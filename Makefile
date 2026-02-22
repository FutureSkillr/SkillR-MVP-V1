# ┌──────────────────────────────────────────────┐
# │   _____ _    _ _ _ ____                      │
# │  / ____| | _(_) | |  _ \                     │
# │ | (___ | |/ / | | | |_) |                    │
# │  \___ \|   <| | | |  _ <                     │
# │  ____) | |\ \ | | | | \ \                    │
# │ |_____/|_| \_\_|_|_|_|  \_\                  │
# │                                               │
# │  Full-Stack Development Toolkit               │
# └──────────────────────────────────────────────┘
# Usage: make <target> [GEMINI_API_KEY=...]

.DEFAULT_GOAL := help

# Load env files if they exist (later files win)
-include .env.deploy
-include .env.local

# Export all loaded vars to recipe shell environments
.EXPORT_ALL_VARIABLES:

PROJECT_ID   ?= skillr
REGION       ?= europe-west3
SERVICE      ?= skillr
IMAGE_NAME   ?= skillr
TAG          ?= latest

# Map .env.deploy names to Makefile names (if sourced)
ifdef GCP_PROJECT_ID
  PROJECT_ID := $(GCP_PROJECT_ID)
endif
ifdef GCP_REGION
  REGION := $(GCP_REGION)
endif
ifdef CLOUD_RUN_SERVICE
  SERVICE := $(CLOUD_RUN_SERVICE)
endif

# ─── Prerequisites ────────────────────────────────────────────────────

.PHONY: check-api-key
check-api-key:
ifndef GEMINI_API_KEY
	$(error GEMINI_API_KEY is not set. Export it or pass via make: GEMINI_API_KEY=...)
endif

# ─── Go Backend ────────────────────────────────────────────────────────

.PHONY: go-build
go-build:
	cd backend && CGO_ENABLED=0 go build -ldflags "-X main.version=$(GIT_SHA)" -o ../bin/server ./cmd/server

.PHONY: go-dev
go-dev:
	cd backend && go run ./cmd/server

.PHONY: go-test
go-test:
	cd backend && go test ./...

.PHONY: go-lint
go-lint:
	cd backend && golangci-lint run ./...

.PHONY: migrate-up
migrate-up:
	migrate -path backend/migrations -database "$(DATABASE_URL)" up

.PHONY: migrate-down
migrate-down:
	migrate -path backend/migrations -database "$(DATABASE_URL)" down 1

.PHONY: migrate-reset
migrate-reset:
	migrate -path backend/migrations -database "$(DATABASE_URL)" drop -f
	$(MAKE) migrate-up

# ─── Frontend Development ────────────────────────────────────────────

.PHONY: install
install:
	cd frontend && npm install

.PHONY: dev
dev:
	cd frontend && npm run dev:all

.PHONY: run-local
run-local: install dev

.PHONY: build
build:
	cd frontend && npm run build

.PHONY: typecheck
typecheck:
	cd frontend && npx tsc --noEmit

.PHONY: clean
clean:
	rm -rf frontend/dist frontend/node_modules/.vite

# ─── Docker ──────────────────────────────────────────────────────────

PLATFORMS ?= linux/amd64,linux/arm64

.PHONY: docker-build
docker-build:
	docker build --build-arg GIT_SHA=$(GIT_SHA) -t $(IMAGE_NAME):$(TAG) .

.PHONY: docker-buildx
docker-buildx:
	docker buildx build --build-arg GIT_SHA=$(GIT_SHA) --platform $(PLATFORMS) -t $(IMAGE_NAME):$(TAG) .

