/**
 * 开始访谈页 session 缓存键（按项目 nodeId），与 InterviewSummaryPanel / InterviewStart 约定一致。
 * 关键热词按「项目 + 单条访谈记录 recordId」分键（见 interviewHotKeywordsSessionKey），不混入其它记录。
 * 仅在「访谈记录列表删除记录」等场景集中清理，避免结束录音后再次进入仍被 startRecording 误清。
 */
import type { InterviewTranscriptSegment } from '@/views/home/composables/useInterviewTranscription'
import type { InterviewSummaryBlock } from '@/views/home/types/interviewSummary'

export const INTERVIEW_SESSION_SUMMARY_PREFIX = 'pd-interview-live-summary:'
export const INTERVIEW_SESSION_TRANSCRIPT_PREFIX = 'pd-interview-transcript-segments:'
export const INTERVIEW_SESSION_HOT_KEYWORDS_PREFIX = 'pd-interview-hot-keywords:'
export const INTERVIEW_SESSION_RECORDER_STATE_PREFIX = 'pd-interview-recorder-state:'

/** 与 localStorage 访谈列表条目一一对应，避免同项目下多条记录共用一个热词缓存 */
export function interviewHotKeywordsSessionKey(projectId: string, recordId: string): string {
  const pid = projectId?.trim()
  const rid = recordId?.trim()
  if (!pid || !rid) return ''
  return `${INTERVIEW_SESSION_HOT_KEYWORDS_PREFIX}${pid}:${rid}`
}

/** 清除该项目下全部热词 session 项（含旧版仅 projectId 的单键与所有 recordId 分键） */
export function clearInterviewHotKeywordsSessionStorageForProject(projectId: string): void {
  const pid = projectId?.trim()
  if (!pid || typeof sessionStorage === 'undefined') return
  try {
    sessionStorage.removeItem(`${INTERVIEW_SESSION_HOT_KEYWORDS_PREFIX}${pid}`)
    const prefix = `${INTERVIEW_SESSION_HOT_KEYWORDS_PREFIX}${pid}:`
    const keys: string[] = []
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i)
      if (k && k.startsWith(prefix)) keys.push(k)
    }
    for (const k of keys) sessionStorage.removeItem(k)
  } catch {
    /* ignore */
  }
}

export type InterviewSessionRecorderLastStatus = 'recording' | 'paused' | 'stopped' | 'idle'

export interface InterviewSessionRecorderState {
  durationMs: number
  wasRecording: boolean
  /** 精确的录音状态，用于刷新后还原暂停/录音/结束 UI */
  lastStatus?: InterviewSessionRecorderLastStatus
  savedAt: number
}

export function persistInterviewRecorderState(
  projectId: string,
  state: Omit<InterviewSessionRecorderState, 'savedAt'>
): void {
  const pid = projectId?.trim()
  if (!pid || typeof sessionStorage === 'undefined') return
  try {
    sessionStorage.setItem(
      `${INTERVIEW_SESSION_RECORDER_STATE_PREFIX}${pid}`,
      JSON.stringify({ ...state, savedAt: Date.now() })
    )
  } catch {
    /* ignore */
  }
}

export function readInterviewRecorderState(projectId: string): InterviewSessionRecorderState | null {
  const pid = projectId?.trim()
  if (!pid || typeof sessionStorage === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(`${INTERVIEW_SESSION_RECORDER_STATE_PREFIX}${pid}`)
    if (!raw) return null
    const data = JSON.parse(raw) as InterviewSessionRecorderState
    if (typeof data.durationMs !== 'number') return null
    return data
  } catch {
    return null
  }
}

export function interviewSessionTranscriptKey(projectId: string): string {
  const id = projectId?.trim()
  return id ? `${INTERVIEW_SESSION_TRANSCRIPT_PREFIX}${id}` : ''
}

/** 写入字幕快照（刷新前 pagehide / 防抖落盘共用） */
export function persistInterviewTranscriptSegments(
  projectId: string,
  segments: InterviewTranscriptSegment[]
): void {
  const key = interviewSessionTranscriptKey(projectId)
  if (!key || typeof sessionStorage === 'undefined' || !segments.length) return
  try {
    sessionStorage.setItem(key, JSON.stringify({ segments, savedAt: Date.now() }))
  } catch {
    /* ignore quota */
  }
}

