/**
 * 授信报告导出：将目录 + 章节 HTML 组装为可下载的 HTML 文件（CreditReport「下载报告」等调用）。
 */
import type {
  CreditReportDoc,
  CreditReportSection,
  CreditReportTocItem
} from '@/views/home/mock/creditReportMock'

interface DownloadCreditReportOptions {
  fileName: string
  reportTitle: string
  metrics: CreditReportDoc['metrics']
  toc: CreditReportTocItem[]
  sections: CreditReportSection[]
  tocToSectionId: Record<string, string>
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function sanitizeFileName(value: string): string {
  const trimmed = value.replace(/[<>:"/\\|?*\u0000-\u001F]/g, ' ').replace(/\s+/g, ' ').trim()
  return trimmed || 'credit-report'
}

function buildMetricsMarkup(metrics: CreditReportDoc['metrics']): string {
  if (!metrics.length) return ''

  const rows: string[] = []

  for (let index = 0; index < metrics.length; index += 2) {
    const left = metrics[index]
    const right = metrics[index + 1]

    rows.push(`
      <tr>
        <td class="summary-cell">
          ${left
            ? `
              <div class="summary-label">${escapeHtml(left.label)}</div>
              <div class="summary-value${left.highlight ? ' summary-value--highlight' : ''}">
                ${escapeHtml(left.value)}
              </div>
            `
            : '&nbsp;'}
        </td>
        <td class="summary-cell">
          ${right
            ? `
              <div class="summary-label">${escapeHtml(right.label)}</div>
              <div class="summary-value${right.highlight ? ' summary-value--highlight' : ''}">
                ${escapeHtml(right.value)}
              </div>
            `
            : '&nbsp;'}
        </td>
      </tr>
    `)
  }

  return `
    <table class="summary-table" cellpadding="0" cellspacing="0" border="0">
      ${rows.join('')}
    </table>
  `
}

function buildTocRows(
  items: CreditReportTocItem[],
  tocToSectionId: Record<string, string>,
  sectionTitleById: Record<string, string>,
  depth = 0
): string {
  return items
    .map(item => {
      const sectionId = tocToSectionId[item.id]
      const title = sectionId ? sectionTitleById[sectionId] || item.title : item.title
      const content = sectionId
        ? `<a href="#section-${sectionId}">${escapeHtml(title)}</a>`
        : `<span>${escapeHtml(title)}</span>`

      return `
        <tr>
          <td class="toc-cell toc-depth-${Math.min(depth, 3)}">${content}</td>
        </tr>
        ${item.children?.length
          ? buildTocRows(item.children, tocToSectionId, sectionTitleById, depth + 1)
          : ''}
      `
    })
    .join('')
}

function buildTocMarkup(
  items: CreditReportTocItem[],
  tocToSectionId: Record<string, string>,
  sectionTitleById: Record<string, string>
): string {
  return `
    <table class="toc-table" cellpadding="0" cellspacing="0" border="0">
      ${buildTocRows(items, tocToSectionId, sectionTitleById)}
    </table>
  `
}

function buildSectionsMarkup(sections: CreditReportSection[]): string {
  return sections
    .map(
      section => `
        <section id="section-${section.id}" class="section">
          <a name="section-${section.id}"></a>
          <p class="section-title">${escapeHtml(section.title)}</p>
          <div class="section-body">${section.bodyHtml}</div>
        </section>
      `
    )
    .join('')
}

function buildReportDocument({
  reportTitle,
  metrics,
  toc,
  sections,
  tocToSectionId
}: Omit<DownloadCreditReportOptions, 'fileName'>): string {
  const sectionTitleById = Object.fromEntries(sections.map(section => [section.id, section.title]))
  const metricsMarkup = buildMetricsMarkup(metrics)
  const tocMarkup = buildTocMarkup(toc, tocToSectionId, sectionTitleById)
  const sectionsMarkup = buildSectionsMarkup(sections)
  const exportTime = new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date())

  return `<!doctype html>
<html
  lang="zh-CN"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:w="urn:schemas-microsoft-com:office:word"
  xmlns="http://www.w3.org/TR/REC-html40"
>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(reportTitle)}</title>
    <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>100</w:Zoom>
          <w:DoNotOptimizeForBrowser />
        </w:WordDocument>
      </xml>
    <![endif]-->
    <style>
      @page {
        size: A4;
        margin: 24mm 18mm 24mm 18mm;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        font-family: "OPPO Sans", "PingFang SC", "Microsoft YaHei", sans-serif;
        font-size: 12pt;
        line-height: 1.75;
        color: #21243d;
        background: #ffffff;
      }

      .page {
        margin: 0 auto;
        padding: 0;
      }

      .header {
        padding: 0 0 20pt;
        border-bottom: 1.5pt solid #2036ca;
      }

      .document-kicker {
        margin: 0 0 10pt;
        font-size: 10.5pt;
        letter-spacing: 2pt;
        color: #7d86a5;
        text-transform: uppercase;
      }

      .title {
        margin: 0 0 10pt;
        font-size: 24pt;
        line-height: 1.35;
        color: #2036ca;
      }

      .document-meta {
        margin: 0;
        font-size: 10.5pt;
        color: #6f7895;
      }

      .summary-block,
      .toc,
      .content {
        margin-top: 18pt;
      }

      .block-title {
        margin: 0 0 10pt;
        padding: 0;
        border: none;
        font-size: 14pt;
        font-weight: 700;
        color: #2036ca;
      }

      .summary-table,
      .toc-table {
        width: 100%;
        border-collapse: collapse;
      }

      .summary-cell {
        width: 50%;
        padding: 12pt 14pt;
        border: 1pt solid #d9e0f5;
        vertical-align: top;
      }

      .summary-label {
        font-size: 10.5pt;
        color: #7d86a5;
      }

      .summary-value {
        margin-top: 6pt;
        font-size: 13.5pt;
        font-weight: 700;
        color: #2036ca;
      }

      .summary-value--highlight {
        color: #00baad;
      }

      .toc-cell {
        padding: 4pt 0;
        font-size: 11pt;
        line-height: 1.7;
        color: #2d3149;
      }

      .toc-depth-0 {
        padding-left: 0;
        font-weight: 700;
      }

      .toc-depth-1 {
        padding-left: 18pt;
      }

      .toc-depth-2 {
        padding-left: 36pt;
      }

      .toc-depth-3 {
        padding-left: 54pt;
      }

      .toc a,
      .toc span {
        color: #2d3149;
        text-decoration: none;
      }

      .page-break-before {
        page-break-before: always;
      }

      .section + .section {
        margin-top: 24pt;
        padding-top: 18pt;
        border-top: 1pt solid #e8ecf7;
      }

      .section-title {
        margin: 0 0 12pt;
        padding: 0;
        border: none;
        font-size: 15pt;
        font-weight: 700;
        line-height: 1.4;
        color: #2036ca;
      }

      .section-body {
        font-size: 12pt;
        line-height: 1.8;
        color: #21243d;
      }

      .section-body p {
        margin: 0 0 10pt;
        text-indent: 2em;
      }

      .section-body h3,
      .section-body h4 {
        margin: 14pt 0 8pt;
        color: #2d3149;
      }

      .section-body ul,
      .section-body ol {
        padding-left: 24pt;
        margin: 0 0 10pt;
      }

      .section-body li {
        margin: 0 0 4pt;
      }

      .section-body table {
        width: 100%;
        margin: 10pt 0;
        border-collapse: collapse;
      }

      .section-body th,
      .section-body td {
        border: 1pt solid #d9e0f5;
        padding: 6pt 8pt;
        vertical-align: top;
      }

      .section-body img {
        max-width: 100%;
      }
    </style>
  </head>
  <body>
    <div class="page">
      <header class="header">
        <p class="document-kicker">CREDIT REPORT</p>
        <h1 class="title">${escapeHtml(reportTitle)}</h1>
        <p class="document-meta">导出时间：${escapeHtml(exportTime)}</p>
      </header>
      <section class="summary-block">
        <p class="block-title">报告摘要</p>
        ${metricsMarkup}
      </section>
      <section class="toc page-break-before">
        <p class="block-title">目录</p>
        ${tocMarkup}
      </section>
      <article class="content page-break-before">
        <p class="block-title">正文</p>
        ${sectionsMarkup}
      </article>
    </div>
  </body>
</html>`
}

export function downloadCreditReportAsWord(options: DownloadCreditReportOptions): void {
  const html = buildReportDocument(options)
  const blob = new Blob(['\uFEFF', html], { type: 'application/msword;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = `${sanitizeFileName(options.fileName)}.doc`
  document.body.append(link)
  link.click()
  link.remove()

  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}
