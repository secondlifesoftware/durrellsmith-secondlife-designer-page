import React, { useState } from "react";

/* ============================================================================
   ExplodedProjects — process work shown as mechanical exploded views.

   Each project is a stack of "parts" (the slides of an Instagram process
   carousel, or films for AI Art). Assembled, the parts sit as one neat
   deck — a closed object. Click the deck and it EXPLODES: parts slide
   apart along the axis with dashed leader lines and part-number callouts,
   exactly like an exploded assembly drawing.

   UPLOADING REAL WORK LATER (data-only, no layout changes needed):
     1. Drop slide images in  frontend/public/process/<project-id>/01.png …
        (4:5 ratio — the 2160×2700 IG carousel exports work as-is)
        or videos for AI Art:  frontend/public/process/<project-id>/01.mp4
     2. Fill each part's `media` below:
        { label: "HOOK", media: { type: "image", src: "/process/wattnext/01.png" } }
        { label: "FILM 01", media: { type: "video", src: "/process/reel/01.mp4" } }
     3. Update the project's title / meta / year. Done.
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

const LIBRARY = {
    webux: {
        unit: "IG process carousels",
        note: "Each web project lands here as its Instagram process carousel — hook, problem, exploration, solution, outcome — exploded so the whole story reads at once.",
        projects: [emptyCarousel("web-01", "01"), emptyCarousel("web-02", "02")],
    },
    mobileux: {
        unit: "IG process carousels",
        note: "Mobile work reads the same way — the carousel slides pulled apart like an assembly drawing of the design process.",
        projects: [emptyCarousel("mob-01", "01"), emptyCarousel("mob-02", "02")],
    },
    aiart: {
        unit: "films",
        note: "The far orbit shows motion — AI-assisted films and artwork, each exploded into its film, stills, and process.",
        projects: [emptyReel("ai-01", "01"), emptyReel("ai-02", "02")],
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
                className={`xpv-stage ${open ? "is-exploded" : ""}`}
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
                    width: clamp(120px, 17vw, 190px);
                    transition:
                        margin 650ms cubic-bezier(0.22, 1.4, 0.36, 1),
                        transform 650ms cubic-bezier(0.22, 1.4, 0.36, 1);
                    /* assembled: a closed deck — parts tucked tight under
                       each other so the explosion has somewhere to go */
                    margin-left: calc(var(--i) * -14%);
                    transform: translateY(calc(var(--i) * 4px))
                        rotate(calc(var(--i) * -1.4deg));
                    z-index: calc(10 - var(--i));
                }
                .xpv-part:first-child { margin-left: 0; }

                .is-exploded .xpv-part {
                    /* exploded: parts separate along the diagonal axis */
                    margin-left: 1.1rem;
                    transform: translateY(calc(var(--i) * 22px)) rotate(0deg);
                }
                .is-exploded .xpv-part:first-child { margin-left: 0; }

                .xpv-panel {
                    aspect-ratio: 4 / 5;
                    box-shadow: 0 1px 0 rgba(42, 24, 16, 0.12),
                        0 10px 24px -18px rgba(42, 24, 16, 0.45);
                }
                .xpv-media { width: 100%; height: 100%; object-fit: cover; display: block; }
                .xpv-empty {
                    width: 100%; height: 100%;
                    display: flex; flex-direction: column;
                    align-items: center; justify-content: center;
                }

                /* callout + dashed leader line — mechanical drawing furniture */
                .xpv-callout {
                    position: absolute;
                    top: -2.4rem;
                    left: 50%;
                    transform: translateX(-50%);
                    font-size: 9px;
                    letter-spacing: 0.2em;
                    text-transform: uppercase;
                    white-space: nowrap;
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

                .xpv-hint {
                    position: absolute;
                    right: 0.4rem;
                    bottom: 0;
                }

                @media (max-width: 640px) {
                    .xpv-stage { flex-wrap: wrap; padding-top: 2.6rem; }
                    .xpv-part { width: 30vw; }
                    .is-exploded .xpv-part {
                        margin-left: 0.6rem;
                        margin-bottom: 2.6rem;
                        transform: translateY(0) rotate(0deg);
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
