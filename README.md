# Second Life Software — Portfolio

> A multidisciplinary portfolio site for **Durrell Smith** — UX designer, painter, songwriter. One page; three planets; live data.

**Live:** [durrellsmith-frontend.onrender.com](https://durrellsmith-frontend.onrender.com)
**Portfolio (fine art):** [dashcreatives.art](https://dashcreatives.art)
**Behance (UX work):** [behance.net/dashcreatives](https://www.behance.net/dashcreatives)
**SoundCloud (music):** [soundcloud.com/durrell-smith](https://soundcloud.com/durrell-smith)

---

## The idea

Most portfolio sites pick a discipline. This one carries three — UX design, fine art, and songwriting — without making the visitor scroll through a tiered menu of "And also…". The metaphor: **three planets orbiting a shared sun**, one for each facet of the practice. Each planet pulls from a different live data source so the work updates itself when new pieces are published; nothing here is hand-curated and stale.

> "Came from another planet, carrying something unexpected."
> — from the About section

---

## What's on the page

### Hero — WebGL particle portrait
A high-contrast portrait sampled into ~48,000 colored particles that coalesce into a face on load. Cursor pulls them magnetically; scroll scatters them. Rendered live in three.js with a custom GLSL shader (no library bloat).

### Work `(02)` — Three orbiting planets
A three.js solar system on a transparent canvas — the cream page shows through, planets and orbital rings float on it. Each planet:

- **Earth → Artwork** — `1.0 AU`, 365.25 d period. Click to land; a fan of paper-plane silhouettes unfurls, each one painted with a piece from [dashcreatives.art](https://dashcreatives.art). Clicking a plane unfolds it from a dart polygon into a full rectangular display of the artwork.

- **Mars → UX Design** — `1.524 AU`, 686.97 d period. Click to land; a procession of vintage 1950s paper coupes drives across the page, each painted with the cover image of a [Behance project](https://www.behance.net/dashcreatives). Two whitewall wheels sit below each chassis with a visible cream gap. Clicking a car opens the project on Behance.

- **Venus → Music** — `0.7233 AU`, 224.7 d period. Click to land; a fleet of paper sailboats drifts across the page, each painted with a [SoundCloud track's](https://soundcloud.com/durrell-smith) artwork. Mast crease, sail fold, rust pennant. Click a boat to open the SoundCloud player in a modal.

The planet positions are computed from **real J2000 epoch heliocentric longitudes**, and on-screen orbital periods are anchored proportionally to Earth's (60 s = 1 Earth year). So the configuration you see when you load the page is where Venus, Earth, and Mars actually are in the sky right now — just sped up.

### About `(03)`
A six-paragraph bio framed by the planet metaphor: "Came from / *another planet*." Includes a pull-quote — "What began in the studio became something larger." — and a small coda: "He is based in the studio. He is still painting. He is still playing."

### Contact `(04)`
A newsletter signup with a circular rust submit button and a "● On the list. Talk soon." success state.

### Footer
Brand wordmark, social links, studio + colophon, and a heart counter that ticks up organically.

---

## Live integrations (the "it auto-updates" part)

| Planet | Source | Mechanism |
| --- | --- | --- |
| Artwork | [dashcreatives.art](https://dashcreatives.art) | Curated list of fine-art pieces |
| UX Design | [Behance profile](https://www.behance.net/dashcreatives) | FastAPI proxy at `GET /api/behance/{username}` scrapes the public profile HTML server-side (real-browser UA, 10-min cache, stale-on-error fallback), then returns JSON to the React app. Bypasses Behance's CORS block. |
| Music | [SoundCloud podcast RSS](https://feeds.soundcloud.com/users/soundcloud:users:47204335/sounds.rss) | Browser-side fetch through a CORS-proxy fallback chain (`corsproxy.io`, `allorigins.win`) with a `?_={Date.now()}` cache-buster so newly-published tracks appear on the next page load. |

Each integration has a static snapshot fallback so the section is never empty if the upstream is down.

---

## Design notes

- **Typography** — every line on the page is set in **JetBrains Mono**. The unification ships via three places: a font-family alias in `tailwind.config.js`, explicit overrides in `index.css` for `.font-serif/.font-mono/.font-sans`, and the body default. Italic + light weight do most of the visual heavy lifting.
- **Palette** — desert/cream foreground (`#F9EFDE`), deep ink (`#2A1810`), softened ink (`#5E4434`), and rust accents (`#C4432C` → `#962F1F`). Three radial-gradient washes (rose / clay / faint rust) plus an SVG turbulence-noise overlay at 7% opacity give the cream background a hand-printed feel.
- **Motion language** — each "fleet" uses a different idiom: paper planes drift on layered wind oscillators (4 nested CSS animations for a Lissajous path that never repeats); cars drive at identical speeds with evenly-distributed phase offsets (mathematically guaranteed never to overlap); boats sail with a rocking on-water bob. The orbital planets themselves move at proportional real-world rates.
- **Accessibility** — semantic landmarks, focus-visible states, keyboard navigation, color-contrast meets WCAG 2.1 AA on body copy. The 3D scenes have non-3D fallbacks (the quick-jump pills below the orbit let you enter any planet without ever dragging the canvas).

---

## Stack

- **Frontend** — React 19 · React Router · Tailwind CSS (via CRACO) · three.js · `@react-three/fiber` · Radix UI primitives · `framer-motion`
- **Backend** — FastAPI · Motor (async MongoDB driver) · `requests` (for the Behance scrape)
- **Database** — MongoDB
- **Hosting** — designed for any host that can run a FastAPI service + serve a built React app (Render, Fly, a single VM, or the [Emergent](https://emergent.sh) base image specified in `.emergent/emergent.yml`)

---

## Project layout

```
.
├── backend/
│   ├── server.py            # FastAPI app + /api/behance/{username} proxy
│   ├── requirements.txt
│   └── .env                 # MONGO_URL, DB_NAME, CORS_ORIGINS (not committed)
├── frontend/
│   ├── src/
│   │   ├── App.js
│   │   ├── index.css        # Tailwind + custom keyframes + paper-* styles
│   │   ├── components/
│   │   │   ├── Nav.jsx
│   │   │   ├── Hero.jsx
│   │   │   ├── ParticleHead.jsx        # WebGL portrait
│   │   │   ├── WorkShowcase.jsx        # Orchestrates the three planets
│   │   │   ├── OrbitingWork.jsx        # three.js solar system
│   │   │   ├── MusicBoatFleet.jsx      # Paper sailboats (SoundCloud)
│   │   │   ├── UXCarFleet.jsx          # Paper cars (Behance)
│   │   │   ├── About.jsx
│   │   │   ├── SubscribePlaceholder.jsx
│   │   │   ├── Footer.jsx
│   │   │   └── HeartCounter.jsx
│   │   └── constants/testIds.js
│   ├── public/
│   │   └── img/durrell.jpg  # Particle-portrait source
│   ├── tailwind.config.js
│   └── package.json
└── README.md (this file)
```

---

## Running locally

**Prerequisites:** Node 18+, Yarn, Python 3.10+, MongoDB (local or [Atlas](https://www.mongodb.com/atlas) free tier).

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env       # then edit MONGO_URL + DB_NAME
uvicorn server:app --reload --port 8000
```

### Frontend

```bash
cd frontend
yarn install
echo "REACT_APP_BACKEND_URL=http://localhost:8000" > .env
yarn start                  # http://localhost:3000
```

The frontend will boot fine without the backend too — the UX Design planet just falls back to the embedded snapshot of projects instead of live-fetching Behance.

---

## Deployment

### Primary: served at `secondlifesoftware.com/design`

The company marketing site (the `SLS_Admin` repo, deployed on Netlify) serves this
portfolio as a page at `/design`. The two projects stay in **separate repos** — the
stacks are incompatible, since this one needs CRACO, three.js, and its own Tailwind
theme, while the marketing site is stock `react-scripts` + react-snap.

What ties them together is the built output, not the source:

```bash
cd frontend
yarn install
yarn build:design                      # sets GENERATE_SOURCEMAP=false + REACT_APP_BACKEND_URL
cp -R build/ ../../SLS_Admin/frontend/public/design/
```

`build:design` is the whole contract. Two things make the bundle path-safe:

- `"homepage": "/design"` in `package.json` — CRA emits assets at `/design/static/…`
  instead of `/static/…`, so nothing collides with the marketing site's own bundle.
- `<BrowserRouter basename={process.env.PUBLIC_URL}>` in `App.js` — the router matches
  `/design` as its root.

Because `homepage` drives both, this same build still works at a domain root if you
set it back to `/`.

The Behance feed points at the existing SLS admin backend
(`https://sls-admin.onrender.com/api/behance/{username}`). `https://secondlifesoftware.com`
is already an allowed CORS origin there, so serving from the company domain needs no
backend or DNS change at all. If the backend is unreachable the UX section falls back
to its bundled snapshot, so the page is never empty.

Keep `public/index.html` free of third-party analytics and vendor badges — it ships on
the company domain, which runs its own GA4 Consent Mode v2 setup and privacy policy.

### Alternative: standalone Render site

The repo also ships a [`render.yaml`](render.yaml) blueprint that deploys this frontend
as its own static site (this is what backs
[durrellsmith-frontend.onrender.com](https://durrellsmith-frontend.onrender.com)). Set
`homepage` back to `/` before building for a domain root.

### One-time setup on Render

1. **Sign in to [render.com](https://render.com)** (free, GitHub sign-in works).
2. From the dashboard, click **New → Blueprint**.
3. Connect this GitHub repo. Render reads `render.yaml` and previews two services:
   - `durrellsmith-backend` — FastAPI on `*.onrender.com`
   - `durrellsmith-frontend` — React static site on `*.onrender.com`
4. Click **Apply**. Both services start building.

The backend will be live in ~2 minutes. The frontend takes ~3 — it bakes the React bundle.

### After the first deploy — wire frontend to backend (one variable, one rebuild)

5. Once the **backend** finishes building, copy its public URL (e.g. `https://durrellsmith-backend.onrender.com`).
6. In the Render dashboard, open the **frontend** service → **Environment** tab → edit `REACT_APP_BACKEND_URL` → paste the backend URL → save.
7. Click **Manual Deploy → Clear cache & deploy** on the frontend service. Render rebuilds the bundle with the backend URL baked in.

That's it. The frontend's `/api/behance/{username}` calls will now hit your live FastAPI service. Publish a new Behance project and a new paper car shows up on the next page load (within the 10-minute cache TTL).

### Optional polish

- **Custom domain.** In the frontend service → **Settings → Custom Domain**, add `work.dashcreatives.art` (or whatever). Add the matching CNAME record at your DNS provider. SSL is provisioned automatically.
- **Tighter CORS.** Once you know the frontend URL, set the backend's `CORS_ORIGINS` env var to that URL instead of `*`.
- **MongoDB.** Optional — the portfolio doesn't need it. If you want the template `/api/status` endpoints to work, grab a free connection string from [MongoDB Atlas](https://www.mongodb.com/atlas) and set `MONGO_URL` + `DB_NAME` on the backend service.

### Free-tier caveat

Render's free tier spins services down after 15 minutes of inactivity. The first request after a cold start takes ~30 seconds to wake the backend. For an interview link, that's usually fine — but if you're sharing it widely, the $7/month Starter plan keeps it warm.

### Other hosts

If you'd rather use Vercel, Fly.io, Railway, or a Linux VM, the structure is the same: serve `frontend/build/` as static files, run the FastAPI app behind `/api/*`, and set `REACT_APP_BACKEND_URL` at build time on the frontend.

The repo also ships with [`.emergent/emergent.yml`](.emergent/emergent.yml) pointing at the `fastapi_react_mongo` base image, so a single-click deploy on [Emergent](https://emergent.sh) picks the project up unchanged.

---

## Credits

- **Design + code:** [Durrell Smith](https://dashcreatives.art) · Atlanta, GA
- **Built with help from:** [Claude (Anthropic)](https://claude.com), three.js, JetBrains Mono
- **Particle portrait:** custom GLSL displacement shader sampled from a high-contrast portrait
- **Type:** JetBrains Mono throughout

---

## License

Personal portfolio — code is provided as a reference; the artwork, music, and bio are © Durrell Smith. Feel free to study the implementation; please don't redeploy as your own.
