import { Suspense, useRef, useCallback, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { TemplePlatform } from "./TemplePlatform";
import { FloatingStones } from "./FloatingStones";
import { MessyObjects } from "./MessyObjects";
import { GuardianStatue } from "./GuardianStatue";
import { TempleMist } from "./TempleMist";
import { TempleHUD } from "./TempleHUD";
import { useTempleState } from "./useTempleState";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";

const OBJECT_NAMES = ["📚 Messy Books", "👟 Scattered Shoes", "📜 Fallen Scroll"];
const OBJECT_COMMANDS = [
  ["put the books on the shelf", "books on shelf", "place the books"],
  ["put the shoes on the shelf", "shoes on shelf", "place the shoes"],
  ["roll up the scroll", "roll the scroll", "tidy the scroll"],
];

export function TempleScene() {
  const temple = useTempleState();
  const [focusedObject, setFocusedObject] = useState<number | null>(null);
  const lastProcessed = useRef("");
  const vKeyDown = useRef(false);

  const handleVoiceResult = useCallback((transcript: string) => {
    const t = transcript.toLowerCase().trim();
    if (t === lastProcessed.current) return;
    lastProcessed.current = t;

    // Bridge alignment
    if (!temple.bridgeAligned && (t.includes("align the path") || t.includes("tidy up") || t.includes("align") || t.includes("fix the bridge"))) {
      temple.alignBridge();
      return;
    }

    // Object tidying — check focused object first, then any match
    if (temple.objectsTidied < 3) {
      for (let i = 0; i < OBJECT_COMMANDS.length; i++) {
        if (i < temple.objectsTidied) continue; // already tidied
        const matches = OBJECT_COMMANDS[i].some(cmd => t.includes(cmd));
        if (matches) {
          temple.tidyObject();
          setFocusedObject(null);
          return;
        }
      }
    }

    // Guardian greeting — check for polite greeting
    if (!temple.guardianPassed) {
      const isGreeting = t.includes("good morning") || t.includes("hello guardian") || t.includes("good morning guardian");
      if (isGreeting) {
        // Check "volume" — we approximate by checking if text has exclamation or ALL CAPS
        // In a real app we'd use audio analysis; here we use a heuristic
        const isShouting = transcript === transcript.toUpperCase() && transcript.length > 5;
        if (isShouting) {
          temple.triggerShake();
        } else {
          temple.passGuardian();
        }
        return;
      }

      // Any loud/aggressive phrase near guardian
      if (t.includes("!") || (transcript === transcript.toUpperCase() && transcript.length > 8)) {
        temple.triggerShake();
      }
    }
  }, [temple]);

  const { isListening, transcript, startListening, stopListening } = useSpeechRecognition({
    onResult: handleVoiceResult,
  });

  // V key hold-to-talk
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "v" || e.key === "V") {
        if (!vKeyDown.current) {
          vKeyDown.current = true;
          startListening();
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "v" || e.key === "V") {
        vKeyDown.current = false;
        stopListening();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [startListening, stopListening]);

  return (
    <div className="relative h-full w-full">
      <TempleHUD
        bridgeAligned={temple.bridgeAligned}
        objectsTidied={temple.objectsTidied}
        guardianPassed={temple.guardianPassed}
        allComplete={temple.allComplete}
        isListening={isListening}
        transcript={transcript}
        focusedObjectName={focusedObject !== null ? OBJECT_NAMES[focusedObject] : null}
        screenShake={temple.screenShake}
      />

      <Canvas shadows className="!absolute inset-0">
        <PerspectiveCamera makeDefault position={[0, 8, 18]} fov={60} />
        <OrbitControls
          enablePan={false}
          maxPolarAngle={Math.PI / 2.2}
          minDistance={8}
          maxDistance={30}
          target={[0, 2, 0]}
        />

        {/* Lighting */}
        <ambientLight intensity={temple.allComplete ? 0.6 : 0.2} />
        <directionalLight
          position={[10, 15, 5]}
          intensity={temple.allComplete ? 1.5 : 0.5}
          color={temple.allComplete ? "#ffd700" : "#999999"}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />

        <Suspense fallback={null}>
          <TemplePlatform complete={temple.allComplete} />
          <FloatingStones aligned={temple.bridgeAligned} />
          <MessyObjects
            tidiedCount={temple.objectsTidied}
            onFocusObject={setFocusedObject}
            focusedIndex={focusedObject}
          />
          <GuardianStatue
            passed={temple.guardianPassed}
            shaking={temple.screenShake}
          />
          <TempleMist clearing={temple.allComplete} />
        </Suspense>
      </Canvas>
    </div>
  );
}
