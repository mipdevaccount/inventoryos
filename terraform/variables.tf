# ─────────────────────────────────────────────────────────────────────────────
# variables.tf — Input variables for all Project X Terraform modules
# Owner: Tech Enablement
# ─────────────────────────────────────────────────────────────────────────────

variable "app_name" {
  description = "Unique app identifier. Lowercase, hyphenated. e.g. cmdr-app"
  type        = string

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{1,28}[a-z0-9]$", var.app_name))
    error_message = "app_name must be lowercase alphanumeric with hyphens, 3–30 characters."
  }
}

variable "app_type" {
  description = "App classification. business = full PROD pathway. personal = DEV only."
  type        = string
  default     = "business"

  validation {
    condition     = contains(["business", "personal"], var.app_type)
    error_message = "app_type must be 'business' or 'personal'."
  }
}

variable "env" {
  description = "Deployment environment."
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "prod"], var.env)
    error_message = "env must be 'dev' or 'prod'."
  }
}

variable "aws_region" {
  description = "AWS region for all resources."
  type        = string
  default     = "ca-central-1"
}

variable "aws_account_id" {
  description = "AWS account ID."
  type        = string
}

variable "subdomain" {
  description = "Subdomain for the app. Business apps only. e.g. cmdrapp.pxltd.ca"
  type        = string
  default     = "commander.pxltd.ca"
}

variable "owner" {
  description = "GitHub username of the app owner. Used for cost tagging."
  type        = string
  default     = "developer"
}

variable "backend_port" {
  description = "Port the backend container listens on."
  type        = number
  default     = 8000
}

variable "frontend_port" {
  description = "Port the frontend container listens on."
  type        = number
  default     = 80
}

variable "backend_cpu" {
  description = "ECS task CPU units for backend."
  type        = number
  default     = 512
}

variable "backend_memory" {
  description = "ECS task memory in MB for backend."
  type        = number
  default     = 1024
}

variable "frontend_cpu" {
  description = "ECS task CPU units for frontend."
  type        = number
  default     = 256
}

variable "frontend_memory" {
  description = "ECS task memory in MB for frontend."
  type        = number
  default     = 512
}

# ── Snowflake Integration ─────────────────────────────────────────────────────

variable "snowflake_enabled" {
  description = "Whether to provision a Snowflake database for this app."
  type        = bool
  default     = false
}

variable "snowflake_account" {
  description = "Snowflake account identifier."
  type        = string
  default     = "" # Provided by TE
}

variable "snowflake_warehouse" {
  description = "Snowflake warehouse for app compute."
  type        = string
  default     = "PX_APP_WH"
}

variable "snowflake_user" {
  description = "Snowflake user for provisioning"
  type        = string
  default     = ""
}

variable "snowflake_password" {
  description = "Snowflake password (sensitive)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "snowflake_role" {
  description = "Snowflake role for provisioning"
  type        = string
  default     = "ACCOUNTADMIN"
}

# ── Common tags applied to ALL resources ──────────────────────────────────────
locals {
  common_tags = {
    app     = var.app_name
    env     = var.env
    type    = var.app_type
    owner   = var.owner
    project = "project-x"
    managed = "terraform"
  }
}
