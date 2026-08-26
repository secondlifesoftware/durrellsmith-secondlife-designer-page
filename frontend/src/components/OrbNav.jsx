import React, { useCallback, useEffect, useRef, useState } from "react";

/* ============================================================================
   OrbNav — the Astral Orb. A React port of web/src/components/OrbNav.astro in
   the dash-creatives repo, so this portfolio carries the same worlds menu as
   every other DASH Creatives page.

   Three things differ from the Astro original, all because this page lives on
   a different origin (ux.dashcreatives.art) than the rest of the site:

     1. Hrefs are absolute. The original uses "/" and "/art/#gallery", which
        would resolve against the ux subdomain and 404.
     2. Durrell Smith is hard-marked current — this page IS that world, so the
        original's pathname sniffing has nothing to match on.
     3. Assets go through PUBLIC_URL. This bundle is also served from
        secondlifesoftware.com/design, where "/gateway/…" hits the SPA
        catch-all and returns index.html with a 200 rather than a 404.

   Keep the visual language in sync with the Astro version if that one changes.
   ========================================================================== */

const P = process.env.PUBLIC_URL;
const SITE = "https://dashcreatives.art";

const WORLDS = [
    { href: `${SITE}/`, label: "The Gateway", sub: "the diamond heart", kind: "heart" },
    { href: `${SITE}/art/#gallery`, label: "D.LAMAR", sub: "the painter · the gallery", c1: "#F2A9C4", c2: "#D2547E" },
    { href: `${SITE}/?world=lamarcy`, label: "LamarCy", sub: "the songwriter · the music", c1: "#09B1AB", c2: "#067A76" },
    { href: `${SITE}/art/#music`, label: "Ashley Smith", sub: "the voice · her stories", c1: "#F4C531", c2: "#C79312" },
    { href: "https://ux.dashcreatives.art", label: "Durrell Smith", sub: "ux · the design work", c1: "#58B368", c2: "#2E7D42", current: true },
];

/* The orb is DASH Creatives chrome. The same bundle is served at
   secondlifesoftware.com/design, where a menu of Durrell's personal worlds is
   off-brand on the company's marketing site — the /design build already strips
   the Emergent badge and PostHog for that reason. Anything else (the ux
   subdomain, localhost) shows it. */
const showsOrb = () =>
    typeof window === "undefined" ||
    !/(^|\.)secondlifesoftware\.com$/.test(window.location.hostname);

function EggIcon({ c1, c2 }) {
    return (
        <svg className="oicon" viewBox="0 0 24 30" aria-hidden="true">
            <ellipse cx="12" cy="15.4" rx="10" ry="13.2" fill={c1} stroke="#141412" strokeWidth="1.6" />
            <circle cx="8" cy="10" r="1.5" fill={c2} />
            <circle cx="14" cy="13" r="1.5" fill={c2} />
            <circle cx="9" cy="18" r="1.5" fill={c2} />
            <circle cx="15" cy="21" r="1.5" fill={c2} />
            <circle cx="16" cy="8.5" r="1.2" fill={c2} />
            <ellipse cx="8.4" cy="8.6" rx="2.4" ry="3.8" fill="rgba(255,255,255,.55)" transform="rotate(24 8.4 8.6)" />
        </svg>
    );
}

