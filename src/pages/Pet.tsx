import { BlobPet } from "@/components/BlobPet";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function Pet() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center bg-background px-4 py-8">
      <header className="flex w-full max-w-2xl items-center justify-between">
        <Button variant="ghost" className="font-fredoka rounded-full" onClick={() => navigate("/")}>
          ← Home
        </Button>
        <h1 className="font-fredoka text-2xl font-bold text-primary">My Pet 🐾</h1>
        <div className="w-20" />
      </header>

      <motion.div
        className="mt-12"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", delay: 0.2 }}
      >
        <BlobPet evolutionStage={0} wordsSpoken={0} size="lg" />
      </motion.div>

      <motion.div
        className="mt-8 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <h2 className="font-fredoka text-xl text-foreground">Blob</h2>
        <p className="mt-2 font-nunito text-muted-foreground">
          Words spoken: <span className="font-bold text-primary">0</span>
        </p>
        <p className="mt-1 font-nunito text-sm text-muted-foreground">
          Stage: <span className="font-bold">Blob</span> — Keep talking to evolve!
        </p>
      </motion.div>

      <motion.div
        className="mt-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        <Button size="lg" className="rounded-full font-fredoka text-lg px-8">
          🎤 Start Talking
        </Button>
        <p className="mt-3 text-center font-nunito text-xs text-muted-foreground">
          (Voice features coming soon with ElevenLabs!)
        </p>
      </motion.div>
    </div>
  );
}
