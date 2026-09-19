export const questionDomains = ["career", "marriage", "wealth", "health", "family", "travel"] as const;

export type QuestionDomain = (typeof questionDomains)[number];

export interface TraditionalInterpretation {
  jieyue: string;
  xianji: string;
  topics: Record<QuestionDomain, string>;
  diangu: string;
}

export interface GuanyinStick {
  id: number;
  level: string;
  title: string;
  poem: [string, string, string, string];
  traditional: TraditionalInterpretation;
}

export interface DrawRecord {
  drawId: string;
  question: string;
  domain: QuestionDomain;
  stickNumber: number;
  drawnAt: string;
  oracleVersion: "0.1.0";
  randomMethod: "server-crypto-random-int";
}
