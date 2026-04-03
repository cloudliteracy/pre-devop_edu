#!/bin/bash

# ============================================================
#   GIT PUSH & PULL MANAGER
#   A comprehensive git workflow script with safety checks
# ============================================================

# ---------- COLORS ----------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# ---------- HELPERS ----------
info()    { echo -e "${CYAN}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[✔] $1${NC}"; }
warn()    { echo -e "${YELLOW}[⚠] $1${NC}"; }
error()   { echo -e "${RED}[✘] $1${NC}"; }
divider() { echo -e "${BOLD}------------------------------------------------------------${NC}"; }

# ---------- SUMMARY LOG ----------
SUMMARY=()
log_summary() { SUMMARY+=("$1"); }

show_summary() {
  divider
  echo -e "${BOLD}��� SUMMARY OF ACTIONS TAKEN:${NC}"
  for item in "${SUMMARY[@]}"; do
    echo -e "  ${GREEN}•${NC} $item"
  done
  divider
}

# ============================================================
#   STEP 1: CHECK & INSTALL GIT
# ============================================================
check_install_git() {
  divider
  info "Checking if Git is installed..."

  if command -v git &>/dev/null; then
    GIT_VERSION=$(git --version)
    success "Git is already installed: $GIT_VERSION"
    log_summary "Git detected: $GIT_VERSION"
    return
  fi

  warn "Git is not installed on this system."
  read -rn 1 -p "$(echo -e "${YELLOW}Do you want to install Git now? (Y/n): ${NC}")" install_choice; echo

  case "$install_choice" in
    yes|y|YES|Y)
      OS=""
      if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if command -v apt-get &>/dev/null; then
          OS="Ubuntu/Debian"
          info "Detected $OS. Installing Git..."
          sudo apt-get update -y && sudo apt-get install git -y
        elif command -v dnf &>/dev/null; then
          OS="Fedora/RHEL"
          info "Detected $OS. Installing Git..."
          sudo dnf install git -y
        elif command -v yum &>/dev/null; then
          OS="CentOS/RHEL"
          info "Detected $OS. Installing Git..."
          sudo yum install git -y
        else
          error "Unsupported Linux distribution. Please install Git manually: https://git-scm.com/download/linux"
          exit 1
        fi
      elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macOS"
        info "Detected macOS."
        if ! command -v brew &>/dev/null; then
          warn "Homebrew is not installed. Installing Homebrew first..."
          /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
          if ! command -v brew &>/dev/null; then
            error "Homebrew installation failed. Please install Git manually: https://git-scm.com/download/mac"
            exit 1
          fi
          success "Homebrew installed successfully."
        fi
        brew install git
      elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
        warn "Windows detected. Please download and install Git manually from:"
        echo -e "  ${CYAN}https://git-scm.com/download/win${NC}"
        exit 1
      else
        error "Unrecognized OS: $OSTYPE"
        echo "Please install Git manually: https://git-scm.com"
        exit 1
      fi

      # Verify install
      if command -v git &>/dev/null; then
        success "Git installed successfully: $(git --version)"
        log_summary "Git installed on $OS"
      else
        error "Git installation failed. Please install manually: https://git-scm.com"
        exit 1
      fi
      ;;
    *)
      error "Git is required to run this script. Exiting."
      exit 1
      ;;
  esac
}

# ============================================================
#   STEP 2: VALIDATE GIT REPOSITORY
# ============================================================
check_git_repo() {
  divider
  info "Checking if this directory is a valid Git repository..."

  if git rev-parse --is-inside-work-tree &>/dev/null; then
    REPO_ROOT=$(git rev-parse --show-toplevel)
    success "Valid Git repository found at: $REPO_ROOT"
    log_summary "Repository: $REPO_ROOT"
  else
    warn "This directory is not a Git repository."
    read -rn 1 -p "$(echo -e "${YELLOW}Do you want to initialize a new Git repository here? (Y/n): ${NC}")" init_choice; echo
    case "$init_choice" in
      yes|y|YES|Y)
        git init
        success "Git repository initialized."
        log_summary "Initialized new Git repository at $(pwd)"
        ;;
      *)
        error "A Git repository is required. Exiting."
        exit 1
        ;;
    esac
  fi
}

