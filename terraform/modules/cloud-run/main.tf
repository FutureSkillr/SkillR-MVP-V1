# Cloud Run module — Service configuration
# Note: The actual image tag is passed as a variable during deployment.
# This module defines the service configuration; image updates happen via
# `gcloud run deploy` or `terraform apply -var="image_tag=..."`.

variable "project_id" {
  type = string
}

variable "region" {
  type    = string
  default = "europe-west3"
}

variable "service_name" {
  type    = string
  default = "future-skillr"
}

variable "image_tag" {
  description = "Full image URL including tag (e.g., europe-west3-docker.pkg.dev/proj/repo/svc:abc123)"
  type        = string
}

variable "max_instances" {
  type    = number
  default = 10
}

variable "cloudsql_connection_name" {
  description = "Cloud SQL connection name for the --add-cloudsql-instances flag"
  type        = string
}

variable "secret_name" {
  description = "Secret Manager secret name for Vertex AI SA key"
  type        = string
  default     = "vertexai-sa-key"
}

variable "env_vars" {
  description = "Environment variables to set on the Cloud Run service"
  type        = map(string)
  default     = {}
}

resource "google_cloud_run_v2_service" "main" {
  project  = var.project_id
  name     = var.service_name
  location = var.region

  template {
    scaling {
      max_instance_count = var.max_instances
    }

    volumes {
      name = "cloudsql"
      cloud_sql_instance {
        instances = [var.cloudsql_connection_name]
      }
    }

    volumes {
      name = "vertexai-secret"
      secret {
        secret = var.secret_name
        items {
          version = "latest"
          path    = "vertexai-sa.json"
        }
      }
    }

    containers {
      image = var.image_tag

      dynamic "env" {
        for_each = var.env_vars
        content {
          name  = env.key
          value = env.value
        }
      }

      env {
        name  = "GOOGLE_APPLICATION_CREDENTIALS"
        value = "/app/credentials/vertexai-sa.json"
      }

      env {
        name  = "RUN_MIGRATIONS"
        value = "true"
      }

      env {
        name  = "STATIC_DIR"
        value = "/app/static"
      }

      env {
        name  = "MIGRATIONS_PATH"
        value = "/app/migrations"
      }

      volume_mounts {
        name       = "cloudsql"
        mount_path = "/cloudsql"
      }

      volume_mounts {
        name       = "vertexai-secret"
        mount_path = "/app/credentials"
      }

      ports {
        container_port = 8080
      }
    }
  }

  lifecycle {
    ignore_changes = [
      # Image tag changes are managed by deploy.sh, not Terraform
      template[0].containers[0].image,
    ]
  }
}

# Allow unauthenticated access
resource "google_cloud_run_v2_service_iam_member" "public" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.main.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

output "service_url" {
  value = google_cloud_run_v2_service.main.uri
}

output "service_name" {
  value = google_cloud_run_v2_service.main.name
}
