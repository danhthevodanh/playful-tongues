import { motion } from "framer-motion";
import { BlobPet } from "@/components/BlobPet";
import { GamePortal } from "@/components/GamePortal";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const PORTALS = [
  {
    title: "Living Pet",
    description: "Grow your creature by speaking!",
    icon: "🐾",
    color: "hsl(260, 67%, 55%)",
    to: "/world?zone=pet",
  },
  {
    title: "Voice Obby",
    description: "Shout to jump & run!",
    icon: "🏃",
    color: "hsl(170, 60%, 50%)",
    to: "/world?zone=obby",
  },
  {
    title: "Magic NPC",
    description: "Chat with a curious traveler",
    icon: "🗣️",
    color: "hsl(35, 95%, 58%)",
    to: "/world?zone=npc",
  },
  {
    title: "Prop Hunt",
    description: "Find & say objects with friends!",
    icon: "🔍",
    color: "hsl(330, 80%, 60%)",
    to: "/world?zone=prop-hunt",
  },
];

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="text-4xl"
        >
          🌀
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4">
        <motion.h1
          className="font-fredoka text-3xl font-bold text-primary md:text-4xl"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          SpeakWorld 🌍
        </motion.h1>
        {user ? (
          <Button
            variant="outline"
            className="font-fredoka rounded-full"
            onClick={async () => {
              await supabase.auth.signOut();
              navigate("/");
            }}
          >
            Sign Out
          </Button>
        ) : (
          <Button
            className="font-fredoka rounded-full"
            onClick={() => navigate("/auth")}
          >
            Parent Login
          </Button>
        )}
      </header>

      {/* Hero */}
      <main className="flex flex-col items-center px-4 pt-6 pb-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
        >
          <BlobPet evolutionStage={0} wordsSpoken={0} size="lg" />
        </motion.div>

        <motion.p
          className="mt-4 max-w-md text-center font-nunito text-lg text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Speak English to power your world! Your pet grows every time you talk. 🎤
        </motion.p>

        {user && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <Button
              size="lg"
              className="mt-4 rounded-full font-fredoka text-lg px-10 bg-secondary hover:bg-secondary/90"
              onClick={() => navigate("/world")}
            >
              🌍 Enter World
            </Button>
          </motion.div>
        )}

        {/* Game Portals */}
        <div className="mt-10 grid w-full max-w-2xl grid-cols-2 gap-4 px-2 md:gap-6">
          {PORTALS.map((portal, i) => (
            <GamePortal key={portal.title} {...portal} delay={0.3 + i * 0.1} />
          ))}
        </div>

        {!user && (
          <motion.div
            className="mt-10 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <p className="mb-3 font-nunito text-muted-foreground">
              Parents: Sign up to save your child's progress!
            </p>
            <Button
              size="lg"
              className="font-fredoka rounded-full text-lg px-8"
              onClick={() => navigate("/auth")}
            >
              Get Started 🚀
            </Button>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default Index;
