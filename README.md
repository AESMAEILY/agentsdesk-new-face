# Agents Desk — Website & Dashboard Redesign (prototype)

A redesign prototype for **[agentsdesk.football](https://agentsdesk.football)**, the workspace for football agents during the transfer window. It contains a new public landing page and a fully clickable dashboard, built as a static site: no backend, no build step.

**Live demo:** https://aesmaeily.github.io/agentsdesk-new-face/

> All players, clubs, deals and numbers inside the dashboard are **sample data** generated for the prototype. Nothing here is connected to the live Agents Desk product or to any real agent's account.

## What's inside

### Landing page
- **Hero globe**: a dotted WebGL globe that turns and stops at each featured player's current city (Madrid, Manchester, Naples, Riyadh). A card pops up with the player's photo, country flag, position and latest transfer (old club → new club, year, fee). Lines connect each player's home country and the Agents Desk office in Munich to their club. Visitors can drag to spin it, or pick a player from the buttons below. The four players are demo data.
- **Proof strip** with rolling-number counters (players tracked, active agents, leagues, tax regimes).
- **AI Agent** and **No Agents** feature sections with HD screen recordings.
- **The Desk**: a short tutorial for Deal Calculator, Agency and Teams.
- **Confidentiality**: the exact wording from the live site (Isolation, Access, Reuse, Independence, Protection, Exit).
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
index.html            Landing page
dashboard.html        Interactive dashboard demo (sample data)
site.css              Landing page styles
dashboard.css         Dashboard styles
site.js               Landing page behaviour (menu, counters, videos, FAQ, contact)
globe.js              Hero globe: player tour, pop-up cards, drag to spin (player data at the top of the file)
cobe.js               cobe 2.0.1 globe library (MIT)
orb.js                WebGL orb used on the dashboard's AI Agent page
dashboard.js          Dashboard views and the sample data generator
*_head.webp           Player photos for the globe cards
rma/psg/mci/bvb/nap/ars/hil.webp   Club crests for the transfer row
*.mp4 / *.webm        HD screen recordings of the dashboard
*_poster.jpg          First frame of each recording
favicon.svg           Site icon
README.md / LICENSE
```

## Run it locally
The globe loads as a JavaScript module, so serve the folder instead of opening the file directly:
```
python3 -m http.server 8000
# then open http://localhost:8000/
```

## Tech
Plain HTML/CSS/JavaScript, no build step · cobe (WebGL globe) · GSAP + ScrollTrigger · Lenis smooth scroll · WebGL shader · browser localStorage for saved items (each visitor's own browser only).

## Credits & rights
Design and code by **Alireza Esmaeily** for Agents Desk.
The Agents Desk name, logo and brand belong to Agents Desk (Phil Wieners GbR, Berlin). Some UI elements are adapted from free [Uiverse.io](https://uiverse.io) components. The globe uses [cobe](https://github.com/shuding/cobe) by Shu Ding (MIT License).
Player photos and club crests belong to their respective owners and are used here only to demonstrate the prototype; they must be licensed or replaced before any public launch.
See [LICENSE](LICENSE). Contact: info@agentsdesk.football
