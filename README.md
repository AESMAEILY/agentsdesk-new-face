# Agents Desk — Website & Dashboard Redesign (prototype)

A redesign prototype for **[agentsdesk.football](https://agentsdesk.football)**, the workspace for football agents during the transfer window. It contains a new public landing page and a fully clickable dashboard, built as a static site: no backend, no build step.

**Live demo:** https://aesmaeily.github.io/agentsdesk-new-face/

> All players, clubs, deals and numbers inside the dashboard are **sample data** generated for the prototype. Nothing here is connected to the live Agents Desk product or to any real agent's account.

## What's inside

### Landing page
- **Hero, exchange board**: the whole top banner is a live stock-exchange style board drawn in the browser (sharp on any screen). Columns of live deals, market values, release clauses, loans and free agents scroll and tick green or red, over a candlestick chart with a trend line. Player cards (photo, city, flag, position, old club → new club, year, fee) fade in and drift through it, and a ticker tape runs along the bottom. All figures are sample data.
- **Earlier hero, the globe** is kept at [/v1/](https://aesmaeily.github.io/agentsdesk-new-face/v1/): a dotted WebGL globe that tours each featured player's current city with a pop-up transfer card.
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
numbers.js            Hero exchange board, floating player cards and ticker tape (player data at the top of the file)
v1/                   The earlier globe version of the landing page
globe.js / cobe.js    Globe used by v1 (cobe 2.0.1, MIT)
orb.js                WebGL orb used on the dashboard's AI Agent page
dashboard.js          Dashboard views and the sample data generator
*_head.webp           Player photos for the hero cards
rma/psg/mci/bvb/nap/ars/hil.webp   Club crests for the transfer row
*.mp4 / *.webm        HD screen recordings of the dashboard
*_poster.jpg          First frame of each recording
favicon.svg           Site icon
README.md / LICENSE
```

## Run it locally
Serve the folder instead of opening the file directly:
```
python3 -m http.server 8000
# then open http://localhost:8000/
```

## Tech
Plain HTML/CSS/JavaScript, no build step · Canvas exchange board · cobe (WebGL globe, v1) · GSAP + ScrollTrigger · Lenis smooth scroll · WebGL shader · browser localStorage for saved items (each visitor's own browser only).

## Credits & rights
Design and code by **Alireza Esmaeily** for Agents Desk.
The Agents Desk name, logo and brand belong to Agents Desk (Phil Wieners GbR, Berlin). Some UI elements are adapted from free [Uiverse.io](https://uiverse.io) components. The globe uses [cobe](https://github.com/shuding/cobe) by Shu Ding (MIT License).
Player photos and club crests belong to their respective owners and are used here only to demonstrate the prototype; they must be licensed or replaced before any public launch.
See [LICENSE](LICENSE). Contact: info@agentsdesk.football