.PHONY: docker-run
docker-run: ## Run standalone container (use 'make local-up' for local dev)
	@echo ""
	@echo "  NOTE: For local development, use: make local-up"
	@echo "        It starts the app with PostgreSQL, Redis, and Solid Pod."
	@echo ""
	@echo "        docker-run is for standalone/production-like testing and"
	@echo "        requires an accessible DATABASE_URL (not Cloud SQL socket)."
	@echo ""
	@if [ -z "$(DATABASE_URL)" ]; then \
		echo "ERROR: DATABASE_URL is required. Either:"; \
		echo "  1. Use 'make local-up' for local dev (recommended)"; \
		echo "  2. Set DATABASE_URL: make docker-run DATABASE_URL=postgres://user:pass@host:5432/db"; \
		exit 1; \
	fi
	@if echo "$(DATABASE_URL)" | grep -q "cloudsql"; then \
		echo "ERROR: DATABASE_URL points to a Cloud SQL socket ($(DATABASE_URL))"; \
		echo "       This won't work in a plain docker run without cloud-sql-proxy."; \
		echo ""; \
		echo "  Options:"; \
		echo "  1. Use 'make local-up' for local dev (recommended)"; \
		echo "  2. Use 'make deploy' for Cloud Run deployment"; \
		echo "  3. Set a direct TCP connection: make docker-run DATABASE_URL=postgres://user:pass@host:5432/db"; \
		exit 1; \
	fi
	docker run --rm -p 8080:8080 \
		-e DATABASE_URL=$(DATABASE_URL) \
		-e REDIS_URL=$(REDIS_URL) \
		-e GEMINI_API_KEY=$(GEMINI_API_KEY) \
		-e FIREBASE_API_KEY=$(FIREBASE_API_KEY) \
		-e FIREBASE_AUTH_DOMAIN=$(FIREBASE_AUTH_DOMAIN) \
		-e FIREBASE_PROJECT_ID=$(FIREBASE_PROJECT_ID) \
		-e FIREBASE_STORAGE_BUCKET=$(FIREBASE_STORAGE_BUCKET) \
		-e FIREBASE_MESSAGING_SENDER_ID=$(FIREBASE_MESSAGING_SENDER_ID) \
		-e FIREBASE_APP_ID=$(FIREBASE_APP_ID) \
		-e RUN_MIGRATIONS=true \
		-e STATIC_DIR=/app/static \
		$(IMAGE_NAME):$(TAG)

.PHONY: local-up
local-up: ## Start full local stack (app + postgres + redis + solid) on :9090
	docker compose up --build

.PHONY: local-down
local-down: ## Stop local stack and remove volumes
	docker compose down -v

.PHONY: local-logs
local-logs: ## Follow local stack logs
	docker compose logs -f app

.PHONY: local-seed-pod
local-seed-pod: ## Seed admin account on Solid Pod (requires local-up)
	docker compose exec app /app/seed-pod.sh

# Backwards-compatible aliases
.PHONY: local-stage local-stage-down seed-pod
local-stage: local-up
local-stage-down: local-down
seed-pod: local-seed-pod

# ─── Combined ────────────────────────────────────────────────────────

.PHONY: build-all
build-all: build go-build

.PHONY: test-all
test-all:
	cd frontend && npm test
	cd backend && go test ./...

# ─── Cloud Run Deploy ────────────────────────────────────────────────

AR_REPO      := cloud-run-source-deploy
GIT_SHA      := $(shell git rev-parse --short HEAD 2>/dev/null || echo latest)

# Common env vars passed to Cloud Run
ALLOWED_ORIGINS ?=
comma := ,

