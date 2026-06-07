import React, { useEffect, useState } from "react";

/* ============================================================================
   UXCarFleet — paper cars representing each Behance project.

   Each project becomes a vintage 1950s-style coupe (clip-path body with
   curved roof + windshield, with two whitewall wheels separated from the
   body by a visible gap) driving across the page from left to right.
   The project's Behance cover image is painted across the body. Click
   a car to open the Behance project page in a new tab.

   Auto-update:
     1. First tries the local backend proxy /api/behance/{username} —
        the FastAPI server scrapes Behance server-side (no CORS issues)
        and caches for 10 minutes. This is the canonical "auto-updates
        when you publish a new project" path.
     2. Falls back to a few public CORS proxies (mostly blocked by
        Behance, but kept for redundancy).
     3. Finally falls back to a static FALLBACK_PROJECTS snapshot so the
        section is never empty.

   Username: dashcreatives (Durrell Smith — https://www.behance.net/dashcreatives)
   ========================================================================== */

const BEHANCE_USERNAME = "dashcreatives";
const BEHANCE_PROFILE = `https://www.behance.net/${BEHANCE_USERNAME}`;

// In production (emergent / deployed builds) the React app and FastAPI
// are served from the same origin, so a relative /api/... URL Just Works.
// In local dev, set REACT_APP_BACKEND_URL to point at your backend.
const BACKEND_BASE = process.env.REACT_APP_BACKEND_URL || "";

/* Static snapshot of Durrell's current projects on Behance — used as a
   fallback when neither the backend proxy nor public CORS proxies can
   reach Behance. Update this list when you publish new projects locally,
   or rely on the backend /api/behance/{username} endpoint for true
   live auto-update. */
const FALLBACK_PROJECTS = [
    {
        id: "250022265",
        slug: "Warrior-in-the-Garden",
        title: "Warrior in the Garden",
        link: "https://www.behance.net/gallery/250022265/Warrior-in-the-Garden",
        img: "https://mir-s3-cdn-cf.behance.net/projects/404/0cf12b250022265.Y3JvcCwxMzA5LDEwMjQsMTEzLDA.png",
    },
    {
        id: "250020251",
        slug: "DASH-Creatives-website",
        title: "DASH Creatives website",
        link: "https://www.behance.net/gallery/250020251/DASH-Creatives-website",
        img: "https://mir-s3-cdn-cf.behance.net/projects/404/6b1cfd250020251.Y3JvcCwyMzAxLDE4MDAsMjkwLDA.png",
    },
    {
        id: "250019681",
        slug: "Diamond-Heritage-Hat-Co",
        title: "Diamond Heritage Hat Co.",
        link: "https://www.behance.net/gallery/250019681/Diamond-Heritage-Hat-Co",
        img: "https://mir-s3-cdn-cf.behance.net/projects/404/931204250019681.Y3JvcCwxMTUwLDkwMCwxNDUsMA.png",
    },
    {
        id: "249110853",
        slug: "Daily-UX-Practice",
        title: "Daily UX Practice",
        link: "https://www.behance.net/gallery/249110853/Daily-UX-Practice",
        img: "https://mir-s3-cdn-cf.behance.net/projects/404/a16c00249110853.6a03cde19636b.jpg",
    },
    {
        id: "249036933",
        slug: "EarthGo-App",
        title: "EarthGo! App",
        link: "https://www.behance.net/gallery/249036933/EarthGo-App",
        img: "https://mir-s3-cdn-cf.behance.net/projects/404/e6d1eb249036933.Y3JvcCwxNDAwLDEwOTUsMCw2MjA.png",
    },
    {
        id: "249036295",
        slug: "Whisper-App",
        title: "Whisper App",
        link: "https://www.behance.net/gallery/249036295/Whisper-App",
        img: "https://mir-s3-cdn-cf.behance.net/projects/404/57bafa249036295.Y3JvcCwxNDAwLDEwOTUsMCwxMDAx.png",
    },
    {
        id: "249024877",
        slug: "Holton-Aeriel",
        title: "Holton Aeriel",
        link: "https://www.behance.net/gallery/249024877/Holton-Aeriel",
        img: "https://mir-s3-cdn-cf.behance.net/projects/404/8b82c9249024877.6a0136bcdaa88.jpg",
    },
];

