import React, { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Particle portrait — dots that coalesce to form Durrell's face.
 *
 * Strategy:
 *   - Sample a high-contrast, centered selfie.
 *   - DARK pixels (hair / beard / eyes / face shadow) become the
 *     SOLID, visible particles.
 *   - BRIGHT pixels (wall background) become transparent.
 *   - On mount: particles start scattered, then coalesce into face.
 *   - Hover / move: small magnetic pull near cursor.
 *   - Scroll: scatter back apart.
 */

const VERT = `
  uniform float uTime;
  uniform float uIntro;     // 0 = scattered, 1 = formed
  uniform vec2 uMouse;
  uniform float uScroll;
  uniform sampler2D uTex;

  attribute vec2 aUv;
  attribute float aSize;
  attribute float aOffset;
  attribute vec3 aScatter;  // pre-randomized scattered position

  varying float vDarkness;  // 1 = dark (face), 0 = bright (bg)
  varying float vIntro;

  void main() {
    vec4 tex = texture2D(uTex, aUv);
    float bright = (tex.r * 0.4 + tex.g * 0.4 + tex.b * 0.2);
    // Invert: darkness drives presence.
    float darkness = 1.0 - smoothstep(0.30, 0.78, bright);
    vDarkness = darkness;
    vIntro = uIntro;

    // Target position = grid (drawn from position)
    vec3 target = position;
    // Tiny ambient breathing on the formed face
    float bz = sin(target.x * 0.12 + uTime * 0.6 + aOffset * 6.28) *
               cos(target.y * 0.10 + uTime * 0.5);
    target.z += bz * 1.6 * darkness;

    // Mouse magnetic pull (only when formed)
    vec2 m = uMouse * 22.0;
    float md = distance(target.xy, m);
    float pull = smoothstep(45.0, 0.0, md) * uIntro;
    target.xy += (m - target.xy) * pull * 0.10;
    target.z += pull * 9.0;

    // Scroll-driven scatter (on TOP of intro animation)
    target += aScatter * uScroll * 110.0;

    // Blend from scatter origin → target based on intro progress
    vec3 origin = aScatter * 90.0;
    vec3 pos = mix(origin, target, uIntro);

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;

    // Size — chunky on face, smaller on bg
    float baseSize = mix(0.45, 1.7, darkness);
    gl_PointSize = aSize * baseSize * (300.0 / -mv.z) *
                   (0.55 + uIntro * 0.55);
  }
`;

const FRAG = `
  precision highp float;
  uniform vec3 uColorInk;
  uniform vec3 uColorRust;
  uniform vec3 uColorRose;
  varying float vDarkness;
  varying float vIntro;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    if (d > 0.5) discard;

    // Solid dot with soft edge
    float core = smoothstep(0.5, 0.0, d);

    // Color: darkest pixels → deep ink, mids → rust, light face → rose
    vec3 col = mix(uColorRose, uColorRust, smoothstep(0.20, 0.55, vDarkness));
    col = mix(col, uColorInk, smoothstep(0.55, 0.90, vDarkness));

    // Background pixels: nearly transparent
    float alpha = core * smoothstep(0.05, 0.40, vDarkness);
    // While forming, give scattered dots a faint glow so the
    // coalesce reads visually
    alpha = mix(alpha + 0.10 * core * (1.0 - vIntro), alpha, vIntro * vIntro);

    gl_FragColor = vec4(col, alpha);
  }
`;

export default function ParticleHead({ imgSrc, testid }) {
    const mountRef = useRef(null);

    useEffect(() => {
        const mount = mountRef.current;
        if (!mount) return;

        let width = mount.clientWidth;
        let height = mount.clientHeight;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(
            45,
            width / height,
            0.1,
            1000,
        );
        camera.position.set(0, 0, 95);

        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(width, height);
        renderer.setClearColor(0x000000, 0);
        mount.appendChild(renderer.domElement);
        renderer.domElement.style.pointerEvents = "none";

        // Grid of points
        const COLS = 220;
        const ROWS = 220;
        const PLANE_W = 95;
        const PLANE_H = 95;
        const count = COLS * ROWS;

        const positions = new Float32Array(count * 3);
        const uvs = new Float32Array(count * 2);
        const sizes = new Float32Array(count);
        const offsets = new Float32Array(count);
        const scatters = new Float32Array(count * 3);

        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                const i = y * COLS + x;
                positions[i * 3 + 0] =
                    (x / (COLS - 1) - 0.5) * PLANE_W;
                positions[i * 3 + 1] =
                    (0.5 - y / (ROWS - 1)) * PLANE_H;
                positions[i * 3 + 2] = 0;

                uvs[i * 2 + 0] = x / (COLS - 1);
                uvs[i * 2 + 1] = 1.0 - y / (ROWS - 1);

                sizes[i] = 1.1 + Math.random() * 1.4;
                offsets[i] = Math.random();

                // Random direction + radius for scatter origin
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(Math.random() * 2 - 1);
                const r = 0.6 + Math.random() * 0.8;
                scatters[i * 3 + 0] = Math.sin(phi) * Math.cos(theta) * r;
                scatters[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * r;
                scatters[i * 3 + 2] = Math.cos(phi) * r;
            }
        }

        const geom = new THREE.BufferGeometry();
        geom.setAttribute(
            "position",
            new THREE.BufferAttribute(positions, 3),
        );
        geom.setAttribute("aUv", new THREE.BufferAttribute(uvs, 2));
        geom.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
        geom.setAttribute(
            "aOffset",
            new THREE.BufferAttribute(offsets, 1),
        );
        geom.setAttribute(
            "aScatter",
            new THREE.BufferAttribute(scatters, 3),
        );

        const uniforms = {
            uTime: { value: 0 },
            uIntro: { value: 0 },
            uMouse: { value: new THREE.Vector2(0, 0) },
            uScroll: { value: 0 },
            uTex: { value: null },
            uColorInk: { value: new THREE.Color("#2a1810") },
            uColorRust: { value: new THREE.Color("#c4432c") },
            uColorRose: { value: new THREE.Color("#e8a094") },
        };

        const material = new THREE.ShaderMaterial({
            uniforms,
            vertexShader: VERT,
            fragmentShader: FRAG,
            transparent: true,
            depthWrite: false,
            blending: THREE.NormalBlending,
        });

        const points = new THREE.Points(geom, material);
        // Shift the face to the left half so the right side is free for copy
        points.position.x = -22;
        scene.add(points);

        // Load texture
        const loader = new THREE.TextureLoader();
        loader.crossOrigin = "anonymous";
        let textureReadyAt = null;
        loader.load(imgSrc, (t) => {
            t.minFilter = THREE.LinearFilter;
            t.magFilter = THREE.LinearFilter;
            t.generateMipmaps = false;
            uniforms.uTex.value = t;
            textureReadyAt = performance.now();
        });

        // Input
        const target = { mx: 0, my: 0, scroll: 0 };
        const onMove = (e) => {
            target.mx = (e.clientX / window.innerWidth) * 2 - 1;
            target.my = -((e.clientY / window.innerHeight) * 2 - 1);
        };
        const onScroll = () => {
            const max = window.innerHeight * 0.85;
            target.scroll = Math.min(window.scrollY / max, 1);
        };
        window.addEventListener("mousemove", onMove);
        window.addEventListener("scroll", onScroll, { passive: true });

        const onResize = () => {
            width = mount.clientWidth;
            height = mount.clientHeight;
            renderer.setSize(width, height);
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
        };
        window.addEventListener("resize", onResize);

        // Animate
        const clock = new THREE.Clock();
        let raf;
        const INTRO_MS = 2600;
        const tick = () => {
            const dt = clock.getDelta();
            uniforms.uTime.value += dt;

            // Intro progress, only once texture loaded
            if (textureReadyAt !== null) {
                const elapsed = performance.now() - textureReadyAt;
                const p = Math.min(elapsed / INTRO_MS, 1);
                // ease-out cubic
                const eased = 1 - Math.pow(1 - p, 3);
                uniforms.uIntro.value = eased;
            }

            // smooth mouse + scroll
            uniforms.uMouse.value.x +=
                (target.mx - uniforms.uMouse.value.x) * 0.06;
            uniforms.uMouse.value.y +=
                (target.my - uniforms.uMouse.value.y) * 0.06;
            uniforms.uScroll.value +=
                (target.scroll - uniforms.uScroll.value) * 0.05;

            // Gentle sway
            points.rotation.y =
                Math.sin(uniforms.uTime.value * 0.2) * 0.05;
            points.rotation.x =
                Math.cos(uniforms.uTime.value * 0.17) * 0.03;

            renderer.render(scene, camera);
            raf = requestAnimationFrame(tick);
        };
        tick();

        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("resize", onResize);
            geom.dispose();
            material.dispose();
            if (uniforms.uTex.value) uniforms.uTex.value.dispose();
            renderer.dispose();
            if (renderer.domElement.parentNode === mount) {
                mount.removeChild(renderer.domElement);
            }
        };
    }, [imgSrc]);

    return (
        <div
            ref={mountRef}
            data-testid={testid}
            className="absolute inset-0 w-full h-full"
            style={{ pointerEvents: "none" }}
        />
    );
}
