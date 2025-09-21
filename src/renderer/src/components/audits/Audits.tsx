import React, { useEffect, useMemo, useState } from 'react'
import Layout from '../helpers/Layout'
import AuditsTable, { OnAuditCellEdit } from './AuditsTable'
import AuditsDialog from './AuditsDialog'
import { searchBarStyle, btnStyle, entriesStyle, containerStyle } from './Audits.styles'
import DeleteAuditDialog from './DeleteAuditDialog'

const carryForwardLastYearFee = (entry: AuditEntry, baseYear: number): AuditEntry => {
  const fee = entry.accounts?.[baseYear]?.fee
  if (fee == null) return entry
  return {
    ...entry,
    accounts: {
      ...entry.accounts,
      [baseYear + 1]: {
        ...(entry.accounts[baseYear + 1] || {}),
        lastYearFee: Number(fee) || 0
      }
    }
  }
}

// put above the component or inside it before useMemo calls
const getDisplayCAForYear = (entry: AuditEntry, yr: number): string => {
  const years = Object.keys(entry.accounts || {})
    .map(Number)
    .sort((a, b) => a - b)
  const caYears = years.filter((y) => (entry.accounts[y]?.sentToCA || '').trim().length > 0)
  if (caYears.length === 0) return ''
  const le = caYears.filter((y) => y <= yr).pop()
  if (le !== undefined) return (entry.accounts[le]!.sentToCA || '').trim()
  return (entry.accounts[caYears[0]]!.sentToCA || '').trim()
}

const Audits: React.FC = () => {
  const [rows, setRows] = useState<AuditEntry[]>([])
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const currentYearStr = localStorage.getItem('selectedYear')!
  const currentYear = Number(currentYearStr)

  useEffect(() => {
    let mounted = true
    window.electronAPI
      .loadAudits()
      .then((data) => {
        if (!mounted) return
        setRows(Array.isArray(data) ? data : [])
      })
      .catch((err) => console.error('load-audits failed:', err))
    return () => {
      mounted = false
    }
  }, [])

  const caOptions = useMemo(() => {
    const set = new Set<string>()
    rows.forEach((r) => {
      Object.values(r.accounts || {}).forEach((acc) => {
        const ca = (acc.sentToCA || '').trim()
        if (ca) set.add(ca)
      })
    })
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [rows])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) => {
      const ca = getDisplayCAForYear(r, currentYear).toLowerCase()
      return r.name.toLowerCase().includes(q) || ca.includes(q)
    })
  }, [rows, search, currentYear])

  const onCellEdit: OnAuditCellEdit = async (pan, key, value) => {
    const row = rows.find((r) => r.pan === pan)
    if (!row) return

    // base update (Rule #2)
    let updatedRow: AuditEntry = {
      ...row,
      accounts: {
        ...row.accounts,
        [currentYear]: {
          ...(row.accounts[currentYear] || {}),
          [key]: value as any
        }
      }
    }

    // Rule #3: if editing `fee` in year Y, set (Y+1).lastYearFee = fee
    if (key === 'fee') {
      updatedRow = carryForwardLastYearFee(updatedRow, currentYear)
    }

    // optimistic UI
    setRows((prev) => prev.map((r) => (r.pan === pan ? updatedRow : r)))

    // persist
    const res = await window.electronAPI.updateAudit(updatedRow)
    if (!res?.success) {
      const fresh = await window.electronAPI.loadAudits()
      setRows(Array.isArray(fresh) ? fresh : [])
      console.error('Update failed:', res?.error)
    }
  }

  const handleDialogSubmit = async (data: AuditEntry) => {
    try {
      // Rule #1 (dialog can set lastYearFee directly) is already satisfied by `data`
      // Rule #3: if dialog has `fee` for currentYear, set next year's lastYearFee
      const toSave = carryForwardLastYearFee(data, currentYear)

      const res = await window.electronAPI.saveAudit(toSave)
      if (res?.success && res.data) {
        setRows((prev) => [...prev, res.data])
        setDialogOpen(false)
      } else {
        alert(res?.error ?? 'Failed to save audit entry')
      }
    } catch (e) {
      console.error(e)
      alert('Failed to save audit entry')
    }
  }

  const handleDelete = async (pan: string) => {
    try {
      const res = await window.electronAPI.deleteAudit(pan)
      if (res?.success) {
        setRows((prev) => prev.filter((r) => r.pan.toUpperCase() !== pan.toUpperCase()))
        setDeleteOpen(false)
      } else {
        alert(res?.error ?? 'Failed to delete audit entry')
      }
    } catch (e) {
      console.error(e)
      alert('Failed to delete audit entry')
    }
  }

  return (
    <Layout title="📝 Audit Windows">
      <div style={containerStyle}>
        <input
          type="text"
          placeholder="Search audits"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={searchBarStyle}
        />

        <button type="button" onClick={() => setDialogOpen(true)} style={btnStyle}>
          New Entry
        </button>

        <button
          type="button"
          onClick={() => setDeleteOpen(true)}
          style={{ ...btnStyle, marginLeft: 8 }}
        >
          Delete Entry
        </button>

        <div style={entriesStyle}>Total entries: {filtered.length}</div>
      </div>

      <AuditsTable
        rows={filtered}
        onCellEdit={onCellEdit}
        caOptions={caOptions}
        year={currentYear}
      />

      <AuditsDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleDialogSubmit}
        caOptions={caOptions}
      />

      <DeleteAuditDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
      />
    </Layout>
  )
}

export default Audits
