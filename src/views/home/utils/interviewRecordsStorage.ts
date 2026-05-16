/**
 * 项目访谈记录的浏览器本地持久化（localStorage）
 *
 * 作用：按 projectId 存取该项目下的访谈记录列表（含转写 segments、时长等），供 ProjectInterviewRecords、InterviewStart 写入/读取。
 * 关键热词仅存 sessionStorage（按 recordId 分键），不写入本结构，避免污染全局访谈列表。
 * 修改存储键名、条数上限或数据结构时请同步调整引用方。
 */
import type { InterviewTranscriptSegment } from '@/views/home/composables/useInterviewTranscription'
import type { InterviewSummaryBlock } from '@/views/home/types/interviewSummary'

const STORAGE_PREFIX = 'pd-admin-interviews:'

/** 与路由、侧栏约定一致，避免因首尾空格导致读写不同 localStorage 键 */
export function normalizeInterviewProjectId(projectId: string): string {
  return typeof projectId === 'string' ? projectId.trim() : ''
}

export interface ProjectInterviewRecord {
  id: string
  projectId: string
  /** 主题（访谈标题） */
  title: string
  createdAt: number
  durationMs: number
  segments: InterviewTranscriptSegment[]
  /** 列表 UI：录音中对应 Figma「加载中」；结束后为 completed 对应「勾选」。旧数据无此字段视为已完成 */
  status?: 'recording' | 'completed'
  /** 与开始访谈页「实时总结」一致的块数据 */
  summaryBlocks?: InterviewSummaryBlock[]
  /** 地点 */
  place?: string
  /** 参与人员 */
  participants?: string
  /** 总结人（默认当前登录用户） */
  summarizerName?: string
  /** 总结生成时间戳 */
  summaryGeneratedAt?: number
}

function storageKey(projectId: string) {
  return `${STORAGE_PREFIX}${normalizeInterviewProjectId(projectId)}`
}

/**
 * 将旧版「未 trim 的键」或仅空白差异的键合并到规范键，避免刷新后列表读不到已存数据。
 */
function readRawListOrMigrate(projectId: string): string | null {
  const id = normalizeInterviewProjectId(projectId)
  if (!id || typeof localStorage === 'undefined') return null
  const canonical = storageKey(id)
  let raw = localStorage.getItem(canonical)
  if (raw != null) return raw

  if (projectId !== id) {
    const legacyKey = `${STORAGE_PREFIX}${projectId}`
    const legacy = localStorage.getItem(legacyKey)
    if (legacy != null) {
      try {
        localStorage.setItem(canonical, legacy)
        localStorage.removeItem(legacyKey)
      } catch {
        /* ignore */
      }
      return legacy
    }
  }

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (!k || !k.startsWith(STORAGE_PREFIX)) continue
      const suffix = k.slice(STORAGE_PREFIX.length)
      if (suffix.trim() !== id) continue
      const found = localStorage.getItem(k)
      if (found == null) continue
      try {
        localStorage.setItem(canonical, found)
        if (k !== canonical) localStorage.removeItem(k)
      } catch {
        /* ignore */
      }
      return found
    }
  } catch {
    /* ignore */
  }
  return null
}

export function getProjectInterviewRecord(
  projectId: string,
  recordId: string
): ProjectInterviewRecord | null {
  if (!projectId || !recordId) return null
  return getProjectInterviewRecords(projectId).find(r => r.id === recordId) ?? null
}

export function getProjectInterviewRecords(projectId: string): ProjectInterviewRecord[] {
  const pid = normalizeInterviewProjectId(projectId)
  if (!pid || typeof localStorage === 'undefined') return []
  try {
    const raw = readRawListOrMigrate(projectId)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    const valid = parsed.filter(
      (r): r is ProjectInterviewRecord =>
        r != null &&
        typeof r === 'object' &&
        typeof (r as ProjectInterviewRecord).id === 'string' &&
        typeof (r as ProjectInterviewRecord).projectId === 'string'
    )
    const seen = new Set<string>()
    const deduped = valid.filter(r => {
      if (seen.has(r.id)) return false
      seen.add(r.id)
      return true
    })
    if (deduped.length !== valid.length) {
      try {
        localStorage.setItem(storageKey(pid), JSON.stringify(deduped))
      } catch {
        /* ignore */
      }
    }
    return deduped
  } catch {
    return []
  }
}

const MAX_RECORDS = 80

export function appendProjectInterviewRecord(
  projectId: string,
  payload: Omit<ProjectInterviewRecord, 'id'>
): ProjectInterviewRecord {
  const pid = normalizeInterviewProjectId(projectId)
  const id = `iv-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  const list = getProjectInterviewRecords(pid)
  const record: ProjectInterviewRecord = {
    ...payload,
    id,
    projectId: pid
  }
  const next = [record, ...list].slice(0, MAX_RECORDS)
  localStorage.setItem(storageKey(pid), JSON.stringify(next))
  return record
}

/** 更新已有记录（用于开始录音后立即落库、结束录音时写入时长与字幕） */
export function updateProjectInterviewRecord(
  projectId: string,
  recordId: string,
  patch: Partial<Omit<ProjectInterviewRecord, 'id' | 'projectId'>>
): ProjectInterviewRecord | null {
  const pid = normalizeInterviewProjectId(projectId)
  if (!pid || !recordId || typeof localStorage === 'undefined') return null
  const list = getProjectInterviewRecords(pid)
  const idx = list.findIndex(r => r.id === recordId)
  if (idx === -1) return null
  const prev = list[idx]!
  const updated = { ...prev, ...patch, id: prev.id, projectId: prev.projectId } as ProjectInterviewRecord
  const next = [...list]
  next[idx] = updated
  localStorage.setItem(storageKey(pid), JSON.stringify(next))
  return updated
}

function idsMatch(a: string, b: string): boolean {
  const x = typeof a === 'string' ? a.trim() : String(a ?? '').trim()
  const y = typeof b === 'string' ? b.trim() : String(b ?? '').trim()
  return x.length > 0 && x === y
}

/** 删除一条访谈记录；调用方需同步清理 session 缓存（见 clearInterviewSessionCachesForProject） */
export function deleteProjectInterviewRecord(projectId: string, recordId: string): boolean {
  const pid = normalizeInterviewProjectId(projectId)
  const rid = typeof recordId === 'string' ? recordId.trim() : String(recordId ?? '').trim()
  if (!pid || !rid || typeof localStorage === 'undefined') return false
  const list = getProjectInterviewRecords(pid)
  const next = list.filter(r => !idsMatch(r.id, rid))
  if (next.length === list.length) return false
  try {
    localStorage.setItem(storageKey(pid), JSON.stringify(next))
  } catch {
    return false
  }
  return true
}

const CN_1_10 = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'] as const

export function nextInterviewTitle(projectId: string): string {
  const n = getProjectInterviewRecords(projectId).length + 1
  if (n >= 1 && n <= 10) return `访谈记录${CN_1_10[n - 1]}`
  return `访谈记录（${n}）`
}
