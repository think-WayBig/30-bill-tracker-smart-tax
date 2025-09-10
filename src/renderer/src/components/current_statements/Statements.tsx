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
      const rows = await window.electronAPI.loadStatements()
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
        await window.electronAPI.saveStatement({
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

      const saved = await window.electronAPI.loadStatements()
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
        await window.electronAPI.updateStatement(row)
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
      const res = await window.electronAPI.deleteStatement(rowId)
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
    <Layout title="🏦 Manage Bank Statements" hideAssessmentYear>
      <SectionHeader
        title="Current Statements"
        description="Import and manage your bank statements by uploading an Excel file."
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
          onMouseOver={(e) => (e.currentTarget.style.background = '#4f46e5')}
          onMouseOut={(e) => (e.currentTarget.style.background = '#6366f1')}
        >
          Import
        </button>

        <button
          type="button"
          onClick={() => setEditMode((prev) => !prev)}
          style={{
            ...importBtnStyle,
            background: '#ffff',
            border: '1px solid #6366f1'
          }}
        >
          {editMode ? '🔒' : '✏️'}
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
    </Layout>
  )
}

export default Statements
