import React, { useCallback, useEffect, useState } from "react";

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
            deck("powerhouse", "Homeowner Wealth OS", "Power-House \u00b7 Leo King", "2026", [
                "Cover", "The Brief", "Reading the Brand", "The Architecture",
                "The Morning Cockpit", "The Client Scorecard", "Hyperlocal Intelligence",
                "Under the Hood", "The Throughline",
            ]),
            /* Brand world for Leo King's book — landscape sheets and web tiles
               rather than 4:5 slides, so this deck overrides the panel shape.
               Source ratios run 1.15 to 2.62, hence contain over cover. */
            deck(
                "manhood", "Manhood by Design", "Power-House \u00b7 Leo King", "2026",
                ["Brand World", "Palette", "Type Pairing", "Homepage Hero", "Quote Card", "Workbook Card"],
                { ratio: "16 / 10", fit: "contain", maxw: "260px" }
            ),
            deck("wattnext", "Two Temperaments, One Brand", "WattNext \u00b7 wattnext.ai", "2026", [
                "Cover", "The Brief", "The Gateway", "Voices In", "Vision Out",
                "The Architecture", "The Palette", "The Voice", "The Throughline",
            ]),
            deck("dashcreatives", "Turning 91 MB Into One Question", "dashcreatives.art", "2026", [
                "Cover", "One File", "91 MB", "The Name", "Twenty-Eight Files", "The Catalog",
                "The Rulebook", "The Gateway", "It Breaks", "Four Worlds", "The Result",
            ]),
            deck("sls-portfolio", "Teaching 40,000 Dots", "Second Life Software", "2026", [
                "Cover", "The Prompt", "The Interview", "The Rulebook", "Raw Material",
                "First Render", "Art Direction", "Iteration", "The System", "Input / Output",
            ]),
            deck("emory-hysci", "Emory HySci Admin Portal", "Globus automation \u00b7 Emory", "2026", [
                "Cover", "The Challenge", "Create Resources Hub", "Dashboard", "Source Video",
                "LDAP Group Creation", "Metrics Dashboard", "Self-Service Resource Management",
            ]),
            deck("engagementboard", "EngagementBoard", "YouTube automation", "2026", [
                "Cover", "The Challenge", "Analytics", "Content Opportunities", "Engagement Inbox",
                "Sentiment Dashboard", "How to Connect", "Core Toolkit",
            ]),
            deck("lnqhub", "LnqHub", "Recruitment platform", "2026", [
                "Cover", "The Challenge", "The Walkthrough",
            ]),
            deck("cdanalytics", "CDAnalytics", "Claim detection", "2026", [
                "Cover", "The Challenge", "The Walkthrough",
            ]),
            deck("clearvoice", "ClearVoice", "Local transcription \u00b7 secure vault", "2026", [
                "Cover", "The Challenge", "The Walkthrough",
            ]),
            deck("realestate-crm", "Real Estate Agent CRM", "Agent CRM", "2026", [
                "Cover", "The Challenge", "The Walkthrough",
            ]),
            deck("voice-demos", "Quick Product Overviews", "Voice agent demos", "2026", [
                "Cover", "The Challenge", "The Walkthrough", "Product Overviews",
            ]),
            deck("sls-admin", "SLS Admin", "In-house finance tracker", "2026", [
                "Cover", "The Challenge", "The Walkthrough", "Admin Walkthrough",
            ]),
        ],
    },
    mobileux: {
        unit: "IG process carousels",
        note: "Mobile work reads the same way — the carousel slides pulled apart like an assembly drawing of the design process.",
        projects: [
            deck("flashcards", "Flashcards That Fight Back", "Second Life \u00b7 Part 2", "2026", [
                "Cover", "The Concept", "Iterations 02\u201303", "Iteration 04", "Iteration 05",
                "The Payoff", "The Takeaway",
            ]),
            deck("thirdspot", "Thirdspot", "Events app", "2026", [
                "Cover", "The Challenge", "Create Event Before Publish", "Create Event",
                "The Walkthrough", "Map View", "My Corner", "Create Event Flow",
            ]),
            deck("narra", "Narra", "Voice-only social", "2026", [
                "Cover", "The Challenge", "The Walkthrough",
            ]),
            deck("caretrack", "CareTrack", "Care coordination", "2026", [
                "Cover", "The Challenge", "Walkthrough 01", "Walkthrough 02", "Walkthrough 03",
            ]),
            deck("aura-rewards", "Aura Rewards", "Loyalty app", "2026", [
                "Cover", "The Challenge", "Walkthrough 01", "Walkthrough 02",
            ]),
        ],
    },
    aiart: {
        unit: "generative work",
        note: "The far orbit is where the machine does the drawing — generative presences and AI-assisted artwork, exploded prompt by prompt.",
        projects: [
            deck("voice-agent", "Designing a Voice You Can See", "Second Life \u00b7 Part 1", "2026", [
                "Cover", "The Brief", "Iteration 01", "Iteration 02", "Exploration",
                "Iterations 03\u201304", "Iterations 10\u201312", "Iterations 13\u201318", "The Result",
            ]),
        ],
    },
};

