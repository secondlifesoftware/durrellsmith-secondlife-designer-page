import React, { Suspense, lazy } from "react";
import { HERO } from "@/constants/testIds";

const ParticleHead = lazy(() => import("./ParticleHead"));

export default function Hero() {
    return (
        <section
            id="top"
            className="relative min-h-screen w-full overflow-hidden"
        >
            {/* WebGL particle portrait */}
            <Suspense fallback={null}>
                <ParticleHead
                    imgSrc="/img/durrell.jpg"
                    testid={HERO.canvas}
                />
            </Suspense>

            {/* Top-left meta */}
            <div className="absolute top-28 left-6 md:left-12 z-10 font-mono text-[10px] uppercase tracking-[0.25em] text-ink-soft">
                <div>(01) — Portfolio / 2026</div>
                <div className="mt-2 text-rust">
                    ● Currently designing
                </div>
            </div>

            {/* Top-right meta */}
            <div className="absolute top-28 right-6 md:right-12 z-10 text-right font-mono text-[10px] uppercase tracking-[0.25em] text-ink-soft">
                <div>N 33.749° / W 84.388°</div>
                <div className="mt-2">Atlanta, GA</div>
            </div>

            {/* Main typographic block — right column only, sized to avoid the face */}
            <div className="relative z-10 max-w-screen-2xl mx-auto px-6 md:px-12 pt-[36vh] md:pt-[28vh] pb-32 grid grid-cols-12 gap-6">
                <div className="col-span-12 md:col-start-8 md:col-span-5 text-right">
                    <h1
                        data-testid={HERO.title}
                        className="font-serif font-light text-ink leading-[0.95] tracking-tight"
                        style={{
                            fontSize: "clamp(2.25rem, 4.4vw, 4.75rem)",
                        }}
                    >
                        <span className="block italic font-normal text-rust-deep">
                            Designing
                        </span>
                        <span className="block">content that</span>
                        <span className="block">
                            connects<span className="text-rust">.</span>
                        </span>
                    </h1>

                    <div className="mt-10 flex flex-col items-end gap-5">
                        <div>
                            <div
                                data-testid={HERO.name}
                                className="font-serif text-xl md:text-2xl text-ink"
                            >
                                Durrell Smith
                            </div>
                            <div
                                data-testid={HERO.role}
                                className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-soft mt-1"
                            >
                                Designer — Second Life Software
                            </div>
                        </div>

                        <p
                            data-testid={HERO.subtitle}
                            className="font-sans text-xs md:text-sm text-ink max-w-xs leading-relaxed bg-cream/70 backdrop-blur-[2px] px-3.5 py-2.5 rounded-sm border border-ink/5"
                        >
                            Crafting interfaces, identities and moving
                            images for creators, engineers and founders
                            — swapping wands for nodes since '19.
                        </p>
                    </div>
                </div>
            </div>

            {/* Scroll cue */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-ink-soft">
                <span>Scroll</span>
                <span className="w-px h-10 bg-ink/30 overflow-hidden relative">
                    <span className="absolute inset-0 bg-rust animate-marquee" />
                </span>
            </div>
        </section>
    );
}