# ============================================================
#   STEP 3: DETECT & CONFIRM BRANCH
# ============================================================

# --- Helper: handle local changes blocking a branch switch ---
handle_changes_before_switch() {
  local target="$1"
  BRANCH_STASHED=false

  warn "You have local changes that would be overwritten by switching to '$target':"
  git status --short
  echo ""
  echo -e "${CYAN}How do you want to handle them before switching?${NC}"
  echo "  1) Stash changes temporarily (restore after switch)"
  echo "  2) Commit changes on current branch first, then switch"
  echo "  3) Abort — stay on current branch"
  read -rp "$(echo -e "${YELLOW}Choose an option (1-3): ${NC}")" block_choice

  case "$block_choice" in
    1)
      git stash push -m "Auto-stash before switching to $target $(date '+%Y-%m-%d %H:%M:%S')"
      success "Changes stashed."
      log_summary "Stashed local changes before switching to '$target'"
      BRANCH_STASHED=true
      ;;
    2)
      while true; do
        read -rp "$(echo -e "${YELLOW}Enter a commit message for your current changes: ${NC}")" pre_switch_msg
        [[ -n "$pre_switch_msg" ]] && break
        error "Commit message cannot be empty."
      done
      git add -A
      # Verify something is actually staged before committing
      if git diff --cached --quiet; then
        error "Nothing was staged to commit. Your changes may already be ignored."
        warn "Try option 1 (Stash) instead."
        return 1
      fi
      COMMIT_OUTPUT=$(git commit -m "$pre_switch_msg" 2>&1)
      COMMIT_STATUS=$?
      if [[ $COMMIT_STATUS -eq 0 ]]; then
        success "Changes committed on '$CURRENT_BRANCH': \"$pre_switch_msg\""
        log_summary "Committed changes on '$CURRENT_BRANCH' before switch: \"$pre_switch_msg\""
      else
        error "Commit failed:"
        echo -e "${RED}$COMMIT_OUTPUT${NC}"
        warn "Try option 1 (Stash) to switch branches instead."
        return 1
      fi
      ;;
    3)
      warn "Branch switch aborted. Staying on '$CURRENT_BRANCH'."
      TARGET_BRANCH="$CURRENT_BRANCH"
      log_summary "Branch switch aborted by user — staying on '$CURRENT_BRANCH'"
      return 1  # Signal: do not proceed with switch
      ;;
    *)
      error "Invalid option. Aborting."
      exit 1
      ;;
  esac
  return 0  # Signal: safe to proceed with switch
}

# --- Helper: perform the actual checkout with exit code check ---
safe_checkout() {
  local target="$1"
  local flag="$2"  # optional: "-b" for new branch

  CHECKOUT_OUTPUT=$(git checkout $flag "$target" 2>&1)
  CHECKOUT_STATUS=$?

  if [[ $CHECKOUT_STATUS -ne 0 ]]; then
    # Check if failure is due to local changes
    if echo "$CHECKOUT_OUTPUT" | grep -q "would be overwritten"; then
      handle_changes_before_switch "$target"
      local handle_status=$?

      if [[ $handle_status -ne 0 ]]; then
        return 1  # User aborted
      fi

      # Retry checkout after resolving changes
      CHECKOUT_OUTPUT=$(git checkout $flag "$target" 2>&1)
      CHECKOUT_STATUS=$?
    fi
  fi

  if [[ $CHECKOUT_STATUS -eq 0 ]]; then
    if [[ "$flag" == "-b" ]]; then
      success "Created and switched to new branch: $target"
      log_summary "Created new branch: $target"
    else
      success "Switched to branch: $target"
      log_summary "Switched to existing branch: $target"
    fi

    # If we stashed before switching, offer to pop now
    if [[ "$BRANCH_STASHED" == true ]]; then
      read -rn 1 -p "$(echo -e "${YELLOW}Do you want to restore your stashed changes onto '$target'? (Y/n): ${NC}")" pop_now; echo
      case "$pop_now" in
        yes|y|YES|Y)
          git stash pop
          success "Stashed changes restored onto '$target'."
          log_summary "Stash popped onto '$target' after branch switch"
          ;;
        *)
          info "Stash kept. Restore later with: git stash pop"
          log_summary "Stash kept after branch switch"
          ;;
      esac
    fi
    return 0
  else
    error "Branch switch failed:"
    echo -e "${RED}$CHECKOUT_OUTPUT${NC}"
    log_summary "Branch switch to '$target' FAILED"
    exit 1
  fi
}

