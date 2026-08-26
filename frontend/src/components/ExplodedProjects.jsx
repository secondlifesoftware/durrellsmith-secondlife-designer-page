import React, { useState } from "react";

/* ============================================================================
   ExplodedProjects — process work shown as mechanical exploded views.

   Each project is a stack of "parts" (the slides of an Instagram process
   carousel, or films for AI Art). Assembled, the parts sit as one neat
   deck — a closed object. Click the deck and it EXPLODES: parts slide
   apart along the axis with dashed leader lines and part-number callouts,
   exactly like an exploded assembly drawing.

   UPLOADING REAL WORK LATER (data-only, no layout changes needed):
     0. Verify with content-type, not just "did the request 200". On the
        /design deploy a wrong path returns index.html with a 200, and an
        offscreen lazy <img> reports complete=true / naturalWidth=0 before it
        has even been asked to load — both read as "fine" if you only count
        broken images. Check that the response is actually image/jpeg.
     1. Drop slide images in  frontend/public/process/<project-id>/01.jpg …
        4:5 ratio. Downscale the 2160×2700 IG exports first — the panels are
        only ~150-190px wide, and full-size PNGs bloat the repo badly:
          sips -Z 1080 -s format jpeg -s formatOptions 82 in.png --out 01.jpg
        Videos still work for films:  /process/<project-id>/01.mp4
     2. Add a deck() call in LIBRARY below with the slides' own section titles:
        deck("wattnext", "Title", "Client", "2026", ["Cover", "The Brief", …])
        Label count must match the file count — deck() maps them 1:1.
     3. For films, set media manually:
        { label: "FILM 01", media: { type: "video", src: "/process/reel/01.mp4" } }

   Decks longer than 5 parts get narrower panels and staggered callouts
   automatically (see .is-dense) — no layout work needed for a 9- or 11-up.
   ========================================================================== */

const CAROUSEL_PARTS = ["Hook", "Problem", "Exploration", "Solution", "Outcome"];

const emptyCarousel = (id, n) => ({
    id: `${id}`,
    title: `Project ${n}`,
    meta: "Awaiting its process carousel",
    year: "—",
    parts: CAROUSEL_PARTS.map((label) => ({ label, media: null })),
});

const emptyReel = (id, n) => ({
    id: `${id}`,
    title: `Film ${n}`,
    meta: "Awaiting upload",
    year: "—",
    parts: [
        { label: "Film", media: null, video: true },
        { label: "Stills", media: null, video: true },
        { label: "Process", media: null, video: true },
    ],
});

/* A real deck. `labels` are the slides' own section titles, in deck order, so
   the exploded callouts read as the case study's actual chapters. Slides live
   at /process/<id>/01.jpg … — see the upload note at the top of this file. */
const deck = (id, title, meta, year, labels, opts = {}) => ({
    id,
    title,
    meta,
    year,
    /* Portrait IG slides are the default. Pass `ratio` for a deck of landscape
       sheets — with `fit: "contain"` so mixed source ratios letterbox inside
       the panel instead of being centre-cropped into an unreadable sliver.
       `maxw` lifts the width cap, which is tuned for portrait panels. */
    ratio: opts.ratio,
    fit: opts.fit,
    maxw: opts.maxw,
    parts: labels.map((label, i) => ({
        label,
        media: {
            type: "image",
            /* MUST go through PUBLIC_URL. This bundle is served from the domain
               root on Render but from /design on Netlify, so a root-absolute
               "/process/…" resolves to the SPA catch-all on the subpath deploy
               and every slide silently renders as index.html (HTTP 200,
               text/html — it does not 404, so it is easy to miss). */
            src: `${process.env.PUBLIC_URL}/process/${id}/${String(i + 1).padStart(2, "0")}.jpg`,
        },
    })),
});

