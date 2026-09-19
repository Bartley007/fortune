import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { getGuanyinStick, guanyinSticks } from "../lib/guanyin/library";
import { drawGuanyinStickNumber, type RandomValuesProvider } from "../lib/guanyin/random";
import { questionDomains } from "../lib/guanyin/types";

describe("观音签库", () => {
  it("包含完整且无重复的 100 签", () => {
    expect(guanyinSticks).toHaveLength(100);
    expect(new Set(guanyinSticks.map((stick) => stick.id)).size).toBe(100);
    expect(guanyinSticks.map((stick) => stick.id).sort((a, b) => a - b)).toEqual(Array.from({ length: 100 }, (_, index) => index + 1));
  });
  it("每支签有四句签诗和六个领域", () => {
    for (const stick of guanyinSticks) {
      expect(stick.poem).toHaveLength(4);
      expect(Object.keys(stick.traditional.topics).sort()).toEqual([...questionDomains].sort());
    }
  });
  it("可正确查询第 1 和第 100 签", () => {
    expect(getGuanyinStick(1).id).toBe(1);
    expect(getGuanyinStick(100).id).toBe(100);
  });
  it("拒绝无效签号", () => {
    expect(() => getGuanyinStick(0)).toThrow(RangeError);
    expect(() => getGuanyinStick(101)).toThrow(RangeError);
    expect(() => getGuanyinStick(1.5)).toThrow(TypeError);
    expect(() => getGuanyinStick("1")).toThrow(TypeError);
  });
});

describe("安全抽签", () => {
  it("结果始终位于 1 至 100", () => {
    const values = [0, 99, 100, 4_294_967_199];
    for (const value of values) {
      const provider: RandomValuesProvider = { getRandomValues(array) { (array as Uint32Array)[0] = value; return array; } };
      expect(drawGuanyinStickNumber(provider)).toBeGreaterThanOrEqual(1);
      expect(drawGuanyinStickNumber(provider)).toBeLessThanOrEqual(100);
    }
  });
  it("以拒绝采样跳过有偏的尾部值", () => {
    const values = [4_294_967_295, 99];
    const provider: RandomValuesProvider = { getRandomValues(array) { (array as Uint32Array)[0] = values.shift() ?? 0; return array; } };
    expect(drawGuanyinStickNumber(provider)).toBe(100);
  });
});

it("项目源码未调用 Math.random", () => {
  const readSources = (directory: string): string[] => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? readSources(path) : /\.(ts|tsx)$/.test(entry.name) ? [readFileSync(path, "utf8")] : [];
  });
  const sourceFiles = ["app", "lib"].flatMap((directory) => readSources(resolve(process.cwd(), directory)));
  const forbidden = ["Math", "random"].join(".");
  expect(sourceFiles).not.toContain(forbidden);
});
