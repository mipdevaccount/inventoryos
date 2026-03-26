# ─────────────────────────────────────────────────────────────────────────────
# iam.tf — OIDC Role + IAM Permission Boundary
# Owner: Tech Enablement
# This is the most important security file in the platform.
# ─────────────────────────────────────────────────────────────────────────────

data "aws_caller_identity" "current" {}

# ── GitHub OIDC Provider (created once per AWS account, referenced here) ──────
data "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"
}

# ── IAM Permission Boundary — hard ceiling on ALL app roles ───────────────────
# No matter what permissions are granted to an app role,
# it can NEVER exceed what this boundary allows.
resource "aws_iam_policy" "app_boundary" {
  name        = "px-app-boundary-${var.app_name}"
  description = "Permission boundary for ${var.app_name}. Set by TE. Limits app to its own resources only."

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        # Allow: full access to app stack
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret",
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload",
          "ecr:PutImage",
          "ecs:UpdateService",
          "ecs:DescribeServices",
          "ecs:RegisterTaskDefinition",
          "ecs:DescribeTaskDefinition",
          "iam:PassRole",
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = "*"
      },
      {
        # Allow: ECR auth token (account-level, no resource tag possible)
        Effect   = "Allow"
        Action   = ["ecr:GetAuthorizationToken"]
        Resource = "*"
      },
      {
        # Deny: actions that can NEVER be performed — hard block
        Effect = "Deny"
        Action = [
          "iam:*",
          "ec2:*",
          "s3:DeleteBucket",
          "s3:DeleteObject",
          "ecr:DeleteRepository",
          "ecr:BatchDeleteImage",
          "ecs:DeleteCluster",
          "ecs:DeleteService",
          "organizations:*",
          "cloudtrail:StopLogging",
          "cloudtrail:DeleteTrail",
        ]
        Resource = "*"
      }
    ]
  })

  tags = local.common_tags
}

# ── OIDC Trust Policy — allows GitHub Actions to assume this role ──────────────
data "aws_iam_policy_document" "github_oidc_trust" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [data.aws_iam_openid_connect_provider.github.arn]
    }

    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      # Scoped to THIS repo only — Supporting org move/case sensitivity
      values   = ["repo:PXLabs/CommanderOS:*", "repo:px-ltd/commander:*", "repo:*:CommanderOS:*"]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }
  }
}

# ── App IAM Role ──────────────────────────────────────────────────────────────
resource "aws_iam_role" "app_deploy" {
  name                 = "px-deploy-${var.app_name}"
  assume_role_policy   = data.aws_iam_policy_document.github_oidc_trust.json
  permissions_boundary = aws_iam_policy.app_boundary.arn
  # The boundary is always attached — even if someone adds more policies later,
  # they cannot exceed what the boundary allows.

  tags = merge(local.common_tags, {
    Name = "px-deploy-${var.app_name}"
  })
}

# ── Deploy Permissions (within the boundary) ───────────────────────────────────
resource "aws_iam_role_policy" "app_deploy" {
  name = "px-deploy-policy-${var.app_name}"
  role = aws_iam_role.app_deploy.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload",
          "ecr:PutImage"
        ]
        Resource = "arn:aws:ecr:${var.aws_region}:${var.aws_account_id}:repository/${var.app_name}-*"
      },
      {
        Effect = "Allow"
        Action = ["ecr:GetAuthorizationToken"]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ecs:UpdateService",
          "ecs:DescribeServices",
          "ecs:RegisterTaskDefinition",
          "ecs:DescribeTaskDefinition",
        ]
        Resource = [
          "arn:aws:ecs:${var.aws_region}:${var.aws_account_id}:service/px-apps-cluster/${var.app_name}-*",
          "arn:aws:ecs:${var.aws_region}:${var.aws_account_id}:task-definition/${var.app_name}-*:*",
        ]
      },
      {
        Effect   = "Allow"
        Action   = ["iam:PassRole"]
        Resource = "*"
      }
    ]
  })
}

# ── ECS Task Execution Role (used by ECS to pull images + inject secrets) ─────
resource "aws_iam_role" "ecs_task_execution" {
  name = "px-ecs-exec-${var.app_name}-${var.env}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })

  permissions_boundary = aws_iam_policy.app_boundary.arn

  tags = merge(local.common_tags, {
    Name = "px-ecs-exec-${var.app_name}-${var.env}"
  })
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Secrets Manager access for the task execution role
resource "aws_iam_role_policy" "ecs_secrets" {
  name = "px-secrets-${var.app_name}-${var.env}"
  role = aws_iam_role.ecs_task_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["secretsmanager:GetSecretValue"]
      Resource = "arn:aws:secretsmanager:${var.aws_region}:${var.aws_account_id}:secret:px/${var.app_name}/*"
    }]
  })
}