/**
 * 读取字幕缓存；兼容旧键（nodeId 未 trim 等），并迁移到规范键。
 */
export function readInterviewTranscriptSegmentsFromSession(projectId: string): InterviewTranscriptSegment[] | null {
  const pid = projectId?.trim()
  if (!pid || typeof sessionStorage === 'undefined') return null
  const canonical = interviewSessionTranscriptKey(pid)
  let raw = sessionStorage.getItem(canonical)
  if (!raw && projectId !== pid) {
    const legacyKey = `${INTERVIEW_SESSION_TRANSCRIPT_PREFIX}${projectId}`
    const legacy = sessionStorage.getItem(legacyKey)
    if (legacy != null) {
      try {
        sessionStorage.setItem(canonical, legacy)
        sessionStorage.removeItem(legacyKey)
      } catch {
        /* ignore */
      }
      raw = legacy
    }
  }
  if (!raw) {
    try {
      for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i)
        if (!k || !k.startsWith(INTERVIEW_SESSION_TRANSCRIPT_PREFIX)) continue
        const suffix = k.slice(INTERVIEW_SESSION_TRANSCRIPT_PREFIX.length)
        if (suffix.trim() !== pid) continue
        const found = sessionStorage.getItem(k)
        if (found) {
          try {
            sessionStorage.setItem(canonical, found)
            if (k !== canonical) sessionStorage.removeItem(k)
          } catch {
            /* ignore */
          }
          raw = found
          break
        }
      }
    } catch {
      /* ignore */
    }
  }
  if (!raw) return null
  try {
    const data = JSON.parse(raw) as { segments?: InterviewTranscriptSegment[] }
    return Array.isArray(data.segments) && data.segments.length ? data.segments : null
  } catch {
    return null
  }
}

/** 与 InterviewSummaryPanel.persistSummaryToSession 写入格式一致，供「录音中」在访谈记录详情从 session 恢复 */
export function readInterviewLiveSummaryFromSession(projectId: string): InterviewSummaryBlock[] | null {
  const pid = projectId?.trim()
  if (!pid || typeof sessionStorage === 'undefined') return null
  const key = `${INTERVIEW_SESSION_SUMMARY_PREFIX}${pid}`
  try {
    const raw = sessionStorage.getItem(key)
    if (!raw) return null
    const data = JSON.parse(raw) as { blocks?: InterviewSummaryBlock[] }
    if (!Array.isArray(data.blocks) || !data.blocks.length) return null
    return data.blocks
  } catch {
    return null
  }
}

/**
 * 检查 sessionStorage 中是否存在该项目的活跃会话数据（字幕片段或录音状态），
 * 用于侧栏「开始访谈」判断是否应恢复现场而非新建会话。
 */
export function hasActiveInterviewSessionData(projectId: string): boolean {
  const pid = projectId?.trim()
  if (!pid || typeof sessionStorage === 'undefined') return false
  try {
    const segKey = `${INTERVIEW_SESSION_TRANSCRIPT_PREFIX}${pid}`
    const segRaw = sessionStorage.getItem(segKey)
    if (segRaw) {
      const data = JSON.parse(segRaw) as { segments?: unknown[] }
      if (Array.isArray(data.segments) && data.segments.length > 0) return true
    }
  } catch { /* ignore */ }
  try {
    const recKey = `${INTERVIEW_SESSION_RECORDER_STATE_PREFIX}${pid}`
    const recRaw = sessionStorage.getItem(recKey)
    if (recRaw) return true
  } catch { /* ignore */ }
  return false
}

export function clearInterviewSessionCachesForProject(projectId: string) {
  const pid = projectId?.trim()
  if (!pid || typeof sessionStorage === 'undefined') return
  for (const prefix of [
    INTERVIEW_SESSION_SUMMARY_PREFIX,
    INTERVIEW_SESSION_TRANSCRIPT_PREFIX,
    INTERVIEW_SESSION_RECORDER_STATE_PREFIX
  ]) {
    try {
      sessionStorage.removeItem(`${prefix}${pid}`)
    } catch {
      /* ignore */
    }
  }
  clearInterviewHotKeywordsSessionStorageForProject(pid)
}
