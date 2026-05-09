#!/usr/bin/env bash
# =============================================================================
# FlowForge AI — Single-Click Linux Launcher
# =============================================================================
# Usage:  ./start.sh
# Requirements: docker, docker compose (v2) or docker-compose (v1),
#               node (>=18), npm, curl, psql (postgresql-client)
#
# On first run:
#   - Prompts for Tambo API key
#   - Auto-generates ENCRYPTION_KEY
#   - Starts PostgreSQL + Redis via Docker
#   - Runs database migrations + seed
#   - Starts Next.js dev server on port 3001
#   - Starts BullMQ worker
#   - Opens browser automatically
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Colors
# ---------------------------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

log_info()    { echo -e "${CYAN}[INFO ]${RESET} $*"; }
log_ok()      { echo -e "${GREEN}[ OK  ]${RESET} $*"; }
log_warn()    { echo -e "${YELLOW}[WARN ]${RESET} $*"; }
log_error()   { echo -e "${RED}[ERROR]${RESET} $*" >&2; }
log_section() { echo -e "\n${BOLD}${BLUE}── $* ──────────────────────────────────────────${RESET}"; }

die() {
    log_error "$*"
    exit 1
}

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/.env.local"
LOG_DIR="${SCRIPT_DIR}/logs"
NEXTJS_LOG="${LOG_DIR}/nextjs.log"
WORKER_LOG="${LOG_DIR}/worker.log"
COMPOSE_FILE="${SCRIPT_DIR}/docker-compose.yml"

APP_PORT=3001
APP_URL="http://localhost:${APP_PORT}"
HEALTH_URL="${APP_URL}/api/health"

# ---------------------------------------------------------------------------
# Process tracking
# ---------------------------------------------------------------------------
NEXTJS_PID=""
WORKER_PID=""
TAILER_PID=""

# ---------------------------------------------------------------------------
# Graceful shutdown
# ---------------------------------------------------------------------------
cleanup() {
    # Disable the trap to prevent re-entry
    trap '' SIGINT SIGTERM EXIT

    echo ""
    log_section "Shutting down FlowForge AI"

    if [[ -n "${TAILER_PID}" ]] && kill -0 "${TAILER_PID}" 2>/dev/null; then
        kill "${TAILER_PID}" 2>/dev/null || true
        wait "${TAILER_PID}" 2>/dev/null || true
    fi

    if [[ -n "${NEXTJS_PID}" ]] && kill -0 "${NEXTJS_PID}" 2>/dev/null; then
        log_info "Stopping Next.js (PID ${NEXTJS_PID})..."
        kill "${NEXTJS_PID}" 2>/dev/null || true
        wait "${NEXTJS_PID}" 2>/dev/null || true
    fi

    if [[ -n "${WORKER_PID}" ]] && kill -0 "${WORKER_PID}" 2>/dev/null; then
        log_info "Stopping BullMQ worker (PID ${WORKER_PID})..."
        kill "${WORKER_PID}" 2>/dev/null || true
        wait "${WORKER_PID}" 2>/dev/null || true
    fi

    log_info "Stopping Docker services (data is preserved)..."
    ${DOCKER_COMPOSE_CMD:-docker compose} -f "${COMPOSE_FILE}" stop 2>/dev/null || true

    log_ok "FlowForge AI stopped. Data is preserved in Docker volumes."
    log_info "To wipe all data: docker compose -f ${COMPOSE_FILE} down -v"
}

trap cleanup SIGINT SIGTERM EXIT

# ---------------------------------------------------------------------------
# Detect docker compose command (v2 plugin or v1 standalone)
# ---------------------------------------------------------------------------
DOCKER_COMPOSE_CMD=""
if docker compose version &>/dev/null 2>&1; then
    DOCKER_COMPOSE_CMD="docker compose"
elif command -v docker-compose &>/dev/null; then
    DOCKER_COMPOSE_CMD="docker-compose"
fi

# ---------------------------------------------------------------------------
# Helper: read a value from .env.local without sourcing
# ---------------------------------------------------------------------------
read_env_var() {
    local key="$1"
    if [[ -f "${ENV_FILE}" ]]; then
        grep -E "^${key}=" "${ENV_FILE}" 2>/dev/null | tail -1 | cut -d= -f2- \
            | sed "s/^['\"]//;s/['\"]$//"
    fi
}

