import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

interface ZonePromptProps {
  zoneName: string;
  zoneIcon: string;
  visible: boolean;
  onEnter: () => void;
}

export function ZonePrompt({ zoneName, zoneIcon, visible, onEnter }: ZonePromptProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed bottom-8 left-1/2 z-40 -translate-x-1/2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
        >
          <Button
            size="lg"
            className="rounded-full font-fredoka text-lg px-8 shadow-xl"
            onClick={onEnter}
          >
            {zoneIcon} Enter {zoneName}
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
