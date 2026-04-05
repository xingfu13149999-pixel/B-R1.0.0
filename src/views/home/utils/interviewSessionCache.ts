/**
 * 开始访谈页 session 缓存键（按项目 nodeId），与 InterviewSummaryPanel / InterviewStart 约定一致。
 * 仅在「访谈记录列表删除记录」等场景集中清理，避免结束录音后再次进入仍被 startRecording 误清。
 */
export const INTERVIEW_SESSION_SUMMARY_PREFIX = 'pd-interview-live-summary:'
export const INTERVIEW_SESSION_TRANSCRIPT_PREFIX = 'pd-interview-transcript-segments:'
export const INTERVIEW_SESSION_HOT_KEYWORDS_PREFIX = 'pd-interview-hot-keywords:'

export function clearInterviewSessionCachesForProject(projectId: string) {
  const pid = projectId?.trim()
  if (!pid || typeof sessionStorage === 'undefined') return
  for (const prefix of [
    INTERVIEW_SESSION_SUMMARY_PREFIX,
    INTERVIEW_SESSION_TRANSCRIPT_PREFIX,
    INTERVIEW_SESSION_HOT_KEYWORDS_PREFIX
  ]) {
    try {
      sessionStorage.removeItem(`${prefix}${pid}`)
    } catch {
      /* ignore */
    }
  }
}
