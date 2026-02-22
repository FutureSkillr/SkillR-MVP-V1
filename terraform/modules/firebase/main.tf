# Firebase module — Project, web app, Identity Platform, Google auth provider

terraform {
  required_providers {
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 5.0"
    }
  }
}

variable "project_id" {
  type = string
}

variable "web_app_display_name" {
  type    = string
  default = "Future SkillR Web"
}

resource "google_firebase_project" "default" {
  provider = google-beta
  project  = var.project_id
}

resource "google_firebase_web_app" "web" {
  provider     = google-beta
  project      = var.project_id
  display_name = var.web_app_display_name

  depends_on = [google_firebase_project.default]
}

# Enable Identity Platform (Firebase Auth)
resource "google_identity_platform_config" "auth" {
  provider = google-beta
  project  = var.project_id

  sign_in {
    allow_duplicate_emails = false

    email {
      enabled           = true
      password_required = true
    }
  }

  depends_on = [google_firebase_project.default]
}

# Enable Google as an auth provider
resource "google_identity_platform_default_supported_idp_config" "google" {
  provider = google-beta
  project  = var.project_id
  idp_id   = "google.com"
  enabled  = true

  # Client ID and secret must be configured via GCP Console (OAuth consent screen)
  # These are placeholder values — replace after OAuth consent screen setup
  client_id     = "placeholder.apps.googleusercontent.com"
  client_secret = "placeholder"

  depends_on = [google_identity_platform_config.auth]
}

# Firestore database
resource "google_firestore_database" "default" {
  provider    = google-beta
  project     = var.project_id
  name        = "(default)"
  location_id = "eur3"
  type        = "FIRESTORE_NATIVE"

  depends_on = [google_firebase_project.default]
}

data "google_firebase_web_app_config" "web" {
  provider   = google-beta
  project    = var.project_id
  web_app_id = google_firebase_web_app.web.app_id
}

output "web_app_id" {
  value = google_firebase_web_app.web.app_id
}

output "firebase_config" {
  value = {
    api_key             = data.google_firebase_web_app_config.web.api_key
    auth_domain         = "${var.project_id}.firebaseapp.com"
    project_id          = var.project_id
    storage_bucket      = data.google_firebase_web_app_config.web.storage_bucket
    messaging_sender_id = data.google_firebase_web_app_config.web.messaging_sender_id
    app_id              = google_firebase_web_app.web.app_id
  }
  sensitive = true
}
