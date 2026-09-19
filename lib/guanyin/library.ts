import oracleData from "../../sticks/guanyin.json";

import { questionDomains, type GuanyinStick, type QuestionDomain } from "./types";

export class GuanyinLibraryValidationError extends Error {
  constructor(message: string) {
    super(`观音签库校验失败：${message}`);
    this.name = "GuanyinLibraryValidationError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireText(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new GuanyinLibraryValidationError(`${field} 必须是非空字符串。`);
  }
  return value;
}

function requireTopics(value: unknown, stickNumber: number): Record<QuestionDomain, string> {
  if (!isRecord(value)) throw new GuanyinLibraryValidationError(`第 ${stickNumber} 签 traditional.topics 必须是对象。`);
  const topics = {} as Record<QuestionDomain, string>;
  for (const domain of questionDomains) topics[domain] = requireText(value[domain], `第 ${stickNumber} 签 traditional.topics.${domain}`);
  return topics;
}

function requireStick(value: unknown, index: number): GuanyinStick {
  if (!isRecord(value)) throw new GuanyinLibraryValidationError(`第 ${index + 1} 项必须是对象。`);
  const id = value.id;
  if (!Number.isInteger(id)) throw new GuanyinLibraryValidationError(`第 ${index + 1} 项 id 必须是整数。`);
  const stickNumber = id as number;
  const poem = value.poem;
  if (!Array.isArray(poem) || poem.length !== 4) throw new GuanyinLibraryValidationError(`第 ${stickNumber} 签 poem 必须恰好包含 4 句。`);
  const traditional = value.traditional;
  if (!isRecord(traditional)) throw new GuanyinLibraryValidationError(`第 ${stickNumber} 签 traditional 必须是对象。`);
  return {
    id: stickNumber,
    level: requireText(value.level, `第 ${stickNumber} 签 level`),
    title: requireText(value.title, `第 ${stickNumber} 签 title`),
    poem: [requireText(poem[0], `第 ${stickNumber} 签 poem[0]`), requireText(poem[1], `第 ${stickNumber} 签 poem[1]`), requireText(poem[2], `第 ${stickNumber} 签 poem[2]`), requireText(poem[3], `第 ${stickNumber} 签 poem[3]`)],
    traditional: {
      jieyue: requireText(traditional.jieyue, `第 ${stickNumber} 签 traditional.jieyue`),
      xianji: requireText(traditional.xianji, `第 ${stickNumber} 签 traditional.xianji`),
      topics: requireTopics(traditional.topics, stickNumber),
      diangu: requireText(traditional.diangu, `第 ${stickNumber} 签 traditional.diangu`),
    },
  };
}

export function validateGuanyinLibrary(value: unknown): readonly GuanyinStick[] {
  if (!Array.isArray(value)) throw new GuanyinLibraryValidationError("顶层必须是数组。");
  if (value.length !== 100) throw new GuanyinLibraryValidationError(`签库必须恰好包含 100 支签，当前为 ${value.length} 支。`);
  const sticks = value.map(requireStick);
  const numbers = new Set<number>();
  for (const stick of sticks) {
    if (stick.id < 1 || stick.id > 100) throw new GuanyinLibraryValidationError(`第 ${stick.id} 签 id 必须在 1 至 100 之间。`);
    if (numbers.has(stick.id)) throw new GuanyinLibraryValidationError(`第 ${stick.id} 签 id 重复。`);
    numbers.add(stick.id);
  }
  for (let id = 1; id <= 100; id += 1) if (!numbers.has(id)) throw new GuanyinLibraryValidationError(`缺少第 ${id} 签。`);
  return Object.freeze(sticks);
}

export const guanyinSticks = validateGuanyinLibrary(oracleData);
const sticksById = new Map(guanyinSticks.map((stick) => [stick.id, stick]));

export function getGuanyinStick(stickNumber: unknown): GuanyinStick {
  if (typeof stickNumber !== "number" || Number.isNaN(stickNumber)) throw new TypeError("签号必须是数字。");
  if (!Number.isInteger(stickNumber)) throw new TypeError("签号必须是整数。");
  if (stickNumber < 1 || stickNumber > 100) throw new RangeError("签号必须在 1 至 100 之间。");
  const stick = sticksById.get(stickNumber);
  if (!stick) throw new RangeError(`签库中不存在第 ${stickNumber} 签。`);
  return stick;
}
