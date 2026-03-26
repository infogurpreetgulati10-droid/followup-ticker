# 📌 Follow-Up Ticker

A lightweight Chrome extension built for Customer Success Managers to track client commitments, log a follow-up in under 5 seconds, never drop a promise again.

---

## 🎯 Problem It Solves

CSMs make verbal commitments constantly — on calls, in Slack, during QBRs. There's no lightweight way to capture these in the moment without switching to a CRM or task manager. Things fall through the cracks.

**Follow-Up Ticker lives in your browser toolbar**, one click, log it, done.

---

## ✨ Features

- **Log follow-ups in 5 seconds** — client name, task, due date, priority
- **Color-coded icon** — red when overdue, amber when due today, dark when clear
- **Pulsing overdue alert** — visual cue inside the popup when action is needed
- **Filter by status** — Overdue, Today, Upcoming, Done
- **Edit tasks** — change due date or priority after logging
- **Mark complete** — check off follow-ups as you go
- **CSV export** — download all follow-ups as a spreadsheet for 1:1s
- **100% local** — no backend, no API, no data leaves your machine

---

## 🔐 Privacy & Safety

This extension requests only one permission:
```json
"permissions": ["storage"]
```

- No access to browsing history, tabs, or page content
- No external servers or APIs
- All data stored locally in Chrome's sandboxed storage
- Uninstalling the extension wipes all data completely

---

## 🚀 Installation (Developer Mode)

1. Clone or download this repo
2. Open Chrome and go to `chrome://extensions`
3. Enable **Developer Mode** (top right)
4. Click **Load unpacked** and select the `followup-ticker` folder
5. Pin the extension from the 🧩 puzzle icon in your toolbar

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| HTML + CSS | Popup UI and styling |
| Vanilla JavaScript | All app logic |
| Chrome Storage API | Local data persistence |
| Chrome Action API | Badge and icon updates |
| Manifest V3 | Latest Chrome extension standard |
| Python + Pillow | Icon generation |

---

## 📁 Project Structure
```
followup-ticker/
├── manifest.json      # Extension config and permissions
├── background.js      # Service worker — updates badge and icon color
├── popup.html         # UI layout and styles
├── popup.js           # App logic (add, edit, filter, export)
├── icons/             # Extension icons in 3 sizes + color variants
└── .gitignore
```

---

## 💡 Product Thinking

This project was built to simulate how SaaS tools solve real workflow problems:

- **Identified a pain point** — CSMs drop commitments because capturing them requires too many steps
- **Designed for speed** — the add form is optimized for under 5 seconds
- **Ambient awareness over interruption** — icon color changes instead of disruptive notifications
- **Minimal permissions** — only what's needed, nothing more
- **Export for reporting** — CSV output connects to real CSM workflows like 1:1s and QBRs

---

## 👤 Author

Built by Gurpreet Kaur — CSM, learning to build tools that solve the problems I face daily.