function PartPanel({ part, idx, accent, exploded, onActivate }) {
    const num = String(idx + 1).padStart(2, "0");
    const zoomable = exploded && !!part.media;
    return (
        <button
            type="button"
            className={`xpv-part${zoomable ? " is-zoomable" : ""}`}
            style={{ "--i": idx }}
            onClick={() => onActivate(idx)}
            aria-label={
                zoomable
                    ? `Open ${part.label} full size`
                    : `${part.label} — expand the deck`
            }
        >
            <span className="xpv-callout font-mono" style={{ color: accent }}>
                P·{num} {part.label}
            </span>
            <span className="xpv-leader" aria-hidden="true" />
            <span className="xpv-panel rounded-xl border border-ink/20 bg-sand/50 overflow-hidden">
                {part.media ? (
                    part.media.type === "video" ? (
                        <video
                            className="xpv-media"
                            src={part.media.src}
                            playsInline
                            muted
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
                    <span className="xpv-empty">
                        <span
                            className="font-mono text-2xl md:text-3xl"
                            style={{ color: accent }}
                        >
                            {part.video ? "▶" : `⌀${num}`}
                        </span>
                        <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-ink-soft mt-2 px-3 text-center leading-relaxed">
                            {part.video ? "video" : "slide"} awaiting upload
                        </span>
                    </span>
                )}
                {zoomable && (
                    <span className="xpv-zoomcue font-mono" aria-hidden="true">
                        ⤢
                    </span>
                )}
            </span>
        </button>
    );
}

/* ----------------------------------------------------------------------------
   Lightbox — the slides carry real UI screenshots, and at deck scale the
   type in them is unreadable. Clicking an exploded panel opens the slide at
   the largest size the viewport allows (up to its native 1080x1350), with
   arrow-key paging through the rest of the deck.
   -------------------------------------------------------------------------- */
function Lightbox({ project, index, onIndex, onClose, accent }) {
    const parts = project.parts;
    /* "fit" shrinks the slide to the viewport; a portrait 4:5 slide in a
       landscape window is then height-capped to well under its native size,
       which is not enough to read a screenshot. "full" shows it 1:1 and lets
       the stage scroll, so the UI in the slide is legible at source
       resolution. */
    const [full, setFull] = useState(false);
    useEffect(() => setFull(false), [index]);
    const step = useCallback(
        (d) => {
            let i = index + d;
            while (i >= 0 && i < parts.length && !parts[i].media) i += d;
            if (i >= 0 && i < parts.length) onIndex(i);
        },
        [index, parts, onIndex]
    );

    useEffect(() => {
        const onKey = (e) => {
            if (e.key === "Escape") onClose();
            else if (e.key === "ArrowRight") step(1);
            else if (e.key === "ArrowLeft") step(-1);
            else if (e.key === "0" || e.key === "z") setFull((v) => !v);
        };
        document.addEventListener("keydown", onKey);
        /* Lock the page behind the overlay, but put back whatever was there
           rather than assuming it was "" — the orb menu also touches this. */
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = prev;
        };
    }, [step, onClose]);

    const part = parts[index];
    const shown = parts.filter((x) => x.media).length;
    const ordinal = parts.slice(0, index + 1).filter((x) => x.media).length;

    return (
        <div
            className="xpv-lb"
            role="dialog"
            aria-modal="true"
            aria-label={`${project.title} — ${part.label}`}
            onClick={onClose}
        >
            <div className="xpv-lb-top font-mono">
                <span className="xpv-lb-title">{project.title}</span>
                <span className="xpv-lb-count" style={{ color: accent }}>
                    {String(ordinal).padStart(2, "0")} / {String(shown).padStart(2, "0")}
                    <span className="xpv-lb-label"> · {part.label}</span>
                </span>
            </div>

            <button
                type="button"
                className="xpv-lb-nav xpv-lb-prev"
                onClick={(e) => {
                    e.stopPropagation();
                    step(-1);
                }}
                aria-label="Previous slide"
            >
                ‹
            </button>

            <figure
                className={`xpv-lb-stage${full ? " is-full" : ""}`}
                onClick={(e) => e.stopPropagation()}
            >
                {part.media.type === "video" ? (
                    <video
                        className="xpv-lb-media"
                        src={part.media.src}
                        controls
                        autoPlay
                        playsInline
                    />
                ) : (
                    <img
                        className="xpv-lb-media"
                        src={part.media.src}
                        alt={part.label}
                        onClick={() => setFull((v) => !v)}
                        title={full ? "Click to fit" : "Click to view at full size"}
                    />
                )}
            </figure>

            <button
                type="button"
                className="xpv-lb-nav xpv-lb-next"
                onClick={(e) => {
                    e.stopPropagation();
                    step(1);
                }}
                aria-label="Next slide"
            >
                ›
            </button>

            <button
                type="button"
                className="xpv-lb-zoom font-mono"
                onClick={(e) => {
                    e.stopPropagation();
                    setFull((v) => !v);
                }}
                aria-pressed={full}
            >
                {full ? "⤡ fit" : "⤢ full size"}
            </button>

            <button
                type="button"
                className="xpv-lb-close font-mono"
                onClick={onClose}
                aria-label="Close"
            >
                esc ✕
            </button>
        </div>
    );
}

