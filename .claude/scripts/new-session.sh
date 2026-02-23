#!/bin/bash
# Creates a new Claude worktree session for Olera Web
# Usage: source this file, then run: oleraweb

OLERAWEB_MAIN_REPO="$HOME/Desktop/olera-web"
OLERAWEB_WORKTREE_BASE="$HOME/.claude-worktrees/olera-web"

# Adjectives
OLERAWEB_ADJECTIVES=(
  "bold" "bright" "calm" "clever" "cool"
  "eager" "easy" "elegant" "epic" "fair"
  "fancy" "fast" "festive" "fierce" "fine"
  "focused" "fond" "fresh" "friendly" "funny"
  "gentle" "gifted" "glad" "golden" "good"
  "graceful" "grand" "great" "happy" "hardy"
  "helpful" "heroic" "honest" "hopeful" "humble"
  "jolly" "jovial" "joyful" "keen" "kind"
  "lively" "logical" "loving" "lucky" "magical"
  "merry" "mighty" "modest" "neat" "nice"
  "noble" "peaceful" "pleasant" "plucky" "polite"
  "proud" "quick" "quiet" "radiant" "relaxed"
  "sharp" "shiny" "silent" "silly" "sleepy"
  "smart" "smooth" "snappy" "sparky" "speedy"
  "steady" "stellar" "sunny" "super" "sweet"
  "swift" "tender" "thirsty" "tidy" "trusting"
  "upbeat" "vibrant" "vigilant" "warm" "wise"
  "witty" "wonderful" "zealous" "zen" "zesty"
)

# Famous scientists
OLERAWEB_NOUNS=(
  "archimedes" "babbage" "bell" "bohr" "brahe"
  "carson" "curie" "darwin" "dijkstra" "einstein"
  "elion" "euler" "faraday" "fermi" "feynman"
  "franklin" "galileo" "gates" "gauss" "goodall"
  "hawking" "heisenberg" "hopper" "hugle" "hypatia"
  "jackson" "jemison" "joliot" "kalam" "keller"
  "kepler" "knuth" "kovalevsky" "lamarr" "lehmann"
  "lovelace" "mahavira" "margulis" "maxwell" "mcclintock"
  "mendel" "meitner" "mirzakhani" "morse" "nash"
  "newton" "nobel" "noether" "panini" "pare"
  "pasteur" "payne" "perlman" "pike" "planck"
  "poitras" "ptolemy" "ramanujan" "ride" "ritchie"
  "roentgen" "rosalind" "rubin" "sagan" "shaw"
  "snyder" "spence" "stonebraker" "swartz" "tesla"
  "thompson" "torvalds" "turing" "villani" "wiles"
  "williams" "wing" "wozniak" "wright" "wu"
  "yalow" "yonath" "zhukovsky" "zuse"
)

oleraweb() {
  # Ensure main repo exists
  if [ ! -d "$OLERAWEB_MAIN_REPO/.git" ]; then
    echo "Error: $OLERAWEB_MAIN_REPO is not a git repository"
    return 1
  fi

  # Fetch latest from remote
  echo "Fetching latest from origin..."
  git -C "$OLERAWEB_MAIN_REPO" fetch origin --quiet

  # Generate unique name
  local ADJ=${OLERAWEB_ADJECTIVES[$RANDOM % ${#OLERAWEB_ADJECTIVES[@]}]}
  local NOUN=${OLERAWEB_NOUNS[$RANDOM % ${#OLERAWEB_NOUNS[@]}]}
  local BRANCH_NAME="${ADJ}-${NOUN}"

  mkdir -p "$OLERAWEB_WORKTREE_BASE"
  local WORKTREE_PATH="$OLERAWEB_WORKTREE_BASE/$BRANCH_NAME"

  # If already exists, add suffix
  if [ -d "$WORKTREE_PATH" ]; then
    BRANCH_NAME="${BRANCH_NAME}-$(date +%s | tail -c 5)"
    WORKTREE_PATH="$OLERAWEB_WORKTREE_BASE/$BRANCH_NAME"
  fi

  # Create worktree from origin/staging (web branches from staging, not main)
  cd "$OLERAWEB_MAIN_REPO"
  git worktree add -b "$BRANCH_NAME" "$WORKTREE_PATH" origin/staging 2>/dev/null

  if [ $? -eq 0 ]; then
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  🚀 New web session: $BRANCH_NAME"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    cd "$WORKTREE_PATH"
    claude
  else
    echo "Error creating worktree"
    return 1
  fi
}

# List existing sessions
oleraweb-list() {
  echo ""
  echo "Active web sessions:"
  echo "━━━━━━━━━━━━━━━━━━━━"
  ls -1 "$OLERAWEB_WORKTREE_BASE" 2>/dev/null || echo "  (none)"
  echo ""
}

# Resume an existing session
oleraweb-resume() {
  if [ -z "$1" ]; then
    echo "Usage: oleraweb-resume <session-name>"
    oleraweb-list
    return 1
  fi

  local WORKTREE_PATH="$OLERAWEB_WORKTREE_BASE/$1"
  if [ -d "$WORKTREE_PATH" ]; then
    cd "$WORKTREE_PATH"
    claude
  else
    echo "Session '$1' not found"
    oleraweb-list
    return 1
  fi
}

# Clean up merged sessions
oleraweb-clean() {
  cd "$OLERAWEB_MAIN_REPO"
  echo "Pruning stale worktrees..."
  git worktree prune
  echo ""
  echo "Remaining sessions:"
  oleraweb-list
}