DEPLOY_ENV_VARS = GEMINI_API_KEY=$(GEMINI_API_KEY),\
	FIREBASE_API_KEY=$(FIREBASE_API_KEY),\
	FIREBASE_AUTH_DOMAIN=$(FIREBASE_AUTH_DOMAIN),\
	FIREBASE_PROJECT_ID=$(FIREBASE_PROJECT_ID),\
	FIREBASE_STORAGE_BUCKET=$(FIREBASE_STORAGE_BUCKET),\
	FIREBASE_MESSAGING_SENDER_ID=$(FIREBASE_MESSAGING_SENDER_ID),\
	FIREBASE_APP_ID=$(FIREBASE_APP_ID),\
	DATABASE_URL=$(DATABASE_URL),\
	GCP_PROJECT_ID=$(PROJECT_ID),\
	GCP_REGION=$(REGION),\
	GOOGLE_APPLICATION_CREDENTIALS=/app/credentials/vertexai-sa.json,\
	HEALTH_CHECK_TOKEN=$(HEALTH_CHECK_TOKEN),\
	ALLOWED_ORIGINS=$(ALLOWED_ORIGINS),\
	HONEYCOMB_URL=$(HONEYCOMB_URL),\
	HONEYCOMB_API_KEY=$(HONEYCOMB_API_KEY),\
	MEMORY_SERVICE_URL=$(MEMORY_SERVICE_URL),\
	MEMORY_SERVICE_API_KEY=$(MEMORY_SERVICE_API_KEY),\
	SOLID_POD_URL=$(SOLID_POD_URL),\
	SOLID_POD_ENABLED=$(SOLID_POD_ENABLED),\
	$(if $(ADMIN_SEED_EMAIL),ADMIN_SEED_EMAIL=$(ADMIN_SEED_EMAIL)$(comma),)\
	$(if $(ADMIN_SEED_PASSWORD),ADMIN_SEED_PASSWORD=$(ADMIN_SEED_PASSWORD)$(comma),)\
	RUN_MIGRATIONS=true,\
	STATIC_DIR=/app/static,\
	MIGRATIONS_PATH=/app/migrations

# Cloud SQL connection (set in .env.deploy by gcp-onboard.sh)
CLOUDSQL_CONNECTION_NAME ?=
CLOUDSQL_FLAG = $(if $(CLOUDSQL_CONNECTION_NAME),--add-cloudsql-instances $(CLOUDSQL_CONNECTION_NAME),)

# FR-069: Secret Manager — mount SA key as file in Cloud Run
VERTEXAI_SECRET_NAME ?= vertexai-sa-key
SECRETS_FLAG = --set-secrets "/app/credentials/vertexai-sa.json=$(VERTEXAI_SECRET_NAME):latest"

IMAGE_TAG   = $(REGION)-docker.pkg.dev/$(PROJECT_ID)/$(AR_REPO)/$(SERVICE):$(GIT_SHA)

.PHONY: deploy
deploy: check-api-key docker-auth
	@echo "── Step 1/3: Building image ──"
	docker build --platform linux/amd64 --build-arg GIT_SHA=$(GIT_SHA) -t $(IMAGE_TAG) .
	@echo "── Step 2/3: Pushing image ──"
	docker push $(IMAGE_TAG)
	@echo "── Step 3/3: Deploying to Cloud Run ──"
	gcloud run deploy $(SERVICE) \
		--project $(PROJECT_ID) \
		--region $(REGION) \
		--image $(IMAGE_TAG) \
		--allow-unauthenticated \
		--max-instances 10 \
		--set-env-vars "$(DEPLOY_ENV_VARS)" \
		$(SECRETS_FLAG) \
		$(CLOUDSQL_FLAG) \
		--quiet

.PHONY: deploy-staging
deploy-staging: check-api-key docker-auth
	$(eval STAGING_TAG := $(REGION)-docker.pkg.dev/$(PROJECT_ID)/$(AR_REPO)/$(SERVICE)-staging:$(GIT_SHA))
	@echo "── Step 1/3: Building image ──"
	docker build --platform linux/amd64 --build-arg GIT_SHA=$(GIT_SHA) -t $(STAGING_TAG) .
	@echo "── Step 2/3: Pushing image ──"
	docker push $(STAGING_TAG)
	@echo "── Step 3/3: Deploying to Cloud Run (staging) ──"
	gcloud run deploy $(SERVICE)-staging \
		--project $(PROJECT_ID) \
		--region $(REGION) \
		--image $(STAGING_TAG) \
		--allow-unauthenticated \
		--max-instances 1 \
		--set-env-vars "$(DEPLOY_ENV_VARS)" \
		$(SECRETS_FLAG) \
		$(CLOUDSQL_FLAG) \
		--quiet