const LIBRARY = {
    webux: {
        unit: "IG process carousels",
        note: "Each web project lands here as its Instagram process carousel — brief, exploration, architecture, outcome — exploded so the whole story reads at once.",
        projects: [
            deck("powerhouse", "Homeowner Wealth OS", "Power-House · Leo King", "2026", [
                "Cover",
                "The Brief",
                "Reading the Brand",
                "The Architecture",
                "The Morning Cockpit",
                "The Client Scorecard",
                "Hyperlocal Intelligence",
                "Under the Hood",
                "The Throughline",
            ]),
            /* Brand world for Leo King's book — landscape sheets and web tiles
               rather than 4:5 slides, so this deck overrides the panel shape.
               Source ratios run 1.15 to 2.62, hence contain over cover. */
            deck(
                "manhood",
                "Manhood by Design",
                "Power-House · Leo King",
                "2026",
                [
                    "Brand World",
                    "Palette",
                    "Type Pairing",
                    "Homepage Hero",
                    "Quote Card",
                    "Workbook Card",
                ],
                { ratio: "16 / 10", fit: "contain", maxw: "260px" }
            ),
            deck("dashcreatives", "Turning 91 MB Into One Question", "dashcreatives.art", "2026", [
                "Cover",
                "One File",
                "91 MB",
                "The Name",
                "Twenty-Eight Files",
                "The Catalog",
                "The Rulebook",
                "The Gateway",
                "It Breaks",
                "Four Worlds",
                "The Result",
            ]),
            deck("sls-portfolio", "Teaching 40,000 Dots", "Second Life Software", "2026", [
                "Cover",
                "The Prompt",
                "The Interview",
                "The Rulebook",
                "Raw Material",
                "First Render",
                "Art Direction",
                "Iteration",
                "The System",
                "Input / Output",
            ]),
        ],
    },
    mobileux: {
        unit: "IG process carousels",
        note: "Mobile work reads the same way — the carousel slides pulled apart like an assembly drawing of the design process.",
        projects: [
            deck("flashcards", "Flashcards That Fight Back", "Second Life · Part 2", "2026", [
                "Cover",
                "The Concept",
                "Iterations 02–03",
                "Iteration 04",
                "Iteration 05",
                "The Payoff",
                "The Takeaway",
            ]),
            emptyCarousel("mob-02", "02"),
        ],
    },
    aiart: {
        unit: "generative work",
        note: "The far orbit is where the machine does the drawing — generative presences and AI-assisted artwork, exploded prompt by prompt.",
        projects: [
            deck("voice-agent", "Designing a Voice You Can See", "Second Life · Part 1", "2026", [
                "Cover",
                "The Brief",
                "Iteration 01",
                "Iteration 02",
                "Exploration",
                "Iterations 03–04",
                "Iterations 10–12",
                "Iterations 13–18",
                "The Result",
            ]),
            emptyReel("ai-02", "02"),
        ],
    },
};

