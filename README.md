# TECHBOY CALC ⚡

A premium, zero-dependency calculator with a luxury dark UI — built with pure HTML5, CSS3, and Vanilla JavaScript.

![TECHBOY CALC Preview](https://img.shields.io/badge/status-production--ready-06b6d4?style=for-the-badge&labelColor=080810)
![License](https://img.shields.io/badge/license-MIT-f59e0b?style=for-the-badge&labelColor=080810)
![Version](https://img.shields.io/badge/version-1.0.0-a855f7?style=for-the-badge&labelColor=080810)

---

## ✨ Features

| Feature | Details |
|---|---|
| **Unique Design** | Glassmorphism dark panel with animated ambient orbs |
| **Custom Cursor** | Glowing amber dot + cyan ring (desktop) |
| **Per-Button Animations** | Each button type has its own unique hover & click effect |
| **Ripple Effects** | Physics-accurate ripple from exact click/tap position |
| **Keyboard Support** | Full keyboard input with visual feedback |
| **Adaptive Font** | Display font scales down for long numbers automatically |
| **Error Handling** | Typed error messages for every failure case |
| **Self-Test Suite** | 12 automated tests run silently on every page load |
| **Fully Responsive** | Mobile · Tablet · Desktop — all screen sizes |
| **Zero Dependencies** | Pure HTML / CSS / JS — no libraries, no build step |

---

## 🧮 Error Handling

TECHBOY CALC catches every edge case and displays a clear, named error:

| Scenario | Error Message |
|---|---|
| `1 + =` (trailing operator) | `INCOMPLETE EXPR` |
| `5 ÷ 0` | `DIV BY ZERO` |
| `× 5` (leading operator) | `SYNTAX ERROR` |
| Result > 10¹⁵ | `OVERFLOW` |
| NaN result | `UNDEFINED` |
| Empty expression | `NOTHING TO CALC` |

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|---|---|
| `0–9` | Number input |
| `+` `-` `*` `/` | Operators |
| `.` or `,` | Decimal point |
| `%` | Percent |
| `Enter` or `=` | Calculate |
| `Backspace` | Delete last character |
| `Delete` / `Escape` / `C` | Clear all |

---

## 🎨 Design Highlights

- **Color Palette:** Deep obsidian `#080810` · Amber `#f59e0b` · Cyan `#06b6d4` · Purple `#a855f7` · Red `#ef4444`
- **Fonts:** Orbitron (display) · Rajdhani (buttons) — from Google Fonts
- **Effects:** Backdrop-filter blur · Radial gradient orbs · Top shimmer line · Value-flip animation on result
- **Button Hover Animations:**
  - **Numbers** → scale up + glow
  - **Operators** → rotate + amber glow
  - **Equals** → pulsing cyan burst ring
  - **Clear** → hover shake + red flash on click
  - **Backspace** → sliding arrow animation
  - **Percent** → 360° spin
  - **Toggle Sign** → horizontal flip

---

## 🚀 Deployment

### GitHub Pages
```bash
git init
git add .
git commit -m "feat: initial TECHBOY CALC release"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/TECHBOY-calc.git
git push -u origin main
```
Then go to **Settings → Pages → Branch: main → / (root) → Save**.

Your calculator will be live at:
`https://YOUR_USERNAME.github.io/TECHBOY-calc/`

### Netlify / Vercel
Drag and drop the project folder. No build step needed.

---

## 📁 File Structure

```
TECHBOY-calc/
├── index.html      # Markup + semantic structure
├── style.css       # All styles, animations, responsive rules
├── script.js       # Calculator engine + UI + keyboard + cursor + tests
├── .gitignore      # Standard ignores
└── README.md       # This file
```

---

## 🧪 Self-Test Suite

Open the browser console after loading — you'll see a collapsed group:

```
TECHBOY CALC — Test Suite: 12/12 passed
```

Tests cover: basic arithmetic, decimal precision, edge-case operators, error states (div/0, incomplete, syntax).

---

## 📄 License

MIT © 2025. Free to use, modify, and distribute.
