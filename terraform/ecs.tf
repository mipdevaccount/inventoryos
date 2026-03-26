# ─────────────────────────────────────────────────────────────────────────────
# ecs.tf — ECS Fargate Task Definition + Service
# Owner: Tech Enablement
# ─────────────────────────────────────────────────────────────────────────────

# ── Dynamic Base Networking ───────────────────────────────────────────────────
# We use the standardized "CLIENT APPS VPC" created in vpc.tf

locals {
  vpc_id             = data.aws_vpc.default.id
  subnet_ids         = data.aws_subnets.default.ids
  ecs_tasks_sg_id    = aws_security_group.ecs_tasks.id
}

resource "aws_ecs_cluster" "app" {
  name = "px-apps-cluster"
  
  tags = merge(local.common_tags, {
    Name = "px-apps-cluster"
  })
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
        { name = "DATABASE_URL", value = "postgresql://commander:changeme@localhost:5432/commander_v3" },
        { name = "SECRET_KEY", value = "your-secret-key-change-in-production" },
        { name = "REDIS_URL", value = "redis://localhost:6379/0" }
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
    },
    {
      name      = "postgres"
      image     = "postgres:15-alpine"
      essential = true
      environment = [
        { name = "POSTGRES_DB", value = "commander_v3" },
        { name = "POSTGRES_USER", value = "commander" },
        { name = "POSTGRES_PASSWORD", value = "changeme" }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.app.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "postgres"
        }
      }
      healthCheck = {
        command     = ["CMD-SHELL", "pg_isready -U commander"]
        interval    = 10
        timeout     = 5
        retries     = 5
      }
    },
    {
      name      = "redis"
      image     = "redis:7-alpine"
      essential = true
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.app.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "redis"
        }
      }
      healthCheck = {
        command     = ["CMD", "redis-cli", "ping"]
        interval    = 10
        timeout     = 3
        retries     = 5
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
  cluster         = aws_ecs_cluster.app.id
  task_definition = aws_ecs_task_definition.backend.arn
  desired_count   = var.env == "prod" ? 2 : 1
  launch_type           = "FARGATE"
  wait_for_steady_state = false

  network_configuration {
    subnets          = local.subnet_ids
    security_groups  = [local.ecs_tasks_sg_id]
    assign_public_ip = true
  }

  dynamic "load_balancer" {
    for_each = var.app_type == "business" ? [1] : []
    content {
      target_group_arn = aws_lb_target_group.backend.arn
      container_name   = "backend"
      container_port   = var.backend_port
    }
  }

  tags = merge(local.common_tags, { Name = "${var.app_name}-backend-${var.env}" })

  lifecycle { ignore_changes = [task_definition] }
}

resource "aws_ecs_service" "frontend" {
  name            = "${var.app_name}-frontend-${var.env}"
  cluster         = aws_ecs_cluster.app.id
  task_definition = aws_ecs_task_definition.frontend.arn
  desired_count   = var.env == "prod" ? 2 : 1
  launch_type           = "FARGATE"
  wait_for_steady_state = false

  network_configuration {
    subnets          = local.subnet_ids
    security_groups  = [local.ecs_tasks_sg_id]
    assign_public_ip = true
  }

  dynamic "load_balancer" {
    for_each = var.app_type == "business" ? [1] : []
    content {
      target_group_arn = aws_lb_target_group.frontend.arn
      container_name   = "frontend"
      container_port   = var.frontend_port
    }
  }

  tags = merge(local.common_tags, { Name = "${var.app_name}-frontend-${var.env}" })

  lifecycle { ignore_changes = [task_definition] }
}
