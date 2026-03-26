#!/bin/bash
#
# Seed Google reviews for all eligible providers.
# Runs batches of 500 with a hard cost ceiling.
#
# Usage:
#   ./scripts/seed-google-reviews.sh <BASE_URL> <SESSION_COOKIE>
#
# Example:
#   ./scripts/seed-google-reviews.sh https://olera.care "sb-auth-token=eyJ..."
#
# The script will:
#   1. Run a dry run to show eligible count + projected cost
#   2. Ask for confirmation
#   3. Process in batches of 500
#   4. Stop if cost ceiling ($150) would be exceeded
#   5. Print a summary at the end

set -e

BASE_URL="${1:?Usage: $0 <BASE_URL> <SESSION_COOKIE>}"
COOKIE="${2:?Usage: $0 <BASE_URL> <SESSION_COOKIE>}"

BATCH_SIZE=500
COST_CEILING=150  # Stop if projected cost exceeds this
COST_PER_1K=5     # Google Places API: $5 per 1,000 requests
DELAY_BETWEEN_BATCHES=3  # seconds

ENDPOINT="${BASE_URL}/api/admin/seed-google-reviews"

echo "=============================="
echo "Google Reviews Seed Script"
echo "=============================="
echo "Target: ${BASE_URL}"
echo "Batch size: ${BATCH_SIZE}"
echo "Cost ceiling: \$${COST_CEILING}"
echo ""

# Step 1: Dry run
echo "Running dry run..."
DRY_RUN=$(curl -s -X POST "${ENDPOINT}?dry_run=true" \
  -H "Cookie: ${COOKIE}" \
  -H "Content-Type: application/json")

TOTAL=$(echo "$DRY_RUN" | python3 -c "import sys,json; print(json.load(sys.stdin).get('total_eligible', 0))" 2>/dev/null || echo "0")
PROJECTED_COST=$(echo "$DRY_RUN" | python3 -c "import sys,json; print(json.load(sys.stdin).get('estimated_cost', 'unknown'))" 2>/dev/null || echo "unknown")

if [ "$TOTAL" = "0" ]; then
  echo "Error: No eligible providers found (or auth failed)."
  echo "Response: ${DRY_RUN}"
  exit 1
fi

echo ""
echo "Eligible providers: ${TOTAL}"
echo "Projected cost:     ${PROJECTED_COST}"
echo "Cost ceiling:       \$${COST_CEILING}"
echo ""

# Check if projected cost exceeds ceiling
COST_NUM=$(echo "$TOTAL" | awk -v rate="$COST_PER_1K" '{printf "%.2f", ($1 / 1000) * rate}')
if (( $(echo "$COST_NUM > $COST_CEILING" | bc -l) )); then
  echo "ERROR: Projected cost (\$${COST_NUM}) exceeds ceiling (\$${COST_CEILING})."
  echo "Reduce the eligible set or increase COST_CEILING."
  exit 1
fi

# Step 2: Confirmation
read -p "Proceed with seeding? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
  echo "Aborted."
  exit 0
fi

echo ""
echo "Starting seed..."
echo ""

# Step 3: Batch processing
OFFSET=0
TOTAL_UPDATED=0
TOTAL_NO_REVIEWS=0
TOTAL_ERRORS=0
TOTAL_PROCESSED=0
BATCH_NUM=0

while [ "$OFFSET" != "null" ] && [ "$OFFSET" -lt "$TOTAL" ] 2>/dev/null; do
  BATCH_NUM=$((BATCH_NUM + 1))

  # Check cost ceiling before each batch
  RUNNING_COST=$(echo "$TOTAL_PROCESSED" | awk -v rate="$COST_PER_1K" '{printf "%.2f", ($1 / 1000) * rate}')
  NEXT_BATCH_COST=$(echo "$BATCH_SIZE" | awk -v rate="$COST_PER_1K" '{printf "%.2f", ($1 / 1000) * rate}')
  PROJECTED_TOTAL=$(echo "$RUNNING_COST $NEXT_BATCH_COST" | awk '{printf "%.2f", $1 + $2}')

  if (( $(echo "$PROJECTED_TOTAL > $COST_CEILING" | bc -l) )); then
    echo ""
    echo "COST CEILING REACHED at \$${RUNNING_COST}. Stopping."
    break
  fi

  echo "Batch ${BATCH_NUM}: offset=${OFFSET}, limit=${BATCH_SIZE} (running cost: \$${RUNNING_COST})"

  RESULT=$(curl -s -X POST "${ENDPOINT}?limit=${BATCH_SIZE}&offset=${OFFSET}" \
    -H "Cookie: ${COOKIE}" \
    -H "Content-Type: application/json")

  PROCESSED=$(echo "$RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('processed', 0))" 2>/dev/null || echo "0")
  UPDATED=$(echo "$RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('updated', 0))" 2>/dev/null || echo "0")
  NO_REVIEWS=$(echo "$RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('no_reviews', 0))" 2>/dev/null || echo "0")
  ERRORS=$(echo "$RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('errors', 0))" 2>/dev/null || echo "0")
  NEXT_OFFSET=$(echo "$RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('next_offset', 'null'))" 2>/dev/null || echo "null")
  BATCH_COST=$(echo "$RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('batch_cost', '?'))" 2>/dev/null || echo "?")

  echo "  → processed: ${PROCESSED}, updated: ${UPDATED}, no_reviews: ${NO_REVIEWS}, errors: ${ERRORS}, cost: ${BATCH_COST}"

  TOTAL_PROCESSED=$((TOTAL_PROCESSED + PROCESSED))
  TOTAL_UPDATED=$((TOTAL_UPDATED + UPDATED))
  TOTAL_NO_REVIEWS=$((TOTAL_NO_REVIEWS + NO_REVIEWS))
  TOTAL_ERRORS=$((TOTAL_ERRORS + ERRORS))

  if [ "$NEXT_OFFSET" = "null" ] || [ "$PROCESSED" = "0" ]; then
    break
  fi

  OFFSET=$NEXT_OFFSET
  sleep $DELAY_BETWEEN_BATCHES
done

# Step 4: Summary
FINAL_COST=$(echo "$TOTAL_PROCESSED" | awk -v rate="$COST_PER_1K" '{printf "%.2f", ($1 / 1000) * rate}')

echo ""
echo "=============================="
echo "Seed Complete"
echo "=============================="
echo "Total processed:  ${TOTAL_PROCESSED}"
echo "Updated:          ${TOTAL_UPDATED}"
echo "No reviews:       ${TOTAL_NO_REVIEWS}"
echo "Errors:           ${TOTAL_ERRORS}"
echo "Total API cost:   \$${FINAL_COST}"
echo "=============================="
