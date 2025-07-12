# Makefile

APP_NAME      := petite-fille
IMAGE_NAME    := $(APP_NAME):latest
ENV_FILE      := .env

# .PHONY targets are not real files
.PHONY: help install dev docker-build docker-run clean

help:
	@echo "Usage:"
	@echo "  make install        # Install with Bun"
	@echo "  make start          # Run in production"
	@echo "  make dev            # Run in development"
	@echo "  make docker-build   # Build Docker image with docker compose"
	@echo "  make docker-run     # Run Docker container with hot reload"
	@echo "  make docker-stop    # Stop Docker container"
	@echo "  make docker-logs    # View Docker logs"
	@echo "  make clean          # Clean build artifacts"

install:
	@echo "🔧 Installing dependencies with Bun..."
	bun install

start:
	@echo "🚀 Running in production mode..."
	bun run start

dev:
	@echo "🚀 Running in development mode..."
	# you can add --watch or nodemon-like tooling here
	bun run watch

docker-build:
	@echo "🐳 Building Docker image with docker compose..."
	docker compose build --no-cache

docker-run:
	@echo "▶️  Running Docker container with hot reload..."
	docker compose up -d

docker-stop:
	@echo "⏹️  Stopping Docker container..."
	docker compose down

docker-logs:
	@echo "📋 Viewing Docker logs..."
	docker compose logs -f

docker-restart:
	@echo "🔄 Restarting Docker container..."
	docker compose restart

clean:
	@echo "🧹 Cleaning up build artifacts..."
	# If you used bun build/dist, remove it:
	rm -rf dist
	# Also clean up Docker containers and images
	docker compose down --rmi all --volumes --remove-orphans
