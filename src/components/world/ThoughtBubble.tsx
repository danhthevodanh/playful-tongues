import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ThoughtBubbleProps {
    icon: string;
    hint: string; // e.g. "Bridge?" or "Open?"
    onDismiss: () => void;
    durationMs?: number;
    showTryAgain?: boolean;
}

export function ThoughtBubble({ icon, hint, onDismiss, durationMs = 2500, showTryAgain = false }: ThoughtBubbleProps) {
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        timerRef.current = setTimeout(onDismiss, durationMs);
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [onDismiss, durationMs]);

    return (
        <div className="fixed left-1/2 top-1/3 z-50 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <motion.div
                initial={{ scale: 0.4, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.5, opacity: 0, y: -20 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="flex flex-col items-center gap-1"
            >
                {/* Bubble body */}
                <div className="rounded-3xl bg-white/95 shadow-2xl border-4 border-white px-6 py-4 flex flex-col items-center gap-1">
                    <span className="text-5xl">{icon}</span>
                    <span className="font-fredoka text-xl font-bold text-indigo-700 tracking-wide">{hint}</span>
                    {showTryAgain && <span className="font-fredoka text-xs text-gray-400">Try again!</span>}
                </div>
                {/* Bubble tail dots */}
                <div className="flex flex-col items-center gap-0.5 mt-0.5">
                    <div className="w-4 h-4 rounded-full bg-white/90 shadow" />
                    <div className="w-2.5 h-2.5 rounded-full bg-white/80 shadow" />
                    <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
                </div>
            </motion.div>
        </div>
    );
}
