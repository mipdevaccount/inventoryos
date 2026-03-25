# ── Default VPC & Subnets ───────────────────────────────────────────────────

data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# ── Shared Security Groups ────────────────────────────────────────────────────

resource "aws_security_group" "lb" {
  name        = "px-apps-lb-sg"
  description = "Allow HTTP/HTTPS to Load Balancer"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    protocol    = "tcp"
    from_port   = 80
    to_port     = 80
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    protocol    = "tcp"
    from_port   = 443
    to_port     = 443
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    protocol    = "-1"
    from_port   = 0
    to_port     = 0
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, { Name = "px-apps-lb-sg" })
}

resource "aws_security_group" "ecs_tasks" {
  name        = "px-apps-ecs-tasks-sg"
  description = "Allow traffic from LB to ECS tasks"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    protocol        = "tcp"
    from_port       = 0
    to_port         = 65535
    security_groups = [aws_security_group.lb.id]
  }

  egress {
    protocol    = "-1"
    from_port   = 0
    to_port     = 0
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, { Name = "px-apps-ecs-tasks-sg" })
}
