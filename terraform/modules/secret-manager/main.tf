# Secret Manager module — Secrets and IAM bindings

variable "project_id" {
  type = string
}

variable "secret_name" {
  type    = string
  default = "vertexai-sa-key"
}

variable "cloud_run_sa_email" {
  description = "Service account email for Cloud Run (to grant secret access)"
  type        = string
}

resource "google_secret_manager_secret" "vertexai" {
  project   = var.project_id
  secret_id = var.secret_name

  replication {
    auto {}
  }
}

# Grant Cloud Run service account access to the secret
resource "google_secret_manager_secret_iam_member" "cloud_run_accessor" {
  project   = var.project_id
  secret_id = google_secret_manager_secret.vertexai.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${var.cloud_run_sa_email}"
}

output "secret_id" {
  value = google_secret_manager_secret.vertexai.secret_id
}

output "secret_name" {
  value = google_secret_manager_secret.vertexai.name
}
