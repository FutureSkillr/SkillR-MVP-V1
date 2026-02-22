# Cloud SQL module — PostgreSQL instance, database, and user

terraform {
  required_providers {
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}

variable "project_id" {
  type = string
}

variable "region" {
  type    = string
  default = "europe-west3"
}

variable "instance_name" {
  type    = string
  default = "future-skillr-db"
}

variable "database_name" {
  type    = string
  default = "futureskiller"
}

variable "database_user" {
  type    = string
  default = "futureskiller"
}

variable "tier" {
  type    = string
  default = "db-f1-micro"
}

resource "random_password" "db_password" {
  length  = 32
  special = false
}

resource "google_sql_database_instance" "main" {
  project          = var.project_id
  name             = var.instance_name
  region           = var.region
  database_version = "POSTGRES_16"

  settings {
    tier              = var.tier
    disk_size         = 10
    disk_autoresize   = true
    availability_type = "ZONAL"

    backup_configuration {
      enabled    = true
      start_time = "03:00"
    }

    ip_configuration {
      ipv4_enabled = true
    }
  }

  deletion_protection = true
}

resource "google_sql_database" "main" {
  project  = var.project_id
  name     = var.database_name
  instance = google_sql_database_instance.main.name
}

resource "google_sql_user" "main" {
  project  = var.project_id
  name     = var.database_user
  instance = google_sql_database_instance.main.name
  password = random_password.db_password.result
}

output "connection_name" {
  value = google_sql_database_instance.main.connection_name
}

output "database_url" {
  value     = "postgres://${var.database_user}:${random_password.db_password.result}@/${var.database_name}?host=/cloudsql/${google_sql_database_instance.main.connection_name}"
  sensitive = true
}

output "instance_name" {
  value = google_sql_database_instance.main.name
}
