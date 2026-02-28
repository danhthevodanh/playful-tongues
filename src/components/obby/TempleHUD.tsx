import { motion, AnimatePresence } from "framer-motion";

interface TempleHUDProps {
  bridgeAligned: boolean;
  objectsTidied: number;
  guardianPassed: boolean;
  allComplete: boolean;
  isListening: boolean;
  transcript: string;
  focusedObjectName: string | null;
  screenShake: boolean;
}

export function TempleHUD({
  bridgeAligned, objectsTidied, guardianPassed, allComplete,
  isListening, transcript, focusedObjectName, screenShake,
}: TempleHUDProps) {
  return (
    <div className={`pointer-events-none absolute inset-0 z-10 ${screenShake ? "animate-wiggle" : ""}`}>
      {/* Title */}
      <motion.div
        className="absolute top-4 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h1 className="font-fredoka text-2xl font-bold text-accent drop-shadow-lg md:text-3xl">
          🏛️ The Forgotten Temple of Order
        </h1>
      </motion.div>

      {/* Quest tracker */}
      <div className="absolute top-16 left-4 flex flex-col gap-2">
        <QuestItem done={bridgeAligned} label="Align the broken bridge" icon="🌉" />
        <QuestItem done={objectsTidied >= 3} label={`Tidy the temple (${objectsTidied}/3)`} icon="🧹" />
        <QuestItem done={guardianPassed} label="Greet the Guardian" icon="🗿" />
      </div>

      {/* Voice indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        {isListening ? (
          <motion.div
            className="rounded-full bg-destructive/80 px-6 py-2 backdrop-blur-sm"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          >
            <span className="font-fredoka text-sm text-destructive-foreground">🎤 Listening...</span>
          </motion.div>
        ) : (
          <div className="rounded-full bg-muted/80 px-6 py-2 backdrop-blur-sm">
            <span className="font-fredoka text-sm text-muted-foreground">Hold V to speak</span>
          </div>
        )}

        {transcript && (
          <motion.div
            className="max-w-md rounded-lg bg-card/80 px-4 py-1 text-center backdrop-blur-sm"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="font-nunito text-sm text-card-foreground">"{transcript}"</span>
          </motion.div>
        )}

        {focusedObjectName && (
          <div className="rounded-lg bg-accent/80 px-4 py-1 backdrop-blur-sm">
            <span className="font-fredoka text-xs text-accent-foreground">
              Focused: {focusedObjectName}
            </span>
          </div>
        )}
      </div>

      {/* Completion banner */}
      <AnimatePresence>
        {allComplete && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <motion.div
              className="rounded-2xl bg-accent/90 px-12 py-8 text-center shadow-2xl backdrop-blur-md"
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <span className="text-5xl">✨</span>
              <h2 className="font-fredoka text-3xl font-bold text-accent-foreground mt-2">
                Temple Restored!
              </h2>
              <p className="font-nunito text-accent-foreground/80 mt-1">
                Order has been brought to the Forgotten Temple
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function QuestItem({ done, label, icon }: { done: boolean; label: string; icon: string }) {
  return (
    <motion.div
      className={`flex items-center gap-2 rounded-lg px-3 py-1.5 backdrop-blur-sm ${
        done ? "bg-game-green/20" : "bg-card/60"
      }`}
      animate={done ? { scale: [1, 1.1, 1] } : {}}
    >
      <span className="text-lg">{done ? "✅" : icon}</span>
      <span className={`font-fredoka text-sm ${done ? "text-game-green line-through" : "text-card-foreground"}`}>
        {label}
      </span>
    </motion.div>
  );
}
