# ─────────────────────────────────────────────────────────────────────────────
# snowflake.tf — Automated Snowflake Provisioning for Project X Apps
# ─────────────────────────────────────────────────────────────────────────────

# This file uses the Snowflake Terraform Provider.
# It only executes if snowflake_enabled is set to true during setup.

terraform {
  required_providers {
    snowflake = {
      source  = "Snowflake-Labs/snowflake"
      version = "~> 0.87.0"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
  }
}

locals {
  # Prefix based on app type
  db_prefix = var.app_type == "business" ? "PX_B" : "PX_P"
  db_name   = "${local.db_prefix}_${upper(replace(var.app_name, "-", "_"))}_${upper(var.env)}"
  role_name = "${upper(replace(var.app_name, "-", "_"))}_ROLE"
  user_name = "${upper(replace(var.app_name, "-", "_"))}_SVC"
}

# 1. Create the Application Database
resource "snowflake_database" "app_db" {
  count   = var.snowflake_enabled ? 1 : 0
  name    = local.db_name
  comment = "Database for ${var.app_name} (${var.env})"
}

# 2. Create the Application Role
resource "snowflake_role" "app_role" {
  count   = var.snowflake_enabled ? 1 : 0
  name    = local.role_name
  comment = "Role for ${var.app_name} application"
}

# 3. Create the Service User
resource "snowflake_user" "app_user" {
  count                = var.snowflake_enabled ? 1 : 0
  name                 = local.user_name
  role                 = snowflake_role.app_role[0].name
  default_role         = snowflake_role.app_role[0].name
  default_warehouse    = var.snowflake_warehouse
  must_change_password = false
  
  # RSA Key Pair Authentication (instead of password)
  rsa_public_key = replace(
    replace(
      replace(tls_private_key.snowflake_key[0].public_key_pem, "-----BEGIN PUBLIC KEY-----", ""),
      "-----END PUBLIC KEY-----", ""
    ),
    "\n", ""
  )
}

# 4. Generate RSA Key Pair
resource "tls_private_key" "snowflake_key" {
  count     = var.snowflake_enabled ? 1 : 0
  algorithm = "RSA"
  rsa_bits  = 2048
}

# 5. Grant Permissions
resource "snowflake_database_grant" "role_grant" {
  count         = var.snowflake_enabled ? 1 : 0
  database_name = snowflake_database.app_db[0].name
  privilege     = "USAGE"
  roles         = [snowflake_role.app_role[0].name]
}

resource "snowflake_schema_grant" "schema_grant" {
  count         = var.snowflake_enabled ? 1 : 0
  database_name = snowflake_database.app_db[0].name
  schema_name   = "PUBLIC"
  privilege     = "USAGE"
  roles         = [snowflake_role.app_role[0].name]
}

# Allow the role to create tables in PUBLIC
resource "snowflake_schema_grant" "create_grant" {
  count         = var.snowflake_enabled ? 1 : 0
  database_name = snowflake_database.app_db[0].name
  schema_name   = "PUBLIC"
  privilege     = "CREATE TABLE"
  roles         = [snowflake_role.app_role[0].name]
}

# ── AWS Secrets Manager Integration ───────────────────────────────────────────

resource "aws_secretsmanager_secret" "snowflake_secret" {
  count = var.snowflake_enabled ? 1 : 0
  name  = "px/${var.app_name}/snowflake"
  
  description = "Snowflake connection details for ${var.app_name}"
  
  tags = merge(local.common_tags, {
    Name = "px-${var.app_name}-snowflake-secret"
  })
}

resource "aws_secretsmanager_secret_version" "snowflake_secret_version" {
  count     = var.snowflake_enabled ? 1 : 0
  secret_id = aws_secretsmanager_secret.snowflake_secret[0].id
  
  secret_string = jsonencode({
    SNOWFLAKE_ACCOUNT     = var.snowflake_account
    SNOWFLAKE_USER        = snowflake_user.app_user[0].name
    SNOWFLAKE_PRIVATE_KEY = tls_private_key.snowflake_key[0].private_key_pem
    SNOWFLAKE_ROLE        = snowflake_role.app_role[0].name
    SNOWFLAKE_DATABASE    = snowflake_database.app_db[0].name
    SNOWFLAKE_URL         = "https://${var.snowflake_account}.snowflakecomputing.com"
  })
}
