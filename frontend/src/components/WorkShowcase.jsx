import React, { useState } from "react";
import { WORK } from "@/constants/testIds";
import OrbitingWork from "@/components/OrbitingWork";
import MusicBoatFleet from "@/components/MusicBoatFleet";
import UXCarFleet from "@/components/UXCarFleet";

/* ------------------------------------------------------------------------
   Real planetary orbits — mean longitudes at J2000 epoch + mean motion
   in degrees/day, semi-major axes in AU. Sources: VSOP87 / IAU.
   The three planets are mapped to facets of the practice:
     Artwork    → Earth   (1.0 AU,    365.256d period)
     UX Design  → Mars    (1.524 AU,  686.971d period)
     Music      → Venus   (0.723 AU,  224.701d period)
   ------------------------------------------------------------------------ */
const PLANETS = {
    venus: { L0: 181.979801, n: 1.602136, period: 224.701, a: 0.7233 },
    earth: { L0: 100.466449, n: 0.985647, period: 365.256, a: 1.0 },
    mars: { L0: 355.433275, n: 0.524033, period: 686.971, a: 1.524 },
};

// scene units per AU — keeps orbits visible in the camera frustum
const DIST_SCALE = 3.6;
// how long Earth's orbit takes on screen (s) — others scale proportionally
const EARTH_ANIM_PERIOD_SEC = 60;

const J2000_MS = Date.UTC(2000, 0, 1, 12, 0, 0); // Jan 1 2000 12:00 UT

function currentAngleRad(planet) {
    const daysSinceJ2000 = (Date.now() - J2000_MS) / 86400000;
    const Ldeg = (planet.L0 + planet.n * daysSinceJ2000) % 360;
    return (Ldeg * Math.PI) / 180;
}

function animPeriod(planet) {
    return (EARTH_ANIM_PERIOD_SEC * planet.period) / PLANETS.earth.period;
}

/* The three facets of the practice — each is a planet in the system. */
const facets = [
    {
        key: "art",
        label: "Artwork",
        planet: "Earth",
        color: "#c4432c",
        surfaceColor: "#962f1f",
        patternColor: "rgba(244, 220, 188, 0.55)",
        pattern: "strokes",
        distance: PLANETS.earth.a * DIST_SCALE,
        size: 0.6, // Earth: baseline
        initialAngle: currentAngleRad(PLANETS.earth),
        animPeriodSec: animPeriod(PLANETS.earth),
        blurb: "Two decades of work across watercolor, oil, India ink and mixed media assemblage — portraiture, abstraction and the unruly space between.",
    },
    {
        key: "ux",
        label: "UX Design",
        planet: "Mars",
        color: "#5b8def",
        surfaceColor: "#1f3a73",
        patternColor: "rgba(180, 220, 255, 0.5)",
        pattern: "grid",
        distance: PLANETS.mars.a * DIST_SCALE,
        size: 0.36, // Mars: ~0.53× Earth radius, bumped for legibility
        initialAngle: currentAngleRad(PLANETS.mars),
        animPeriodSec: animPeriod(PLANETS.mars),
        blurb: "Product design, UI/UX and animation for web and mobile — translating a painter's eye and a musician's ear into interfaces that feel inevitable.",
    },
    {
        key: "music",
        label: "Music",
        planet: "Venus",
        color: "#9b6dff",
        surfaceColor: "#3a1f55",
        patternColor: "rgba(220, 200, 255, 0.55)",
        pattern: "waves",
        distance: PLANETS.venus.a * DIST_SCALE,
        size: 0.57, // Venus: ~0.95× Earth radius
        initialAngle: currentAngleRad(PLANETS.venus),
        animPeriodSec: animPeriod(PLANETS.venus),
        blurb: "Songwriting and guitar work rooted in rock and blues — tension, release, and the honest grit of a take that hurt just enough to mean something.",
    },
];

/* Artwork tiles — populated; the other facets are placeholders for now. */
const artworkProjects = [
    {
        i: "01",
        title: "Sankofa",
        client: "Mixed Media Assemblage",
        year: "2018",
        tags: ["Assemblage", "Mixed Media"],
        img: "https://dashcreatives.art/images/sankofa.jpg",
    },
    {
        i: "02",
        title: "Palm Springs",
        client: "Watercolor / Ink / Turmeric",
        year: "2025",
        tags: ["Watercolor"],
        img: "https://dashcreatives.art/images/palm-springs.png",
    },
    {
        i: "03",
        title: "Ashley 1",
        client: "Oil on Canvas",
        year: "2024",
        tags: ["Oil", "Portrait"],
        img: "https://dashcreatives.art/images/ashley-1.png",
    },
    {
        i: "04",
        title: "The Songwriter",
        client: "Watercolor / India Ink",
        year: "2025",
        tags: ["Watercolor", "Ink"],
        img: "https://dashcreatives.art/images/the-songwriter.png",
    },
    {
        i: "05",
        title: "Holy Matrimony",
        client: "Mixed Media Assemblage",
        year: "2018",
        tags: ["Assemblage"],
        img: "https://dashcreatives.art/images/holy-matrimony.jpg",
    },
    {
        i: "06",
        title: "Duende",
        client: "Watercolor",
        year: "2022",
        tags: ["Watercolor"],
        img: "https://dashcreatives.art/images/duende.png",
    },
];

