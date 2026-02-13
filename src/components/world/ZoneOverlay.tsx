import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { PetActivity } from "@/components/activities/PetActivity";

interface ZoneOverlayProps {
  zoneId: string | null;
  zoneName: string;
  onClose: () => void;
}

function ZoneContent({ zoneId }: { zoneId: string }) {
  switch (zoneId) {
    case "pet":
      return <PetActivity />;
    case "obby":
      return (
        <div className="flex flex-col items-center gap-4 py-8">
          <motion.span className="text-6xl" animate={{ y: [0, -15, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>🏃</motion.span>
          <h2 className="font-fredoka text-xl text-foreground">Voice Obby</h2>
          <p className="font-nunito text-muted-foreground text-center max-w-sm">
            Shout <span className="font-bold text-secondary">"Jump!"</span>, <span className="font-bold text-secondary">"Left!"</span>, or <span className="font-bold text-secondary">"Go!"</span> to move!
          </p>
          <p className="font-nunito text-xs text-muted-foreground">🚧 Coming soon!</p>
        </div>
      );
    case "npc":
      return (
        <div className="flex flex-col items-center gap-4 py-8">
          <motion.span className="text-6xl" animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 3, repeat: Infinity }}>🧙‍♂️</motion.span>
          <h2 className="font-fredoka text-xl text-foreground">Magic NPC</h2>
          <p className="font-nunito text-muted-foreground text-center max-w-sm">
            Chat with the friendly traveler and their <span className="font-bold text-accent">Magic Sketchbook</span>!
          </p>
          <p className="font-nunito text-xs text-muted-foreground">🚧 Coming soon!</p>
        </div>
      );
    case "prop-hunt":
      return (
        <div className="flex flex-col items-center gap-4 py-8">
          <motion.span className="text-6xl" animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>🔍</motion.span>
          <h2 className="font-fredoka text-xl text-foreground">Prop Hunt</h2>
          <p className="font-nunito text-muted-foreground text-center max-w-sm">
            Find objects and <span className="font-bold text-[hsl(var(--game-pink))]">say their names</span> with friends!
          </p>
          <p className="font-nunito text-xs text-muted-foreground">🚧 Coming soon!</p>
        </div>
      );
    default:
      return null;
  }
}

export function ZoneOverlay({ zoneId, zoneName, onClose }: ZoneOverlayProps) {
  return (
    <AnimatePresence>
      {zoneId && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="relative mx-4 w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-3xl bg-background p-6 shadow-2xl border border-border"
            initial={{ scale: 0.8, y: 40 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 40 }}
            transition={{ type: "spring", damping: 20 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h1 className="font-fredoka text-2xl font-bold text-primary">{zoneName}</h1>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                onClick={onClose}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <ZoneContent zoneId={zoneId} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
