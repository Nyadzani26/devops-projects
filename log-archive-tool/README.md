# Log Archive Tool

Archive logs from the CLI with the date and time. Compresses a given log directory into a timestamped `tar.gz` inside an `archives/` folder and logs the operation.

---

## 📌 Features

- **CLI usage** with required log directory argument
- **Timestamped archives** like `logs_archive_20240816_100648.tar.gz`
- **Destination control** via `--dest`
- **Retention policy** with `--keep-days N`
- **Verbose mode** with `-v`
- **Operation log** written to `archives/archive.log`

---

## Usage

```bash
# Make executable (if needed)
chmod +x log-archive.sh

# Basic usage: archive /var/log into /var/log/archives
./log-archive.sh /var/log

# Custom destination directory
./log-archive.sh /var/log --dest /backups/logs

# Custom name prefix and retention (delete archives older than 14 days)
./log-archive.sh /var/log --name-prefix prod_logs --keep-days 14

# Verbose output
./log-archive.sh /var/log -v
```

- Output example:
```
Archive created: /var/log/archives/logs_archive_20240816_100648.tar.gz
Size (bytes): 123456
Logged at: /var/log/archives/archive.log
```

---

## CLI Reference

```text
Usage:
  log-archive.sh <log-directory> [--dest <archive-dir>] [--name-prefix <prefix>] [--keep-days <N>] [-v|--verbose]

Options:
  --dest <archive-dir>     Destination directory to store archives (default: <log-directory>/archives)
  --name-prefix <prefix>   Archive name prefix (default: logs_archive)
  --keep-days <N>          Delete archives older than N days in destination (optional)
  -v, --verbose            Verbose output
  -h, --help               Show help
```

---

## Scheduling (cron)

Example: run daily at 02:00, keep 14 days of archives:
```
0 2 * * * /path/to/log-archive.sh /var/log --keep-days 14 >> /var/log/archives/cron.log 2>&1
```

Note: Archiving `/var/log` may require `sudo` depending on permissions.

---

## Notes

- The script excludes the destination directory if it is inside the log directory to avoid recursion.
- Uses `tar`, `date`, and standard POSIX utilities. GNU `stat` is preferred; fallback uses `wc -c`.
- Tested on typical Linux distros; macOS may require adjustments (e.g., `gstat`).

---

- Project brief: https://roadmap.sh/projects/log-archive-tool
x