const EXTERNAL_PROXIES = [
    (url) =>
        `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
    (url) =>
        `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
];

function titleize(slug) {
    return decodeURIComponent(slug).replace(/-/g, " ");
}

function parseBehanceHtml(html) {
    const linkRe = /\/gallery\/(\d{6,12})\/([A-Za-z0-9_-]+)/g;
    const byId = new Map();
    let m;
    while ((m = linkRe.exec(html)) !== null) {
        const [, id, slug] = m;
        if (!byId.has(id)) {
            byId.set(id, {
                id,
                slug,
                title: titleize(slug),
                link: `https://www.behance.net/gallery/${id}/${slug}`,
                img: "",
            });
        }
    }
    byId.forEach((project) => {
        const imgRe = new RegExp(
            `https://mir-s3-cdn-cf\\.behance\\.net/projects/404/[a-z0-9]+${project.id}\\.[A-Za-z0-9_-]+\\.(?:png|jpe?g|webp)`,
            "i",
        );
        const im = html.match(imgRe);
        if (im) project.img = im[0];
    });
    return [...byId.values()];
}

async function fetchBehanceProjects() {
    // 1) Local backend proxy — the FastAPI server scrapes Behance and
    //    serves JSON with permissive CORS. This is the path that gives
    //    true auto-update when the user publishes new Behance work.
    try {
        const res = await fetch(
            `${BACKEND_BASE}/api/behance/${BEHANCE_USERNAME}?_=${Date.now()}`,
            { cache: "no-store" },
        );
        if (res.ok) {
            const data = await res.json();
            if (data && Array.isArray(data.projects) && data.projects.length) {
                return data.projects;
            }
        }
    } catch (e) {
        // try the next fallback
    }

    // 2) Public CORS proxies — usually blocked by Behance, kept for
    //    redundancy in case one starts working.
    const profileUrl = `${BEHANCE_PROFILE}?_=${Date.now()}`;
    for (const wrap of EXTERNAL_PROXIES) {
        try {
            const res = await fetch(wrap(profileUrl), {
                cache: "no-store",
            });
            if (!res.ok) continue;
            const html = await res.text();
            const projects = parseBehanceHtml(html);
            if (projects.length) return projects;
        } catch (e) {
            // try the next
        }
    }

    // 3) Static fallback — keeps the section populated.
    return FALLBACK_PROJECTS;
}

/* ---------- PaperCar -------------------------------------------------- */

