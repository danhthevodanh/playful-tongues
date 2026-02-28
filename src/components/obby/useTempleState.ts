import { create } from 'zustand';

// We'll use a simple module-level store since zustand isn't installed
import { useState, useCallback, useMemo } from 'react';

export interface TempleState {
  bridgeAligned: boolean;
  objectsTidied: number; // 0-3
  guardianPassed: boolean;
  screenShake: boolean;
  allComplete: boolean;
}

// Shared mutable state for 60fps access without re-renders
export const templeRef = {
  bridgeAligned: false,
  objectsTidied: 0,
  guardianPassed: false,
  screenShake: false,
  shakeIntensity: 0,
  playerPushedBack: false,
};

export function useTempleState() {
  const [bridgeAligned, setBridgeAligned] = useState(false);
  const [objectsTidied, setObjectsTidied] = useState(0);
  const [guardianPassed, setGuardianPassed] = useState(false);
  const [screenShake, setScreenShake] = useState(false);

  const allComplete = bridgeAligned && objectsTidied >= 3 && guardianPassed;

  const alignBridge = useCallback(() => {
    setBridgeAligned(true);
    templeRef.bridgeAligned = true;
  }, []);

  const tidyObject = useCallback(() => {
    setObjectsTidied(prev => {
      const next = Math.min(prev + 1, 3);
      templeRef.objectsTidied = next;
      return next;
    });
  }, []);

  const passGuardian = useCallback(() => {
    setGuardianPassed(true);
    templeRef.guardianPassed = true;
  }, []);

  const triggerShake = useCallback(() => {
    setScreenShake(true);
    templeRef.screenShake = true;
    templeRef.shakeIntensity = 1;
    templeRef.playerPushedBack = true;
    setTimeout(() => {
      setScreenShake(false);
      templeRef.screenShake = false;
      templeRef.shakeIntensity = 0;
      templeRef.playerPushedBack = false;
    }, 800);
  }, []);

  return {
    bridgeAligned, objectsTidied, guardianPassed, screenShake, allComplete,
    alignBridge, tidyObject, passGuardian, triggerShake,
  };
}
