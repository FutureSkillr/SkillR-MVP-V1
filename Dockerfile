# Stage 1: Build frontend SPA
# L1: Pin base images to SHA digests for supply-chain safety
# Update digests when upgrading base image versions.
FROM node:20-alpine@sha256:09e2b3d9726018aecf269bd35325f46bf75046a643a66d28360ec71132750ec8 AS frontend-build

WORKDIR /app/frontend

# Install dependencies first (better layer caching)
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

# Copy frontend source and build
COPY frontend/ ./
RUN npm run build

# Stage 2: Build Go backend
# TARGETARCH is auto-set by buildx (amd64, arm64, etc.)
FROM golang:1.24-alpine@sha256:8bee1901f1e530bfb4a7850aa7a479d17ae3a18beb6e09064ed54cfd245b7191 AS backend-build

ARG TARGETOS=linux
ARG TARGETARCH=amd64

WORKDIR /app/backend

# Download dependencies first (better layer caching)
COPY backend/go.mod backend/go.sum ./
RUN go mod download

# Copy backend source and build for the target platform
COPY backend/ ./
ARG GIT_SHA=unknown
RUN CGO_ENABLED=0 GOOS=${TARGETOS} GOARCH=${TARGETARCH} go build -ldflags="-s -w -X main.version=${GIT_SHA}" -o /server ./cmd/server

# Stage 3: Production (Node.js + CSS + Go server)
FROM node:20-alpine@sha256:09e2b3d9726018aecf269bd35325f46bf75046a643a66d28360ec71132750ec8

# Install CSS globally (Community Solid Server v7)
RUN npm install -g @solid/community-server@7 && npm cache clean --force

# Create non-root user
RUN addgroup -S app && adduser -S -G app app

# Copy Go server binary
COPY --from=backend-build /server /app/server

# Copy frontend assets and migrations
COPY --from=frontend-build /app/frontend/dist /app/static
COPY backend/migrations /app/migrations

# Copy CSS config and entrypoint
COPY solid/config /app/solid-config
COPY scripts/entrypoint.sh /app/entrypoint.sh
COPY scripts/seed-pod.sh /app/seed-pod.sh
RUN chmod +x /app/entrypoint.sh /app/seed-pod.sh

# Create data directory for CSS
RUN mkdir -p /app/pod-data && chown -R app:app /app

ENV PORT=8080
ENV CSS_PORT=3000
ENV SOLID_POD_URL=http://localhost:3000
ENV SOLID_POD_ADMIN_EMAIL=admin@skillr.local
ENV SOLID_POD_ADMIN_PASSWORD=skillr

USER app
WORKDIR /app
ENTRYPOINT ["/app/entrypoint.sh"]
