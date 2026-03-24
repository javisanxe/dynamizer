.DEFAULT_GOAL := help

API_DIR     := apps/api
WEB_DIR     := apps/web
PYTHON      := $(API_DIR)/.venv/bin/python
PIP         := $(API_DIR)/.venv/bin/pip
PYTEST      := $(API_DIR)/.venv/bin/pytest
RUFF        := $(API_DIR)/.venv/bin/ruff
UVICORN     := $(API_DIR)/.venv/bin/uvicorn

# ─── Help ────────────────────────────────────────────────────────────────────

.PHONY: help
help: ## Show available targets
	@grep -E '^[a-zA-Z_-]+:.*##' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*##"}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}' \
		| sort

# ─── Infrastructure ───────────────────────────────────────────────────────────

.PHONY: up
up: ## Start Postgres and Redis (Docker Compose)
	docker-compose up -d

.PHONY: down
down: ## Stop Docker Compose services
	docker-compose down

.PHONY: logs
logs: ## Show Docker Compose logs
	docker-compose logs -f

# ─── Setup ────────────────────────────────────────────────────────────────────

.PHONY: install
install: install-api install-web ## Install all dependencies (backend + frontend)

.PHONY: install-api
install-api: ## Install backend dependencies (creates .venv if needed)
	python3 -m venv $(API_DIR)/.venv
	$(PIP) install --upgrade pip
	$(PIP) install -e "$(API_DIR)/[dev]"
	@if [ ! -f $(API_DIR)/.env ]; then cp $(API_DIR)/.env.example $(API_DIR)/.env; echo "Created $(API_DIR)/.env from .env.example"; fi

.PHONY: install-web
install-web: ## Install frontend dependencies
	npm install --prefix $(WEB_DIR)
	@if [ ! -f $(WEB_DIR)/.env.local ]; then cp $(WEB_DIR)/.env.example $(WEB_DIR)/.env.local 2>/dev/null || true; fi

# ─── Development ──────────────────────────────────────────────────────────────

.PHONY: dev
dev: ## Start backend and frontend in parallel
	@make -j2 dev-api dev-web

.PHONY: dev-api
dev-api: ## Start FastAPI server with hot-reload
	$(UVICORN) app.main:asgi_app --reload --host 0.0.0.0 --port 8000 --app-dir $(API_DIR)

.PHONY: dev-web
dev-web: ## Start Next.js dev server
	npm run dev --prefix $(WEB_DIR)

# ─── Tests ────────────────────────────────────────────────────────────────────

.PHONY: test
test: test-api test-web ## Run all tests (backend + frontend)

.PHONY: test-api
test-api: ## Run backend tests (pytest)
	$(PYTEST) $(API_DIR)/tests -v

.PHONY: test-web
test-web: ## Run frontend tests (Jest)
	npm test --prefix $(WEB_DIR)

.PHONY: test-cov
test-cov: test-cov-api test-cov-web ## Run all tests with coverage

.PHONY: test-cov-api
test-cov-api: ## Run backend tests with coverage report
	$(PYTEST) $(API_DIR)/tests --cov=$(API_DIR)/app --cov-report=term-missing

.PHONY: test-cov-web
test-cov-web: ## Run frontend tests with coverage report
	npm test --prefix $(WEB_DIR) -- --coverage

# ─── Lint & Format ───────────────────────────────────────────────────────────

.PHONY: lint
lint: lint-api lint-web ## Run linters on backend and frontend

.PHONY: lint-api
lint-api: ## Run ruff linter on backend
	$(RUFF) check $(API_DIR)/app $(API_DIR)/tests

.PHONY: lint-web
lint-web: ## Run ESLint on frontend
	npm run lint --prefix $(WEB_DIR)

.PHONY: format
format: ## Format backend code with ruff
	$(RUFF) format $(API_DIR)/app $(API_DIR)/tests

.PHONY: format-check
format-check: ## Check backend formatting without applying changes
	$(RUFF) format --check $(API_DIR)/app $(API_DIR)/tests

# ─── Clean ────────────────────────────────────────────────────────────────────

.PHONY: clean
clean: ## Remove build artifacts and caches
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .pytest_cache -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .ruff_cache -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	rm -rf $(WEB_DIR)/.next
	rm -rf $(WEB_DIR)/coverage
	@echo "Cleaned build artifacts"
