import React, { useRef, useEffect } from "react";
import * as THREE from "three";

/* ============================================================================
   OrbitingWork — a draggable 3D solar system of clickable "facet" planets.
   Adapted from the InteractiveGlobe spec: three.js r128-safe, no OrbitControls.

   Each facet becomes a planet orbiting a central sun. Drag to spin the whole
   system; click a planet to fire onSelect(facet). Auto-rotation pauses while
   the user is interacting and resumes a couple of seconds after release.

   Props:
     facets       : [{ key, label, color, surfaceColor?, patternColor?,
                       pattern?, distance, size, speed? }, ...]
     onSelect     : (facet) => void
     selectedKey  : currently active facet (highlights its orbit ring)
     height       : number (px)  default 520
     config       : visual overrides (see DEFAULTS)
   ========================================================================== */

const DEFAULTS = {
    // Transparent — the canvas lets the page background show through so
    // the planets feel like they're floating in the site, not in a box.
    bgGradient: "transparent",
    borderColor: "transparent",
    sunColor: 0xff8a4a,
    sunCoreColor: 0xffcf99,
    sunSize: 0.55,
    starCount: 0, // no star field against a cream page
    autoTumble: 0.0009,
    orbitRingOpacity: 0.12,
    orbitRingActive: 0.45,
    orbitRingColor: 0x2a1810, // ink — visible against the cream page
    labelColor: "rgba(42, 24, 16, 0.88)", // ink for labels on cream bg
    hintTextColor: "rgba(42, 24, 16, 0.55)",
    hintText: "Drag to spin · click a planet to enter its world",
};