.PHONY: docker-auth
docker-auth:
	@gcloud auth configure-docker $(REGION)-docker.pkg.dev --quiet 2>/dev/null

# ─── Onboarding & Env-Based Deploy ───────────────────────────────────

.PHONY: onboard
onboard:
	./scripts/gcp-onboard.sh

.PHONY: ship
ship:
	./scripts/deploy.sh

.PHONY: ship-staging
ship-staging:
	./scripts/deploy.sh staging

# ─── Health Check (FR-068) ───────────────────────────────────────────
# Cloud Run:     make health
# docker-compose: make health-local  (reads .env.local, hits localhost:9090)

.PHONY: health
health: ## Health check Cloud Run service
	@scripts/health-check.sh

.PHONY: local-health
local-health: ## Health check local stack (:9090)
	@SERVICE_URL=http://localhost:9090 scripts/health-check.sh

.PHONY: monitor
monitor: ## Continuously poll Cloud Run health (Ctrl+C to stop)
	@scripts/health-monitor.sh

.PHONY: local-monitor
local-monitor: ## Continuously poll local stack health (Ctrl+C to stop)
	@SERVICE_URL=http://localhost:9090 scripts/health-monitor.sh

# Backwards-compatible aliases
.PHONY: health-local monitor-local
health-local: local-health
monitor-local: local-monitor

# ─── Logs ────────────────────────────────────────────────────────────

.PHONY: logs
logs:
	gcloud beta run services logs tail $(SERVICE) \
		--project $(PROJECT_ID) \
		--region $(REGION)

# ─── Cloud Run Management ──────────────────────────────────────────

.PHONY: cloudrun-list
cloudrun-list:
	@echo "── Services ──"
	@gcloud run services list --project $(PROJECT_ID) --region $(REGION) \
		--format="table(metadata.name,status.url,status.latestReadyRevisionName,metadata.creationTimestamp.date())"
	@echo ""
	@echo "── Revisions ──"
	@gcloud run revisions list --project $(PROJECT_ID) --region $(REGION) \
		--format="table(metadata.name,spec.containerConcurrency,status.conditions[0].status,metadata.creationTimestamp.date())"

.PHONY: cloudrun-delete
cloudrun-delete:
	@echo "This will delete Cloud Run services in project $(PROJECT_ID) / $(REGION)."
	@echo ""
	@gcloud run services list --project $(PROJECT_ID) --region $(REGION) \
		--format="value(metadata.name)" | while read -r svc; do \
		echo "  - $$svc"; \
	done
	@echo ""
	@read -rp "Delete ALL listed services? [y/N] " confirm; \
	if [ "$$confirm" = "y" ] || [ "$$confirm" = "Y" ]; then \
		gcloud run services list --project $(PROJECT_ID) --region $(REGION) \
			--format="value(metadata.name)" | while read -r svc; do \
			echo "Deleting $$svc ..."; \
			gcloud run services delete "$$svc" --project $(PROJECT_ID) --region $(REGION) --quiet; \
		done; \
		echo "Done."; \
	else \
		echo "Aborted."; \
	fi

# ─── Admin Tools ────────────────────────────────────────────────────

.PHONY: setup-firebase
setup-firebase:
	./scripts/setup-firebase.sh

.PHONY: setup-secrets
setup-secrets:
	./scripts/setup-secrets.sh

.PHONY: set-admin
set-admin:
	cd scripts && npm install --silent && node set-admin.mjs

# ─── API Code Generation ────────────────────────────────────────────

.PHONY: api-gen
api-gen:
	$(MAKE) -C integrations/api-spec all

