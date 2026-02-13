import { motion } from "framer-motion";

interface BlobPetProps {
  evolutionStage: number;
  wordsSpoken: number;
  size?: "sm" | "md" | "lg";
}

const STAGE_COLORS = [
  "hsl(260, 67%, 75%)",   // stage 0: soft purple blob
  "hsl(280, 60%, 65%)",   // stage 1: ears
  "hsl(300, 55%, 60%)",   // stage 2: tail
  "hsl(320, 65%, 60%)",   // stage 3: wings
  "hsl(340, 70%, 55%)",   // stage 4: full creature
];

const sizeMap = { sm: 80, md: 140, lg: 200 };

export function BlobPet({ evolutionStage, wordsSpoken, size = "md" }: BlobPetProps) {
  const s = sizeMap[size];
  const stage = Math.min(evolutionStage, 4);
  const glowIntensity = Math.min(wordsSpoken / 50, 1);

  return (
    <motion.div
      className="relative flex items-center justify-center"
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    >
      <svg width={s} height={s} viewBox="0 0 200 200">
        {/* Glow */}
        <motion.circle
          cx="100" cy="110" r="70"
          fill={STAGE_COLORS[stage]}
          opacity={0.2 + glowIntensity * 0.3}
          animate={{ r: [70, 75, 70] }}
          transition={{ duration: 2, repeat: Infinity }}
        />

        {/* Body */}
        <motion.ellipse
          cx="100" cy="110" rx="55" ry="50"
          fill={STAGE_COLORS[stage]}
          animate={{ ry: [50, 53, 50] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Eyes */}
        <circle cx="82" cy="100" r="8" fill="white" />
        <circle cx="118" cy="100" r="8" fill="white" />
        <motion.circle
          cx="84" cy="101" r="5" fill="hsl(260, 30%, 20%)"
          animate={{ cx: [84, 86, 84] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        <motion.circle
          cx="120" cy="101" r="5" fill="hsl(260, 30%, 20%)"
          animate={{ cx: [120, 122, 120] }}
          transition={{ duration: 3, repeat: Infinity }}
        />

        {/* Smile */}
        <path
          d="M 88 120 Q 100 132 112 120"
          stroke="hsl(260, 30%, 20%)"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />

        {/* Stage 1+: Ears */}
        {stage >= 1 && (
          <>
            <motion.ellipse
              cx="65" cy="70" rx="12" ry="20"
              fill={STAGE_COLORS[stage]}
              animate={{ rotate: [-5, 5, -5] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ transformOrigin: "65px 90px" }}
            />
            <motion.ellipse
              cx="135" cy="70" rx="12" ry="20"
              fill={STAGE_COLORS[stage]}
              animate={{ rotate: [5, -5, 5] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ transformOrigin: "135px 90px" }}
            />
          </>
        )}

        {/* Stage 2+: Tail */}
        {stage >= 2 && (
          <motion.path
            d="M 150 130 Q 170 120 175 100 Q 180 85 170 80"
            stroke={STAGE_COLORS[stage]}
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            animate={{ d: [
              "M 150 130 Q 170 120 175 100 Q 180 85 170 80",
              "M 150 130 Q 175 125 178 105 Q 182 88 168 78",
              "M 150 130 Q 170 120 175 100 Q 180 85 170 80",
            ]}}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}

        {/* Stage 3+: Wings */}
        {stage >= 3 && (
          <>
            <motion.path
              d="M 50 100 Q 25 70 40 50 Q 50 60 55 80"
              fill={`${STAGE_COLORS[stage]}88`}
              animate={{ d: [
                "M 50 100 Q 25 70 40 50 Q 50 60 55 80",
                "M 50 100 Q 20 65 35 45 Q 48 58 55 80",
                "M 50 100 Q 25 70 40 50 Q 50 60 55 80",
              ]}}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <motion.path
              d="M 150 100 Q 175 70 160 50 Q 150 60 145 80"
              fill={`${STAGE_COLORS[stage]}88`}
              animate={{ d: [
                "M 150 100 Q 175 70 160 50 Q 150 60 145 80",
                "M 150 100 Q 180 65 165 45 Q 152 58 145 80",
                "M 150 100 Q 175 70 160 50 Q 150 60 145 80",
              ]}}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </>
        )}

        {/* Stage 4: Crown / sparkles */}
        {stage >= 4 && (
          <>
            <motion.polygon
              points="85,60 88,48 91,60"
              fill="hsl(45, 95%, 60%)"
              animate={{ opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <motion.polygon
              points="97,55 100,42 103,55"
              fill="hsl(45, 95%, 60%)"
              animate={{ opacity: [1, 0.8, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <motion.polygon
              points="109,60 112,48 115,60"
              fill="hsl(45, 95%, 60%)"
              animate={{ opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </>
        )}
      </svg>
    </motion.div>
  );
}