export default function OrbitingWork({
    facets = [],
    onSelect = () => {},
    selectedKey = null,
    focusedKey = null,
    height = 520,
    config = {},
}) {
    const cfg = { ...DEFAULTS, ...config };
    const mountRef = useRef(null);
    const stateRef = useRef({});
    const facetsRef = useRef(facets);
    facetsRef.current = facets;
    const onSelectRef = useRef(onSelect);
    onSelectRef.current = onSelect;
    const selectedKeyRef = useRef(selectedKey);
    selectedKeyRef.current = selectedKey;
    const focusedKeyRef = useRef(focusedKey);
    focusedKeyRef.current = focusedKey;

    useEffect(() => {
        const mount = mountRef.current;
        if (!mount) return;

        let renderer,
            scene,
            camera,
            raf,
            disposed = false;
        const planets = [];
        const orbitRings = [];
        const labels = [];

        const W = mount.clientWidth;
        const H = height;
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
        camera.position.set(0, 4.5, 12);
        camera.lookAt(0, 0, 0);

        renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
        });
        renderer.setSize(W, H);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        mount.appendChild(renderer.domElement);

        // ---- background star field ----
        if (cfg.starCount > 0) {
            const starGeo = new THREE.BufferGeometry();
            const starPos = new Float32Array(cfg.starCount * 3);
            for (let i = 0; i < cfg.starCount; i++) {
                const r = 30 + Math.random() * 20;
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(Math.random() * 2 - 1);
                starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
                starPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
                starPos[i * 3 + 2] = r * Math.cos(phi);
            }
            starGeo.setAttribute(
                "position",
                new THREE.BufferAttribute(starPos, 3),
            );
            const starMat = new THREE.PointsMaterial({
                color: 0xffffff,
                size: 0.05,
                transparent: true,
                opacity: 0.65,
                sizeAttenuation: true,
            });
            scene.add(new THREE.Points(starGeo, starMat));
        }

        // group that rotates on user drag (the whole orbital plane)
        const system = new THREE.Group();
        system.rotation.x = 0.35;
        scene.add(system);

        // ---- sun ----
        // Two billboard sprites with canvas-painted radial gradients —
        // a bright incandescent core that fades smoothly to transparent
        // at its edge, and a wider warm corona that surrounds it. No
        // mesh edges means no thin dark ring where shader halo meets
        // solid sphere; the sun reads as a continuous glow.
        function makeSunCoreTexture() {
            const size = 512;
            const c = document.createElement("canvas");
            c.width = size;
            c.height = size;
            const x = c.getContext("2d");
            x.clearRect(0, 0, size, size);

            // Main radial gradient — white-hot center → pale yellow →
            // orange → fades to transparent at the edge.
            const grad = x.createRadialGradient(
                size / 2,
                size / 2,
                0,
                size / 2,
                size / 2,
                size / 2,
            );
            grad.addColorStop(0.0, "rgba(255, 250, 230, 1)");
            grad.addColorStop(0.18, "rgba(255, 235, 180, 1)");
            grad.addColorStop(0.4, "rgba(255, 195, 120, 1)");
            grad.addColorStop(0.62, "rgba(235, 130, 70, 0.95)");
            grad.addColorStop(0.82, "rgba(196, 67, 44, 0.5)");
            grad.addColorStop(1.0, "rgba(196, 67, 44, 0)");
            x.fillStyle = grad;
            x.fillRect(0, 0, size, size);

            // Subtle surface "granulation" — small bright flecks like
            // photosphere convection cells.
            for (let i = 0; i < 380; i++) {
                const r = Math.sqrt(Math.random()) * (size * 0.36);
                const a = Math.random() * Math.PI * 2;
                const cx = size / 2 + Math.cos(a) * r;
                const cy = size / 2 + Math.sin(a) * r;
                x.fillStyle = `rgba(255, 230, 170, ${0.05 + Math.random() * 0.1})`;
                x.fillRect(cx, cy, 2, 2);
            }
            return new THREE.CanvasTexture(c);
        }

        function makeSunCoronaTexture() {
            const size = 512;
            const c = document.createElement("canvas");
            c.width = size;
            c.height = size;
            const x = c.getContext("2d");
            x.clearRect(0, 0, size, size);
            const grad = x.createRadialGradient(
                size / 2,
                size / 2,
                size * 0.12,
                size / 2,
                size / 2,
                size / 2,
            );
            grad.addColorStop(0.0, "rgba(255, 180, 110, 0.55)");
            grad.addColorStop(0.4, "rgba(232, 110, 60, 0.25)");
            grad.addColorStop(0.75, "rgba(196, 67, 44, 0.08)");
            grad.addColorStop(1.0, "rgba(196, 67, 44, 0)");
            x.fillStyle = grad;
            x.fillRect(0, 0, size, size);
            return new THREE.CanvasTexture(c);
        }

        const sun = new THREE.Sprite(
            new THREE.SpriteMaterial({
                map: makeSunCoreTexture(),
                transparent: true,
                depthWrite: false,
                depthTest: false,
                blending: THREE.NormalBlending,
            }),
        );
        sun.scale.set(cfg.sunSize * 2.6, cfg.sunSize * 2.6, 1);
        sun.renderOrder = 2;
        system.add(sun);

        const sunCorona = new THREE.Sprite(
            new THREE.SpriteMaterial({
                map: makeSunCoronaTexture(),
                transparent: true,
                depthWrite: false,
                depthTest: false,
                blending: THREE.AdditiveBlending,
            }),
        );
        sunCorona.scale.set(cfg.sunSize * 6.5, cfg.sunSize * 6.5, 1);
        sunCorona.renderOrder = 1;
        system.add(sunCorona);

        // ---- lights ----
        // Bumped ambient so the dark sides of planets stay readable
        // against the cream page background (no more silhouettes).
        scene.add(new THREE.AmbientLight(0xfff1d6, 0.95));
        const sunLight = new THREE.PointLight(0xffd7a6, 1.6, 60);
        sunLight.position.set(0, 0, 0);
        system.add(sunLight);
        const fill = new THREE.DirectionalLight(0xffffff, 0.35);
        fill.position.set(-6, 4, 6);
        scene.add(fill);

        // ---- planet texture factory ----
        function makePlanetTexture(facet) {
            const c = document.createElement("canvas");
            c.width = 512;
            c.height = 512;
            const x = c.getContext("2d");

            // base fill
            x.fillStyle = facet.surfaceColor || facet.color || "#444";
            x.fillRect(0, 0, 512, 512);

            // soft inner gradient for depth
            const grad = x.createRadialGradient(
                240,
                200,
                40,
                256,
                256,
                360,
            );
            grad.addColorStop(0, "rgba(255,255,255,0.18)");
            grad.addColorStop(1, "rgba(0,0,0,0.45)");
            x.fillStyle = grad;
            x.fillRect(0, 0, 512, 512);

            const stroke = facet.patternColor || "rgba(255,255,255,0.22)";

            if (facet.pattern === "strokes") {
                // painterly marks
                x.strokeStyle = stroke;
                x.lineCap = "round";
                for (let i = 0; i < 90; i++) {
                    x.save();
                    x.translate(Math.random() * 512, Math.random() * 512);
                    x.rotate(Math.random() * Math.PI);
                    x.lineWidth = 2 + Math.random() * 5;
                    x.beginPath();
                    x.moveTo(-40 - Math.random() * 30, 0);
                    x.lineTo(40 + Math.random() * 30, 0);
                    x.stroke();
                    x.restore();
                }
                // a few darker accent splats
                x.fillStyle = "rgba(0,0,0,0.35)";
                for (let i = 0; i < 18; i++) {
                    x.beginPath();
                    x.ellipse(
                        Math.random() * 512,
                        Math.random() * 512,
                        6 + Math.random() * 18,
                        4 + Math.random() * 10,
                        Math.random() * Math.PI,
                        0,
                        Math.PI * 2,
                    );
                    x.fill();
                }
            } else if (facet.pattern === "grid") {
                // wireframe / blueprint
                x.strokeStyle = stroke;
                x.lineWidth = 1;
                for (let i = 0; i <= 512; i += 28) {
                    x.beginPath();
                    x.moveTo(i, 0);
                    x.lineTo(i, 512);
                    x.stroke();
                    x.beginPath();
                    x.moveTo(0, i);
                    x.lineTo(512, i);
                    x.stroke();
                }
                // ui chrome accents
                x.strokeStyle = "rgba(255,255,255,0.55)";
                x.lineWidth = 2;
                for (let i = 0; i < 10; i++) {
                    const px = Math.random() * 480;
                    const py = Math.random() * 480;
                    const pw = 30 + Math.random() * 80;
                    const ph = 16 + Math.random() * 30;
                    x.strokeRect(px, py, pw, ph);
                }
            } else if (facet.pattern === "waves") {
                // sound waves / strings
                x.strokeStyle = stroke;
                x.lineWidth = 1.6;
                for (let y = 20; y < 512; y += 22) {
                    x.beginPath();
                    for (let xx = 0; xx <= 512; xx += 6) {
                        const yy =
                            y +
                            Math.sin(xx * 0.05 + y * 0.13) *
                                (4 + (y % 60) * 0.12);
                        if (xx === 0) x.moveTo(xx, yy);
                        else x.lineTo(xx, yy);
                    }
                    x.stroke();
                }
                // a couple of brighter "string" lines
                x.strokeStyle = "rgba(255,255,255,0.5)";
                x.lineWidth = 2.5;
                for (let k = 0; k < 3; k++) {
                    const ly = 100 + k * 160;
                    x.beginPath();
                    x.moveTo(0, ly);
                    x.lineTo(512, ly);
                    x.stroke();
                }
            }

            // speckle noise to break up flatness
            x.fillStyle = "rgba(0,0,0,0.22)";
            for (let i = 0; i < 1400; i++) {
                x.fillRect(
                    Math.random() * 512,
                    Math.random() * 512,
                    2,
                    2,
                );
            }
            const tex = new THREE.CanvasTexture(c);
            tex.anisotropy = 4;
            return tex;
        }

        // ---- label sprite factory ----
        function makeLabelSprite(text) {
            const c = document.createElement("canvas");
            c.width = 512;
            c.height = 128;
            const x = c.getContext("2d");
            x.clearRect(0, 0, 512, 128);
            x.font =
                "600 38px 'JetBrains Mono', ui-monospace, monospace";
            x.fillStyle = cfg.labelColor;
            x.textAlign = "center";
            x.textBaseline = "middle";
            // Soft cream glow so labels stay readable when they pass
            // in front of dark planet textures.
            x.shadowColor = "rgba(249, 239, 222, 0.95)";
            x.shadowBlur = 14;
            x.fillText(text.toUpperCase(), 256, 64);
            const tex = new THREE.CanvasTexture(c);
            const mat = new THREE.SpriteMaterial({
                map: tex,
                transparent: true,
                depthWrite: false,
            });
            const sprite = new THREE.Sprite(mat);
            sprite.scale.set(2.1, 0.52, 1);
            return sprite;
        }

        // ---- build planets ----
        facetsRef.current.forEach((f, idx) => {
            const tex = makePlanetTexture(f);
            const mat = new THREE.MeshPhongMaterial({
                map: tex,
                shininess: 22,
                specular: 0x222222,
                transparent: true, // enables fade when out of focus
                opacity: 1.0,
            });
            const geom = new THREE.SphereGeometry(
                f.size || 0.5,
                48,
                48,
            );
            const planet = new THREE.Mesh(geom, mat);

            // Initial angle: prefer the facet's real-time orbital phase,
            // fall back to an even spread if none provided.
            const initAngle =
                typeof f.initialAngle === "number"
                    ? f.initialAngle
                    : (idx /
                          Math.max(1, facetsRef.current.length)) *
                      Math.PI *
                      2;

            // Angular velocity (rad/s): derived from on-screen period
            // (animPeriodSec) so planets keep their real-world ratios.
            // Legacy `speed` field still supported for callers that
            // haven't migrated.
            const angVel = f.animPeriodSec
                ? (2 * Math.PI) / f.animPeriodSec
                : ((f.speed || 0.22 + idx * 0.04) * Math.PI) / 6;

            planet.userData = {
                facet: f,
                angle: initAngle,
                distance: f.distance,
                angVel,
                spin: 0.4 + idx * 0.15, // self-rotation rad/s
            };
            system.add(planet);
            planets.push(planet);

            // orbit ring
            const ringGeo = new THREE.RingGeometry(
                f.distance - 0.015,
                f.distance + 0.015,
                128,
            );
            const ringMat = new THREE.MeshBasicMaterial({
                color: cfg.orbitRingColor,
                transparent: true,
                opacity: cfg.orbitRingOpacity,
                side: THREE.DoubleSide,
            });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.rotation.x = -Math.PI / 2;
            ring.userData = { facetKey: f.key };
            system.add(ring);
            orbitRings.push(ring);

            // label sprite (added to scene root so it isn't squashed by tilt)
            const label = makeLabelSprite(f.label);
            scene.add(label);
            labels.push({ sprite: label, planet });
            planet.userData.label = label;
        });

        // ---- interaction (custom drag + click pick) ----
        const s = stateRef.current;
        s.rotX = 0.35;
        s.rotY = 0;
        s.tz = 12;
        s.auto = true;
        let drag = false,
            lx = 0,
            ly = 0,
            moved = 0;
        const ray = new THREE.Raycaster();
        const m = new THREE.Vector2();

        function down(e) {
            drag = true;
            moved = 0;
            const t = e.touches ? e.touches[0] : e;
            lx = t.clientX;
            ly = t.clientY;
            s.auto = false;
        }
        function move(e) {
            if (!drag) return;
            const t = e.touches ? e.touches[0] : e;
            const dx = t.clientX - lx,
                dy = t.clientY - ly;
            moved += Math.abs(dx) + Math.abs(dy);
            s.rotY += dx * 0.005;
            s.rotX = Math.max(
                -1.1,
                Math.min(1.2, s.rotX + dy * 0.005),
            );
            lx = t.clientX;
            ly = t.clientY;
        }
        function up(e) {
            if (!drag) return;
            drag = false;
            if (moved < 6) pick(e);
            setTimeout(() => {
                s.auto = true;
            }, 2500);
        }
        function pick(e) {
            const r = renderer.domElement.getBoundingClientRect();
            const t = e.changedTouches ? e.changedTouches[0] : e;
            m.x = ((t.clientX - r.left) / r.width) * 2 - 1;
            m.y = -((t.clientY - r.top) / r.height) * 2 + 1;
            ray.setFromCamera(m, camera);
            const hit = ray.intersectObjects(planets);
            if (hit.length) {
                const planet = hit[0].object;
                onSelectRef.current(planet.userData.facet);
                // The parent component decides whether to set focusedKey;
                // when it does, the animation loop reads it and zooms in.
            }
        }

        const el = renderer.domElement;
        el.style.cursor = "grab";
        el.addEventListener("mousedown", down);
        window.addEventListener("mousemove", move);
        window.addEventListener("mouseup", up);
        el.addEventListener("touchstart", down, { passive: true });
        el.addEventListener("touchmove", move, { passive: true });
        el.addEventListener("touchend", up);

        const clock = new THREE.Clock();
        let tElapsed = 0;
        function anim() {
            if (disposed) return;
            raf = requestAnimationFrame(anim);
            // dt clamped so background-tab catch-up doesn't fling planets
            const dt = Math.min(clock.getDelta(), 0.1);
            tElapsed += dt;

            const focusKey = focusedKeyRef.current;
            const selKey = selectedKeyRef.current;
            const isFocused = !!focusKey;

            if (s.auto && !drag && !isFocused) s.rotY += cfg.autoTumble;

            // tumble the whole orbital plane based on user drag + auto yaw
            system.rotation.x = s.rotX;
            system.rotation.y = s.rotY;

            // ease camera distance — closer when a planet is focused
            const targetTz = isFocused ? 7.5 : s.tz;
            camera.position.z +=
                (targetTz - camera.position.z) * 0.06;

            // sun + corona pulse — the corona breathes slightly slower
            // and at a larger amplitude than the core, so the glow looks
            // alive without making the disc itself feel rubbery.
            const corePulse = 0.92 + Math.sin(tElapsed * 2.7) * 0.08;
            const coronaPulse =
                0.94 + Math.sin(tElapsed * 1.6 + 0.6) * 0.12;
            sun.scale.set(
                cfg.sunSize * 2.6 * corePulse,
                cfg.sunSize * 2.6 * corePulse,
                1,
            );
            sunCorona.scale.set(
                cfg.sunSize * 6.5 * coronaPulse,
                cfg.sunSize * 6.5 * coronaPulse,
                1,
            );

            // orbits + self-rotation + labels
            planets.forEach((p) => {
                const u = p.userData;
                // Freeze orbital motion when any planet is focused so the
                // user can study the scene without it drifting.
                if (!isFocused) {
                    u.angle += u.angVel * dt;
                }
                // Counter-clockwise when viewed from +Y (matches real
                // solar system convention from north of the ecliptic).
                p.position.x = Math.cos(u.angle) * u.distance;
                p.position.z = -Math.sin(u.angle) * u.distance;
                p.position.y = 0;
                p.rotation.y += u.spin * dt;

                const isThisFocused = focusKey === u.facet.key;
                const isSelected = selKey === u.facet.key;

                // Scale: focused planet enlarges, others stay normal.
                let targetScale = 1;
                if (isThisFocused) {
                    targetScale = 1.6 + Math.sin(tElapsed * 5) * 0.04;
                } else if (isSelected) {
                    targetScale = 1 + Math.sin(tElapsed * 6) * 0.04;
                }
                const cur = p.scale.x;
                p.scale.setScalar(cur + (targetScale - cur) * 0.1);

                // Opacity: dim non-focused planets during focus mode.
                const targetOpacity =
                    isFocused && !isThisFocused ? 0.28 : 1.0;
                p.material.opacity +=
                    (targetOpacity - p.material.opacity) * 0.08;

                // label opacity tracks planet opacity, brighter on focus
                if (u.label) {
                    const lblTarget = isFocused
                        ? isThisFocused
                            ? 1
                            : 0.18
                        : 1;
                    u.label.material.opacity +=
                        (lblTarget - u.label.material.opacity) * 0.08;
                    const worldPos = p.getWorldPosition(
                        new THREE.Vector3(),
                    );
                    u.label.position.set(
                        worldPos.x,
                        worldPos.y +
                            (u.facet.size || 0.5) *
                                p.scale.x +
                            0.55,
                        worldPos.z,
                    );
                }
            });

            // orbit ring opacities
            orbitRings.forEach((ring) => {
                const isThisFocused = ring.userData.facetKey === focusKey;
                const isThisSelected =
                    ring.userData.facetKey === selKey;
                let targetOp;
                if (isFocused) {
                    targetOp = isThisFocused
                        ? cfg.orbitRingActive
                        : cfg.orbitRingOpacity * 0.3;
                } else if (isThisSelected) {
                    targetOp = cfg.orbitRingActive;
                } else {
                    targetOp = cfg.orbitRingOpacity;
                }
                ring.material.opacity +=
                    (targetOp - ring.material.opacity) * 0.08;
            });

            renderer.render(scene, camera);
        }
        anim();

        function onResize() {
            const w = mount.clientWidth;
            camera.aspect = w / H;
            camera.updateProjectionMatrix();
            renderer.setSize(w, H);
        }
        window.addEventListener("resize", onResize);

        s.reset = () => {
            s.tz = 12;
            s.rotX = 0.35;
            s.rotY = 0;
        };

        return () => {
            disposed = true;
            el.removeEventListener("mousedown", down);
            window.removeEventListener("mousemove", move);
            window.removeEventListener("mouseup", up);
            el.removeEventListener("touchstart", down);
            el.removeEventListener("touchmove", move);
            el.removeEventListener("touchend", up);
            window.removeEventListener("resize", onResize);
            if (raf) cancelAnimationFrame(raf);
            // dispose geometries / materials / textures
            planets.forEach((p) => {
                p.geometry.dispose();
                if (p.material.map) p.material.map.dispose();
                p.material.dispose();
            });
            orbitRings.forEach((r) => {
                r.geometry.dispose();
                r.material.dispose();
            });
            labels.forEach(({ sprite }) => {
                if (sprite.material.map) sprite.material.map.dispose();
                sprite.material.dispose();
            });
            renderer.dispose();
            if (renderer.domElement.parentNode === mount)
                mount.removeChild(renderer.domElement);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [height]);

    return (
        <div className="relative">
            <div
                ref={mountRef}
                style={{
                    width: "100%",
                    height,
                    overflow: "hidden",
                    background: cfg.bgGradient,
                    cursor: "grab",
                    border:
                        cfg.borderColor === "transparent"
                            ? "none"
                            : `1px solid ${cfg.borderColor}`,
                }}
            />
            {cfg.hintText && (
                <div
                    className="pointer-events-none absolute top-4 left-5 font-mono text-[10px] uppercase tracking-[0.22em]"
                    style={{ color: cfg.hintTextColor }}
                >
                    {cfg.hintText}
                </div>
            )}
            <button
                type="button"
                onClick={() =>
                    stateRef.current.reset && stateRef.current.reset()
                }
                className="absolute top-3 right-3 px-3 py-1.5 rounded-md bg-ink/5 text-ink border border-ink/15 hover:bg-ink/10 transition-colors font-mono text-[10px] uppercase tracking-[0.22em]"
            >
                Reset view
            </button>
        </div>
    );
}