env_var_set() {
    local val
    val="$(read_env_var "$1")"
    [[ -n "${val}" ]]
}

append_env() {
    local key="$1"
    local val="$2"
    echo "${key}=${val}" >> "${ENV_FILE}"
}

# ---------------------------------------------------------------------------
# STEP 1 — Check prerequisites
# ---------------------------------------------------------------------------
log_section "Checking prerequisites"

MISSING=()
command -v docker &>/dev/null || MISSING+=("docker")
command -v node   &>/dev/null || MISSING+=("node (>=18)")
command -v npm    &>/dev/null || MISSING+=("npm")
command -v curl   &>/dev/null || MISSING+=("curl")
command -v psql   &>/dev/null || MISSING+=("psql  (package: postgresql-client)")

if [[ -z "${DOCKER_COMPOSE_CMD}" ]]; then
    MISSING+=("docker compose  (package: docker-compose-v2  OR  docker-compose)")
fi

if [[ ${#MISSING[@]} -gt 0 ]]; then
    log_error "Missing required tools:"
    for t in "${MISSING[@]}"; do echo -e "  ${RED}•${RESET} ${t}"; done
    echo ""
    echo "  Install on Ubuntu/Debian:"
    echo "    sudo apt-get update"
    echo "    sudo apt-get install -y docker.io docker-compose-v2 nodejs npm curl postgresql-client"
    echo "    sudo usermod -aG docker \$USER   # then log out and back in"
    die "Please install the missing tools and re-run."
fi

if ! docker info &>/dev/null 2>&1; then
    die "Docker daemon is not running or you lack permission.\n  Try: sudo systemctl start docker\n  Or add yourself to the docker group: sudo usermod -aG docker \$USER"
fi

NODE_MAJOR="$(node --version | sed 's/v\([0-9]*\).*/\1/')"
if [[ "${NODE_MAJOR}" -lt 18 ]]; then
    log_warn "Node.js $(node --version) is below the recommended minimum v18."
fi

log_ok "docker  : $(docker --version | head -1)"
log_ok "compose : $(${DOCKER_COMPOSE_CMD} version 2>/dev/null | head -1)"
log_ok "node    : $(node --version)"
log_ok "npm     : $(npm --version)"

# ---------------------------------------------------------------------------
# STEP 2 — Populate .env.local
# ---------------------------------------------------------------------------
log_section "Environment configuration"

[[ -f "${ENV_FILE}" ]] || touch "${ENV_FILE}"

# Tambo API key — must be provided by user
if ! env_var_set "NEXT_PUBLIC_TAMBO_API_KEY"; then
    echo ""
    log_warn "NEXT_PUBLIC_TAMBO_API_KEY is not set."
    echo -e "  ${CYAN}Get your free API key at: https://app.tambo.co/dashboard${RESET}"
    echo -n "  Enter your Tambo API key (or press Enter to skip for now): "
    read -r TAMBO_KEY
    if [[ -n "${TAMBO_KEY}" ]]; then
        append_env "NEXT_PUBLIC_TAMBO_API_KEY" "${TAMBO_KEY}"
        log_ok "NEXT_PUBLIC_TAMBO_API_KEY saved to .env.local"
    else
        log_warn "Skipped — AI chat features will not work without this key."
        append_env "NEXT_PUBLIC_TAMBO_API_KEY" "YOUR_TAMBO_API_KEY_HERE"
    fi
fi

# Auto-populate infrastructure vars from docker-compose.yml defaults
if ! env_var_set "DATABASE_URL"; then
    append_env "DATABASE_URL" "postgresql://flowforge:flowforge_dev_password@localhost:5432/flowforge"
    log_info "DATABASE_URL set to Docker Compose default."
fi

if ! env_var_set "REDIS_URL"; then
    append_env "REDIS_URL" "redis://localhost:6379"
    log_info "REDIS_URL set to Docker Compose default."
fi

if ! env_var_set "ENCRYPTION_KEY"; then
    GENERATED_KEY="$(node -e "process.stdout.write(require('crypto').randomBytes(32).toString('hex'))")"
    append_env "ENCRYPTION_KEY" "${GENERATED_KEY}"
    log_ok "ENCRYPTION_KEY auto-generated (32 random bytes). Keep .env.local secret."
fi

if ! env_var_set "NEXT_PUBLIC_APP_URL"; then
    append_env "NEXT_PUBLIC_APP_URL" "${APP_URL}"
    log_info "NEXT_PUBLIC_APP_URL set to ${APP_URL}."
fi

if ! env_var_set "NODE_ENV"; then
    append_env "NODE_ENV" "development"
fi

log_ok ".env.local is ready."

# ---------------------------------------------------------------------------
# STEP 3 — Install node_modules if missing
# ---------------------------------------------------------------------------
log_section "Node.js dependencies"

if [[ ! -d "${SCRIPT_DIR}/node_modules" ]] || [[ ! -f "${SCRIPT_DIR}/node_modules/.package-lock.json" && ! -f "${SCRIPT_DIR}/node_modules/.yarn-integrity" ]]; then
    log_info "Installing npm dependencies (this takes ~30s on first run)..."
    cd "${SCRIPT_DIR}" && npm install --prefer-offline 2>&1 | tail -5
    log_ok "npm install complete."
else
    log_ok "node_modules already installed."
fi

mkdir -p "${LOG_DIR}"

# ---------------------------------------------------------------------------
# STEP 4 — Start Docker services
# ---------------------------------------------------------------------------
log_section "Starting infrastructure (PostgreSQL + Redis)"

cd "${SCRIPT_DIR}"
${DOCKER_COMPOSE_CMD} -f "${COMPOSE_FILE}" up -d --remove-orphans 2>&1 \
    | grep -E "Starting|Started|Creating|Created|Pulling|Pulled|healthy|running|up-to-date" \
    || true

# Wait for PostgreSQL
log_info "Waiting for PostgreSQL to be ready..."
PG_ATTEMPTS=0
PG_MAX=30
until ${DOCKER_COMPOSE_CMD} -f "${COMPOSE_FILE}" exec -T postgres \
        pg_isready -U flowforge -d flowforge -q 2>/dev/null; do
    PG_ATTEMPTS=$((PG_ATTEMPTS + 1))
    [[ ${PG_ATTEMPTS} -ge ${PG_MAX} ]] && die "PostgreSQL did not start within 60s.\n  Check: ${DOCKER_COMPOSE_CMD} -f ${COMPOSE_FILE} logs postgres"
    printf "."
    sleep 2
done
echo ""
log_ok "PostgreSQL is ready."

# Wait for Redis
log_info "Waiting for Redis to be ready..."
REDIS_ATTEMPTS=0
REDIS_MAX=20
until ${DOCKER_COMPOSE_CMD} -f "${COMPOSE_FILE}" exec -T redis \
        redis-cli ping 2>/dev/null | grep -q "PONG"; do
    REDIS_ATTEMPTS=$((REDIS_ATTEMPTS + 1))
    [[ ${REDIS_ATTEMPTS} -ge ${REDIS_MAX} ]] && die "Redis did not start within 20s.\n  Check: ${DOCKER_COMPOSE_CMD} -f ${COMPOSE_FILE} logs redis"
    printf "."
    sleep 1
done
echo ""
log_ok "Redis is ready."

# ---------------------------------------------------------------------------
# STEP 5 — First-run database setup
# ---------------------------------------------------------------------------
log_section "Database setup"

DB_URL="$(read_env_var "DATABASE_URL")"

# Check if the users table already exists
USERS_EXISTS="$(
    psql "${DB_URL}" -tAc \
        "SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='users');" \
        2>/dev/null || echo "f"
)"

if [[ "${USERS_EXISTS}" != "t" ]]; then
    log_info "First run — pushing database schema..."
    cd "${SCRIPT_DIR}"
    # Load env vars for drizzle-kit
    set -a; source "${ENV_FILE}"; set +a
    npx drizzle-kit push 2>&1 | grep -v "^$" | sed "s/^/  /" || true
    log_ok "Schema applied."

    log_info "Seeding database with template workflows..."
    npx tsx src/db/seed.ts 2>&1 | grep -v "^$" | sed "s/^/  /" || true
    log_ok "Database seeded."
else
    log_ok "Database schema already initialized — skipping migrations."
fi

# ---------------------------------------------------------------------------
# STEP 6 — Start Next.js dev server
# ---------------------------------------------------------------------------
log_section "Starting Next.js dev server (port ${APP_PORT})"

cd "${SCRIPT_DIR}"
# Load .env.local into child process environment
set -a; source "${ENV_FILE}"; set +a

npm run dev > "${NEXTJS_LOG}" 2>&1 &
NEXTJS_PID=$!
log_ok "Next.js started (PID ${NEXTJS_PID}) → logs/nextjs.log"

# ---------------------------------------------------------------------------
# STEP 7 — Start BullMQ worker
# ---------------------------------------------------------------------------
log_section "Starting BullMQ workflow worker"

npm run worker:dev > "${WORKER_LOG}" 2>&1 &
WORKER_PID=$!
log_ok "Worker started (PID ${WORKER_PID}) → logs/worker.log"

# ---------------------------------------------------------------------------
# STEP 8 — Wait for app to be healthy
# ---------------------------------------------------------------------------
log_section "Waiting for application to be ready"

log_info "Polling ${HEALTH_URL} ..."
HEALTH_ATTEMPTS=0
HEALTH_MAX=60   # 120 seconds max

until curl -sf "${HEALTH_URL}" >/dev/null 2>&1; do
    # Check if Next.js is still alive
    if ! kill -0 "${NEXTJS_PID}" 2>/dev/null; then
        echo ""
        log_error "Next.js process died unexpectedly. Last output:"
        tail -40 "${NEXTJS_LOG}" >&2
        die "Next.js failed to start. See logs/nextjs.log for details."
    fi
    HEALTH_ATTEMPTS=$((HEALTH_ATTEMPTS + 1))
    if [[ ${HEALTH_ATTEMPTS} -ge ${HEALTH_MAX} ]]; then
        echo ""
        log_error "App did not become healthy within 120s. Last Next.js output:"
        tail -30 "${NEXTJS_LOG}" >&2
        die "Start-up timed out. See logs/nextjs.log"
    fi
    printf "."
    sleep 2
done
echo ""
log_ok "Application is healthy!"

# ---------------------------------------------------------------------------
# STEP 9 — Open browser
# ---------------------------------------------------------------------------
log_section "Opening browser"

if command -v xdg-open &>/dev/null; then
    xdg-open "${APP_URL}" &>/dev/null &
    log_ok "Opened ${APP_URL} in your default browser."
elif command -v sensible-browser &>/dev/null; then
    sensible-browser "${APP_URL}" &>/dev/null &
    log_ok "Opened ${APP_URL} via sensible-browser."
else
    log_warn "Could not auto-open browser. Navigate to: ${APP_URL}"
fi

# ---------------------------------------------------------------------------
# STEP 10 — Live log tailing + wait
# ---------------------------------------------------------------------------
log_section "FlowForge AI is running"

echo -e ""
echo -e "  ${GREEN}${BOLD}App URL   : ${APP_URL}${RESET}"
echo -e "  ${GREEN}Health    : ${HEALTH_URL}${RESET}"
echo -e "  ${CYAN}Next.js log: logs/nextjs.log${RESET}"
echo -e "  ${CYAN}Worker log : logs/worker.log${RESET}"
echo -e ""
echo -e "  ${YELLOW}Press Ctrl+C to stop all services gracefully.${RESET}"
echo -e ""
echo -e "${BLUE}──────────────────────────── Live Logs ─────────────────────────────${RESET}"

# Tail both log files with source labels
(
    tail -n 0 -f "${NEXTJS_LOG}" 2>/dev/null | sed $'s/^/\e[36m[next]\e[0m /' &
    tail -n 0 -f "${WORKER_LOG}"  2>/dev/null | sed $'s/^/\e[33m[wrkr]\e[0m /' &
    wait
) &
TAILER_PID=$!

# Block until both app processes exit (normally they run forever until Ctrl+C)
wait "${NEXTJS_PID}" "${WORKER_PID}" 2>/dev/null || true