/* ------------------------------------------------------------------------
   ArtworkFan + PaperPlaneCard
   Each artwork becomes a small paper plane that slowly orbits the centre
   of its own cell, banking with the curve like it's gliding in a thermal.
   Click a plane to land it — its orbit pauses and the plane "unfolds" into
   the full rectangular artwork with a title band below.
   ------------------------------------------------------------------------ */

// Tiny deterministic pseudo-random so each plane has a stable orbit
// across re-renders.
function hash(n, salt = 1) {
    return ((n * 9301 + salt * 49297) % 233280) / 233280;
}

function PaperPlaneCard({ project, idx, isOpen, onToggle }) {
    // Per-plane wind drift — four independent oscillators (X, Y, tilt,
    // micro-jitter) each with a unique period & phase. The durations are
    // intentionally long and unrelated so the planes trace slow
    // Lissajous-like paths that never repeat and never sync with each
    // other. All deterministic so the motion is stable across re-renders.
    //
    // Smoother feel comes from:
    //   • longer base durations (12–30s) so direction changes are gradual
    //   • gentle cubic-bezier easing on each track
    //   • a 4th fast "fine jitter" oscillator layered on top of the
    //     slow drifts so the planes never look mechanical, even when the
    //     primary tracks are mid-cycle
    const dxDur = (12 + hash(idx, 7) * 18).toFixed(2); // 12 – 30 s
    const dyDur = (10 + hash(idx, 11) * 14).toFixed(2); // 10 – 24 s
    const spinDur = (14 + hash(idx, 19) * 16).toFixed(2); // 14 – 30 s
    const jitDur = (3.5 + hash(idx, 47) * 3).toFixed(2); // 3.5 – 6.5 s

    const dxAmp = Math.round(24 + hash(idx, 13) * 42); // 24 – 66 px
    const dyAmp = Math.round(16 + hash(idx, 17) * 32); // 16 – 48 px
    const spinAmp = Math.round(8 + hash(idx, 23) * 20); // 8 – 28 deg
    const jitAmp = Math.round(4 + hash(idx, 53) * 6); // 4 – 10 px

    const dxDelay = (-dxDur * hash(idx, 29)).toFixed(2);
    const dyDelay = (-dyDur * hash(idx, 31)).toFixed(2);
    const spinDelay = (-spinDur * hash(idx, 37)).toFixed(2);
    const jitDelay = (-jitDur * hash(idx, 59)).toFixed(2);

    // Random initial bias — half the planes start drifting in opposite
    // directions on each axis for additional variety.
    const dxStart = hash(idx, 41) > 0.5 ? "normal" : "reverse";
    const dyStart = hash(idx, 43) > 0.5 ? "normal" : "reverse";
    const spinStart = hash(idx, 61) > 0.5 ? "normal" : "reverse";

    return (
        <button
            type="button"
            data-testid={WORK.item(idx)}
            onClick={onToggle}
            aria-label={
                isOpen
                    ? `Re-fold ${project.title} into a paper plane`
                    : `Land ${project.title} and view the artwork`
            }
            className={`pp-card group ${isOpen ? "is-landed" : ""}`}
            style={{
                "--dx-dur": `${dxDur}s`,
                "--dy-dur": `${dyDur}s`,
                "--spin-dur": `${spinDur}s`,
                "--jit-dur": `${jitDur}s`,
                "--dx-amp": `${dxAmp}px`,
                "--dy-amp": `${dyAmp}px`,
                "--spin-amp": `${spinAmp}deg`,
                "--jit-amp": `${jitAmp}px`,
                "--dx-delay": `${dxDelay}s`,
                "--dy-delay": `${dyDelay}s`,
                "--spin-delay": `${spinDelay}s`,
                "--jit-delay": `${jitDelay}s`,
                "--dx-dir": dxStart,
                "--dy-dir": dyStart,
                "--spin-dir": spinStart,
            }}
        >
            {/* Four nested layers, each carrying one oscillator. Because
                CSS animations compose across nested elements (each affects
                its own transform), stacking them produces a wandering,
                wind-blown path rather than a tidy circle. The innermost
                jitter is the fast fine-grain micro-tremor that keeps the
                motion from ever feeling mechanical. */}
            <div className="pp-drift-x">
                <div className="pp-drift-y">
                    <div className="pp-jitter">
                        <div className="pp-spin">
                            <div className="pp-plane">
                                <img
                                    src={project.img}
                                    alt={project.title}
                                    loading="lazy"
                                    className="pp-img"
                                />
                                <div className="pp-fold" />
                                <div className="pp-paper" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Title band — only visible once the plane has landed */}
            <div className="pp-title">
                <h3>{project.title}</h3>
                <div className="pp-title-meta">
                    <span>{project.client}</span>
                    <span>{project.year}</span>
                </div>
            </div>
        </button>
    );
}

