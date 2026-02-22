terraform {
  backend "gcs" {
    prefix = "terraform/production"
    # bucket is set via -backend-config="bucket=<PROJECT_ID>-tfstate"
  }
}
