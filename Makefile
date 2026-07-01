# AI Virtual Staging Studio — developer shortcuts.
#
# Usage:
#   make install       # install backend + frontend dependencies
#   make dev-backend   # run the FastAPI backend (reload)
#   make dev-frontend  # run the Vite dev server
#   make test          # run backend + frontend tests
#   make build         # build the frontend for production
#   make docker-up     # build and start everything via Docker Compose

BACKEND_DIR  := backend
FRONTEND_DIR := frontend

.DEFAULT_GOAL := help
.PHONY: help install install-backend install-frontend dev-backend dev-frontend test test-backend test-frontend build docker-up docker-down

help: ## Show this help.
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

install: install-backend install-frontend ## Install all dependencies.

install-backend: ## Install Python dependencies.
	cd $(BACKEND_DIR) && pip install -r requirements.txt

install-frontend: ## Install Node dependencies.
	cd $(FRONTEND_DIR) && npm install

dev-backend: ## Run the FastAPI backend with autoreload on :8000.
	cd $(BACKEND_DIR) && uvicorn app.main:app --reload --port 8000

dev-frontend: ## Run the Vite dev server on :5173.
	cd $(FRONTEND_DIR) && npm run dev

test: test-backend test-frontend ## Run all tests.

test-backend: ## Run backend tests (pytest).
	cd $(BACKEND_DIR) && pytest

test-frontend: ## Run frontend tests.
	cd $(FRONTEND_DIR) && npm test

build: ## Build the frontend for production.
	cd $(FRONTEND_DIR) && npm run build

docker-up: ## Build and start all services via Docker Compose.
	docker compose up --build

docker-down: ## Stop and remove Docker Compose services.
	docker compose down