# ─── K6 Scenario Tests ────────────────────────────────────────────────
K6_BASE_URL ?= http://localhost:9090
K6_OUT      ?= k6/reports
K6_ENV      = --env BASE_URL=$(K6_BASE_URL)

ifdef HEALTH_CHECK_TOKEN
  K6_ENV += --env HEALTH_CHECK_TOKEN=$(HEALTH_CHECK_TOKEN)
endif
ifdef ADMIN_EMAIL
  K6_ENV += --env ADMIN_EMAIL=$(ADMIN_EMAIL)
endif
ifdef ADMIN_PASSWORD
  K6_ENV += --env ADMIN_PASSWORD=$(ADMIN_PASSWORD)
endif
ifdef K6_LIVE_AI
  K6_ENV += --env K6_LIVE_AI=$(K6_LIVE_AI)
endif

.PHONY: k6-preflight
k6-preflight: ## Check local setup before running K6 tests
	@echo "── K6 Preflight Check ──"
	@command -v k6 >/dev/null 2>&1 || { echo "ERROR: k6 not found. Install: brew install k6"; exit 1; }
	@mkdir -p $(K6_OUT)
	@if echo "$(K6_BASE_URL)" | grep -q "localhost\|127\.0\.0\.1"; then \
		echo "  Target: $(K6_BASE_URL) (local)"; \
		curl -sf --max-time 5 $(K6_BASE_URL)/api/health >/dev/null 2>&1 || { \
			echo "ERROR: $(K6_BASE_URL)/api/health is not reachable."; \
			echo "       Is the local stack running? Start it with: make local-up"; \
			echo "       Or set K6_BASE_URL to a remote target."; \
			exit 1; \
		}; \
		echo "  Health: OK"; \
		DOCKER_STATUS=$$(docker compose ps --format '{{.Name}} {{.Status}}' 2>/dev/null | head -5); \
		if [ -n "$$DOCKER_STATUS" ]; then \
			echo "  Containers:"; \
			echo "$$DOCKER_STATUS" | while read line; do echo "    $$line"; done; \
		fi; \
	else \
		echo "  Target: $(K6_BASE_URL) (remote — skipping local checks)"; \
		curl -sf --max-time 10 $(K6_BASE_URL)/api/health >/dev/null 2>&1 || { \
			echo "WARNING: $(K6_BASE_URL)/api/health is not reachable. Tests may fail."; \
		}; \
	fi
	@echo "  K6 version: $$(k6 version | head -1)"
	@echo "  Reports dir: $(K6_OUT)"
	@echo "── Preflight OK ──"

.PHONY: k6-smoke
k6-smoke: k6-preflight ## Quick smoke test (30s)
	@echo "── K6 Smoke Test ──"
	k6 run $(K6_ENV) --out json=$(K6_OUT)/smoke.json k6/scenarios/load/ts-040-smoke.js

.PHONY: k6-student
k6-student: k6-preflight ## Student stakeholder suite (TS-001..008)
	@echo "── K6 Student Suite ──"
	@for f in k6/scenarios/student/ts-*.js; do \
		echo "Running $$f ..."; \
		k6 run $(K6_ENV) --out json=$(K6_OUT)/student-$$(basename $$f .js).json "$$f" || true; \
	done
	@echo "── Student suite complete ──"

.PHONY: k6-admin
k6-admin: k6-preflight ## Admin stakeholder suite (TS-010..013)
	@echo "── K6 Admin Suite ──"
	@for f in k6/scenarios/admin/ts-*.js; do \
		echo "Running $$f ..."; \
		k6 run $(K6_ENV) --out json=$(K6_OUT)/admin-$$(basename $$f .js).json "$$f" || true; \
	done
	@echo "── Admin suite complete ──"

