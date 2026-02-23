import type { GeneratedCodeRow } from './types'

function escapeCsvCell(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export function downloadCsv(rows: GeneratedCodeRow[], filenameBase: string): void {
  const header = 'code,barangay,status,expiry'
  const body = rows
    .map((row) => [row.code, row.barangay, row.status, row.expiry].map(escapeCsvCell).join(','))
    .join('\n')

  const csv = `${header}\n${body}`
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filenameBase}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function escapePdfText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

function buildSimplePdf(lines: string[]): Uint8Array {
  const safeLines = lines.length ? lines : ['No codes available']
  const linesPerPage = 45
  const chunks: string[][] = []

  for (let i = 0; i < safeLines.length; i += linesPerPage) {
    chunks.push(safeLines.slice(i, i + linesPerPage))
  }

  const objects: Array<{ id: number; content: string }> = []
  const catalogId = 1
  const pagesId = 2
  const pageObjectIds: number[] = []
  const fontId = 3 + chunks.length * 2
  let nextId = 3

  for (const chunk of chunks) {
    const pageId = nextId++
    const contentId = nextId++
    pageObjectIds.push(pageId)

    const textOps = [
      'BT',
      '/F1 10 Tf',
      '50 760 Td',
      ...chunk.flatMap((line, index) => {
        const escaped = escapePdfText(line)
        return index === 0 ? [`(${escaped}) Tj`] : ['0 -14 Td', `(${escaped}) Tj`]
      }),
      'ET',
    ].join('\n')

    objects.push({
      id: contentId,
      content: `<< /Length ${textOps.length} >>\nstream\n${textOps}\nendstream`,
    })

    objects.push({
      id: pageId,
      content: `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>`,
    })
  }

  objects.push({
    id: catalogId,
    content: `<< /Type /Catalog /Pages ${pagesId} 0 R >>`,
  })

  objects.push({
    id: pagesId,
    content: `<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageObjectIds.length} >>`,
  })

  objects.push({
    id: fontId,
    content: '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  })

  objects.sort((a, b) => a.id - b.id)

  let pdf = '%PDF-1.4\n'
  const offsets: number[] = [0]

  for (const object of objects) {
    offsets[object.id] = pdf.length
    pdf += `${object.id} 0 obj\n${object.content}\nendobj\n`
  }

  const xrefOffset = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n`
  pdf += '0000000000 65535 f \n'

  for (let id = 1; id <= objects.length; id++) {
    const offset = String(offsets[id] || 0).padStart(10, '0')
    pdf += `${offset} 00000 n \n`
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`

  return new TextEncoder().encode(pdf)
}

export function downloadPdf(rows: GeneratedCodeRow[], filenameBase: string, title: string): void {
  const lines = [
    title,
    '',
    'Code | Barangay | Status | Expiry',
    ...rows.map((row) => `${row.code} | ${row.barangay} | ${row.status} | ${row.expiry}`),
  ]

  const bytes = buildSimplePdf(lines)
  const pdfBuffer = new ArrayBuffer(bytes.byteLength)
  new Uint8Array(pdfBuffer).set(bytes)
  const blob = new Blob([pdfBuffer], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filenameBase}.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function copyToClipboard(text: string): Promise<void> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', 'true')
  textarea.style.position = 'absolute'
  textarea.style.left = '-9999px'
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy')
  document.body.removeChild(textarea)
}

