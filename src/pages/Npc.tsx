import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function Npc() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center bg-background px-4 py-8">
      <header className="flex w-full max-w-2xl items-center justify-between">
        <Button variant="ghost" className="font-fredoka rounded-full" onClick={() => navigate("/")}>
          ← Home
        </Button>
        <h1 className="font-fredoka text-2xl font-bold text-accent">Magic NPC 🗣️</h1>
        <div className="w-20" />
      </header>

      <motion.div
        className="mt-20 flex flex-col items-center gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <motion.span
          className="text-7xl"
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          🧙‍♂️
        </motion.span>
        <h2 className="font-fredoka text-xl text-foreground">The Foreign Traveler</h2>
        <p className="max-w-md text-center font-nunito text-muted-foreground">
          Meet a friendly traveler who's also learning! Speak and they'll show you their{" "}
          <span className="font-bold text-accent">Magic Sketchbook</span> with pictures to help you both understand.
        </p>
        <Button size="lg" className="rounded-full bg-accent font-fredoka text-lg px-8 text-accent-foreground hover:bg-accent/90">
          🗣️ Start Chatting
        </Button>
        <p className="font-nunito text-xs text-muted-foreground">
          (NPC conversation coming soon!)
        </p>
      </motion.div>
    </div>
  );
}