check_branch() {
  divider
  CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
  BRANCH_STASHED=false
  info "Current branch detected: ${BOLD}$CURRENT_BRANCH${NC}"

  read -rn 1 -p "$(echo -e "${YELLOW}Is '${CURRENT_BRANCH}' the branch you want to use? (Y/n): ${NC}")" branch_confirm; echo

  case "$branch_confirm" in
    yes|y|YES|Y)
      TARGET_BRANCH="$CURRENT_BRANCH"
      success "Using branch: $TARGET_BRANCH"
      log_summary "Branch: $TARGET_BRANCH"
      ;;
    *)
      read -rp "$(echo -e "${YELLOW}Enter the name of the target branch: ${NC}")" TARGET_BRANCH

      if [[ -z "$TARGET_BRANCH" ]]; then
        error "Branch name cannot be empty. Exiting."
        exit 1
      fi

      # Check if branch exists locally
      if git show-ref --verify --quiet "refs/heads/$TARGET_BRANCH"; then
        info "Branch '$TARGET_BRANCH' exists locally. Switching to it..."
        safe_checkout "$TARGET_BRANCH"
      else
        warn "Branch '$TARGET_BRANCH' does not exist locally."
        read -rn 1 -p "$(echo -e "${YELLOW}Do you want to create and switch to '$TARGET_BRANCH'? (Y/n): ${NC}")" create_branch; echo

        case "$create_branch" in
          yes|y|YES|Y)
            safe_checkout "$TARGET_BRANCH" "-b"
            ;;
          *)
            warn "Keeping current branch: $CURRENT_BRANCH"
            TARGET_BRANCH="$CURRENT_BRANCH"
            log_summary "Kept original branch: $CURRENT_BRANCH"
            ;;
        esac
      fi
      ;;
  esac
}

