terraform {
  required_version = ">= 1.5"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

provider "google-beta" {
  project = var.project_id
  region  = var.region
}

# --- Modules ---

module "apis" {
  source     = "../../modules/apis"
  project_id = var.project_id
}

module "artifact_registry" {
  source     = "../../modules/artifact-registry"
  project_id = var.project_id
  region     = var.region

  depends_on = [module.apis]
}

module "cloud_sql" {
  source        = "../../modules/cloud-sql"
  project_id    = var.project_id
  region        = var.region
  instance_name = "skillr-db"

  depends_on = [module.apis]
}

module "firebase" {
  source     = "../../modules/firebase"
  project_id = var.project_id

  providers = {
    google-beta = google-beta
  }

  depends_on = [module.apis]
}

# Look up the default compute service account for IAM bindings
data "google_project" "current" {
  project_id = var.project_id
}

module "secret_manager" {
  source             = "../../modules/secret-manager"
  project_id         = var.project_id
  cloud_run_sa_email = "${data.google_project.current.number}-compute@developer.gserviceaccount.com"

  depends_on = [module.apis]
}

module "cloud_run" {
  source                   = "../../modules/cloud-run"
  project_id               = var.project_id
  region                   = var.region
  service_name             = "skillr"
  image_tag                = var.image_tag
  max_instances            = 10
  cloudsql_connection_name = module.cloud_sql.connection_name
  secret_name              = module.secret_manager.secret_id

  env_vars = {
    DATABASE_URL                 = module.cloud_sql.database_url
    GEMINI_API_KEY               = var.gemini_api_key
    GCP_PROJECT_ID               = var.project_id
    GCP_REGION                   = var.region
    GCP_TTS_REGION               = var.gcp_tts_region
    FIREBASE_API_KEY             = var.firebase_api_key
    FIREBASE_AUTH_DOMAIN         = var.firebase_auth_domain
    FIREBASE_PROJECT_ID          = var.firebase_project_id
    FIREBASE_STORAGE_BUCKET      = var.firebase_storage_bucket
    FIREBASE_MESSAGING_SENDER_ID = var.firebase_messaging_sender_id
    FIREBASE_APP_ID              = var.firebase_app_id
    HEALTH_CHECK_TOKEN           = var.health_check_token
    ALLOWED_ORIGINS              = var.allowed_origins
    HONEYCOMB_URL                = var.honeycomb_url
    HONEYCOMB_API_KEY            = var.honeycomb_api_key
    MEMORY_SERVICE_URL           = var.memory_service_url
    MEMORY_SERVICE_API_KEY       = var.memory_service_api_key
    REDIS_URL                    = var.redis_url
    SOLID_POD_URL                = var.solid_pod_url
    SOLID_POD_ENABLED            = var.solid_pod_enabled
  }

  depends_on = [module.apis, module.cloud_sql, module.secret_manager]
}

# --- Outputs ---

output "cloud_run_url" {
  value = module.cloud_run.service_url
}

output "artifact_registry_url" {
  value = module.artifact_registry.repository_url
}

output "cloudsql_connection_name" {
  value = module.cloud_sql.connection_name
}
