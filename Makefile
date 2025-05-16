# Makefile

APP_NAME      := village-notifier
IMAGE_NAME    := $(APP_NAME):latest
ENV_FILE      := .env

# .PHONY targets are not real files
.PHONY: help install dev docker-build docker-run clean

help:
	@echo "Usage:"
	@echo "  make install        # Install with Bun"
	@echo "  make start          # Run in production"
	@echo "  make dev            # Run in development"
	@echo "  make docker-build   # Build Docker image"
	@echo "  make docker-run     # Run Docker container"
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
	@echo "🐳 Building Docker image '$(IMAGE_NAME)'..."
	docker build -t $(IMAGE_NAME) .

docker-run:
	@echo "▶️  Running Docker container from '$(IMAGE_NAME)'..."
	docker run --rm -it \
	  --env-file $(ENV_FILE) \
	  $(IMAGE_NAME)

clean:
	@echo "🧹 Cleaning up build artifacts..."
	# If you used bun build/dist, remove it:
	rm -rf dist
