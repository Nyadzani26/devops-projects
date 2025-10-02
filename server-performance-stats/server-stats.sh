#!/usr/bin/env bash
#
# server-stats.sh
# A lightweight script to produce basic server performance statistics.
# Works on typical Linux distributions (uses /proc, free, df, ps).
#
# Usage: ./server-stats.sh

set -o nounset
set -o pipefail
# removed errexit to prevent script from stopping on small parsing errors

# ---- Helpers ----
human_bytes() {
  # Convert bytes to human-readable format
  local bytes=$1
  if [ "$bytes" -lt 1024 ]; then
    printf "%dB" "$bytes"
  elif [ "$bytes" -lt $((1024**2)) ]; then
    awk -v b=$bytes 'BEGIN {printf "%.1fK", b/1024}'
  elif [ "$bytes" -lt $((1024**3)) ]; then
    awk -v b=$bytes 'BEGIN {printf "%.1fM", b/(1024^2)}'
  else
    awk -v b=$bytes 'BEGIN {printf "%.1fG", b/(1024^3)}'
  fi
}

# ---- CPU usage ----
cpu_usage() {
  local cpu1 cpu2
  cpu1=($(awk '/^cpu /{for(i=2;i<=NF;i++) printf "%s ", $i; print ""}' /proc/stat))
  sleep 0.5
  cpu2=($(awk '/^cpu /{for(i=2;i<=NF;i++) printf "%s ", $i; print ""}' /proc/stat))

  local -i i idle1=0 idle2=0 total1=0 total2=0
  for ((i=0;i<${#cpu1[@]};i++)); do
    total1+=${cpu1[i]}
    total2+=${cpu2[i]}
  done
  idle1=$((cpu1[3] + cpu1[4]))
  idle2=$((cpu2[3] + cpu2[4]))

  local -i total_diff=$((total2 - total1))
  local -i idle_diff=$((idle2 - idle1))
  if [ "$total_diff" -le 0 ]; then
    echo "CPU Usage: N/A"
    return
  fi

  local usage
  usage=$(awk -v t=$total_diff -v i=$idle_diff 'BEGIN {printf "%.1f", 100 * (t - i) / t}')
  printf "CPU Usage: %s%%\n" "$usage"
}

# ---- Memory usage ----
memory_usage() {
  if ! command -v free >/dev/null 2>&1; then
    echo "Memory Usage: 'free' command not found"
    return
  fi

  # fallback safe parsing
  local mem_total mem_available
  mem_total=$(free -b | awk '/^Mem:/ {print $2}')
  mem_available=$(free -b | awk '/^Mem:/ {print $7}')

  if [ -z "$mem_total" ] || [ -z "$mem_available" ]; then
    echo "Memory Usage: N/A"
    return
  fi

  local used=$((mem_total - mem_available))
  local perc
  perc=$(awk -v used=$used -v total=$mem_total 'BEGIN {printf "%.1f", 100 * used / total}')
  printf "Memory Usage: %s / %s (%s%%)\n" "$(human_bytes "$used")" "$(human_bytes "$mem_total")" "$perc"
}

# ---- Disk usage ----
disk_usage() {
  if ! command -v df >/dev/null 2>&1; then
    echo "Disk Usage: 'df' command not found"
    return
  fi

  # root filesystem only
  local info
  info=$(df -B1 / 2>/dev/null | tail -1)
  if [ -z "$info" ]; then
    echo "Disk Usage: N/A"
    return
  fi

  local size used avail usep mount
  size=$(echo "$info" | awk '{print $2}')
  used=$(echo "$info" | awk '{print $3}')
  avail=$(echo "$info" | awk '{print $4}')
  usep=$(echo "$info" | awk '{print $5}' | tr -d '%')
  mount=$(echo "$info" | awk '{print $6}')

  printf "Disk Usage (%s): %s / %s (%s%% used, free: %s)\n" "$mount" "$(human_bytes "$used")" "$(human_bytes "$size")" "$usep" "$(human_bytes "$avail")"
}

# ---- Top 5 processes by CPU and Memory ----
top_processes() {
  printf "\nTop 5 Processes by CPU:\n"
  ps aux --sort=-%cpu | awk 'NR==1 {printf "  %-7s %-8s %-6s %s\n", "PID", "USER", "%CPU", "COMMAND"} NR>1 && NR<=6 {printf "  %-7s %-8s %-6s %s\n", $2, $1, $3, substr($0,index($0,$11))}'
  
  printf "\nTop 5 Processes by Memory:\n"
  ps aux --sort=-%mem | awk 'NR==1 {printf "  %-7s %-8s %-6s %s\n", "PID", "USER", "%MEM", "COMMAND"} NR>1 && NR<=6 {printf "  %-7s %-8s %-6s %s\n", $2, $1, $4, substr($0,index($0,$11))}'
}

# ---- Stretch info ----
stretch_info() {
  printf "\nStretch info:\n"
  if command -v uname >/dev/null 2>&1; then
    printf "OS: %s %s\n" "$(uname -s)" "$(uname -r)"
  fi

  if command -v lsb_release >/dev/null 2>&1; then
    printf "Distro: %s\n" "$(lsb_release -ds)"
  elif [ -f /etc/os-release ]; then
    awk -F= '/^PRETTY_NAME/{gsub(/"/,""); print "Distro: " $2}' /etc/os-release || true
  fi

  if command -v uptime >/dev/null 2>&1; then
    printf "Uptime & Load: %s | load: %s\n" "$(uptime -p)" "$(cut -d' ' -f1-3 /proc/loadavg)"
  fi

  if command -v who >/dev/null 2>&1; then
    printf "Logged in users: %d\n" "$(who | wc -l)"
  fi

  # Failed login attempts (if readable)
  if [ -r /var/log/auth.log ]; then
    local fails
    fails=$(grep -i "failed password" /var/log/auth.log 2>/dev/null | tail -n20 | wc -l)
    printf "Recent failed auth attempts (last 20 lines): %s\n" "$fails"
  fi
}

# ---- Main ----
main() {
  printf "===== SERVER PERFORMANCE STATS =====\n\n"
  cpu_usage
  memory_usage
  disk_usage
  top_processes
  stretch_info
  printf "\n====================================\n"
}

main "$@"
