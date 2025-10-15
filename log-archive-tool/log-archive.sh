#!/usr/bin/env bash
#
# log-archive.sh
# Archive logs from a given directory into a timestamped tar.gz and store in an archives directory.
# Also logs the archive operation with date/time.
#
# Usage:
#   ./log-archive.sh <log-directory> [--dest <archive-dir>] [--name-prefix <prefix>] [--keep-days <N>] [-v]
# Examples:
#   ./log-archive.sh /var/log
#   ./log-archive.sh /var/log --dest /backups/logs --keep-days 14
#
set -euo pipefail

print_help() {
  cat <<EOF
Log Archive Tool

Archive logs from the CLI with date and time.

Usage:
  $(basename "$0") <log-directory> [--dest <archive-dir>] [--name-prefix <prefix>] [--keep-days <N>] [-v|--verbose]

Arguments:
  <log-directory>          Directory containing logs to archive (e.g., /var/log)

Options:
  --dest <archive-dir>     Destination directory to store archives (default: <log-directory>/archives)
  --name-prefix <prefix>   Archive name prefix (default: logs_archive)
  --keep-days <N>          Delete archives older than N days in destination (optional)
  -v, --verbose            Verbose output
  -h, --help               Show this help message

Notes:
  - If archiving /var/log, you may need elevated privileges (sudo).
  - The destination directory is excluded from the archive to avoid recursion.
EOF
}

# Defaults
DEST=""
NAME_PREFIX="logs_archive"
KEEP_DAYS=""
VERBOSE=0

log() { if [[ $VERBOSE -eq 1 ]]; then echo "$@"; fi }

# Parse args
if [[ $# -lt 1 ]]; then
  print_help
  exit 1
fi

LOG_DIR=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help)
      print_help; exit 0;;
    -v|--verbose)
      VERBOSE=1; shift;;
    --dest)
      [[ $# -ge 2 ]] || { echo "--dest requires a value" >&2; exit 2; }
      DEST="$2"; shift 2;;
    --name-prefix)
      [[ $# -ge 2 ]] || { echo "--name-prefix requires a value" >&2; exit 2; }
      NAME_PREFIX="$2"; shift 2;;
    --keep-days)
      [[ $# -ge 2 ]] || { echo "--keep-days requires a value" >&2; exit 2; }
      KEEP_DAYS="$2"; shift 2;;
    --)
      shift; break;;
    -*)
      echo "Unknown option: $1" >&2; exit 2;;
    *)
      if [[ -z "$LOG_DIR" ]]; then LOG_DIR="$1"; shift; else break; fi;;
  esac
done

if [[ -z "${LOG_DIR}" ]]; then
  echo "Missing <log-directory> argument" >&2
  print_help
  exit 1
fi

# Normalize paths
if [[ ! -d "$LOG_DIR" ]]; then
  echo "Log directory not found: $LOG_DIR" >&2
  exit 1
fi
LOG_DIR="$(readlink -f "$LOG_DIR" 2>/dev/null || realpath "$LOG_DIR" 2>/dev/null || echo "$LOG_DIR")"

if [[ -z "$DEST" ]]; then
  DEST="$LOG_DIR/archives"
fi

# Ensure destination exists
mkdir -p "$DEST"
DEST="$(readlink -f "$DEST" 2>/dev/null || realpath "$DEST" 2>/dev/null || echo "$DEST")"

# Determine exclude pattern if destination is inside log dir
EXCLUDES=()
case "$DEST" in
  "$LOG_DIR"/*)
    # dest is inside log dir; exclude it by relative name
    DEST_BASENAME="$(basename "$DEST")"
    EXCLUDES+=("--exclude=./$DEST_BASENAME" "--exclude=./$DEST_BASENAME/*")
    ;;
  *) ;;
esac

TS="$(date +%Y%m%d_%H%M%S)"
ARCHIVE_NAME="${NAME_PREFIX}_${TS}.tar.gz"
ARCHIVE_PATH="$DEST/$ARCHIVE_NAME"
LOG_FILE="$DEST/archive.log"

log "Log dir: $LOG_DIR"
log "Dest dir: $DEST"
log "Archive: $ARCHIVE_PATH"

# Create archive
# Use -C to archive relative paths; exclude destination if nested
if tar -czf "$ARCHIVE_PATH" -C "$LOG_DIR" "${EXCLUDES[@]}" . 2>"$DEST/.tar.stderr"; then
  :
else
  echo "tar failed. See $DEST/.tar.stderr" >&2
  exit 3
fi

# Size in bytes
SIZE_BYTES=$(stat -c %s "$ARCHIVE_PATH" 2>/dev/null || wc -c < "$ARCHIVE_PATH")

# Log the operation
{
  echo "[$(date -Iseconds)] archived source=$LOG_DIR archive=$ARCHIVE_PATH size_bytes=$SIZE_BYTES"
} >> "$LOG_FILE"

# Optional retention
if [[ -n "$KEEP_DAYS" ]]; then
  if [[ "$KEEP_DAYS" =~ ^[0-9]+$ ]]; then
    DELETED=$(find "$DEST" -type f -name "*.tar.gz" -mtime "+$KEEP_DAYS" -print -delete | wc -l || true)
    if [[ ${DELETED:-0} -gt 0 ]]; then
      echo "[$(date -Iseconds)] deleted_old count=$DELETED older_than_days=$KEEP_DAYS" >> "$LOG_FILE"
      log "Deleted $DELETED archives older than $KEEP_DAYS days"
    fi
  else
    echo "Invalid --keep-days value: $KEEP_DAYS" >&2
    exit 4
  fi
fi

# Output summary
cat <<EOF
Archive created: $ARCHIVE_PATH
Size (bytes): $SIZE_BYTES
Logged at: $LOG_FILE
EOF
