# Stage 1: Build the frontend
FROM node:20-alpine AS build

ARG GEMINI_API_KEY

WORKDIR /app/frontend

# Install dependencies first (better layer caching)
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

# Copy frontend source
COPY frontend/ ./

# Write .env.local so Vite's loadEnv picks up the API key during build
RUN echo "GEMINI_API_KEY=${GEMINI_API_KEY}" > .env.local

# Build the production bundle
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:1.25-alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy nginx config template
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Copy built assets from build stage
COPY --from=build /app/frontend/dist /usr/share/nginx/html

# Cloud Run sets PORT=8080; envsubst injects it into nginx config
ENV PORT=8080
EXPOSE 8080

# nginx:alpine image uses envsubst automatically via docker-entrypoint.d
CMD ["nginx", "-g", "daemon off;"]
