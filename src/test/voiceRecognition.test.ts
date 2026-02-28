import { describe, it, expect } from "vitest";

describe("Voice Command Recognition Regex", () => {
    // Ported from GameWorld3D.tsx logic
    const bridgeRegex = /bridge|brij|brig|cross|brid|rich|fridge|ridge|witch/i;
    const openRegex = /open|break|brake|broke|brick|opin|ope/i;
    const speedRegex = /speed|fast|go|sprint/i;

    it("should recognize variants of 'bridge'", () => {
        expect(bridgeRegex.test("bridge")).toBe(true);
        expect(bridgeRegex.test("rich")).toBe(true);
        expect(bridgeRegex.test("fridge")).toBe(true);
        expect(bridgeRegex.test("ridge")).toBe(true);
        expect(bridgeRegex.test("witch")).toBe(true);
        expect(bridgeRegex.test("brid")).toBe(true);
        expect(bridgeRegex.test("brij")).toBe(true);
        expect(bridgeRegex.test("brig")).toBe(true);
    });

    it("should recognize variants of 'open'", () => {
        expect(openRegex.test("open")).toBe(true);
        expect(openRegex.test("break")).toBe(true);
        expect(openRegex.test("brake")).toBe(true);
        expect(openRegex.test("brick")).toBe(true);
        expect(openRegex.test("opin")).toBe(true);
    });

    it("should recognize variants of 'speed'", () => {
        expect(speedRegex.test("speed")).toBe(true);
        expect(speedRegex.test("fast")).toBe(true);
        expect(speedRegex.test("sprint")).toBe(true);
    });

    it("should not falsely match unrelated words", () => {
        expect(bridgeRegex.test("hello")).toBe(false);
        expect(openRegex.test("jump")).toBe(false);
        expect(speedRegex.test("slow")).toBe(false);
    });
});
