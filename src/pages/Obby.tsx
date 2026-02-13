import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function Obby() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center bg-background px-4 py-8">
      <header className="flex w-full max-w-2xl items-center justify-between">
        <Button variant="ghost" className="font-fredoka rounded-full" onClick={() => navigate("/")}>
          ← Home
        </Button>
        <h1 className="font-fredoka text-2xl font-bold text-secondary">Voice Obby 🏃</h1>
        <div className="w-20" />
      </header>

      <motion.div
        className="mt-20 flex flex-col items-center gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <motion.span
          className="text-7xl"
          animate={{ y: [0, -15, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          🏃
        </motion.span>
        <h2 className="font-fredoka text-xl text-foreground">Voice-Activated Obstacle Course</h2>
        <p className="max-w-md text-center font-nunito text-muted-foreground">
          Shout <span className="font-bold text-secondary">"Jump!"</span>,{" "}
          <span className="font-bold text-secondary">"Left!"</span>, or{" "}
          <span className="font-bold text-secondary">"Go!"</span> to move your character. Silence means no movement!
        </p>
        <Button size="lg" className="rounded-full bg-secondary font-fredoka text-lg px-8 hover:bg-secondary/90">
          🎤 Start Course
        </Button>
        <p className="font-nunito text-xs text-muted-foreground">
          (Voice commands coming soon!)
        </p>
      </motion.div>
    </div>
  );
}