function PartPanel({ part, idx, accent }) {
    const num = String(idx + 1).padStart(2, "0");
    return (
        <div className="xpv-part" style={{ "--i": idx }}>
            <div className="xpv-callout font-mono" style={{ color: accent }}>
                P·{num} {part.label}
            </div>
            <div className="xpv-leader" aria-hidden="true" />
            <div className="xpv-panel rounded-xl border border-ink/20 bg-sand/50 overflow-hidden">
                {part.media ? (
                    part.media.type === "video" ? (
                        <video
                            className="xpv-media"
                            src={part.media.src}
                            controls
                            playsInline
                            preload="metadata"
                        />
                    ) : (
                        <img
                            className="xpv-media"
                            src={part.media.src}
                            alt={part.label}
                            loading="lazy"
                        />
                    )
                ) : (
                    <div className="xpv-empty">
                        <div
                            className="font-mono text-2xl md:text-3xl"
                            style={{ color: accent }}
                        >
                            {part.video ? "▶" : `⌀${num}`}
                        </div>
                        <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-ink-soft mt-2 px-3 text-center leading-relaxed">
                            {part.video ? "video" : "slide"} awaiting upload
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function ExplodedProject({ project, accent, defaultOpen }) {
    const [open, setOpen] = useState(!!defaultOpen);
    return (
        <div className="xpv-project">
            {/* Drawing header — like a title block on a blueprint sheet */}
            <div className="flex items-baseline gap-4 mb-3">
                <h4 className="font-serif text-2xl md:text-3xl text-ink">
                    {project.title}
                </h4>
                <div className="flex-1 border-b border-dashed border-ink/25" />
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-soft">
                    {project.meta} · {project.year}
                </span>
            </div>

            <button
                type="button"
                aria-pressed={open}
                onClick={() => setOpen(!open)}
                style={{
                    "--n": project.parts.length,
                    ...(project.ratio ? { "--ratio": project.ratio } : {}),
                    ...(project.fit ? { "--fit": project.fit } : {}),
                    ...(project.maxw ? { "--maxw": project.maxw } : {}),
                }}
                className={`xpv-stage ${open ? "is-exploded" : ""} ${
                    project.parts.length > 5 ? "is-dense" : ""
                }`}
                aria-label={
                    open
                        ? `Assemble ${project.title} back into a deck`
                        : `Explode ${project.title} into its parts`
                }
            >
                {project.parts.map((part, i) => (
                    <PartPanel
                        key={part.label + i}
                        part={part}
                        idx={i}
                        accent={accent}
                    />
                ))}
                <span
                    className="xpv-hint font-mono text-[10px] uppercase tracking-[0.22em]"
                    style={{ color: accent }}
                >
                    {open ? "⤡ assemble" : "⤢ explode view"}
                </span>
            </button>
        </div>
    );
}

export default function ExplodedProjects({ facetKey, accent = "#c4432c" }) {
    const lib = LIBRARY[facetKey];
    if (!lib) return null;

    return (
        <div className="xpv-root">
            <style>{`
                .xpv-root { --xpv-accent: ${accent}; }
                .xpv-project { margin-bottom: 4.5rem; }
                .xpv-project:last-child { margin-bottom: 1rem; }

                .xpv-stage {
                    position: relative;
                    display: flex;
                    align-items: flex-start;
                    width: 100%;
                    padding: 3.2rem 1rem 1.6rem;
                    cursor: pointer;
                    border: 0;
                    background: transparent;
                    text-align: left;
                }

                .xpv-part {
                    position: relative;
                    flex: 0 0 auto;
                    /* Panels share the row, so a 9-slide deck stays inside the
                       container instead of running off the edge. Caps at the
                       original 190px so short decks look unchanged. Held in a
                       variable because the assembled offset below is a fraction
                       of the CARD's width. */
                    --pw: clamp(
                        84px,
                        calc((100% - (var(--n, 5) - 1) * 1.1rem) / var(--n, 5)),
                        var(--maxw, 190px)
                    );
                    width: var(--pw);
                    transition:
                        margin 650ms cubic-bezier(0.22, 1.4, 0.36, 1),
                        width 650ms cubic-bezier(0.22, 1.4, 0.36, 1),
                        transform 650ms cubic-bezier(0.22, 1.4, 0.36, 1);
                    /* Assembled: ONE stack. Every card but the first pulls back
                       over its predecessor, leaving a ~6% sliver of edge, so a
                       deck of any length reads as a single riffled pile.

                       The offset is a fraction of --pw, i.e. of the card. It
                       used to be a percentage margin (var(--i) * -14%), but a
                       percentage margin resolves against the CONTAINING BLOCK,
                       not the element — that was 14% of a ~1400px stage per
                       card, so 9- and 11-card decks marched off the left edge
                       instead of stacking. No backticks in here: this whole
                       stylesheet is a JS template literal. */
                    margin-left: calc(var(--pw) * -0.94);
                    transform: translateY(calc(var(--i) * 3px))
                        rotate(calc(var(--i) * -1.1deg));
                    z-index: calc(30 - var(--i));
                }
                .xpv-part:first-child { margin-left: 0; }

                /* Exploded: the deck stops being a single row and becomes a
                   wrapped grid of LARGE panels. A one-row explode divides the
                   container by the part count, so an 11-slide deck lands at
                   ~110px per panel — the slides are dense editorial layouts and
                   are unreadable at that size. Here the panel size is fixed and
                   the row count follows, so slides stay legible no matter how
                   long the deck is. Reflows 4 → 3 → 2 per row as space allows,
                   and one per row on phones. */
                .is-exploded {
                    flex-wrap: wrap;
                    gap: 3.4rem 1.1rem;
                    padding-top: 3.6rem;
                }
                .is-exploded .xpv-part {
                    width: clamp(240px, calc((100% - 3 * 1.1rem) / 4), 380px);
                    margin-left: 0;
                    transform: none;
                }

                .xpv-panel {
                    aspect-ratio: var(--ratio, 4 / 5);
                    box-shadow: 0 1px 0 rgba(42, 24, 16, 0.12),
                        0 10px 24px -18px rgba(42, 24, 16, 0.45);
                }
                .xpv-media {
                    width: 100%; height: 100%; display: block;
                    object-fit: var(--fit, cover);
                }
                .xpv-empty {
                    width: 100%; height: 100%;
                    display: flex; flex-direction: column;
                    align-items: center; justify-content: center;
                }

                /* callout + dashed leader line — mechanical drawing furniture */
                .xpv-callout {
                    position: absolute;
                    top: -2.4rem;
                    /* Span the panel and wrap rather than centring a nowrap
                       line on it. Every callout in a wrapped row shares one
                       baseline, so a long label centred on a narrow panel
                       would overlap its neighbours. */
                    left: 0;
                    right: 0;
                    text-align: center;
                    font-size: 9px;
                    letter-spacing: 0.2em;
                    text-transform: uppercase;
                    white-space: normal;
                    line-height: 1.35;
                    opacity: 0;
                    transition: opacity 420ms ease 180ms;
                }
                .xpv-leader {
                    position: absolute;
                    top: -1.5rem;
                    left: 50%;
                    height: 1.5rem;
                    border-left: 1px dashed var(--xpv-accent);
                    opacity: 0;
                    transition: opacity 420ms ease 180ms;
                }
                .is-exploded .xpv-callout,
                .is-exploded .xpv-leader { opacity: 0.9; }

                /* --n and --maxw size the ASSEMBLED deck only; once exploded the
                   panel size is fixed and the rows wrap. Don't reintroduce a
                   per-part vertical stagger to separate callouts — the callouts
                   are panel-width and wrap, which already prevents overlap. */

                .xpv-hint {
                    position: absolute;
                    right: 0.4rem;
                    bottom: 0;
                }

                @media (max-width: 640px) {
                    .xpv-stage { flex-wrap: wrap; padding-top: 2.6rem; }
                    /* Set --pw, not width — the assembled stack offset is
                       derived from it. */
                    .xpv-part { --pw: 30vw; }
                    /* One slide per row on phones. These are dense editorial
                       layouts — two-up at ~150px is not readable, and the panel
                       is the whole point of expanding. */
                    .is-exploded { gap: 3rem 0; }
                    .is-exploded .xpv-part {
                        width: 100%;
                        margin-left: 0;
                        transform: none;
                    }
                }
                @media (prefers-reduced-motion: reduce) {
                    .xpv-part { transition: none; }
                }
            `}</style>

            <p className="font-sans text-sm text-ink-soft max-w-xl leading-relaxed mb-8">
                {lib.note}
            </p>

            {lib.projects.map((p, i) => (
                <ExplodedProject
                    key={p.id}
                    project={p}
                    accent={accent}
                    defaultOpen={i === 0}
                />
            ))}
        </div>
    );
}
