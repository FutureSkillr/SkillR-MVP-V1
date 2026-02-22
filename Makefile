# Future Skiller — Project Makefile
# Usage: make <target> [GEMINI_API_KEY=...]

.DEFAULT_GOAL := help

PROJECT_ID   := future-skillr
REGION       := europe-west3
SERVICE      := future-skillr
IMAGE_NAME   := future-skillr
TAG          := latest

# ─── Prerequisites ────────────────────────────────────────────────────

.PHONY: check-api-key
check-api-key:
ifndef GEMINI_API_KEY
	$(error GEMINI_API_KEY is not set. Export it or pass via make: GEMINI_API_KEY=...)
endif

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

.PHONY: docker-build
docker-build: check-api-key
	docker build \
		--build-arg GEMINI_API_KEY=$(GEMINI_API_KEY) \
		-t $(IMAGE_NAME):$(TAG) .

.PHONY: docker-run
docker-run:
	docker run --rm -p 8080:8080 $(IMAGE_NAME):$(TAG)

# ─── Cloud Run Deploy ────────────────────────────────────────────────

.PHONY: deploy
deploy: check-api-key
	gcloud run deploy $(SERVICE) \
		--project $(PROJECT_ID) \
		--region $(REGION) \
		--source . \
		--build-arg GEMINI_API_KEY=$(GEMINI_API_KEY) \
		--allow-unauthenticated \
		--max-instances 10

.PHONY: deploy-staging
deploy-staging: check-api-key
	gcloud run deploy $(SERVICE)-staging \
		--project $(PROJECT_ID) \
		--region $(REGION) \
		--source . \
		--build-arg GEMINI_API_KEY=$(GEMINI_API_KEY) \
		--allow-unauthenticated \
		--max-instances 1

# ─── Logs ────────────────────────────────────────────────────────────

.PHONY: logs
logs:
	gcloud run services logs tail $(SERVICE) \
		--project $(PROJECT_ID) \
		--region $(REGION)

# ─── Admin Tools ────────────────────────────────────────────────────

.PHONY: set-admin
set-admin:
	cd scripts && npm install --silent && node set-admin.mjs

# ─── API Code Generation ────────────────────────────────────────────

.PHONY: api-gen
api-gen:
	$(MAKE) -C integrations/api-spec all

# ─── Help ────────────────────────────────────────────────────────────

.PHONY: help
help:
	@echo "Future Skiller Makefile"
	@echo ""
	@echo "  make install          Install frontend dependencies"
	@echo "  make run-local        Install deps + start dev server"
	@echo "  make dev              Start Vite dev server"
	@echo "  make build            Build frontend for production"
	@echo "  make typecheck        Run TypeScript type checking"
	@echo "  make clean            Remove build artifacts"
	@echo ""
	@echo "  make docker-build     Build Docker image (requires GEMINI_API_KEY)"
	@echo "  make docker-run       Run Docker image locally on :8080"
	@echo ""
	@echo "  make deploy           Deploy to Cloud Run production"
	@echo "  make deploy-staging   Deploy to Cloud Run staging (max 1 instance)"
	@echo "  make logs             Tail Cloud Run logs"
	@echo ""
	@echo "  make api-gen          Run OpenAPI code generation"
	@echo ""
	@echo "  make set-admin        Manage Firebase Auth admin roles (interactive)"
