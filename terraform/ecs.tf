# ─────────────────────────────────────────────────────────────────────────────
# ecs.tf — ECS Fargate Task Definition + Service
# Owner: Tech Enablement
# ─────────────────────────────────────────────────────────────────────────────

# ── Dynamic Base Networking ───────────────────────────────────────────────────
# Business apps lookup enterprise infrastructure. Personal apps use the default VPC.
data "aws_vpc" "main" {
  count = var.app_type == "business" ? 1 : 0
  tags  = { Name = "px-vpc" }
}

data "aws_subnets" "private" {
  count = var.app_type == "business" ? 1 : 0
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.main[0].id]
  }
  tags = { Tier = "private" }
}

data "aws_security_group" "ecs_tasks" {
  count  = var.app_type == "business" ? 1 : 0
  name   = "px-ecs-tasks-sg"
  vpc_id = data.aws_vpc.main[0].id
}

data "aws_vpc" "default" {
  count   = var.app_type != "business" ? 1 : 0
  default = true
}

data "aws_subnets" "default" {
  count = var.app_type != "business" ? 1 : 0
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default[0].id]
  }
}

# Personal apps create their own temporary sandbox ECS cluster
resource "aws_ecs_cluster" "personal" {
  count = var.app_type != "business" ? 1 : 0
  name  = "px-${var.env}-cluster"
}

# ── CloudWatch Log Group ───────────────────────────────────────────────────────
resource "aws_cloudwatch_log_group" "app" {
  name              = "/px/${var.env}/${var.app_name}"
  retention_in_days = 90

  tags = merge(local.common_tags, {
    Name = "/px/${var.env}/${var.app_name}"
  })
}

# ── ECS Task Definitions ──────────────────────────────────────────────────────

resource "aws_ecs_task_definition" "backend" {
  family                   = "${var.app_name}-backend-${var.env}"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.backend_cpu
  memory                   = var.backend_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn

  container_definitions = jsonencode([
    {
      name      = "backend"
      image     = "${var.aws_account_id}.dkr.ecr.${var.aws_region}.amazonaws.com/${var.app_name}-backend:${var.env}-latest"
      essential = true

      portMappings = [{
        containerPort = var.backend_port
        protocol      = "tcp"
      }]

      environment = [
        { name = "APP_NAME", value = var.app_name },
        { name = "APP_ENV", value = var.env },
        { name = "APP_TYPE", value = var.app_type },
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.app.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "backend"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "python -c \"import urllib.request; urllib.request.urlopen('http://localhost:${var.backend_port}/health')\" || exit 1"]
        interval    = 30
        timeout     = 10
        retries     = 3
        startPeriod = 15
      }
    }
  ])

  tags = merge(local.common_tags, { Name = "${var.app_name}-backend-${var.env}" })
}

resource "aws_ecs_task_definition" "frontend" {
  family                   = "${var.app_name}-frontend-${var.env}"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.frontend_cpu
  memory                   = var.frontend_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn

  container_definitions = jsonencode([
    {
      name      = "frontend"
      image     = "${var.aws_account_id}.dkr.ecr.${var.aws_region}.amazonaws.com/${var.app_name}-frontend:${var.env}-latest"
      essential = true

      portMappings = [{
        containerPort = var.frontend_port
        protocol      = "tcp"
      }]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.app.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "frontend"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "wget --quiet --tries=1 --spider http://localhost:${var.frontend_port}/ || exit 1"]
        interval    = 30
        timeout     = 10
        retries     = 3
        startPeriod = 15
      }
    }
  ])

  tags = merge(local.common_tags, { Name = "${var.app_name}-frontend-${var.env}" })
}

# ── ECS Services ──────────────────────────────────────────────────────────────

resource "aws_ecs_service" "backend" {
  name            = "${var.app_name}-backend-${var.env}"
  cluster         = var.app_type == "business" ? "px-${var.env}-cluster" : aws_ecs_cluster.personal[0].id
  task_definition = aws_ecs_task_definition.backend.arn
  desired_count   = var.env == "prod" ? 2 : 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.app_type == "business" ? data.aws_subnets.private[0].ids : data.aws_subnets.default[0].ids
    security_groups  = var.app_type == "business" ? [data.aws_security_group.ecs_tasks[0].id] : []
    assign_public_ip = var.app_type == "business" ? false : true
  }

  dynamic "load_balancer" {
    for_each = var.app_type == "business" ? [1] : []
    content {
      target_group_arn = aws_lb_target_group.backend[0].arn
      container_name   = "backend"
      container_port   = var.backend_port
    }
  }

  tags = merge(local.common_tags, { Name = "${var.app_name}-backend-${var.env}" })

  lifecycle { ignore_changes = [task_definition] }
}

resource "aws_ecs_service" "frontend" {
  name            = "${var.app_name}-frontend-${var.env}"
  cluster         = var.app_type == "business" ? "px-${var.env}-cluster" : aws_ecs_cluster.personal[0].id
  task_definition = aws_ecs_task_definition.frontend.arn
  desired_count   = var.env == "prod" ? 2 : 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.app_type == "business" ? data.aws_subnets.private[0].ids : data.aws_subnets.default[0].ids
    security_groups  = var.app_type == "business" ? [data.aws_security_group.ecs_tasks[0].id] : []
    assign_public_ip = var.app_type == "business" ? false : true
  }

  dynamic "load_balancer" {
    for_each = var.app_type == "business" ? [1] : []
    content {
      target_group_arn = aws_lb_target_group.frontend[0].arn
      container_name   = "frontend"
      container_port   = var.frontend_port
    }
  }

  tags = merge(local.common_tags, { Name = "${var.app_name}-frontend-${var.env}" })

  lifecycle { ignore_changes = [task_definition] }
}
