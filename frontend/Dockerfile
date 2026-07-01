# AI Virtual Staging Studio — frontend image (multi-stage).

# ---- Build stage -----------------------------------------------------------
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies first for better layer caching.
COPY package*.json ./
RUN npm ci

# Build-time API URL, injected by Docker Compose (see docker-compose.yml).
ARG VITE_API_URL=http://localhost:8000
ENV VITE_API_URL=$VITE_API_URL

# Copy source and produce the optimized static build in /app/dist.
COPY . .
RUN npm run build

# ---- Serve stage -----------------------------------------------------------
FROM node:20-alpine AS serve

WORKDIR /app

# Bring in the compiled app and just enough to run `vite preview`.
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/vite.config.* ./

EXPOSE 4173

# Serve the built assets. --host exposes it outside the container.
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "4173"]
