variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "europe-west3"
}

variable "gcp_tts_region" {
  description = "GCP region for TTS/STT (Gemini TTS not available in all regions)"
  type        = string
  default     = "europe-west1"
}

variable "image_tag" {
  description = "Docker image tag for Cloud Run deployment"
  type        = string
  default     = "europe-west3-docker.pkg.dev/placeholder/cloud-run-source-deploy/skillr:latest"
}

variable "gemini_api_key" {
  description = "Google Gemini API key"
  type        = string
  sensitive   = true
}

# --- Firebase client config (injected into /api/config for frontend) ---

variable "firebase_api_key" {
  description = "Firebase API key for frontend config injection"
  type        = string
  default     = ""
}

variable "firebase_auth_domain" {
  description = "Firebase auth domain"
  type        = string
  default     = ""
}

variable "firebase_project_id" {
  description = "Firebase project ID"
  type        = string
  default     = ""
}

variable "firebase_storage_bucket" {
  description = "Firebase storage bucket"
  type        = string
  default     = ""
}

variable "firebase_messaging_sender_id" {
  description = "Firebase messaging sender ID"
  type        = string
  default     = ""
}

variable "firebase_app_id" {
  description = "Firebase app ID"
  type        = string
  default     = ""
}

# --- Security ---

variable "health_check_token" {
  description = "Shared secret for /api/health/detailed"
  type        = string
  sensitive   = true
  default     = ""
}

variable "allowed_origins" {
  description = "Comma-separated CORS origins"
  type        = string
  default     = ""
}

# --- External services ---

variable "honeycomb_url" {
  description = "Honeycomb API base URL (FR-072)"
  type        = string
  default     = ""
}

variable "honeycomb_api_key" {
  description = "Honeycomb API key"
  type        = string
  sensitive   = true
  default     = ""
}

variable "memory_service_url" {
  description = "Memory Service base URL (FR-073)"
  type        = string
  default     = ""
}

variable "memory_service_api_key" {
  description = "Memory Service API key"
  type        = string
  sensitive   = true
  default     = ""
}

variable "redis_url" {
  description = "Redis connection URL"
  type        = string
  default     = ""
}

# --- Solid Pod (FR-076) ---

variable "solid_pod_url" {
  description = "Solid Pod base URL (CSS running in same container)"
  type        = string
  default     = "http://localhost:3000"
}

variable "solid_pod_enabled" {
  description = "Enable Solid Pod integration"
  type        = string
  default     = "false"
}