# ============================================================
#   STEP 4: REMOTE URL SETUP
# ============================================================
validate_remote_url() {
  local url="$1"
  if [[ "$url" =~ ^https://github\.com/.+/.+\.git$ ]] || \
     [[ "$url" =~ ^git@github\.com:.+/.+\.git$ ]] || \
     [[ "$url" =~ ^https://github\.com/.+/.+$ ]] || \
     [[ "$url" =~ ^git@gitlab\.com:.+/.+\.git$ ]] || \
     [[ "$url" =~ ^https://gitlab\.com/.+/.+\.git$ ]] || \
     [[ "$url" =~ ^https://bitbucket\.org/.+/.+\.git$ ]]; then
    return 0
  else
    return 1
  fi
}

setup_remote() {
  divider
  info "Checking remote (origin) configuration..."

  if git remote get-url origin &>/dev/null; then
    CURRENT_REMOTE=$(git remote get-url origin)
    info "Remote 'origin' is currently set to: ${CYAN}$CURRENT_REMOTE${NC}"
    read -rn 1 -p "$(echo -e "${YELLOW}Do you want to use this remote URL? (Y/n): ${NC}")" use_existing; echo

    case "$use_existing" in
      yes|y|YES|Y)
        success "Using existing remote: $CURRENT_REMOTE"
        log_summary "Remote URL: $CURRENT_REMOTE"
        ;;
      *)
        prompt_new_remote "set-url"
        ;;
    esac
  else
    warn "No remote 'origin' found."
    prompt_new_remote "add"
  fi
}

prompt_new_remote() {
  local action="$1"
  while true; do
    echo -e "${CYAN}Supported formats:${NC}"
    echo -e "  HTTPS : ${CYAN}https://github.com/username/repo.git${NC}"
    echo -e "  SSH   : ${CYAN}git@github.com:username/repo.git${NC}"
    read -rp "$(echo -e "${YELLOW}Enter the remote URL: ${NC}")" NEW_REMOTE

    if validate_remote_url "$NEW_REMOTE"; then
      if [[ "$action" == "add" ]]; then
        git remote add origin "$NEW_REMOTE"
        success "Remote 'origin' added: $NEW_REMOTE"
      else
        git remote set-url origin "$NEW_REMOTE"
        success "Remote 'origin' updated to: $NEW_REMOTE"
      fi
      log_summary "Remote URL set to: $NEW_REMOTE"
      break
    else
      error "Invalid remote URL format. Please try again."
    fi
  done
}

# ============================================================
#   STEP 5: SECURITY CHECK
# ============================================================
security_check() {
  divider
  info "Running security checks..."
  SECURITY_ISSUES=()

  # --- Ensure .gitignore exists ---
  if [[ ! -f ".gitignore" ]]; then
    warn ".gitignore not found. Creating one..."
    touch .gitignore
    success ".gitignore created."
    log_summary "Created .gitignore"
  fi

  # --- Ensure .env patterns are in .gitignore ---
  ENV_PATTERNS=(".env" ".env.*" "*.env")
  for pattern in "${ENV_PATTERNS[@]}"; do
    if ! grep -qxF "$pattern" .gitignore 2>/dev/null; then
      echo "$pattern" >> .gitignore
      warn "Added '$pattern' to .gitignore for security."
      log_summary "Security: '$pattern' added to .gitignore"
    fi
  done
  success ".gitignore is protecting .env files."

  # --- Check if .env is already being tracked by git ---
  TRACKED_ENV_FILES=$(git ls-files | grep -E '\.env(\.|$)' 2>/dev/null)
  if [[ -n "$TRACKED_ENV_FILES" ]]; then
    warn "The following .env file(s) are currently tracked by Git:"
    echo -e "${RED}$TRACKED_ENV_FILES${NC}"
    read -rn 1 -p "$(echo -e "${YELLOW}Do you want to untrack them now? (Y/n): ${NC}")" untrack_choice; echo
    case "$untrack_choice" in
      yes|y|YES|Y)
        while IFS= read -r tracked_file; do
          git rm --cached "$tracked_file"
          success "Untracked: $tracked_file"
          log_summary "Security: Untracked $tracked_file from Git"
        done <<< "$TRACKED_ENV_FILES"
        ;;
      *)
        error "⚠ Refusing to push: tracked .env file(s) detected. Please untrack them before pushing."
        exit 1
        ;;
    esac
  fi

  # --- Scan staged files for .env ---
  STAGED_ENV=$(git diff --cached --name-only | grep -E '\.env(\.|$)' 2>/dev/null)
  if [[ -n "$STAGED_ENV" ]]; then
    error "SECURITY ABORT: The following .env file(s) are staged and cannot be pushed:"
    echo -e "${RED}$STAGED_ENV${NC}"
    error "Please unstage them with: git reset HEAD <file>"
    log_summary "Security: PUSH ABORTED due to staged .env file(s)"
    exit 1
  fi

  # --- Always exclude .gitignore from staging ---
  if git diff --cached --name-only | grep -q "^\.gitignore$"; then
    git restore --staged .gitignore 2>/dev/null || git reset HEAD .gitignore 2>/dev/null
    warn ".gitignore was unstaged automatically for security."
    log_summary "Security: .gitignore excluded from staging"
  fi

  success "Security check passed. No sensitive files detected in staging area."

  # --- Security Summary ---
  divider
  echo -e "${BOLD}��� SECURITY SUMMARY:${NC}"
  echo -e "  ${GREEN}✔${NC} .env patterns are protected in .gitignore"
  echo -e "  ${GREEN}✔${NC} No .env files found in staging area"
  echo -e "  ${GREEN}✔${NC} .gitignore excluded from staging"
  divider
}

# ============================================================
#   PUSH FLOW
# ============================================================
do_push() {
  divider
  echo -e "${BOLD}��� STARTING PUSH FLOW${NC}"
  divider

  # --- Check for uncommitted changes ---
  info "Checking for uncommitted changes..."
  if [[ -n $(git status --porcelain) ]]; then
    warn "You have uncommitted changes:"
    git status --short
    echo ""
    echo -e "${CYAN}How would you like to stage your changes?${NC}"
    echo "  1) Stage ALL changes"
    echo "  2) Stage changes interactively"
    echo "  3) Skip staging (commit what's already staged)"
    echo "  4) Abort"
    read -rp "$(echo -e "${YELLOW}Choose an option (1-4): ${NC}")" stage_choice

    case "$stage_choice" in
      1)
        git add -A
        success "All changes staged."
        log_summary "Staged all changes"
        ;;
      2)
        git add -i
        log_summary "Staged changes interactively"
        ;;
      3)
        info "Skipping staging. Proceeding with already staged files."
        ;;
      4)
        warn "Push aborted by user."
        exit 0
        ;;
      *)
        error "Invalid option. Aborting."
        exit 1
        ;;
    esac
  else
    info "No uncommitted changes found."
  fi

  # --- Check if anything is staged ---
  if git diff --cached --quiet; then
    warn "Nothing is staged for commit."
    read -rn 1 -p "$(echo -e "${YELLOW}Do you still want to push the latest commit? (Y/n): ${NC}")" push_no_stage; echo
    case "$push_no_stage" in
      yes|y|YES|Y) ;;
      *)
        warn "Push aborted. Nothing to commit or push."
        exit 0
        ;;
    esac
  else
    # --- Security check before committing ---
    security_check

    # --- Commit message ---
    divider
    while true; do
      read -rp "$(echo -e "${YELLOW}Enter commit message: ${NC}")" COMMIT_MSG
      if [[ -n "$COMMIT_MSG" ]]; then
        break
      else
        error "Commit message cannot be empty. Please try again."
      fi
    done

    git commit -m "$COMMIT_MSG"
    success "Changes committed: \"$COMMIT_MSG\""
    log_summary "Commit: \"$COMMIT_MSG\""
  fi

  # --- Check for upstream / first-time push ---
  divider
  info "Checking upstream tracking for branch '$TARGET_BRANCH'..."
  if ! git rev-parse --abbrev-ref --symbolic-full-name "@{u}" &>/dev/null; then
    warn "No upstream set for branch '$TARGET_BRANCH'. This will be a first-time push."
    PUSH_CMD="git push --set-upstream origin $TARGET_BRANCH"
  else
    PUSH_CMD="git push origin $TARGET_BRANCH"
  fi

  # --- Attempt push ---
  info "Attempting to push to origin/$TARGET_BRANCH..."
  PUSH_OUTPUT=$($PUSH_CMD 2>&1)
  PUSH_STATUS=$?

  if [[ $PUSH_STATUS -eq 0 ]]; then
    success "Push successful to origin/$TARGET_BRANCH!"
    log_summary "Push successful → origin/$TARGET_BRANCH"
  else
    echo -e "${RED}$PUSH_OUTPUT${NC}"

    # --- Rejected push: remote has new changes ---
    if echo "$PUSH_OUTPUT" | grep -q "rejected"; then
      warn "Push was rejected. The remote has changes you don't have locally."
      read -rn 1 -p "$(echo -e "${YELLOW}Do you want to pull the latest changes first? (Y/n): ${NC}")" pull_first; echo

      case "$pull_first" in
        yes|y|YES|Y)
          do_pull
          info "Retrying push after pull..."
          if git push origin "$TARGET_BRANCH"; then
            success "Push successful after pulling."
            log_summary "Push successful after resolving rejection"
          else
            prompt_force_push
          fi
          ;;
        *)
          prompt_force_push
          ;;
      esac
    else
      error "Push failed. See error above."
      log_summary "Push FAILED"
    fi
  fi
}