.PHONY: k6-operator
k6-operator: k6-preflight ## Operator monitoring suite (TS-020..022)
	@echo "── K6 Operator Suite ──"
	@for f in k6/scenarios/operator/ts-*.js; do \
		echo "Running $$f ..."; \
		k6 run $(K6_ENV) --out json=$(K6_OUT)/operator-$$(basename $$f .js).json "$$f" || true; \
	done
	@echo "── Operator suite complete ──"

.PHONY: k6-security
k6-security: k6-preflight ## Security validation suite (TS-030..037)
	@echo "── K6 Security Suite ──"
	@for f in k6/scenarios/security/ts-*.js; do \
		echo "Running $$f ..."; \
		k6 run $(K6_ENV) --out json=$(K6_OUT)/security-$$(basename $$f .js).json "$$f" || true; \
	done
	@echo "── Security suite complete ──"

.PHONY: k6-load
k6-load: k6-preflight ## Sustained 10-min load test
	@echo "── K6 Sustained Load ──"
	k6 run $(K6_ENV) --out json=$(K6_OUT)/sustained-load.json k6/scenarios/load/ts-041-sustained-load.js

.PHONY: k6-spike
k6-spike: k6-preflight ## Spike test (50 VU peak)
	@echo "── K6 Spike Test ──"
	k6 run $(K6_ENV) --out json=$(K6_OUT)/spike.json k6/scenarios/load/ts-042-spike-test.js

.PHONY: k6-all
k6-all: k6-smoke k6-student k6-admin k6-operator k6-security ## All functional scenarios

.PHONY: k6-report
k6-report: k6-preflight ## Run smoke + generate HTML report via k6-reporter
	@echo "── K6 Smoke + HTML Report ──"
	k6 run $(K6_ENV) --out json=$(K6_OUT)/report-smoke.json k6/scenarios/load/ts-040-smoke.js
	@if command -v k6-reporter >/dev/null 2>&1; then \
		k6-reporter $(K6_OUT)/report-smoke.json -o $(K6_OUT)/report-smoke.html; \
		echo "HTML report: $(K6_OUT)/report-smoke.html"; \
	else \
		echo "k6-reporter not found. Install: npm install -g k6-reporter"; \
		echo "JSON report available at: $(K6_OUT)/report-smoke.json"; \
	fi

.PHONY: k6-report-full
k6-report-full: k6-preflight ## Run sustained load + generate HTML report
	@echo "── K6 Full Load + HTML Report ──"
	k6 run $(K6_ENV) --out json=$(K6_OUT)/report-full.json k6/scenarios/load/ts-041-sustained-load.js
	@if command -v k6-reporter >/dev/null 2>&1; then \
		k6-reporter $(K6_OUT)/report-full.json -o $(K6_OUT)/report-full.html; \
		echo "HTML report: $(K6_OUT)/report-full.html"; \
	else \
		echo "k6-reporter not found. Install: npm install -g k6-reporter"; \
		echo "JSON report available at: $(K6_OUT)/report-full.json"; \
	fi

.PHONY: k6-ci
k6-ci: k6-preflight ## Run smoke + print shell pass/fail summary (CI-friendly)
	@echo "── K6 CI Smoke ──"
	@k6 run $(K6_ENV) --quiet k6/scenarios/load/ts-040-smoke.js; \
	EXIT=$$?; \
	if [ $$EXIT -eq 0 ]; then \
		echo "PASS: smoke test passed"; \
	else \
		echo "FAIL: smoke test failed (exit $$EXIT)"; \
		exit $$EXIT; \
	fi

# ─── Help ────────────────────────────────────────────────────────────

