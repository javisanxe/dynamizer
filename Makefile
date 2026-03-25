.DEFAULT_GOAL := help

API_DIR     := apps/api
WEB_DIR     := apps/web
POETRY      := cd $(API_DIR) && poetry

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
logs: ## Show Docker Compose logs (all services)
	docker-compose logs -f

.PHONY: logs-api
logs-api: ## Stream API logs (Docker)
	docker-compose logs -f api

.PHONY: redis
redis: ## Open Redis CLI
	docker compose exec redis redis-cli

# ─── Setup ────────────────────────────────────────────────────────────────────

.PHONY: install
install: install-api install-web ## Install all dependencies (backend + frontend)

.PHONY: install-api
install-api: ## Install backend dependencies via Poetry (creates .venv if needed)
	$(POETRY) install --with dev
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
	$(POETRY) run uvicorn app.main:asgi_app --reload --host 0.0.0.0 --port 8000

.PHONY: dev-web
dev-web: ## Start Next.js dev server
	npm run dev --prefix $(WEB_DIR)

# ─── Tests ────────────────────────────────────────────────────────────────────

.PHONY: test
test: test-api test-web ## Run all tests (backend + frontend)

.PHONY: test-api
test-api: ## Run backend tests (pytest)
	$(POETRY) run pytest tests -v

.PHONY: test-api-logs
test-api-logs: ## Run backend tests showing log output (DEBUG level)
	$(POETRY) run pytest tests -v -s --log-cli-level=DEBUG

.PHONY: test-web
test-web: ## Run frontend tests (Jest)
	npm test --prefix $(WEB_DIR)

.PHONY: test-cov
test-cov: ## Run all tests with coverage (backend + frontend)
	$(POETRY) run pytest tests --cov=app --cov-report=term-missing
	npm test --prefix $(WEB_DIR) -- --coverage

.PHONY: test-cov-api
test-cov-api: ## Run backend tests with coverage report
	$(POETRY) run pytest tests --cov=app --cov-report=term-missing

.PHONY: test-cov-web
test-cov-web: ## Run frontend tests with coverage report
	npm test --prefix $(WEB_DIR) -- --coverage

# ─── Lint & Format ───────────────────────────────────────────────────────────

.PHONY: lint
lint: lint-api lint-web ## Run linters on backend and frontend

.PHONY: lint-api
lint-api: ## Run ruff linter on backend
	$(POETRY) run ruff check app tests

.PHONY: lint-web
lint-web: ## Run ESLint on frontend
	npm run lint --prefix $(WEB_DIR)

.PHONY: format
format: ## Format backend code with ruff
	$(POETRY) run ruff format app tests

.PHONY: format-check
format-check: ## Check backend formatting without applying changes
	$(POETRY) run ruff format --check app tests

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
