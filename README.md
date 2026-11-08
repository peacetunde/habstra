# HABSTRA - Daily Habit Tracker

A simple, distraction-free habit tracker web app built with vanilla HTML, CSS, and JavaScript. Zero dependencies, no backend, no server, and no database required—all data is saved locally in your browser with `localStorage`.

![HABSTRA Preview](https://img.shields.io/badge/HABSTRA-Habit%20Tracker-4f46e5?style=for-the-badge)

## ✨ Features

- **Add Habits**: Define a Habit Name, Daily Goal, and Start Date.
- **Daily Check-in**: Tap "Done today" once per day to mark your habit completed.
- **Streak Tracking**: Displays a flame streak counter (`🔥 X days`) that increases every day you tick it and resets to zero if a day is missed.
- **Live Search**: Instant filtering by habit name or goal.
- **Total Habits & Stats**: Prominent overview counters for Total Habits, Done Today, and Best Streak.
- **Edit & Delete**: Easily update habit details or delete habits with confirmation.
- **Backup & Restore**: Export and import your data as JSON anytime.
- **Mobile Optimized**: Clean, minimalist design with touch-friendly 44px+ buttons that look great on phones and desktops.
- **Day Rollover Detection**: Automatically updates habit statuses when a new day arrives without needing a manual refresh.

## 🚀 Getting Started

Simply open `index.html` in any modern web browser:

```bash
# Clone the repository
git clone https://github.com/<your-username>/habstra.git

# Navigate into the project folder
cd habstra

# Open index.html in your browser (Windows)
start index.html
```

Or just double-click `index.html`.

## 📁 Project Structure

```text
habstra/
├── index.html       # Semantic HTML layout and accessible dialogs
├── style.css        # Clean CSS styling and responsive layout
├── script.js        # Core habit tracking, streak algorithms, and localStorage
└── README.md        # Documentation
```

## 🔒 Privacy & Data

All data is stored exclusively in your browser's `localStorage` (`habstra_habits_v1`). No personal data is transmitted or stored on any external server.
