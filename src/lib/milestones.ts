const MERIT_MILESTONES: [number, string][] = [
  [10, "First Kindness"],
  [50, "Virtuous Heart"],
  [100, "Di Zi Gui Scholar"],
  [250, "Sage of Compassion"],
  [500, "Liao Fan Master"],
];

const ECO_MILESTONES: [number, string][] = [
  [10, "Seedling"],
  [50, "Green Guardian"],
  [100, "Climate Champion"],
  [250, "Earth Protector"],
  [500, "SDG Hero"],
];

export function checkMilestone(
  type: "merit" | "eco",
  oldVal: number,
  newVal: number
): string | null {
  const milestones = type === "merit" ? MERIT_MILESTONES : ECO_MILESTONES;
  for (const [threshold, name] of milestones) {
    if (oldVal < threshold && newVal >= threshold) return name;
  }
  return null;
}

export function getNextMilestone(
  type: "merit" | "eco",
  currentVal: number
): { threshold: number; name: string; progress: number } | null {
  const milestones = type === "merit" ? MERIT_MILESTONES : ECO_MILESTONES;
  for (const [threshold, name] of milestones) {
    if (currentVal < threshold) {
      const prevThreshold = milestones[milestones.indexOf([threshold, name]) - 1]?.[0] ?? 0;
      return {
        threshold,
        name,
        progress: (currentVal - prevThreshold) / (threshold - prevThreshold),
      };
    }
  }
  return null;
}

export function getNextMilestoneForValue(
  type: "merit" | "eco",
  currentVal: number
): { threshold: number; name: string; progress: number } | null {
  const milestones = type === "merit" ? MERIT_MILESTONES : ECO_MILESTONES;
  for (let i = 0; i < milestones.length; i++) {
    const [threshold, name] = milestones[i];
    if (currentVal < threshold) {
      const prevThreshold = i > 0 ? milestones[i - 1][0] : 0;
      return {
        threshold,
        name,
        progress: Math.min(1, (currentVal - prevThreshold) / (threshold - prevThreshold)),
      };
    }
  }
  return null;
}
