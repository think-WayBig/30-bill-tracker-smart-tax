import React, { useEffect, useState } from 'react'
import Layout from '../helpers/Layout'
import { SectionHeader } from '../helpers/SectionHeader'
import { StatementsTable } from './StatementsTable'
import { importBtnStyle, searchBarContainerStyle, searchBarStyle } from './Statement.styles'

const DeletedStatements: React.FC = () => {
  const [rows, setRows] = useState<BankStatementRow[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [query, setQuery] = useState('') // ← NEW

  // --- Financial year (same logic as your main screen) ---
  const rawSelected = localStorage.getItem('selectedYear')!
  let startYear: number, endYear: number
  if (rawSelected.includes('-')) {
    const [a, b] = rawSelected.split('-').map((s) => s.trim())
    startYear = Number(a.length === 2 ? `20${a}` : a)
    endYear = Number(b.length === 2 ? `20${b}` : b)
  } else {
    const y = Number(rawSelected.length === 2 ? `20${rawSelected}` : rawSelected)
    startYear = y
    endYear = y + 1
  }
  const startDate = new Date(`${startYear}-04-01`)
  const endDate = new Date(`${endYear}-03-31`)

  // --- Load deleted rows for current FY ---
  useEffect(() => {
    ;(async () => {
      const all = (await window.electronAPI.loadStatements()) ?? []
      const fyDeleted = all.filter((r: BankStatementRow) => {
        if (!r.deleted) return false
        if (!r.date) return false
        const [d, m, y] = r.date.split('/').map((v) => v.trim())
        const fullYear = y.length === 2 ? Number(`20${y}`) : Number(y)
        const dt = new Date(`${fullYear}-${m}-${d}`)
        return dt >= startDate && dt <= endDate
      })
      setRows(fyDeleted)
    })()
  }, [startDate.getTime(), endDate.getTime()])

  // --- Selection handlers (unchanged) ---
  const onToggleRow = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      checked ? next.add(id) : next.delete(id)
      return next
    })
  }
  const onToggleAll = (checked: boolean, visibleIds: string[]) => {
    setSelectedIds(() => (checked ? new Set(visibleIds) : new Set()))
  }

  // Scrub selection when rows or search change (so hidden items don’t stay selected)
  useEffect(() => {
    setSelectedIds((prev) => {
      // 'rows' here are only FY+deleted filtered; the table will do query filtering,
      // but we can still prune against FY set to be safe.
      const allowed = new Set(rows.map((r) => r.id))
      const next = new Set<string>()
      prev.forEach((id) => {
        if (allowed.has(id)) next.add(id)
      })
      return next
    })
  }, [rows, query])

  const restoreSelected = async () => {
    if (selectedIds.size === 0) return
    const ids = Array.from(selectedIds)
    try {
      for (const id of ids) {
        const row = rows.find((r) => r.id === id)
        if (!row) continue
        await window.electronAPI.updateStatement({ ...row, deleted: false })
      }
      setRows((prev) => prev.filter((r) => !selectedIds.has(r.id)))
      setSelectedIds(new Set())
      alert('✅ Restored')
    } catch (e: any) {
      alert(`❌ Failed to restore: ${e?.message || e}`)
    }
  }

  return (
    <Layout title="🗂️ Deleted Statements" financialYear>
      <SectionHeader
        title="Deleted Statements"
        description="Soft-deleted rows. Search, select, and restore."
      />

      {/* Search + actions (mirrors main view styling) */}
      <div style={searchBarContainerStyle}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search deleted statements..."
          aria-label="Search deleted statements"
          style={searchBarStyle}
        />

        <div style={{ width: 1, alignSelf: 'stretch', background: '#e5e7eb' }} />

        <button
          type="button"
          onClick={restoreSelected}
          disabled={selectedIds.size === 0}
          style={{
            ...importBtnStyle,
            background: selectedIds.size ? '#16a34a' : '#f3f4f6',
            color: selectedIds.size ? '#fff' : '#9ca3af',
            border: '1px solid #16a34a'
          }}
          title={selectedIds.size ? 'Restore selected' : 'Select rows to restore'}
        >
          ♻️ Restore
        </button>
      </div>

      {rows.length > 0 ? (
        <StatementsTable
          rows={rows} // FY+deleted filtered set
          onCellEdit={() => {}}
          onRowDelete={() => {}}
          query={query} // ← NEW: same search experience
          editMode={false}
          showUnnamed={false}
          editingNameRowId={null}
          setEditingNameRowId={() => {}}
          selectedIds={selectedIds}
          onToggleRow={onToggleRow}
          onToggleAll={onToggleAll}
          onSearchName={function (): void {
            throw new Error('Function not implemented.')
          }}
        />
      ) : (
        <div style={{ padding: 24, color: '#6b7280' }}>No deleted statements for this year.</div>
      )}
    </Layout>
  )
}

export default DeletedStatements
