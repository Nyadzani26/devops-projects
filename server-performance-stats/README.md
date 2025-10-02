# Server Performance Stats

This project is part of my DevOps learning journet following [https://roadmap.sh/projects/server-stats](https://roadmap.sh/projects/server-stats).
It provides a Bash script ('server-stats.sh') to quickly analyse essential server performance metrics.
The script is lightweight and can run on any Linux system.

---

## 📌 Features

- ✅ **CPU Usage** (overall percentage)
- ✅ **Memory Usage** (free vs. used with percentage)
- ✅ **Disk Usage** (free vs. used with percentage)
- ✅ **Top 5 Processes by CPU usage**
- ✅ **Top 5 Processes by Memory usage**

### Stretch Goals (These are optional extras that i tried out)
- OS version and kernel details
- System uptime
- Load average
- Logged-in users
- Failed login attempts

---

## Usage

Clone the repository and run the script

'''bash
# Clone repo
git clone https://github.com/Nyadzani26/devops-projects.git
cd devops-projects/server-performance-stats

# Make the script executable
chmod +x server server-stats.sh

# Run the script
./server-stats.sh

- Link to project [https://roadmap.sh/projects/server-stats]
