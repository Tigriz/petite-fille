# 1. Base image with Bun pre-installed
FROM oven/bun:latest AS base
WORKDIR /app

# 2. Install dependencies first (leveraging Docker cache)
#    Copy package files and scripts needed for installation
COPY package.json bun.lock ./
COPY src/scripts/ ./src/scripts/
RUN bun install --production

# 3. Copy your source & config
COPY . .

# 4. Build step (optional bundling—Bun can run TS directly, so you can skip this)
# RUN bun build src/index.ts --outdir dist

# 5. Runtime
ENV NODE_ENV=production
# If you want Bun to minimize startup logs:
ENV BUN_LOG_LEVEL=error

# Expose any port if you have one (e.g. for healthcheck)
# EXPOSE 3000

# Default command: run your notifier
CMD ["bun", "run", "start"]
