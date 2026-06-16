#!/bin/bash
# Grok Quick Start for Olera Web
# Parallel to the Claude one in .claude/scripts/new-session.sh
#
# This gives you a one-command way to start a fresh random worktree-based Grok session,
# exactly like your "oleraweb" / olera-web quick start for Claude Code.
#
# Usage (after sourcing):
#   grokweb                    # just start the TUI in a new random worktree
#   grokweb "fix the claim flow"   # start with an initial prompt/task
#
# It reuses your existing adjective/scientist random name generator and staging-based workflow.
#
# Setup: Add this to your ~/.zshrc (or wherever you source the Claude one):
#   source ~/Desktop/olera-web/.grok/scripts/grok-session.sh
#
# Then you can just type "grokweb" instead of pasting the 4 lines every time.

# Source the Claude script first so we inherit the exact same random name lists,
# paths, and conventions (work from staging, same adjective-noun style you already use).
# This way your Grok sessions and Claude sessions use consistent naming.
if [ -f "$HOME/Desktop/olera-web/.claude/scripts/new-session.sh" ]; then
  source "$HOME/Desktop/olera-web/.claude/scripts/new-session.sh"
fi

# Fallback definitions (in case the Claude script wasn't present or arrays not exported)
if [ -z "${OLERAWEB_ADJECTIVES+x}" ]; then
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
fi

if [ -z "${OLERAWEB_NOUNS+x}" ]; then
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
fi

# Main quick start for Grok
grokweb() {
  local OLERAWEB_MAIN_REPO="$HOME/Desktop/olera-web"

  # Ensure main repo exists
  if [ ! -d "$OLERAWEB_MAIN_REPO/.git" ]; then
    echo "Error: $OLERAWEB_MAIN_REPO is not a git repository"
    return 1
  fi

  # Fetch latest from remote (keeps us in sync with your staging-based workflow)
  echo "Fetching latest from origin..."
  git -C "$OLERAWEB_MAIN_REPO" fetch origin --quiet

  # Generate unique random name using the SAME lists as your Claude quick start
  # This keeps naming consistent (polite-margulis, keen-mendel, sparky-bohr, etc.)
  local ADJ=${OLERAWEB_ADJECTIVES[$RANDOM % ${#OLERAWEB_ADJECTIVES[@]}]}
  local NOUN=${OLERAWEB_NOUNS[$RANDOM % ${#OLERAWEB_NOUNS[@]}]}
  local BRANCH_NAME="${ADJ}-${NOUN}"

  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  🚀 New Grok session: $BRANCH_NAME"
  echo "  (worktree from origin/staging • follows your CLAUDE.md rules)"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  # Change to main repo so grok knows which project
  cd "$OLERAWEB_MAIN_REPO"

  # Launch Grok using its native --worktree support with the random name.
  # Grok will create and manage the isolated worktree automatically (similar to how your Claude one does).
  # Any arguments you pass become the initial prompt.
  # Grok will automatically pick up CLAUDE.md, CONTRIBUTING.md, SCRATCHPAD.md, etc.
  grok --worktree="$BRANCH_NAME" "$@"
}

# List helper (Grok manages its own sessions/worktrees — use inside TUI with Ctrl+S or /resume,
# or run `grok sessions` / `grok worktree` commands for introspection).
grokweb-list() {
  echo ""
  echo "Grok sessions / worktrees are managed by Grok."
  echo "Inside a Grok session use: Ctrl+S  or  /resume  or  /sessions"
  echo "From shell you can also try: grok sessions list   or   grok worktree help"
  echo ""
  echo "Your existing Claude sessions are still at ~/.claude-worktrees/olera-web/"
  echo ""
}

# Simple resume for a Grok worktree session by name (if you know the label)
grokweb-resume() {
  if [ -z "$1" ]; then
    echo "Usage: grokweb-resume <session-name>"
    grokweb-list
    return 1
  fi
  # Grok can resume via its own mechanisms; for a quick shell start:
  cd "$HOME/Desktop/olera-web"
  grok --worktree="$1"   # Grok will resume or re-attach the named worktree if it exists
}

# Optional: clean helper (Grok has its own pruning via `grok worktree` commands)
grokweb-clean() {
  echo "Use Grok's built-in worktree management:"
  echo "  grok worktree help"
  echo "  grok worktree prune   (or similar — check with grok worktree --help)"
  echo ""
  echo "Claude worktrees can still be cleaned with your oleraweb-clean"
}