export default function OrbNav() {
    const [open, setOpen] = useState(false);
    const rootRef = useRef(null);
    const [visible] = useState(showsOrb);

    const close = useCallback(() => setOpen(false), []);

    useEffect(() => {
        if (!open) return undefined;
        const onDocClick = (e) => {
            if (rootRef.current && !rootRef.current.contains(e.target)) close();
        };
        const onKey = (e) => {
            if (e.key === "Escape") close();
        };
        document.addEventListener("click", onDocClick);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("click", onDocClick);
            document.removeEventListener("keydown", onKey);
        };
    }, [open, close]);

    if (!visible) return null;

    return (
        <nav
            id="orbnav"
            ref={rootRef}
            className={open ? "open" : ""}
            aria-label="DASH Creatives worlds"
        >
            <style>{`
@font-face{font-family:'OswaldOrb';src:url('${P}/gateway/Oswald.ttf');font-display:swap}
#orbnav{all:unset;display:block;position:fixed;top:auto;left:auto;right:20px;bottom:20px;
  width:auto;height:auto;margin:0;padding:0;background:none;border:0;z-index:45}
#orbnav .oball{position:relative;display:block;width:64px;height:64px;border-radius:50%;cursor:pointer;padding:0;
  border:1.5px solid rgba(20,20,18,.4);
  background:rgba(247,243,232,.16);
  -webkit-backdrop-filter:blur(7px) saturate(1.15);backdrop-filter:blur(7px) saturate(1.15);
  box-shadow:0 10px 24px rgba(20,20,18,.28),inset 0 1px 6px rgba(255,255,255,.55),inset 0 -6px 12px rgba(20,20,18,.08);
  perspective:230px;transition:transform .16s ease,border-color .16s ease,box-shadow .16s ease}
#orbnav .oball:hover{transform:scale(1.07);border-color:#09B1AB}
#orbnav.open .oball{border-color:#09B1AB;box-shadow:0 10px 26px rgba(9,177,171,.4),inset 0 1px 6px rgba(255,255,255,.55)}
#orbnav .osheen{position:absolute;inset:0;border-radius:50%;pointer-events:none;
  background:radial-gradient(ellipse 42% 30% at 32% 24%,rgba(255,255,255,.6),rgba(255,255,255,0) 70%)}
#orbnav .onucleus{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none}
#orbnav .onucleus img{width:42%;height:42%;object-fit:contain}
#orbnav .oplane{position:absolute;inset:8%;pointer-events:none;transform-style:preserve-3d}
#orbnav .p1{transform:rotateZ(0deg) rotateX(68deg)}
#orbnav .p2{transform:rotateZ(60deg) rotateX(68deg)}
#orbnav .p3{transform:rotateZ(-60deg) rotateX(68deg)}
#orbnav .oring{position:absolute;inset:0;border-radius:50%;border:1.2px solid rgba(20,20,18,.5)}
#orbnav .ocarrier{position:absolute;inset:0;animation:orbnav-orbit 6.5s linear infinite}
#orbnav .p2 .ocarrier{animation-duration:9s;animation-direction:reverse}
#orbnav .p3 .ocarrier{animation-duration:12s}
#orbnav .oelectron{position:absolute;top:0;left:50%;width:26%;height:26%;object-fit:contain;
  transform:translate(-50%,-50%) rotateX(-68deg)}
@keyframes orbnav-orbit{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){#orbnav .ocarrier{animation:none}}

#orbnav .omenu{position:absolute;bottom:78px;right:0;min-width:288px;padding:8px;
  background:rgba(247,243,232,.86);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);
  border:3px solid #141412;box-shadow:7px 7px 0 rgba(20,20,18,.8);
  opacity:0;visibility:hidden;transform:translateY(8px) scale(.94);transform-origin:bottom right;
  pointer-events:none;transition:opacity .16s ease,transform .16s ease,visibility 0s linear .16s}
#orbnav.open .omenu{opacity:1;visibility:visible;transform:none;pointer-events:auto;transition:opacity .16s ease,transform .16s ease}
#orbnav .oitem{display:flex;align-items:center;gap:12px;padding:10px 12px;text-decoration:none;color:#141412}
#orbnav .oitem + .oitem{border-top:1px solid rgba(20,20,18,.14)}
#orbnav .oitem:hover{background:#141412;color:#F7F3E8}
#orbnav .oicon{width:22px;height:28px;flex:0 0 22px;object-fit:contain}
#orbnav img.oicon{width:24px;height:22px;flex-basis:24px}
#orbnav .olabel{display:block;font-family:'OswaldOrb',sans-serif;text-transform:uppercase;font-size:12.5px;letter-spacing:2.5px;font-weight:700}
#orbnav .osub{display:block;font-family:'DejaVu Sans Mono',Menlo,monospace;text-transform:uppercase;font-size:9.5px;letter-spacing:1.5px;color:#5a564b;margin-top:2px}
#orbnav .oitem:hover .osub{color:rgba(247,243,232,.75)}
#orbnav .oitem.current{box-shadow:inset 3px 0 0 #09B1AB}
@media (max-width:560px){
  #orbnav{right:14px;bottom:14px}
  #orbnav .oball{width:56px;height:56px}
  #orbnav .omenu{min-width:238px;bottom:70px}
}
            `}</style>

            <div className="omenu" id="orbmenu" role="menu">
                {WORLDS.map((w) => (
                    <a
                        key={w.label}
                        className={`oitem${w.current ? " current" : ""}`}
                        role="menuitem"
                        href={w.href}
                        aria-current={w.current ? "page" : undefined}
                    >
                        {w.kind === "heart" ? (
                            <img className="oicon" src={`${P}/gateway/heart.png`} alt="" />
                        ) : (
                            <EggIcon c1={w.c1} c2={w.c2} />
                        )}
                        <span className="otext">
                            <span className="olabel">{w.label}</span>
                            <span className="osub">{w.sub}</span>
                        </span>
                    </a>
                ))}
            </div>

            <button
                className="oball"
                id="orbball"
                type="button"
                aria-haspopup="menu"
                aria-expanded={open}
                aria-controls="orbmenu"
                title="Navigate the worlds"
                onClick={(e) => {
                    e.stopPropagation();
                    setOpen((v) => !v);
                }}
            >
                <span className="onucleus" aria-hidden="true">
                    <img src={`${P}/gateway/orb-heart.png`} alt="" />
                </span>
                {["p1", "p2", "p3"].map((p) => (
                    <span key={p} className={`oplane ${p}`} aria-hidden="true">
                        <span className="oring" />
                        <span className="ocarrier">
                            <img className="oelectron" src={`${P}/gateway/orb-heart.png`} alt="" />
                        </span>
                    </span>
                ))}
                <span className="osheen" aria-hidden="true" />
            </button>
        </nav>
    );
}
