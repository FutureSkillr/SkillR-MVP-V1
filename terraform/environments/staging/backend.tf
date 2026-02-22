terraform {
  backend "gcs" {
    prefix = "terraform/staging"
    # bucket is set via -backend-config="bucket=<PROJECT_ID>-tfstate"
  }
}
