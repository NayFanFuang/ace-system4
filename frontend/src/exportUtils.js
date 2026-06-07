// Export utilities for Clock Monitor + KPI + HR
// Wraps jsPDF (PDF) + xlsx-js-style (Excel with cell styling)

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx-js-style'

const ACE_BLUE = [36, 71, 216]   // RGB
const ACE_RED  = [220, 38, 38]
const ACE_DARK = [15, 23, 42]

/**
 * Export rows to PDF with title + optional signature blocks
 * @param {Object} opts
 *   - title: string
 *   - subtitle: string
 *   - filename: string (default ace-export.pdf)
 *   - columns: [{ header, dataKey, width? }]
 *   - rows: array of objects
 *   - signatures: [{ label, line2 }] optional bottom sign blocks
 *   - landscape: boolean
 */
export function exportPdf({ title, subtitle, filename = 'ace-export.pdf', columns, rows, signatures = null, landscape = false }) {
  const doc = new jsPDF({ orientation: landscape ? 'landscape' : 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()

  // Header
  doc.setFillColor(...ACE_BLUE)
  doc.rect(0, 0, pageW, 18, 'F')
  doc.setTextColor(255)
  doc.setFontSize(14)
  doc.setFont(undefined, 'bold')
  doc.text(title || 'ACE Report', 10, 11)
  if (subtitle) {
    doc.setFontSize(9)
    doc.setFont(undefined, 'normal')
    doc.text(subtitle, 10, 16)
  }
  doc.setTextColor(...ACE_DARK)
  doc.setFontSize(8)
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageW - 10, 11, { align: 'right' })

  // Table
  autoTable(doc, {
    startY: 24,
    head: [columns.map(c => c.header)],
    body: rows.map(r => columns.map(c => {
      const v = r[c.dataKey]
      if (v == null) return '—'
      return String(v)
    })),
    headStyles: { fillColor: ACE_DARK, textColor: 255, fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 7.5, textColor: ACE_DARK },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 10, right: 10 },
    columnStyles: Object.fromEntries(columns.map((c, i) => [i, c.width ? { cellWidth: c.width } : {}])),
    didDrawPage: (data) => {
      // Footer page number
      doc.setFontSize(7)
      doc.setTextColor(120)
      doc.text(`Page ${doc.internal.getNumberOfPages()}`, pageW - 10, pageH - 8, { align: 'right' })
      doc.text('ACE System · AirConnect Engineering', 10, pageH - 8)
    },
  })

  // Signatures (bottom of last page)
  if (signatures?.length) {
    const lastY = doc.lastAutoTable.finalY || 40
    const sigY = Math.max(lastY + 25, pageH - 50)
    const sigWidth = (pageW - 30) / signatures.length
    signatures.forEach((sig, i) => {
      const x = 10 + i * sigWidth
      doc.setDrawColor(...ACE_DARK)
      doc.setLineWidth(0.3)
      doc.line(x + 10, sigY, x + sigWidth - 10, sigY)
      doc.setFontSize(8)
      doc.setTextColor(...ACE_DARK)
      doc.text(sig.label || '', x + sigWidth / 2, sigY + 5, { align: 'center' })
      if (sig.line2) {
        doc.setFontSize(7)
        doc.setTextColor(100)
        doc.text(sig.line2, x + sigWidth / 2, sigY + 10, { align: 'center' })
      }
    })
  }

  doc.save(filename)
}

/**
 * Export rows to styled Excel
 * @param {Object} opts
 *   - title: string (sheet name)
 *   - filename: string (default ace-export.xlsx)
 *   - columns: [{ header, dataKey, width?, color? (fn(row) → hex) }]
 *   - rows: array
 *   - subtitle: optional row above headers
 */
export function exportExcel({ title, filename = 'ace-export.xlsx', columns, rows, subtitle = '' }) {
  const wb = XLSX.utils.book_new()
  const aoa = []

  // Title row (merged)
  if (title) {
    aoa.push([title])
  }
  if (subtitle) {
    aoa.push([subtitle])
  }
  if (title || subtitle) {
    aoa.push([])  // blank row
  }

  // Headers
  aoa.push(columns.map(c => c.header))

  // Data rows
  rows.forEach(r => {
    aoa.push(columns.map(c => {
      const v = r[c.dataKey]
      return v == null ? '—' : v
    }))
  })

  const ws = XLSX.utils.aoa_to_sheet(aoa)
  const headerRowIdx = title ? (subtitle ? 3 : 2) : 0

  // Style title rows
  if (title) {
    ws['A1'].s = { font: { bold: true, sz: 14, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '2447D8' } }, alignment: { horizontal: 'center' } }
    if (!ws['!merges']) ws['!merges'] = []
    ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: columns.length - 1 } })
  }
  if (subtitle) {
    ws['A2'].s = { font: { italic: true, sz: 10, color: { rgb: '475569' } }, alignment: { horizontal: 'center' } }
    if (!ws['!merges']) ws['!merges'] = []
    ws['!merges'].push({ s: { r: 1, c: 0 }, e: { r: 1, c: columns.length - 1 } })
  }

  // Style headers
  columns.forEach((_, ci) => {
    const cellRef = XLSX.utils.encode_cell({ r: headerRowIdx, c: ci })
    if (!ws[cellRef]) return
    ws[cellRef].s = {
      font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 10 },
      fill: { fgColor: { rgb: '0F172A' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: {
        top: { style: 'thin', color: { rgb: '94A3B8' } },
        bottom: { style: 'thin', color: { rgb: '94A3B8' } },
        left: { style: 'thin', color: { rgb: '94A3B8' } },
        right: { style: 'thin', color: { rgb: '94A3B8' } },
      },
    }
  })

  // Style body rows
  rows.forEach((row, ri) => {
    columns.forEach((col, ci) => {
      const cellRef = XLSX.utils.encode_cell({ r: headerRowIdx + 1 + ri, c: ci })
      if (!ws[cellRef]) return
      const fgColor = typeof col.color === 'function' ? col.color(row) : null
      ws[cellRef].s = {
        font: { sz: 9, color: fgColor ? { rgb: 'FFFFFF' } : { rgb: '0F172A' } },
        fill: fgColor ? { fgColor: { rgb: fgColor } } : (ri % 2 ? { fgColor: { rgb: 'F8FAFC' } } : null),
        alignment: { horizontal: col.align || 'left', vertical: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: 'E2E8F0' } },
          bottom: { style: 'thin', color: { rgb: 'E2E8F0' } },
          left: { style: 'thin', color: { rgb: 'E2E8F0' } },
          right: { style: 'thin', color: { rgb: 'E2E8F0' } },
        },
      }
    })
  })

  // Column widths
  ws['!cols'] = columns.map(c => ({ wch: c.width || 14 }))

  XLSX.utils.book_append_sheet(wb, ws, (title || 'Data').slice(0, 31))
  XLSX.writeFile(wb, filename)
}

/**
 * Helper: get color for compliance/score percentage (0-100)
 */
export function colorForPct(pct) {
  if (pct == null || pct === '' || isNaN(pct)) return null
  const p = Number(pct)
  if (p >= 80) return '16A34A'    // green
  if (p >= 60) return 'CA8A04'    // amber
  if (p >= 40) return 'EA580C'    // orange
  return 'DC2626'                  // red
}
