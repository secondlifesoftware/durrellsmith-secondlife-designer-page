import React, { useState, useEffect } from "react";
import { HEART } from "@/constants/testIds";

export default function HeartCounter() {
    const [count, setCount] = useState(2735);
    const [liked, setLiked] = useState(false);
    const [bursts, setBursts] = useState([]);

    useEffect(() => {
        // organic background growth so the counter feels alive
        const t = setInterval(() => {
            if (Math.random() > 0.6) setCount((c) => c + 1);
        }, 3500);
        return () => clearInterval(t);
    }, []);

    const click = () => {
        setCount((c) => c + 1);
        setLiked(true);
        const id = Date.now() + Math.random();
        setBursts((b) => [...b, id]);
        setTimeout(
            () => setBursts((b) => b.filter((x) => x !== id)),
            900,
        );
    };

    return (
        <button
            type="button"
            data-testid={HEART.button}
            onClick={click}
            /* Bottom-LEFT: OrbNav owns the bottom-right corner on every DASH
               Creatives page, and this used to sit directly underneath it. */
            className="fixed bottom-6 left-6 md:bottom-8 md:left-8 z-40 flex items-center gap-2.5 px-4 py-3 rounded-full bg-cream/85 backdrop-blur-xl border border-ink/10 shadow-[0_8px_32px_rgba(42,24,16,0.12)] hover:scale-105 active:scale-95 transition-transform"
        >
            <span className="relative inline-flex w-5 h-5 items-center justify-center">
                <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill={liked ? "#C4432C" : "none"}
                    stroke="#C4432C"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-all"
                >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                {bursts.map((id) => (
                    <span
                        key={id}
                        className="absolute inset-0 heart-burst pointer-events-none text-rust"
                    >
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="#C4432C"
                        >
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                    </span>
                ))}
            </span>
            <span
                data-testid={HEART.count}
                className="font-mono text-xs text-ink tabular-nums"
            >
                {count.toLocaleString()}
            </span>
        </button>
    );
}
