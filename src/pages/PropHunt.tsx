import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function PropHunt() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center bg-background px-4 py-8">
      <header className="flex w-full max-w-2xl items-center justify-between">
        <Button variant="ghost" className="font-fredoka rounded-full" onClick={() => navigate("/")}>
          ← Home
        </Button>
        <h1 className="font-fredoka text-2xl font-bold text-game-pink">Prop Hunt 🔍</h1>
        <div className="w-20" />
      </header>

      <motion.div
        className="mt-20 flex flex-col items-center gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <motion.span
          className="text-7xl"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          🔍
        </motion.span>
        <h2 className="font-fredoka text-xl text-foreground">Find & Say!</h2>
        <p className="max-w-md text-center font-nunito text-muted-foreground">
          Get a secret word, find the object in the scene, and{" "}
          <span className="font-bold text-game-pink">say its name aloud</span>! Play with 2-4 friends in real-time.
        </p>
        <Button size="lg" className="rounded-full bg-game-pink font-fredoka text-lg px-8 text-white hover:bg-game-pink/90">
          🎮 Find a Room
        </Button>
        <p className="font-nunito text-xs text-muted-foreground">
          (Multiplayer rooms coming soon!)
        </p>
      </motion.div>
    </div>
  );
}
