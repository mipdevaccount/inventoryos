# ── Dedicated Load Balancer for PX Apps ───────────────────────────────────────

resource "aws_lb" "main" {
  name               = "px-apps-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.lb.id]
  subnets            = data.aws_subnets.default.ids

  tags = merge(local.common_tags, { Name = "px-apps-alb" })
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type = "redirect"
    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-2016-08"
  certificate_arn   = "arn:aws:acm:us-east-1:547456401969:certificate/f54cfc40-f498-42b1-adcc-975b6bd5dce7"

  default_action {
    type = "fixed-response"
    fixed_response {
      content_type = "text/plain"
      message_body = "PX Platform Gateway - No Service Match"
      status_code  = "404"
    }
  }
}

# ── Target Groups ─────────────────────────────────────────────────────────────

resource "aws_lb_target_group" "backend" {
  name        = "cmdr-be-dev"
  port        = var.backend_port
  protocol    = "HTTP"
  vpc_id      = data.aws_vpc.default.id
  target_type = "ip"

  health_check {
    enabled             = true
    path                = "/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    matcher             = "200"
  }

  tags = merge(local.common_tags, { Name = "cmdr-be-dev-tg" })
}

resource "aws_lb_target_group" "frontend" {
  name        = "cmdr-fe-dev"
  port        = var.frontend_port
  protocol    = "HTTP"
  vpc_id      = data.aws_vpc.default.id
  target_type = "ip"

  health_check {
    enabled             = true
    path                = "/"
    port                = "traffic-port"
    protocol            = "HTTP"
    matcher             = "200"
  }

  tags = merge(local.common_tags, { Name = "cmdr-fe-dev-tg" })
}

# ── ALB Listener Rules ────────────────────────────────────────────────────────

resource "aws_lb_listener_rule" "backend" {
  listener_arn = aws_lb_listener.https.arn
  priority     = 10

  condition {
    path_pattern {
      values = ["/api/*", "/docs", "/openapi.json", "/auth/*"]
    }
  }

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend.id
  }
}

resource "aws_lb_listener_rule" "frontend" {
  listener_arn = aws_lb_listener.https.arn
  priority     = 20

  condition {
    path_pattern {
      values = ["/*"]
    }
  }

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.frontend.id
  }
}




# ── Outputs ────────────────────────────────────────────────────────────────────
output "alb_dns_name" {
  description = "DNS name of the application load balancer"
  value       = aws_lb.main.dns_name
}

output "app_url" {
  description = "Application URL"
  value       = "https://${var.subdomain != "" ? var.subdomain : "commander.pxltd.ca"}"
}
