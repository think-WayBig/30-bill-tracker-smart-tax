import React, { useEffect, useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import Layout from '../helpers/Layout'
import { SectionHeader } from '../helpers/SectionHeader'
import { StatementsEditorDialog } from './StatementsEditorDialog'
import { StatementsTable, OnCellEdit } from './StatementsTable'
import {
  emptyStatementStyle,
  importBtnStyle,
  searchBarContainerStyle,
  searchBarStyle
} from './Statement.styles'

const BANK_HEADERS = [
  'date',
  'narration',
  'chqNo',
  'valueDt',
  'withdrawal',
  'deposit',
  'closing',
  'name',
  'txnType'
] as const

const toRows = (data: any[][]): BankStatementRow[] => {
  return data.slice(1).map((row) => {
    const obj: any = {}
    BANK_HEADERS.forEach((key, idx) => {
      obj[key] = row[idx] != null ? String(row[idx]) : ''
    })
    return obj as BankStatementRow
  })
}

const SAVE_DEBOUNCE_MS = 500

type SaveTimers = Map<string, number> // rowId -> timeout id

const Statements: React.FC = () => {
  // Final saved rows
  const [fileData, setFileData] = useState<BankStatementRow[]>([])

  // Temporary preview before Save
  const [previewData, setPreviewData] = useState<string[][]>([])

  const [editMode, setEditMode] = useState(false)

  const [showDialog, setShowDialog] = useState(false)
  const [query, setQuery] = useState('')

  const inputRef = useRef<HTMLInputElement>(null)
  const saveTimersRef = useRef<SaveTimers>(new Map())
  useEffect(() => {
    ;(async () => {
      const rows = await window.electronAPI.loadStatements2()
      setFileData(rows ?? [])
    })()
  }, [])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data, { type: 'array', cellDates: true })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        raw: false
      }) as any[][]

      setPreviewData(jsonData)
      setShowDialog(true)
    } catch (error) {
      alert(`❌ Failed to import file: ${error}`)
    } finally {
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleSave = async (updated: string[][]) => {
    try {
      // save each row
      const rows = toRows(updated)
      for (const row of rows) {
        await window.electronAPI.saveStatement2({
          date: row.date,
          narration: row.narration,
          chqNo: row.chqNo,
          valueDt: row.valueDt,
          withdrawal: row.withdrawal,
          deposit: row.deposit,
          closing: row.closing,
          name: row.name,
          txnType: row.txnType
        })
      }

      const saved = await window.electronAPI.loadStatements2()
      setFileData(saved ?? [])

      setPreviewData([])
      setShowDialog(false)
      alert('✅ Statements saved successfully!')
    } catch (err: any) {
      alert(`❌ Failed to save statements: ${err?.message || err}`)
    }
  }

  const scheduleSaveRow = (row: BankStatementRow) => {
    const id = row.id
    if (!id) return

    // clear previous timer
    const prev = saveTimersRef.current.get(id)
    if (prev) window.clearTimeout(prev)

    const t = window.setTimeout(async () => {
      try {
        await window.electronAPI.updateStatement2(row)
      } catch (e: any) {
        console.error(e)
        alert(`❌ Failed to save change for row ${id}: ${e?.message || e}`)
      } finally {
        saveTimersRef.current.delete(id)
      }
    }, SAVE_DEBOUNCE_MS)

    saveTimersRef.current.set(id, t)
  }

  const handleCellEdit: OnCellEdit = (rowId, key, value) => {
    setFileData((prev) => {
      const next = prev.map((r) =>
        r.id === rowId ? ({ ...r, [key]: value } as BankStatementRow) : r
      )
      const edited = next.find((r) => r.id === rowId)!
      // schedule debounced save for this single row
      scheduleSaveRow(edited)
      return next
    })
  }

  const handleDeleteRow = async (rowId: string) => {
    try {
      const res = await window.electronAPI.deleteStatement2(rowId)
      if (!res?.success) {
        alert(`❌ Failed to delete: ${res?.error || 'Unknown error'}`)
        return
      }
      setFileData((prev) => prev.filter((r) => r.id !== rowId))
    } catch (e: any) {
      alert(`❌ Failed to delete: ${e?.message || e}`)
    }
  }

  return (
    <Layout title="🏦 Manage Bank Statements" hideAssessmentYear color="#d35f00ff">
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 8mm; }

          /* Hide everything except the printable area */
          body * { visibility: hidden; }
          #printable, #printable * { visibility: visible; }
          #printable { position: absolute; left: 0; top: 0; width: 100%; }

          /* Hide app chrome / controls */
          .app-toolbar, button, input[type="file"] { display: none !important; }

          /* Table niceties */
          table { width: 100% !important; table-layout: auto !important; }
          thead { display: table-header-group; }  /* repeat header on every page */
          tfoot { display: table-footer-group; }
          tr, td, th { page-break-inside: avoid; }

          /* Optional: remove backgrounds for better B/W printing */
          th { background: #fff !important; color: #000 !important; }

          textarea, input {
            background: none !important;
            border: 0 !important;
            padding: 0 !important;
            resize: none !important;
            box-shadow: none !important;
          }

          tfoot {
            zoom: 0.9
          }
        }

        /* Show only in print */
        .print-only { display: none; }
        @media print { .print-only { display: block; } }

        /* Hide in print */
        .screen-only { display: block; }
        @media print { .screen-only { display: none !important; } }

        @media print {
          /* Subtle, readable typography */
          #printable {
            font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial;
            color: #111;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          /* Neat grid with soft borders */
          #printable table {
            border-collapse: collapse;            /* cosmetic only */
            border: 0.5pt solid #e5e7eb;
            border-radius: 8px;
            overflow: hidden;                     /* keeps rounded corners on PDF */
          }

          #printable th, #printable td {
            border: 0.5pt solid #e5e7eb;          /* light cell lines */
            line-height: 1.25;
          }

          /* Stronger rule under header, keep your white header bg */
          #printable thead th {
            font-weight: 700;
            border-bottom: 1pt solid #111;
          }

          /* Zebra striping for readability (very light) */
          #printable tbody tr:nth-child(even) td {
            background: #fafafa;
          }

          /* Right-align numeric columns (5=Withdrawal, 6=Deposit, 7=Closing) */
          #printable tbody td:nth-child(5),
          #printable tbody td:nth-child(6),
          #printable tbody td:nth-child(7),
          #printable tfoot td:nth-child(5),
          #printable tfoot td:nth-child(6),
          #printable tfoot td:nth-child(7) {
            text-align: right;
            font-variant-numeric: tabular-nums;   /* aligned digits */
          }

          /* Slight emphasis for footer */
          #printable tfoot td {
            background: #f5f5f5;
            font-weight: 600;
          }
        }

        @media print {
          /* Accent color */
          :root {
            --accent-color: #ff7403ff;
          }

          /* Header with accent background */
          #printable thead th {
            background: var(--accent-color) !important;
            color: #fff !important;
            font-weight: 700;
            border-bottom: 1pt solid #333;
          }

          /* Footer with lighter accent */
          #printable tfoot td {
            background: #fff7f1ff !important; /* pale indigo */
            color: #111 !important;
            font-weight: 600;
          }

          /* Stronger borders on totals row */
          #printable tfoot tr:last-child td {
            border-top: 2pt solid var(--accent-color);
          }

          /* Accent highlights for numbers (optional) */
          #printable tfoot td:nth-child(5),
          #printable tfoot td:nth-child(6),
          #printable tfoot td:nth-child(7) {
            color: var(--accent-color);
            font-weight: 700;
          }

          /* Keep zebra striping, but soften it */
          #printable tbody tr:nth-child(even) td {
            background: #f9fafb;
          }
        }
      `}</style>
      <SectionHeader
        title="Savings Statements"
        description="Import and manage your bank statements by uploading an Excel file."
        color="#ff7403ff"
      />

      {/* Toolbar */}
      <div style={searchBarContainerStyle}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search bills..."
          aria-label="Search bills"
          style={searchBarStyle}
        />

        <div style={{ width: 1, alignSelf: 'stretch', background: '#e5e7eb' }} />

        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          id="excel-upload"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          style={importBtnStyle}
          onMouseOver={(e) => (e.currentTarget.style.background = '#d35f00ff')}
          onMouseOut={(e) => (e.currentTarget.style.background = '#ff7403ff')}
        >
          📄 Import
        </button>

        <button
          type="button"
          onClick={() => setEditMode((prev) => !prev)}
          style={{
            ...importBtnStyle,
            background: '#ffff',
            color: '#d35f00ff',
            border: '1px solid #d35f00ff'
          }}
        >
          {editMode ? '🔒 Lock' : '✏️ Edit'}
        </button>

        <button
          type="button"
          onClick={() => {
            // optional: lock edits for cleaner print
            if (editMode) setEditMode(false)
            // wait a tick if you just toggled edit mode
            setTimeout(() => window.print(), 50)
          }}
          style={importBtnStyle}
          onMouseOver={(e) => (e.currentTarget.style.background = '#d35f00ff')}
          onMouseOut={(e) => (e.currentTarget.style.background = '#ff7403ff')}
          className="screen-only"
          aria-label="Print visible rows"
          title="Print visible rows"
        >
          🖨️ Print
        </button>
      </div>

      {/* Dialog */}
      <StatementsEditorDialog
        open={showDialog}
        data={previewData}
        onClose={() => {
          setPreviewData([])
          setShowDialog(false)
        }}
        onSave={handleSave}
      />

      <div id="printable">
        {/* Print header (only shows on print) */}
        <div className="print-only" style={{ marginBottom: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>Bank Statements</div>
          <div style={{ fontSize: 12 }}>
            Printed: {new Date().toLocaleString()}
            {query?.trim() ? `  •  Filter: "${query.trim()}"` : ''}
          </div>
        </div>
        {fileData.length > 0 && (
          <StatementsTable
            rows={fileData}
            onCellEdit={handleCellEdit}
            onRowDelete={handleDeleteRow}
            query={query}
            editMode={editMode}
          />
        )}

        {fileData.length === 0 && (
          <div style={emptyStatementStyle}>
            No statements yet. Import an Excel file to get started.
          </div>
        )}
      </div>
    </Layout>
  )
}

export default Statements
