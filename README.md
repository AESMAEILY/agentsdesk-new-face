# Agents Desk — Website & Dashboard Redesign (prototype)

A redesign prototype for **[agentsdesk.football](https://agentsdesk.football)**, the workspace for football agents during the transfer window. It contains a new public landing page and a fully clickable dashboard, built as a static site: one HTML file, no backend, no build step.

**Live demo:** https://aesmaeily.github.io/agentsdesk-new-face/

> All players, clubs, deals and numbers inside the dashboard are **sample data** generated for the prototype. Nothing here is connected to the live Agents Desk product or to any real agent's account.

## What's inside

### Landing page
- **Hero** with the Agents Desk logo, a live WebGL "liquid" orb and smooth scrolling.
- **Proof strip** with rolling-number counters (players tracked, active agents, leagues, tax regimes).
- **AI Agent** and **No Agents** feature sections with HD screen recordings.
- **The Desk** — a short tutorial for Deal Calculator, Agency and Teams.
- **Confidentiality** — the exact wording from the live site (Isolation, Access, Reuse, Independence, Protection, Exit).
- **FAQ**, and a **Contact** section with the official details from the site's legal notice.

### Dashboard (click "Dashboard" in the menu)
| Page | What it does |
|---|---|
| Daily Overview | Requests, deal snapshot, transfer log, calendar, to-do list, live deals strip |
| Agency | Squad tiles, last match round, squad value and contract charts, one merged player table |
| Deal Calculator | League → club → player lists, fee, add-ons, sell-on, tax by country, commission split, PDF-style summary |
| Transfer Requests | Save a club brief and run a player search against it |
| Transfer Log | Log moves with fee, type and date |
| AI Agent | Chat-style player search with saved conversation history |
| Filter / Targets / No Agents | Player search, saved targets, unrepresented players with value bands from under €500k |
| Teams / Standings | League tabs, club rail, squad and form details, league table |
| Live Journalism / Live Deals / Done Deals / News | Transfer feeds that update while the page is open |

## Files
```
index.html        Landing page
dashboard.html    Interactive dashboard demo (sample data)
site.css          Landing page styles
dashboard.css     Dashboard styles
site.js           Landing page behaviour (menu, counters, videos, FAQ, contact)
orb.js            WebGL orb shared by the hero and the AI Agent page
dashboard.js      Dashboard views and the sample data generator
*.mp4 / *.webm    HD screen recordings of the dashboard
*_poster.jpg      First frame of each recording
favicon.svg       Site icon
README.md / LICENSE
```

## Run it locally
Open `index.html` in a browser, or serve the folder:
```
python3 -m http.server 8000
# then open http://localhost:8000/
```

## Tech
Plain HTML/CSS/JavaScript, no build step · GSAP + ScrollTrigger · Lenis smooth scroll · WebGL shader · browser localStorage for saved items (each visitor's own browser only).

## Credits & rights
Design and code by **Alireza Esmaeily** for Agents Desk.
The Agents Desk name, logo and brand belong to Agents Desk (Phil Wieners GbR, Berlin). Some UI elements are adapted from free [Uiverse.io](https://uiverse.io) components.
See [LICENSE](LICENSE). Contact: info@agentsdesk.football
