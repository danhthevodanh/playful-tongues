import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GameWorld3D } from "@/components/world/GameWorld3D";
import { motion } from "framer-motion";
import { meritStore } from "@/stores/useMeritStore";

export default function World() {
  const [profile, setProfile] = useState<{ id: string; name: string }>({ id: "guest", name: "Explorer" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase
          .from("profiles")
          .select("id, name")
          .eq("auth_id", session.user.id)
          .maybeSingle();
        if (data) {
          setProfile(data);
          meritStore.loadFromProfile(data.id);
        }
      }
      setLoading(false);
    }
    loadProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="text-4xl">
          🌀
        </motion.div>
      </div>
    );
  }

  return <GameWorld3D profileId={profile.id} playerName={profile.name} />;
}
