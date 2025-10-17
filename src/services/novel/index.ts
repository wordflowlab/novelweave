/**
 * Novel Services Module
 * 小说创作服务模块
 */

export { NovelProjectManager } from "./ProjectManager"
export { TrackingSystem } from "./TrackingSystem"
export { KnowledgeBase } from "./KnowledgeBase"
export { CommandGenerator } from "./CommandGenerator"

export type { Character, PlotLine, TimelineEvent } from "./TrackingSystem"
export type { KnowledgeItem } from "./KnowledgeBase"
export type { AIPlatform, PlatformConfig } from "./CommandGenerator"
