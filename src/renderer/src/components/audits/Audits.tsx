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

// AckNo last 6 digits are ddmmyy -> return "YYYY-MM-DD"
const ackNoToISO = (ack?: string): string | undefined => {
  if (!ack) return undefined
  const digits = ack.replace(/\D/g, '')
  if (digits.length < 6) return undefined
  const last6 = digits.slice(-6)
  const dd = last6.slice(0, 2)
  const mm = last6.slice(2, 4)
  const yy = last6.slice(4, 6)
  // assume 20yy (adjust if you need 19xx for very old years)
  return `20${yy}-${mm}-${dd}`
}

const todayLocalISO = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })

const updateItrFiledOnIfMissing = async (
  row: AuditEntry,
  year: number,
  folderPath: string,
  setRows: React.Dispatch<React.SetStateAction<AuditEntry[]>>
) => {
  const current = row.accounts?.[year]?.itrFiledOn?.trim()
  if (current) return // already set

  // ask Book's helper from preload
  const res = await window.electronAPI.getAcknoFromFile?.(row.pan, folderPath, String(year))
  const ackNum = res?.success ? res.ackno?.num : undefined
  const iso = ackNoToISO(ackNum)
  if (!iso) return

  // optimistic UI
  const updated: AuditEntry = {
    ...row,
    accounts: {
      ...row.accounts,
      [year]: {
        ...(row.accounts?.[year] || {}),
        itrFiledOn: iso
      }
    }
  }
  setRows((prev) => prev.map((r) => (r.pan === row.pan ? updated : r)))

  // persist
  await window.electronAPI.updateAudit(updated)
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

  useEffect(() => {
    const folderPath = localStorage.getItem('selectedFolder')
    if (!folderPath) return
    if (!rows.length) return
    ;(async () => {
      for (const r of rows) {
        try {
          await updateItrFiledOnIfMissing(r, currentYear, folderPath, setRows)
        } catch (e) {
          console.error('Ack/ITR sync failed for', r.pan, e)
        }
      }
    })()
  }, [rows, currentYear]) // re-check when rows load or assessment year changes

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

  const accountantOptions = useMemo(() => {
    const set = new Set<string>()
    rows.forEach((r) => {
      Object.values(r.accounts || {}).forEach((acc) => {
        const a = (acc.accountant || '').trim()
        if (a) set.add(a)
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

    if (key === 'fee') {
      const prevFee = row.accounts?.[currentYear]?.fee
      const prevFeeDate = row.accounts?.[currentYear]?.feeDate
      if ((prevFee === undefined || prevFee === null) && !prevFeeDate) {
        updatedRow.accounts[currentYear].feeDate = todayLocalISO()
      }
      // carry forward still applies
      updatedRow = carryForwardLastYearFee(updatedRow, currentYear)
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
      const res = await window.electronAPI.saveAudit(data)
      if (res?.success && res.data) {
        setRows((prev) => [...prev, res.data])
        setDialogOpen(false)

        const folderPath = localStorage.getItem('selectedFolder')
        if (folderPath) {
          // try to set ITR Filed On from AckNo immediately
          await updateItrFiledOnIfMissing(res.data, currentYear, folderPath, setRows)
        }
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
        accountantOptions={accountantOptions}
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
