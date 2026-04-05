/**
 * 与 InterviewSummaryPanel 一致的块结构，供 localStorage 与跨页展示复用。
 */
export type InterviewSummaryBlock =
  | { type: 'mainTitle' | 'subTitle' | 'body'; content: string }
  | { type: 'bodyBullets'; items: string[] }