function ArtworkFan() {
    const [openIdx, setOpenIdx] = useState(null);

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 md:gap-8 pt-4 pb-8">
            {artworkProjects.map((p, idx) => (
                <PaperPlaneCard
                    key={p.i}
                    project={p}
                    idx={idx}
                    isOpen={openIdx === idx}
                    onToggle={() =>
                        setOpenIdx(openIdx === idx ? null : idx)
                    }
                />
            ))}
        </div>
    );
}

function ComingSoonFan({ label, accent }) {
    return (
        <div
            className="rounded-2xl border border-ink/15 bg-sand/40 p-10 md:p-14 text-center mx-auto max-w-2xl"
            style={{ minHeight: 220 }}
        >
            <div
                className="font-mono text-[10px] uppercase tracking-[0.28em] mb-4"
                style={{ color: accent }}
            >
                Transmission incoming
            </div>
            <h3 className="font-serif text-3xl md:text-4xl text-ink leading-[1.05]">
                The {label} world is still under construction.
            </h3>
            <p className="mt-4 font-sans text-sm text-ink-soft max-w-md mx-auto leading-relaxed">
                Selected pieces will land here soon. In the meantime,
                step back to the orbit and visit another planet.
            </p>
        </div>
    );
}

export default function WorkShowcase() {
    const [selected, setSelected] = useState(facets[0]);
    const [entered, setEntered] = useState(false);

    const enterFacet = (f) => {
        setSelected(f);
        setEntered(true);
    };

    const exitFacet = () => setEntered(false);

    return (
        <section
            id="work"
            data-testid={WORK.section}
            className="relative max-w-screen-2xl mx-auto px-6 md:px-12 py-16 md:py-24"
        >
            {/* Section header */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-10 md:mb-14 border-t border-ink/15 pt-10">
                <div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-rust">
                        (02) — Selected Work
                    </div>
                </div>
                <p className="font-sans text-sm text-ink-soft max-w-sm leading-relaxed md:text-right md:self-end">
                    Three planets, one practice. Artwork rides Earth, UX
                    Design rides Mars, Music rides Venus — positioned at
                    their real heliocentric longitudes right now, orbiting
                    in their true proportional rhythms.
                </p>
            </div>

            {/* Orbital scene */}
            <OrbitingWork
                facets={facets}
                selectedKey={selected.key}
                focusedKey={entered ? selected.key : null}
                onSelect={(f) => enterFacet(f)}
                height={520}
            />

            {/* Quick-jump pills (also accessible without 3D interaction) */}
            <div className="mt-8 flex flex-wrap items-center gap-3">
                {facets.map((f) => {
                    const active =
                        entered && f.key === selected.key;
                    return (
                        <button
                            key={f.key}
                            type="button"
                            onClick={() => enterFacet(f)}
                            className={`group flex items-center gap-2.5 px-4 py-2 rounded-full font-mono text-[11px] uppercase tracking-[0.22em] border transition-colors ${
                                active
                                    ? "bg-ink text-cream border-ink"
                                    : "bg-transparent text-ink-soft border-ink/20 hover:border-ink/50 hover:text-ink"
                            }`}
                        >
                            <span
                                className="w-2 h-2 rounded-full"
                                style={{ background: f.color }}
                            />
                            <span>{f.label}</span>
                        </button>
                    );
                })}
                {entered && (
                    <button
                        type="button"
                        onClick={exitFacet}
                        className="ml-auto group flex items-center gap-2 px-4 py-2 rounded-full font-mono text-[11px] uppercase tracking-[0.22em] border border-ink/30 text-ink hover:bg-ink hover:text-cream transition-colors"
                    >
                        <span>← Back to orbit</span>
                    </button>
                )}
            </div>

            {/* Default prompt (when no planet is entered) */}
            {!entered && (
                <div className="mt-12 md:mt-16 text-center">
                    <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-rust mb-4">
                        Pick a planet
                    </div>
                    <h3 className="font-serif text-3xl md:text-5xl text-ink leading-[1.05] max-w-xl mx-auto">
                        Click any orbiting world to zoom in and fan out
                        its work.
                    </h3>
                </div>
            )}

            {/* Entered facet detail + content */}
            {entered && (
                <div className="mt-10 md:mt-14 animate-[fade-up_500ms_ease-out_both]">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-end">
                        <div className="md:col-span-7">
                            <div
                                className="font-mono text-[10px] uppercase tracking-[0.28em] mb-4"
                                style={{ color: selected.color }}
                            >
                                Now landing — {selected.label}
                            </div>
                            <h3 className="font-serif text-4xl md:text-6xl text-ink leading-[0.95]">
                                {selected.label}
                                <span className="text-rust">.</span>
                            </h3>
                        </div>
                        <p className="md:col-span-5 font-sans text-sm md:text-base text-ink-soft leading-relaxed">
                            {selected.blurb}
                        </p>
                    </div>

                    <div className="mt-10 md:mt-14">
                        {selected.key === "art" && <ArtworkFan />}
                        {selected.key === "ux" && <UXCarFleet />}
                        {selected.key === "music" && <MusicBoatFleet />}
                    </div>
                </div>
            )}
        </section>
    );
}