function ExplodedProject({ project, accent, defaultOpen }) {
    const [open, setOpen] = useState(!!defaultOpen);
    const [zoom, setZoom] = useState(null);

    /* Assembled, a click anywhere on the stack opens the deck. Exploded, a
       click on a panel opens that slide full size — which is the only way the
       screenshots are actually legible. */
    const activate = (idx) => {
        if (!open) setOpen(true);
        else if (project.parts[idx].media) setZoom(idx);
    };

    return (
        <div className={`xpv-project${open ? " is-open" : ""}`}>
            {/* Drawing header — a blueprint title block when the deck is open
                and has the width for one line; stacked inside a grid cell,
                where a nowrap meta line ran straight out of the column. */}
            <div className="xpv-head">
                <h4 className="xpv-title font-serif text-ink">{project.title}</h4>
                <span className="xpv-rule" aria-hidden="true" />
                <span className="xpv-meta font-mono">
                    {project.meta} · {project.year}
                </span>
            </div>

            <div
                style={{
                    "--n": project.parts.length,
                    ...(project.ratio ? { "--ratio": project.ratio } : {}),
                    ...(project.fit ? { "--fit": project.fit } : {}),
                    ...(project.maxw ? { "--maxw": project.maxw } : {}),
                }}
                className={`xpv-stage ${open ? "is-exploded" : ""} ${
                    project.parts.length > 5 ? "is-dense" : ""
                }`}
            >
                {project.parts.map((part, i) => (
                    <PartPanel
                        key={part.label + i}
                        part={part}
                        idx={i}
                        accent={accent}
                        exploded={open}
                        onActivate={activate}
                    />
                ))}
            </div>

            <button
                type="button"
                aria-pressed={open}
                onClick={() => setOpen(!open)}
                className="xpv-toggle font-mono"
                style={{ "--btn": accent }}
            >
                <span className="xpv-toggle-ico" aria-hidden="true">
                    {open ? "⤡" : "⤢"}
                </span>
                {open ? "Assemble" : "Explode view"}
                <span className="xpv-toggle-n" aria-hidden="true">
                    {project.parts.length}
                </span>
            </button>

            {zoom !== null && (
                <Lightbox
                    project={project}
                    index={zoom}
                    onIndex={setZoom}
                    onClose={() => setZoom(null)}
                    accent={accent}
                />
            )}
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
                /* Decks sit in a grid: assembled they are a ~200px stack that used to
                   leave ~1100px of dead row beside them. Exploded, a deck takes
                   the full width it needs. */
                .xpv-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(clamp(230px, 21vw, 310px), 1fr));
                    gap: 3.2rem 1.8rem;
                    align-items: start;
                }
                .xpv-project { margin: 0; min-width: 0; }
                .xpv-project.is-open { grid-column: 1 / -1; }

                /* ---- deck header ----------------------------------------
                   Stacked by default. A deck sits in a ~316px grid column, and
                   the old one-line title block (title · rule · nowrap meta) ran
                   329-475px wide — every meta line overflowed its column and
                   collided with the neighbouring deck. Open decks span the full
                   row, so they get the blueprint title block back. */
                .xpv-head {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 0.3rem;
                    margin-bottom: 0.9rem;
                    min-width: 0;
                }
                .xpv-title {
                    font-size: 1.15rem;
                    line-height: 1.2;
                    max-width: 100%;
                    overflow-wrap: anywhere;
                }
                .xpv-rule {
                    display: block;
                    width: 100%;
                    border-bottom: 1px dashed rgba(42, 24, 16, 0.25);
                }
                .xpv-meta {
                    font-size: 9.5px;
                    letter-spacing: 0.2em;
                    text-transform: uppercase;
                    color: var(--xpv-soft, rgba(42, 24, 16, 0.55));
                    line-height: 1.5;
                    max-width: 100%;
                    overflow-wrap: anywhere;
                }
                .xpv-project.is-open .xpv-head {
                    flex-direction: row;
                    align-items: baseline;
                    gap: 1rem;
                    margin-bottom: 1.1rem;
                }
                .xpv-project.is-open .xpv-title { font-size: 1.75rem; }
                .xpv-project.is-open .xpv-rule { flex: 1 1 auto; width: auto; }
                .xpv-project.is-open .xpv-meta { flex: 0 0 auto; white-space: nowrap; }

                /* ---- the explode / assemble control ----------------------
                   Was 10px accent text floated in the corner of the stage and
                   people could not find it. Now a real pill under the deck. */
                .xpv-toggle {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin-top: 0.85rem;
                    padding: 0.5rem 0.85rem;
                    font-size: 10px;
                    letter-spacing: 0.18em;
                    text-transform: uppercase;
                    color: var(--btn);
                    background: rgba(255, 255, 255, 0.55);
                    border: 1.5px solid var(--btn);
                    border-radius: 999px;
                    cursor: pointer;
                    line-height: 1;
                    transition: background .16s ease, color .16s ease,
                        box-shadow .16s ease, transform .16s ease;
                }
                .xpv-toggle:hover {
                    background: var(--btn);
                    color: #F7F3E8;
                    box-shadow: 0 6px 18px -8px var(--btn);
                    transform: translateY(-1px);
                }
                .xpv-toggle:focus-visible {
                    outline: 2px solid var(--btn);
                    outline-offset: 3px;
                }
                .xpv-toggle-ico { font-size: 13px; line-height: 1; }
                .xpv-toggle-n {
                    padding: 2px 6px;
                    border-radius: 999px;
                    border: 1px solid currentColor;
                    font-size: 9px;
                    line-height: 1.3;
                    opacity: 0.75;
                }

                .xpv-stage {
                    position: relative;
                    display: flex;
                    align-items: flex-start;
                    width: 100%;
                    padding: 3.2rem 0 0.4rem;
                    cursor: pointer;
                    border: 0;
                    background: transparent;
                    text-align: left;
                }

                .xpv-part {
                    /* A <button> now (it opens the slide full size), so the
                       UA chrome has to come off before the layout below. */
                    appearance: none;
                    -webkit-appearance: none;
                    background: none;
                    border: 0;
                    padding: 0;
                    margin: 0;
                    font: inherit;
                    color: inherit;
                    text-align: left;
                    cursor: pointer;
                    display: block;
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
                    gap: 4.4rem 1.1rem;
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

                .xpv-zoomcue {
                    position: absolute;
                    right: 6px;
                    bottom: 6px;
                    font-size: 11px;
                    line-height: 1;
                    padding: 3px 5px;
                    border-radius: 5px;
                    color: #F7F3E8;
                    background: rgba(20, 20, 18, 0.55);
                    opacity: 0;
                    transition: opacity .18s ease;
                }
                .xpv-part.is-zoomable:hover .xpv-zoomcue,
                .xpv-part.is-zoomable:focus-visible .xpv-zoomcue { opacity: 1; }
                .xpv-part.is-zoomable:hover .xpv-panel { border-color: var(--xpv-accent); }
                .xpv-part:focus-visible { outline: 2px solid var(--xpv-accent); outline-offset: 3px; }

                /* ---- lightbox ---- */
                .xpv-lb {
                    position: fixed;
                    inset: 0;
                    z-index: 200;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(18, 16, 14, 0.94);
                    -webkit-backdrop-filter: blur(6px);
                    backdrop-filter: blur(6px);
                    animation: xpv-lb-in .16s ease;
                }
                @keyframes xpv-lb-in { from { opacity: 0 } to { opacity: 1 } }
                .xpv-lb-stage {
                    margin: 0;
                    max-width: 96vw;
                    max-height: 88vh;
                    display: flex;
                }
                /* 1:1. The stage scrolls so the whole slide is reachable even
                   when it is taller than the window. */
                .xpv-lb-stage.is-full {
                    max-width: 100vw;
                    max-height: 100vh;
                    width: 100vw;
                    height: 100vh;
                    overflow: auto;
                    align-items: flex-start;
                    justify-content: flex-start;
                    padding: 3.4rem 1rem 4rem;
                    overscroll-behavior: contain;
                }
                .xpv-lb-stage.is-full .xpv-lb-media {
                    max-width: none;
                    max-height: none;
                    width: auto;
                    height: auto;
                    margin: auto;
                    border-radius: 0;
                    cursor: zoom-out;
                }
                .xpv-lb-media {
                    display: block;
                    max-width: 96vw;
                    max-height: 88vh;
                    width: auto;
                    height: auto;
                    object-fit: contain;
                    cursor: zoom-in;
                    border-radius: 10px;
                    box-shadow: 0 30px 80px -20px rgba(0,0,0,.7);
                }
                .xpv-lb-top {
                    position: absolute;
                    top: 0; left: 0; right: 0;
                    display: flex;
                    align-items: baseline;
                    justify-content: space-between;
                    gap: 1rem;
                    padding: 1rem 1.3rem;
                    font-size: 10px;
                    letter-spacing: 0.22em;
                    text-transform: uppercase;
                    color: rgba(247,243,232,.72);
                    pointer-events: none;
                }
                .xpv-lb-title { color: #F7F3E8; }
                .xpv-lb-label { color: rgba(247,243,232,.6); }
                .xpv-lb-nav {
                    position: absolute;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 52px; height: 52px;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 30px; line-height: 1;
                    color: #F7F3E8;
                    background: rgba(247,243,232,.10);
                    border: 1px solid rgba(247,243,232,.22);
                    border-radius: 50%;
                    cursor: pointer;
                    transition: background .15s ease, transform .15s ease;
                }
                .xpv-lb-nav:hover { background: rgba(247,243,232,.2); }
                .xpv-lb-prev { left: 18px; }
                .xpv-lb-next { right: 18px; }
                .xpv-lb-zoom {
                    position: absolute;
                    left: 18px; bottom: 18px;
                    padding: 8px 12px;
                    font-size: 10px;
                    letter-spacing: 0.22em;
                    text-transform: uppercase;
                    color: #F7F3E8;
                    background: rgba(247,243,232,.10);
                    border: 1px solid rgba(247,243,232,.22);
                    border-radius: 999px;
                    cursor: pointer;
                }
                .xpv-lb-zoom:hover { background: rgba(247,243,232,.2); }
                .xpv-lb-close {
                    position: absolute;
                    right: 18px; bottom: 18px;
                    padding: 8px 12px;
                    font-size: 10px;
                    letter-spacing: 0.22em;
                    text-transform: uppercase;
                    color: #F7F3E8;
                    background: rgba(247,243,232,.10);
                    border: 1px solid rgba(247,243,232,.22);
                    border-radius: 999px;
                    cursor: pointer;
                }
                .xpv-lb-close:hover { background: rgba(247,243,232,.2); }
                @media (max-width: 640px) {
                    .xpv-lb-nav { width: 42px; height: 42px; font-size: 24px; }
                    .xpv-lb-prev { left: 8px; }
                    .xpv-lb-next { right: 8px; }
                    .xpv-lb-media { max-width: 96vw; max-height: 74vh; }
                }


                /* tablets: two decks a row reads better than three cramped */
                @media (max-width: 1100px) {
                    .xpv-grid {
                        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
                    }
                    .is-exploded .xpv-part {
                        width: clamp(220px, calc((100% - 2 * 1.1rem) / 3), 340px);
                    }
                }

                @media (max-width: 640px) {
                    /* One deck per row. Two 150px decks side by side are not
                       readable, and the header needs the full width. */
                    .xpv-grid { grid-template-columns: 1fr; gap: 2.8rem; }
                    .xpv-title { font-size: 1.25rem; }
                    /* An open deck has no extra width here, so keep the header
                       stacked rather than forcing the one-line title block. */
                    .xpv-project.is-open .xpv-head {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 0.3rem;
                    }
                    .xpv-project.is-open .xpv-title { font-size: 1.35rem; }
                    .xpv-project.is-open .xpv-rule { width: 100%; flex: none; }
                    .xpv-project.is-open .xpv-meta { white-space: normal; }
                    /* 44px minimum touch target */
                    .xpv-toggle {
                        min-height: 44px;
                        padding: 0.7rem 1.1rem;
                        font-size: 10.5px;
                    }
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

            <div className="xpv-grid">
            {lib.projects.map((p, i) => (
                <ExplodedProject
                    key={p.id}
                    project={p}
                    accent={accent}
                    defaultOpen={i === 0}
                />
            ))}
            </div>
        </div>
    );
}
