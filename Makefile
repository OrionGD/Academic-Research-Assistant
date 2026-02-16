.PHONY: help install dev install-dev lint format test test-cov clean build docker-build docker-up docker-down deploy check

# Variables
PYTHON := python3
PIP := pip3
PROJECT_NAME := vector-db-integrations
DOCKER_COMPOSE := docker-compose
DOCKER_IMAGE := $(PROJECT_NAME):latest
PYTEST := pytest
BLACK := black
ISORT := isort
FLAKE8 := flake8
MYPY := mypy

# Colors for help
GREEN := \033[0;32m
NC := \033[0m

help: ## Show this help message
	@printf "${GREEN}Available commands:${NC}\n"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  ${GREEN}%-20s${NC} %s\n", $$1, $$2}'

install: ## Install production dependencies
	$(PIP) install -r requirements.txt

dev: install-dev ## Alias for install-dev

install-dev: ## Install development dependencies
	$(PIP) install -e .[dev]
	pre-commit install

lint: ## Run all linters
	$(BLACK) --check vector_db/ tests/
	$(ISORT) --check-only vector_db/ tests/
	$(FLAKE8) vector_db/ tests/
	$(MYPY) vector_db/
	bandit -r vector_db/ -c pyproject.toml

format: ## Format code
	$(BLACK) vector_db/ tests/
	$(ISORT) vector_db/ tests/
	autoflake --in-place --remove-all-unused-imports --remove-unused-variables -r vector_db/ tests/

test: ## Run tests
	$(PYTEST) tests/ -v

test-cov: ## Run tests with coverage
	$(PYTEST) tests/ --cov=vector_db --cov-report=term-missing --cov-report=html

test-integration: ## Run integration tests
	$(PYTEST) tests/integration/ -v -m integration

test-unit: ## Run unit tests
	$(PYTEST) tests/unit/ -v -m unit

clean: ## Clean build artifacts
	rm -rf build/
	rm -rf dist/
	rm -rf *.egg-info
	rm -rf .pytest_cache/
	rm -rf .coverage
	rm -rf htmlcov/
	rm -rf .mypy_cache/
	rm -rf .ruff_cache/
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	find . -type f -name "*.pyo" -delete
	find . -type f -name "*.pyd" -delete
	find . -type f -name ".coverage" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} +

build: clean ## Build package
	$(PYTHON) -m build

docker-build: ## Build Docker image
	docker build -t $(DOCKER_IMAGE) .

docker-up: ## Start Docker services
	$(DOCKER_COMPOSE) up -d

docker-down: ## Stop Docker services
	$(DOCKER_COMPOSE) down

docker-logs: ## View Docker logs
	$(DOCKER_COMPOSE) logs -f

docker-clean: ## Remove Docker containers and volumes
	$(DOCKER_COMPOSE) down -v
	docker system prune -f

deploy: ## Deploy to production (customize as needed)
	@echo "Deploying to production..."
	# Add your deployment commands here
	# e.g., kubectl apply -f k8s/
	# e.g., ansible-playbook deploy.yml

check: test lint ## Run all checks (tests and linters)

ci: lint test-cov ## CI pipeline commands

pre-commit-run: ## Run pre-commit hooks on all files
	pre-commit run --all-files

pre-commit-update: ## Update pre-commit hooks
	pre-commit autoupdate

requirements: ## Generate requirements.txt with pinned versions
	$(PIP) freeze > requirements-lock.txt

db-migrate: ## Run database migrations
	@echo "Running migrations..."
	# Add migration commands here

seed-db: ## Seed database with sample data
	@echo "Seeding database..."
	# Add seeding commands here

shell: ## Open Python shell with project context
	PYTHONPATH=. $(PYTHON)

version: ## Show current version
	@python -c "import vector_db; print(vector_db.__version__)"

docs: ## Build documentation
	cd docs && make html

docs-serve: ## Serve documentation locally
	cd docs/build/html && python -m http.server 8000

security-scan: ## Run security scan
	bandit -r vector_db/ -f json -o security-report.json
	safety check

# Development server
run-dev: ## Run development server
	uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Production server
run-prod: ## Run production server
	gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000

# Initialize new environment
init: install-dev docker-build pre-commit-run ## Initialize development environment

# Database backups
backup-db: ## Backup database
	@echo "Creating database backup..."
	# Add backup commands here

restore-db: ## Restore database from backup
	@echo "Restoring database..."
	# Add restore commands here

# Default target
.DEFAULT_GOAL := help