prompt_force_push() {
  divider
  warn "⚠ FORCE PUSH WARNING ⚠"
  warn "Force pushing will overwrite the remote branch history."
  warn "This can cause data loss for others working on the same branch."
  read -rn 1 -p "$(echo -e "${RED}Are you absolutely sure you want to force push? (Y/n): ${NC}")" force_choice; echo
  case "$force_choice" in
    yes|y|YES|Y)
      git push --force origin "$TARGET_BRANCH"
      warn "Force push executed to origin/$TARGET_BRANCH"
      log_summary "⚠ Force push to origin/$TARGET_BRANCH"
      ;;
    *)
      warn "Force push declined. Aborting."
      log_summary "Force push declined"
      ;;
  esac
}

# ============================================================
#   PULL FLOW
# ============================================================
do_pull() {
  divider
  echo -e "${BOLD}⬇  STARTING PULL FLOW${NC}"
  divider

  STASH_APPLIED=false

  # --- Check for uncommitted local changes ---
  info "Checking for local uncommitted changes before pulling..."
  if [[ -n $(git status --porcelain) ]]; then
    warn "You have uncommitted local changes:"
    git status --short
    echo ""
    echo -e "${CYAN}How would you like to handle them?${NC}"
    echo "  1) Stash changes temporarily (recommended)"
    echo "  2) Commit changes before pulling"
    echo "  3) Abort pull"
    read -rp "$(echo -e "${YELLOW}Choose an option (1-3): ${NC}")" local_change_choice

    case "$local_change_choice" in
      1)
        git stash push -m "Auto-stash before pull $(date '+%Y-%m-%d %H:%M:%S')"
        success "Changes stashed."
        log_summary "Stashed local changes before pull"
        STASH_APPLIED=true
        ;;
      2)
        while true; do
          read -rp "$(echo -e "${YELLOW}Enter commit message: ${NC}")" PRE_PULL_MSG
          [[ -n "$PRE_PULL_MSG" ]] && break
          error "Commit message cannot be empty."
        done
        git add -A
        git commit -m "$PRE_PULL_MSG"
        success "Changes committed before pull."
        log_summary "Committed changes before pull: \"$PRE_PULL_MSG\""
        ;;
      3)
        warn "Pull aborted by user."
        return
        ;;
      *)
        error "Invalid option. Aborting."
        exit 1
        ;;
    esac
  fi

  # --- Choose pull strategy ---
  divider
  echo -e "${CYAN}Choose pull strategy:${NC}"
  echo "  1) Merge  (default — merges remote into local)"
  echo "  2) Rebase (replays your commits on top of remote)"
  read -rp "$(echo -e "${YELLOW}Choose an option (1-2): ${NC}")" strategy_choice

  case "$strategy_choice" in
    2)
      PULL_CMD="git pull --rebase origin $TARGET_BRANCH"
      log_summary "Pull strategy: Rebase"
      ;;
    *)
      PULL_CMD="git pull origin $TARGET_BRANCH"
      log_summary "Pull strategy: Merge"
      ;;
  esac

  # --- Check if a specific branch to pull from ---
  read -rp "$(echo -e "${YELLOW}Pull from a specific branch? (press Enter for origin/$TARGET_BRANCH, or type branch name): ${NC}")" PULL_BRANCH
  if [[ -n "$PULL_BRANCH" ]]; then
    PULL_CMD="git pull origin $PULL_BRANCH"
    log_summary "Pulling from origin/$PULL_BRANCH"
  fi

  # --- Attempt pull ---
  info "Pulling from remote..."
  PULL_OUTPUT=$($PULL_CMD 2>&1)
  PULL_STATUS=$?

  echo "$PULL_OUTPUT"

  if [[ $PULL_STATUS -eq 0 ]]; then
    success "Pull successful!"
    log_summary "Pull successful"
  else
    # --- Handle merge conflicts ---
    if echo "$PULL_OUTPUT" | grep -qiE "conflict|CONFLICT"; then
      warn "⚠ Merge conflicts detected!"
      echo ""
      info "Files with conflicts:"
      git diff --name-only --diff-filter=U
      echo ""
      echo -e "${CYAN}To resolve conflicts:${NC}"
      echo "  1. Open the conflicted files and look for <<<<<<, ======, >>>>>>>"
      echo "  2. Edit the files to resolve the conflicts"
      echo "  3. Run: git add <resolved-file>"
      echo "  4. Run: git commit   (for merge) or   git rebase --continue   (for rebase)"
      echo ""
      read -rp "$(echo -e "${YELLOW}Press Enter once you have resolved the conflicts to continue...${NC}")" _
      log_summary "Merge conflicts were detected and resolved manually"
    else
      error "Pull failed. See output above."
      log_summary "Pull FAILED"
    fi
  fi

  # --- Pop stash if it was applied ---
  if [[ "$STASH_APPLIED" == true ]]; then
    read -rn 1 -p "$(echo -e "${YELLOW}Do you want to restore your stashed changes now? (Y/n): ${NC}")" pop_stash; echo
    case "$pop_stash" in
      yes|y|YES|Y)
        git stash pop
        success "Stash restored."
        log_summary "Stash popped after pull"
        ;;
      *)
        info "Stash kept. You can restore it later with: git stash pop"
        log_summary "Stash kept (not popped)"
        ;;
    esac
  fi
}

