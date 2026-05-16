export interface NoteTranscriptSegment {
  id: string
  speaker: string
  timeRange: string
  text: string
}

export interface NoteSummarySection {
  id: string
  title: string
  content: string
}

export interface NoteItem {
  id: string
  title: string
  detailTitle: string
  content: string
  updatedAt: string
  tag: string
  pinned: boolean
  detailParagraphs: string[]
  transcriptSegments: NoteTranscriptSegment[]
  summarySections: NoteSummarySection[]
}

export const NOTES_STORAGE_KEY = 'pd-my-notes-list'

const defaultTranscriptSegments: NoteTranscriptSegment[] = [
  {
    id: 'speaker-1',
    speaker: '发言人1',
    timeRange: '00:12:20-00:20:10',
    text: '大家好，你是不是也遇到过这样的情况，参加了一场重要的会议，回到办公室想要整理会议内容，却发现信息纷繁复杂难以整理，或在会议中主讲人的发言如同连珠炮，而你却在拼命记录，却总是感觉遗漏了关键好信息。'
  },
  {
    id: 'speaker-2',
    speaker: '发言人2',
    timeRange: '00:22:20-00:24:16',
    text: '首先您只需点击上传音视频按钮或点击开始录音，选择你想要转换的会议视频或会议录音。接着产品将自动进行语音识别和转换，将音视频内容转化为可编辑的文本。现在您可以看到转换后的文本内容，它不仅准确度高，而且支持多种编辑操作，方便您进行后续的整理和学习。'
  },
  {
    id: 'speaker-3',
    speaker: '发言人3',
    timeRange: '00:24:16-00:25:40',
    text: '在整理过程中，我们建议优先关注会议目标、待办事项、责任人和时间节点。这样可以让会议纪要不只是记录，更能真正服务于后续推进。'
  }
]

const defaultSummarySections: NoteSummarySection[] = [
  {
    id: 'summary-1',
    title: '会议主题',
    content: '围绕会议记录整理、语音转写效率提升以及后续事项推进方式展开讨论。'
  },
  {
    id: 'summary-2',
    title: '核心结论',
    content: '通过上传音视频或实时录音，可以快速完成高准确度的文本转写，并在此基础上形成结构化会议纪要。'
  },
  {
    id: 'summary-3',
    title: '待办事项',
    content: '补齐责任人分工、确认关键时间节点，并结合转写内容输出正式会议纪要与执行清单。'
  }
]

function buildDetailParagraphs(seed: string) {
  return [
    `      ${seed}哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！`,
    `      ${seed}哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！`,
    `      ${seed}哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！`
  ]
}

function createNote(
  id: string,
  tag: string,
  pinned: boolean,
  content: string
): NoteItem {
  return {
    id,
    title: '笔记 2026-06-11 15:43:46',
    detailTitle: '笔记 2026-06-11 15:42:20',
    content,
    updatedAt: '2026-03-26 16:47:32',
    tag,
    pinned,
    detailParagraphs: buildDetailParagraphs(content.slice(0, 18)),
    transcriptSegments: defaultTranscriptSegments,
    summarySections: defaultSummarySections
  }
}

export const defaultNotes: NoteItem[] = [
  createNote('note-1', '重要会议', true, '哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！...'),
  createNote('note-2', '项目会议', false, '哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！...'),
  createNote('note-3', '项目会议', true, '哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！...'),
  createNote('note-4', '项目会议', false, '哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！...'),
  createNote('note-5', '项目会议', false, '哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！...'),
  createNote('note-6', '项目会议', false, '哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！...'),
  createNote('note-7', '项目会议', true, '哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！...'),
  createNote('note-8', '项目会议', false, '哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！...'),
  createNote('note-9', '重要会议', true, '哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！...'),
  createNote('note-10', '项目会议', false, '哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！...'),
  createNote('note-11', '项目会议', false, '哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！哈喽咯！...')
]

export function loadNotes(): NoteItem[] {
  try {
    const raw = localStorage.getItem(NOTES_STORAGE_KEY)
    if (!raw) return defaultNotes
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || !parsed.length) return defaultNotes

    return parsed.map((rawNote, index) => {
      const fallback: NoteItem = defaultNotes[index] ?? defaultNotes[0]!
      const title = typeof rawNote?.title === 'string' && rawNote.title.trim() ? rawNote.title : fallback.title
      return {
        ...fallback,
        ...rawNote,
        title,
        detailTitle:
          typeof rawNote?.detailTitle === 'string' && rawNote.detailTitle.trim()
            ? rawNote.detailTitle
            : fallback.detailTitle || title,
        detailParagraphs:
          Array.isArray(rawNote?.detailParagraphs) && rawNote.detailParagraphs.length
            ? rawNote.detailParagraphs
            : fallback.detailParagraphs,
        transcriptSegments:
          Array.isArray(rawNote?.transcriptSegments) && rawNote.transcriptSegments.length
            ? rawNote.transcriptSegments
            : fallback.transcriptSegments,
        summarySections:
          Array.isArray(rawNote?.summarySections) && rawNote.summarySections.length
            ? rawNote.summarySections
            : fallback.summarySections
      }
    })
  } catch {
    return defaultNotes
  }
}

export function saveNotes(notes: NoteItem[]) {
  localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes))
}

export function findNoteById(noteId: string) {
  return loadNotes().find(note => note.id === noteId) ?? null
}
