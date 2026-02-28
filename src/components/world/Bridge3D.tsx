import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const PLANK_COUNT = 10;

interface Bridge3DProps {
    midX: number;
    midZ: number;
    length: number;
    angle?: number;
    state: "hidden" | "forming" | "solid" | "dissolving";
    countdown: number; // 1.0=fresh, 0.0=expired
}

export function Bridge3D({ midX, midZ, length, angle = 0, state, countdown }: Bridge3DProps) {
    const progressRef = useRef(0);
    const plankRefs = useRef<(THREE.Mesh | null)[]>(Array(PLANK_COUNT).fill(null));

    // Reset progress when we start forming or dissolving
    useEffect(() => {
        if (state === "forming") progressRef.current = 0;
        if (state === "dissolving") progressRef.current = 1;
        if (state === "hidden") progressRef.current = 0;
        if (state === "solid") progressRef.current = 1;
    }, [state]);

    useFrame((_, delta) => {
        if (state === "forming") {
            progressRef.current = Math.min(1, progressRef.current + delta * 2.2);
        } else if (state === "dissolving") {
            progressRef.current = Math.max(0, progressRef.current - delta * 2.2);
        }

        const p = progressRef.current;

        // Choose plank color based on countdown urgency
        const isWarning = state === "solid" && countdown < 0.3;
        const isCaution = state === "solid" && countdown < 0.6;
        const r = isWarning ? 0.85 : isCaution ? 0.75 : 0.54;
        const g = isWarning ? 0.25 : isCaution ? 0.42 : 0.41;
        const b = isWarning ? 0.05 : isCaution ? 0.05 : 0.08;

        plankRefs.current.forEach((plank, i) => {
            if (!plank) return;
            // Each plank gets progressively later share of total progress
            const plankStart = i / PLANK_COUNT;
            const plankProgress = Math.max(0, Math.min(1, (p - plankStart) * PLANK_COUNT));

            plank.position.y = 0.25 + (1 - plankProgress) * 18;
            plank.visible = plankProgress > 0.01;

            // Warning wobble when about to dissolve
            if (state === "solid" && countdown < 0.25) {
                plank.position.y += Math.sin(Date.now() * 0.008 + i) * 0.06;
            }

            const mat = plank.material as THREE.MeshStandardMaterial;
            mat.color.setRGB(r, g, b);

            // Bright appear effect: glow while falling/forming
            if (state === "forming") {
                mat.emissive.setHex(0xf5c842);
                mat.emissiveIntensity = (1 - plankProgress) * 2.5;
            } else if (state === "solid") {
                mat.emissiveIntensity = countdown < 0.3 ? (Math.sin(Date.now() * 0.01) * 0.5 + 0.5) : 0;
            } else {
                mat.emissiveIntensity = 0;
            }
        });
    });

    const plankSpacing = length / PLANK_COUNT;

    return (
        <group position={[midX, 0, midZ]} rotation={[0, angle, 0]}>
            {/* Rope rails */}
            <mesh position={[0, 1.1, -2.5]}>
                <boxGeometry args={[length + 3, 0.07, 0.07]} />
                <meshStandardMaterial color="#3d200a" />
            </mesh>
            <mesh position={[0, 1.1, 2.5]}>
                <boxGeometry args={[length + 3, 0.07, 0.07]} />
                <meshStandardMaterial color="#3d200a" />
            </mesh>

            {/* Wooden planks */}
            {Array.from({ length: PLANK_COUNT }, (_, i) => {
                const xOff = (i / (PLANK_COUNT - 1) - 0.5) * length;
                return (
                    <mesh
                        key={i}
                        ref={(el) => { plankRefs.current[i] = el; }}
                        position={[xOff, 0.25, 0]}
                        castShadow
                        receiveShadow
                    >
                        <boxGeometry args={[plankSpacing * 0.75, 0.22, 5.5]} />
                        <meshStandardMaterial color="#8B6914" />
                    </mesh>
                );
            })}
        </group>
    );
}