.PHONY: help
help:
	@echo ""
	@echo "   _____ _    _ _ _ ____  "
	@echo "  / ____| | _(_) | |  _ \\ "
	@echo " | (___ | |/ / | | | |_) |"
	@echo "  \\___ \\|   <| | | |  _ < "
	@echo "  ____) | |\\ \\ | | | | \\ \\"
	@echo " |_____/|_| \\_\\_|_|_|_|  \\_\\"
	@echo ""
	@echo "  Full-Stack Development Toolkit"
	@echo ""
	@echo "  Go Backend:"
	@echo "  make go-build         Build Go backend binary"
	@echo "  make go-dev           Run Go backend in dev mode"
	@echo "  make go-test          Run Go backend tests"
	@echo "  make go-lint          Lint Go backend"
	@echo "  make migrate-up       Run database migrations up"
	@echo "  make migrate-down     Rollback last migration"
	@echo "  make migrate-reset    Drop all and re-run migrations"
	@echo ""
	@echo "  Frontend:"
	@echo "  make install          Install frontend dependencies"
	@echo "  make run-local        Install deps + start dev server"
	@echo "  make dev              Start Vite dev server"
	@echo "  make build            Build frontend for production"
	@echo "  make typecheck        Run TypeScript type checking"
	@echo "  make clean            Remove build artifacts"
	@echo ""
	@echo "  Combined:"
	@echo "  make build-all        Build frontend + backend"
	@echo "  make test-all         Run frontend + backend tests"
	@echo ""
	@echo "  Local Development:"
	@echo "  make local-up         Start local stack (app + PG + Redis + Solid) on :9090"
	@echo "  make local-down       Stop local stack and remove volumes"
	@echo "  make local-logs       Follow local stack logs"
	@echo "  make local-health     Health check local stack (:9090)"
	@echo "  make local-monitor    Continuously poll local stack (Ctrl+C to stop)"
	@echo "  make local-seed-pod   Seed admin account on Solid Pod"
	@echo ""
	@echo "  Docker:"
	@echo "  make docker-build     Build Docker image for current platform"
	@echo "  make docker-buildx    Build multi-arch image (amd64 + arm64)"
	@echo "  make docker-run       Run standalone container (requires DATABASE_URL)"
	@echo ""
	@echo "  Cloud Deployment:"
	@echo "  make onboard          Run GCP onboarding wizard (first-time setup)"
	@echo "  make ship             Deploy via .env.deploy config"
	@echo "  make ship-staging     Deploy staging via .env.deploy config"
	@echo "  make deploy           Build + push + deploy to Cloud Run"
	@echo "  make deploy-staging   Build + push + deploy staging (max 1 instance)"
	@echo "  make logs             Tail Cloud Run logs"
	@echo "  make health           Health check Cloud Run service"
	@echo "  make monitor          Continuously poll Cloud Run health (Ctrl+C to stop)"
	@echo "  make cloudrun-list    List Cloud Run services and revisions"
	@echo "  make cloudrun-delete  Delete all Cloud Run services (interactive)"
	@echo ""
	@echo "  K6 Tests:"
	@echo "  make k6-smoke         Quick smoke test (30s)"
	@echo "  make k6-student       Student stakeholder suite (TS-001..008)"
	@echo "  make k6-admin         Admin stakeholder suite (TS-010..013)"
	@echo "  make k6-operator      Operator monitoring suite (TS-020..022)"
	@echo "  make k6-security      Security validation suite (TS-030..037)"
	@echo "  make k6-load          Sustained 10-min load test"
	@echo "  make k6-spike         Spike test (50 VU peak)"
	@echo "  make k6-all           All functional scenarios"
	@echo "  make k6-report        Run smoke + generate HTML report"
	@echo "  make k6-report-full   Run sustained load + generate HTML report"
	@echo "  make k6-ci            CI-friendly smoke with pass/fail summary"
	@echo ""
	@echo "  Setup:"
	@echo "  make setup-firebase   Set up Firebase Auth (APIs, web app, providers)"
	@echo "  make setup-secrets    Store SA key in Secret Manager (one-time)"
	@echo "  make api-gen          Run OpenAPI code generation"
	@echo "  make set-admin        Manage Firebase Auth admin roles (interactive)"
