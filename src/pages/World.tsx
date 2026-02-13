import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { GameWorld } from "@/components/world/GameWorld";
import { motion } from "framer-motion";

export default function World() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("id, name")
        .eq("auth_id", session.user.id)
        .maybeSingle();

      if (data) {
        setProfile(data);
      } else {
        navigate("/auth");
      }
      setLoading(false);
    }
    loadProfile();
  }, [navigate]);

  if (loading || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="text-4xl">
          🌀
        </motion.div>
      </div>
    );
  }

  return <GameWorld profileId={profile.id} playerName={profile.name} />;
}
