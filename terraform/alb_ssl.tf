# ─────────────────────────────────────────────────────────────────────────────
# alb_ssl.tf — ALB Target Group + Listener Rule + Route 53 + ACM SSL
# Owner: Tech Enablement
# ─────────────────────────────────────────────────────────────────────────────

# ── Reference existing shared ALB (Business apps only) ───────────────────────
data "aws_lb" "shared" {
  count = var.app_type == "business" ? 1 : 0
  name  = "px-${var.env}-alb"
}

data "aws_lb_listener" "https" {
  count             = var.app_type == "business" ? 1 : 0
  load_balancer_arn = data.aws_lb.shared[0].arn
  port              = 443
}

# ── Target Groups ─────────────────────────────────────────────────────────────

resource "aws_lb_target_group" "backend" {
  count       = var.app_type == "business" ? 1 : 0
  name        = "${var.app_name}-be-${var.env}"
  port        = var.backend_port
  protocol    = "HTTP"
  vpc_id      = data.aws_vpc.main[0].id
  target_type = "ip"

  health_check {
    enabled             = true
    path                = "/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    matcher             = "200"
  }

  tags = merge(local.common_tags, { Name = "${var.app_name}-be-${var.env}-tg" })
}

resource "aws_lb_target_group" "frontend" {
  count       = var.app_type == "business" ? 1 : 0
  name        = "${var.app_name}-fe-${var.env}"
  port        = var.frontend_port
  protocol    = "HTTP"
  vpc_id      = data.aws_vpc.main[0].id
  target_type = "ip"

  health_check {
    enabled             = true
    path                = "/"
    port                = "traffic-port"
    protocol            = "HTTP"
    matcher             = "200"
  }

  tags = merge(local.common_tags, { Name = "${var.app_name}-fe-${var.env}-tg" })
}

# ── ALB Listener Rules ────────────────────────────────────────────────────────

resource "aws_lb_listener_rule" "backend" {
  count        = var.app_type == "business" ? 1 : 0
  listener_arn = data.aws_lb_listener.https[0].arn
  priority     = 10

  condition {
    host_header {
      values = [var.subdomain != "" ? var.subdomain : "${var.app_name}.pxltd.ca"]
    }
  }

  condition {
    path_pattern {
      values = ["/api/*", "/docs", "/openapi.json", "/auth/*"]
    }
  }

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend[0].arn
  }
}

resource "aws_lb_listener_rule" "frontend" {
  count        = var.app_type == "business" ? 1 : 0
  listener_arn = data.aws_lb_listener.https[0].arn
  priority     = 20

  condition {
    host_header {
      values = [var.subdomain != "" ? var.subdomain : "${var.app_name}.pxltd.ca"]
    }
  }

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.frontend[0].arn
  }
}

# ── Route 53 ──────────────────────────────────────────────────────────────────
data "aws_route53_zone" "pxltd" {
  count        = var.app_type == "business" ? 1 : 0
  name         = "pxltd.ca."
  private_zone = false
}

resource "aws_route53_record" "app" {
  count   = var.app_type == "business" && var.env == "prod" && var.subdomain != "" ? 1 : 0
  zone_id = data.aws_route53_zone.pxltd[0].zone_id
  name    = var.subdomain
  type    = "A"

  alias {
    name                   = data.aws_lb.shared[0].dns_name
    zone_id                = data.aws_lb.shared[0].zone_id
    evaluate_target_health = true
  }
}

# ── ACM Certificate ────────────────────────────────────────────────────────────
resource "aws_acm_certificate" "app" {
  count             = var.app_type == "business" && var.env == "prod" && var.subdomain != "" ? 1 : 0
  domain_name       = var.subdomain
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = merge(local.common_tags, {
    Name = "${var.app_name}-ssl-cert"
  })
}

resource "aws_route53_record" "acm_validation" {
  for_each = {
    for dvo in(length(aws_acm_certificate.app) > 0 ? aws_acm_certificate.app[0].domain_validation_options : []) :
    dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  zone_id = data.aws_route53_zone.pxltd[0].zone_id
  name    = each.value.name
  type    = each.value.type
  records = [each.value.record]
  ttl     = 60
}

resource "aws_acm_certificate_validation" "app" {
  count                   = length(aws_acm_certificate.app)
  certificate_arn         = aws_acm_certificate.app[0].arn
  validation_record_fqdns = [for record in aws_route53_record.acm_validation : record.fqdn]
}

# ── Outputs ────────────────────────────────────────────────────────────────────
output "app_url" {
  description = "Application URL"
  value       = var.app_type == "business" ? (var.env == "prod" && var.subdomain != "" ? "https://${var.subdomain}" : "http://${data.aws_lb.shared[0].dns_name}") : "No ALB available for Personal apps. Traffic served directly on ECS task Public IP."
}
