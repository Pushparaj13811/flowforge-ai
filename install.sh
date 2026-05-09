#!/usr/bin/env bash
# =============================================================================
# FlowForge AI — One-Time Installation Script
# =============================================================================
# Run once after cloning the repository (on Linux):
#   chmod +x install.sh && ./install.sh
#
# What it does:
#   1. Makes start.sh executable
#   2. Rewrites absolute paths in start.desktop to match this machine
#   3. Registers the launcher in ~/.local/share/applications/
#   4. Installs the icon
#   5. Optionally creates a Desktop shortcut for double-click access
# =============================================================================

set -euo pipefail

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

die() { log_error "$*"; exit 1; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="${SCRIPT_DIR}"

echo -e "${BOLD}${BLUE}"
echo "  ╔═══════════════════════════════════════╗"
echo "  ║      FlowForge AI — Installation      ║"
echo "  ╚═══════════════════════════════════════╝"
echo -e "${RESET}"
log_info "Project directory: ${PROJECT_DIR}"

# ---------------------------------------------------------------------------
# 1. Make start.sh executable
# ---------------------------------------------------------------------------
log_section "Making start.sh executable"

[[ -f "${PROJECT_DIR}/start.sh" ]] || die "start.sh not found in ${PROJECT_DIR}"
chmod +x "${PROJECT_DIR}/start.sh"
log_ok "start.sh is executable."

# ---------------------------------------------------------------------------
# 2. Update paths in start.desktop to match this machine
# ---------------------------------------------------------------------------
log_section "Configuring launcher paths"

DESKTOP_SRC="${PROJECT_DIR}/start.desktop"
[[ -f "${DESKTOP_SRC}" ]] || die "start.desktop not found in ${PROJECT_DIR}"

# The .desktop file may contain an absolute path from the developer's machine.
# Replace it with the actual project path on this machine.
ORIGINAL_PATH="/Users/hompushparajmehta/Pushparaj/github/Learning/flowforge-ai"

if [[ "${PROJECT_DIR}" != "${ORIGINAL_PATH}" ]]; then
    sed -i "s|${ORIGINAL_PATH}|${PROJECT_DIR}|g" "${DESKTOP_SRC}"
    log_ok "Paths updated: ${ORIGINAL_PATH} → ${PROJECT_DIR}"
else
    log_ok "Paths are already correct (same machine as developer)."
fi

# Also update the Path= field to be accurate
sed -i "s|^Path=.*|Path=${PROJECT_DIR}|" "${DESKTOP_SRC}"

# ---------------------------------------------------------------------------
# 3. Register application launcher
# ---------------------------------------------------------------------------
log_section "Registering application launcher"

APPS_DIR="${HOME}/.local/share/applications"
mkdir -p "${APPS_DIR}"

DESKTOP_DEST="${APPS_DIR}/flowforge-ai.desktop"
cp "${DESKTOP_SRC}" "${DESKTOP_DEST}"
chmod +x "${DESKTOP_DEST}"
log_ok "Launcher registered at ${DESKTOP_DEST}"

# Mark as trusted so GNOME's Nautilus file manager allows launching
if command -v gio &>/dev/null; then
    gio set "${DESKTOP_DEST}" "metadata::trusted" yes 2>/dev/null || true
    log_ok "Launcher marked as trusted (gio)."
fi

# Refresh desktop database so it appears in app menu search
if command -v update-desktop-database &>/dev/null; then
    update-desktop-database "${APPS_DIR}" 2>/dev/null || true
    log_ok "Desktop database updated."
fi

# ---------------------------------------------------------------------------
# 4. Install icon
# ---------------------------------------------------------------------------
log_section "Installing application icon"

SVG_SRC="${PROJECT_DIR}/public/Octo-Icon.svg"
ICON_DIR="${HOME}/.local/share/icons/hicolor/scalable/apps"
mkdir -p "${ICON_DIR}"

if [[ -f "${SVG_SRC}" ]]; then
    cp "${SVG_SRC}" "${ICON_DIR}/flowforge-ai.svg"
    log_ok "SVG icon installed to ${ICON_DIR}/flowforge-ai.svg"

    if command -v gtk-update-icon-cache &>/dev/null; then
        gtk-update-icon-cache -f -t "${HOME}/.local/share/icons/hicolor" 2>/dev/null || true
        log_ok "Icon cache updated."
    fi
else
    log_warn "Icon not found at ${SVG_SRC} — launcher will use a system default icon."
fi

# ---------------------------------------------------------------------------
# 5. Create Desktop shortcut
# ---------------------------------------------------------------------------
log_section "Desktop shortcut"

DESKTOP_FOLDER="${HOME}/Desktop"
if [[ -d "${DESKTOP_FOLDER}" ]]; then
    echo -n "  Create a shortcut on your Desktop for double-click launch? [Y/n]: "
    read -r REPLY || REPLY="Y"
    REPLY="${REPLY:-Y}"
    if [[ "${REPLY}" =~ ^[Yy] ]]; then
        SHORTCUT="${DESKTOP_FOLDER}/FlowForge AI.desktop"
        cp "${DESKTOP_DEST}" "${SHORTCUT}"
        chmod +x "${SHORTCUT}"
        if command -v gio &>/dev/null; then
            gio set "${SHORTCUT}" "metadata::trusted" yes 2>/dev/null || true
        fi
        log_ok "Desktop shortcut created."
        log_info "In GNOME: right-click it and select 'Allow Launching' if shown as untrusted."
    else
        log_info "Skipping Desktop shortcut."
    fi
else
    log_warn "~/Desktop not found — skipping Desktop shortcut."
fi

# ---------------------------------------------------------------------------
# 6. Check recommended system packages
# ---------------------------------------------------------------------------
log_section "Checking recommended packages"

RECOMMENDED_MISSING=()
command -v docker        &>/dev/null || RECOMMENDED_MISSING+=("docker.io")
command -v node          &>/dev/null || RECOMMENDED_MISSING+=("nodejs")
command -v npm           &>/dev/null || RECOMMENDED_MISSING+=("npm")
command -v psql          &>/dev/null || RECOMMENDED_MISSING+=("postgresql-client")
command -v xdg-open      &>/dev/null || RECOMMENDED_MISSING+=("xdg-utils")

# docker compose check
if ! docker compose version &>/dev/null 2>&1 && ! command -v docker-compose &>/dev/null; then
    RECOMMENDED_MISSING+=("docker-compose-v2")
fi

if [[ ${#RECOMMENDED_MISSING[@]} -gt 0 ]]; then
    log_warn "These packages are needed to run the app:"
    for pkg in "${RECOMMENDED_MISSING[@]}"; do
        echo -e "  ${YELLOW}•${RESET} ${pkg}"
    done
    echo ""
    echo -e "  Install with:"
    echo -e "  ${CYAN}sudo apt-get update && sudo apt-get install -y ${RECOMMENDED_MISSING[*]}${RESET}"
    echo ""
    echo -e "  After installing docker, add yourself to the docker group:"
    echo -e "  ${CYAN}sudo usermod -aG docker \$USER  # then log out and back in${RESET}"
fi

# ---------------------------------------------------------------------------
# Done
# ---------------------------------------------------------------------------
log_section "Installation complete"
echo ""
echo -e "  ${GREEN}${BOLD}FlowForge AI is ready to launch!${RESET}"
echo ""
echo -e "  ${BOLD}How to start:${RESET}"
echo -e "    ${CYAN}Option A:${RESET} Search 'FlowForge AI' in your app menu and click it"
echo -e "    ${CYAN}Option B:${RESET} Double-click the Desktop shortcut (if you created one)"
echo -e "    ${CYAN}Option C:${RESET} Run directly: ${PROJECT_DIR}/start.sh"
echo ""
echo -e "  ${YELLOW}First run:${RESET} You'll be asked for your Tambo AI API key."
echo -e "  Get it free at: ${CYAN}https://app.tambo.co/dashboard${RESET}"
echo ""
echo -e "  ${BOLD}The app will open at:${RESET} ${CYAN}http://localhost:3001${RESET}"
echo ""
