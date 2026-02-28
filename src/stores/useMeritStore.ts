import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { checkMilestone } from "@/lib/milestones";
import { toast } from "sonner";

interface MeritState {
  meritPoints: number;
  ecoVitality: number;
  profileId: string | null;
  loaded: boolean;
  glowing: boolean;
}

type Listener = () => void;

function createMeritStore() {
  let state: MeritState = {
    meritPoints: 0,
    ecoVitality: 0,
    profileId: null,
    loaded: false,
    glowing: false,
  };

  const listeners = new Set<Listener>();
  let saveTimeout: ReturnType<typeof setTimeout> | null = null;
  let glowTimeout: ReturnType<typeof setTimeout> | null = null;

  function emit() {
    listeners.forEach((l) => l());
  }

  function getState() {
    return state;
  }

  function subscribe(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function setState(partial: Partial<MeritState>) {
    state = { ...state, ...partial };
    emit();
  }

  function triggerGlow() {
    if (glowTimeout) clearTimeout(glowTimeout);
    setState({ glowing: true });
    glowTimeout = setTimeout(() => setState({ glowing: false }), 1500);
  }

  function scheduleSave() {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => saveToProfile(), 2000);
  }

  async function loadFromProfile(profileId: string) {
    setState({ profileId });
    const { data } = await supabase
      .from("profiles")
      .select("merit_points, eco_vitality")
      .eq("id", profileId)
      .maybeSingle();
    if (data) {
      setState({
        meritPoints: (data as any).merit_points ?? 0,
        ecoVitality: (data as any).eco_vitality ?? 0,
        loaded: true,
      });
    } else {
      setState({ loaded: true });
    }
  }

  async function saveToProfile() {
    if (!state.profileId) return;
    await supabase
      .from("profiles")
      .update({
        merit_points: state.meritPoints,
        eco_vitality: state.ecoVitality,
      } as any)
      .eq("id", state.profileId);
  }

  function addMerit(amount: number) {
    const old = state.meritPoints;
    const next = old + amount;
    setState({ meritPoints: next });
    triggerGlow();
    scheduleSave();
    const milestone = checkMilestone("merit", old, next);
    if (milestone) {
      toast("🌟 Kindness Milestone!", {
        description: `${milestone} — ${next} Merit Points!`,
      });
    }
  }

  function addEcoVitality(amount: number) {
    const old = state.ecoVitality;
    const next = old + amount;
    setState({ ecoVitality: next });
    triggerGlow();
    scheduleSave();
    const milestone = checkMilestone("eco", old, next);
    if (milestone) {
      toast("🌿 Eco Milestone!", {
        description: `${milestone} — ${next} Eco-Vitality!`,
      });
    }
  }

  return { getState, subscribe, loadFromProfile, addMerit, addEcoVitality, saveToProfile };
}

export const meritStore = createMeritStore();

export function useMeritStore() {
  const state = useSyncExternalStore(meritStore.subscribe, meritStore.getState);
  return state;
}
