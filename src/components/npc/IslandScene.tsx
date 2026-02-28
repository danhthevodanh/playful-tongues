import { useRef, useEffect, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { ElderKong3D } from "./ElderKong3D";
import { IslandGround } from "./IslandGround";
import { IslandTrees } from "./IslandTrees";
import { ShadowMirror3D } from "./ShadowMirror3D";
import { IslandHUD } from "./IslandHUD";
import { useIslandState } from "./useIslandState";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";

/** Fog + ambient light shift */
function IslandAtmosphere({ transformed }: { transformed: boolean }) {
  const { scene } = useThree();

  useFrame((_, delta) => {
    if (!scene.fog) {
      scene.fog = new THREE.FogExp2("#555555", 0.03);
    }
    if (scene.fog instanceof THREE.FogExp2) {
      const targetDensity = transformed ? 0.008 : 0.03;
      scene.fog.density = THREE.MathUtils.lerp(scene.fog.density, targetDensity, delta * 1.5);
      const targetFogColor = transformed ? new THREE.Color("#ffeedd") : new THREE.Color("#555555");
      scene.fog.color.lerp(targetFogColor, delta * 1.5);
    }
  });

  return null;
}

/** Ambient + directional lights that shift on transformation */
function IslandLights({ transformed }: { transformed: boolean }) {
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const dirRef = useRef<THREE.DirectionalLight>(null);

  useFrame((_, delta) => {
    if (ambientRef.current) {
      const target = transformed ? 0.8 : 0.3;
      ambientRef.current.intensity = THREE.MathUtils.lerp(ambientRef.current.intensity, target, delta * 1.5);
      const targetColor = transformed ? new THREE.Color("#fff5e0") : new THREE.Color("#888888");
      ambientRef.current.color.lerp(targetColor, delta * 1.5);
    }
    if (dirRef.current) {
      const target = transformed ? 1.2 : 0.4;
      dirRef.current.intensity = THREE.MathUtils.lerp(dirRef.current.intensity, target, delta * 1.5);
    }
  });

  return (
    <>
      <ambientLight ref={ambientRef} intensity={0.3} color="#888888" />
      <directionalLight ref={dirRef} position={[5, 10, 5]} intensity={0.4} color="#ffffff" />
    </>
  );
}

export function IslandScene() {
  const state = useIslandState();
  const pendingTranscript = useRef("");
  const mirrorMode = useRef(false);

  const handleVoiceResult = useCallback(
    (transcript: string) => {
      pendingTranscript.current = transcript;
    },
    []
  );

  const { isListening, transcript, startListening, stopListening } = useSpeechRecognition({
    onResult: handleVoiceResult,
  });

  // V-key hold-to-talk
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (e.key === "v" || e.key === "V") {
        if (!e.repeat) startListening();
      }
    };
    const onUp = (e: KeyboardEvent) => {
      if (e.key === "v" || e.key === "V") {
        stopListening();
        const text = pendingTranscript.current;
        if (text.trim()) {
          if (mirrorMode.current && !state.hasCape) {
            const claimed = state.claimCape(text);
            if (!claimed) {
              // Not an affirmation, send to elder anyway
              state.sendMessage(text);
            }
          } else {
            state.sendMessage(text);
          }
        }
        pendingTranscript.current = "";
      }
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, [startListening, stopListening, state]);

  return (
    <>
      <IslandHUD
        chatHistory={state.chatHistory}
        localMerit={state.localMerit}
        transformed={state.transformed}
        hasCape={state.hasCape}
        elderMood={state.elderMood}
        isThinking={state.isThinking}
        isListening={isListening}
        transcript={transcript}
      />
      <Canvas camera={{ position: [0, 6, 12], fov: 50 }} style={{ width: "100%", height: "100%" }}>
        <IslandAtmosphere transformed={state.transformed} />
        <IslandLights transformed={state.transformed} />
        <OrbitControls
          target={[0, 1.5, -1]}
          maxPolarAngle={Math.PI / 2.1}
          minDistance={4}
          maxDistance={20}
          enablePan={false}
        />
        <IslandGround transformed={state.transformed} />
        <ElderKong3D mood={state.elderMood} />
        <IslandTrees transformed={state.transformed} />
        <ShadowMirror3D hasCape={state.hasCape} onApproach={(near) => (mirrorMode.current = near)} />
      </Canvas>
    </>
  );
}