function PaperCar({ project, idx, count }) {
    // IDENTICAL speed for every car — pair this with evenly-distributed
    // phase delays below so the cars are always spaced evenly across the
    // horizontal track and physically can never catch up to one another.
    // With different speeds they'd eventually overlap; with the same
    // speed + staggered phase, the gap between cars is constant forever.
    const speed = 40;
    // Each car offset by 1/count of the lap so they appear at evenly
    // spaced X positions at all times.
    const phase = idx / Math.max(1, count);
    const delay = -(speed * phase).toFixed(2);
    // Lanes give a little vertical variation; with the phase stagger
    // above, X separation is what actually prevents overlap, but the
    // varied Y adds depth.
    const lane = (idx % 4) * 30;
    // Bumpy-road bob — small fast vertical hop
    const bobDur = (0.72 + ((idx * 13) % 40) / 100).toFixed(2);
    const bobDelay = (-((idx * 17) % 100) / 100).toFixed(2);
    // 1950s candy palette for fallback body tints
    const fallbackHues = [
        "#c4432c",
        "#3a8fcf",
        "#f3d36b",
        "#9b6dff",
        "#e8a094",
        "#4a8c6b",
        "#d68a6e",
    ];
    const bodyTint = fallbackHues[idx % fallbackHues.length];

    return (
        <a
            href={project.link}
            target="_blank"
            rel="noreferrer"
            className="paper-car"
            aria-label={`Open ${project.title} on Behance`}
            style={{
                "--car-speed": `${speed}s`,
                "--car-delay": `${delay}s`,
                "--car-lane": `${lane}px`,
                "--car-bob-dur": `${bobDur}s`,
                "--car-bob-delay": `${bobDelay}s`,
                "--car-tint": bodyTint,
            }}
        >
            <div className="paper-car-body">
                {project.img ? (
                    <img
                        src={project.img}
                        alt=""
                        loading="lazy"
                        className="paper-car-img"
                    />
                ) : (
                    <div className="paper-car-tint" />
                )}
                {/* center fold of the paper down the middle of the body */}
                <div className="paper-car-fold" />
                {/* sheen — light on top, shadow on the rocker panel */}
                <div className="paper-car-sheen" />
                {/* big curved windshield + roof window glass */}
                <div className="paper-car-window" />
                {/* headlight glow on the front-right corner */}
                <div className="paper-car-headlight" />
            </div>
            {/* Wheels — sit BELOW the body with a visible gap, like a toy
                car with its wheels separated from the chassis. */}
            <div className="paper-car-wheel paper-car-wheel--back" />
            <div className="paper-car-wheel paper-car-wheel--front" />
            <div className="paper-car-label">
                <span>{project.title}</span>
            </div>
        </a>
    );
}

/* ---------- The fleet ------------------------------------------------- */

export default function UXCarFleet() {
    const [projects, setProjects] = useState([]);
    const [status, setStatus] = useState("loading");

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const list = await fetchBehanceProjects();
                if (cancelled) return;
                if (!list.length) {
                    setStatus("empty");
                    return;
                }
                setProjects(list);
                setStatus("loaded");
            } catch (e) {
                if (!cancelled) setStatus("error");
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    if (status === "loading") {
        return (
            <div className="rounded-2xl border border-ink/15 bg-sand/40 p-10 md:p-14 text-center mx-auto max-w-2xl">
                <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-rust mb-3">
                    Starting the engines…
                </div>
                <p className="font-sans text-sm text-ink-soft">
                    Pulling the latest from Behance.
                </p>
            </div>
        );
    }

    if (status === "empty" || status === "error" || !projects.length) {
        return (
            <div className="rounded-2xl border border-ink/15 bg-sand/40 p-10 md:p-14 text-center mx-auto max-w-2xl">
                <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-rust mb-3">
                    The garage is empty — for now
                </div>
                <h3 className="font-serif text-3xl md:text-4xl text-ink leading-[1.05]">
                    New projects roll out here as new paper cars.
                </h3>
                <p className="mt-4 font-sans text-sm text-ink-soft max-w-md mx-auto leading-relaxed">
                    This page is wired into{" "}
                    <a
                        href={BEHANCE_PROFILE}
                        target="_blank"
                        rel="noreferrer"
                        className="text-rust hover:underline"
                    >
                        Durrell&rsquo;s Behance profile
                    </a>
                    . Publish a project and a new car leaves the lot next
                    time the page loads.
                </p>
            </div>
        );
    }

    return (
        <>
            <div className="paper-car-fleet">
                {projects.map((p, i) => (
                    <PaperCar
                        key={p.id}
                        project={p}
                        idx={i}
                        count={projects.length}
                    />
                ))}
            </div>
            <div className="mt-6 font-mono text-[10px] uppercase tracking-[0.28em] text-ink-soft text-center">
                {projects.length} project
                {projects.length === 1 ? "" : "s"} live from{" "}
                <a
                    href={BEHANCE_PROFILE}
                    target="_blank"
                    rel="noreferrer"
                    className="text-rust hover:underline"
                >
                    behance.net/{BEHANCE_USERNAME}
                </a>
            </div>
        </>
    );
}