# ============================================================
#   MAIN MENU
# ============================================================
main_menu() {
  divider
  echo -e "${BOLD}${CYAN}"
  echo "  ██████╗ ██╗████████╗    ███╗   ███╗ █████╗ ███╗   ██╗ █████╗  ██████╗ ███████╗██████╗ "
  echo "  ██╔════╝ ██║╚══██╔══╝    ████╗ ████║██╔══██╗████╗  ██║██╔══██╗██╔════╝ ██╔════╝██╔══██╗"
  echo "  ██║  ███╗██║   ██║       ██╔████╔██║███████║██╔██╗ ██║███████║██║  ███╗█████╗  ██████╔╝"
  echo "  ██║   ██║██║   ██║       ██║╚██╔╝██║██╔══██║██║╚██╗██║██╔══██║██║   ██║██╔══╝  ██╔══██╗"
  echo "  ╚██████╔╝██║   ██║       ██║ ╚═╝ ██║██║  ██║██║ ╚████║██║  ██║╚██████╔╝███████╗██║  ██║"
  echo "   ╚═════╝ ╚═╝   ╚═╝       ╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝"
  echo -e "${NC}"
  divider

  echo -e "${CYAN}What would you like to do?${NC}"
  echo "  1) ��� Push"
  echo "  2) ⬇  Pull"
  echo "  3) ��� Push & Pull (Pull first, then Push)"
  echo "  4) ❌ Exit"
  divider
  read -rp "$(echo -e "${YELLOW}Choose an option (1-4): ${NC}")" main_choice
}

# ============================================================
#   SCRIPT ENTRY POINT
# ============================================================
clear
check_install_git
check_git_repo
check_branch
setup_remote

main_menu

case "$main_choice" in
  1)
    do_push
    ;;
  2)
    do_pull
    ;;
  3)
    do_pull
    do_push
    ;;
  4)
    info "Exiting Git Manager. Goodbye!"
    exit 0
    ;;
  *)
    error "Invalid option. Exiting."
    exit 1
    ;;
esac

show_summary
echo -e "${GREEN}${BOLD}✅ Git Manager completed successfully!${NC}"
