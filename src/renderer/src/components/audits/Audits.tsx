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

    const loadAll = async () => {
      try {
        const [audits, entries] = await Promise.all([
          window.electronAPI.loadAudits(),
          window.electronAPI.loadEntries()
        ])

        if (!mounted) return

        const auditRows = Array.isArray(audits) ? audits : []

        console.log('Extracted audits:', extractAuditCases(entries, currentYear, auditRows))

        // extract audit entries from entries.json
        const entryAuditRows = extractAuditCases(entries, currentYear, auditRows)

        // merge both
        const combined = [...auditRows, ...entryAuditRows]
        console.log('Final combined audits:', combined)

        setRows(combined)
      } catch (err) {
        console.error('load-all failed:', err)
      }
    }

    loadAll()
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

  const extractAuditCases = (
    entries: any,
    year: number,
    existingAudits: AuditEntry[]
  ): AuditEntry[] => {
    if (!entries) return []

    // Create a Set of existing PANs for fast lookup
    const existingPANs = new Set(existingAudits.map((audit) => audit.pan.toUpperCase()))

    return entries
      .filter((e: Entry) => {
        if (!e.auditCase || !Array.isArray(e.auditCase)) return false

        // Check if PAN already exists in audit cases
        if (existingPANs.has(e.pan.toUpperCase())) return false

        return e.auditCase.some(
          (audit: { year: string; value: boolean }) =>
            Number(audit.year) === year && audit.value === true
        )
      })
      .map((e: Entry) => ({
        pan: e.pan,
        name: e.name,
        accounts: {
          [year]: {}, // Ensure current year exists
          [year + 1]: {} // Ensure next year exists
        }
      }))
  }

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

    if (!res?.success && res?.error === 'Audit entry not found.') {
      // Entry doesn't exist in audits.json, save it as new
      await window.electronAPI.saveAudit(updatedRow)
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
      {/* --- PRINT STYLES --- */}
      <style>{`
        .print-only { visibility: hidden; zoom: 0.1 }

        .print-value { display: none; }

        @media print {
          @page { size: A4 landscape; margin: 6mm; }

          .print-only { visibility: unset; zoom: 1 }

          .print-value { display: none; }

          :root {
            --accent: #4f46e5;        /* platform indigo */
            --row-alt: #f6f8ff;       /* very light indigo for zebra */
            --grid: #e5e7eb;          /* slate-200 borders */
            --ink: #111;              /* text */
            --ink-muted: #6b7280;     /* slate-500 */
          }

          /* Show only audits area */
          body * { visibility: hidden; }
          #audits-printable, #audits-printable * { visibility: visible; }
          #audits-printable {
            position: absolute; left: 0; top: 0; width: 100%;
            -webkit-print-color-adjust: exact; print-color-adjust: exact;
            font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial;
            color: var(--ink);
          }

          /* Let table paginate (no scroll clipping) */
          #audits-printable .audits-scroll { overflow: visible !important; max-height: none !important; }

          /* Repeat header per page; avoid row splits */
          #audits-printable thead { display: table-header-group; }
          #audits-printable tfoot { display: table-footer-group; }
          #audits-printable tr, #audits-printable td, #audits-printable th { page-break-inside: avoid; }

          /* Table visuals */
          #audits-printable table {
            width: 100% !important;
            min-width: 0 !important;
            table-layout: auto !important;
            border-collapse: collapse;
            border: 0.5pt solid var(--grid);
            font-size: 11px;
            line-height: 1.25;
          }
          #audits-printable col { width: auto !important; }

          /* Colored header */
          #audits-printable thead th {
            position: static !important; /* disable sticky in print */
            background: var(--accent) !important;
            color: #fff !important;
            font-weight: 700;
            padding: 6px 8px;
            border-bottom: 1pt solid #333;
          }

          /* Cells */
          #audits-printable td {
            border: 0.5pt solid var(--grid);
            padding: 4px 6px;
            vertical-align: top;
          }

          /* Zebra */
          #audits-printable tbody tr:nth-child(even) td { background: var(--row-alt); }

          /* Numbers right-aligned (Last Year Fee, Fee) */
          #audits-printable td:nth-child(8),
          #audits-printable td:nth-child(9) {
            text-align: right;
            font-variant-numeric: tabular-nums;
          }

          /* Name truncation (from earlier) */
          #audits-printable td.name-col .name-text,
          #audits-printable td.name-col .print-trunc {
            display: inline-block !important;
            width: 24ch !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            font-weight: 600 !important;
            color: #000 !important;
          }
          #audits-printable th:nth-child(2) { width: 24ch !important; }

          /* 👇 PRINT VALUES: hide inputs/selects, show spans with dash fallback */
          #audits-printable input,
          #audits-printable select {
            display: none !important;
          }
          #audits-printable .print-value {
            display: inline !important;
            color: var(--ink);
          }

          /* Muted dash color (optional) */
          #audits-printable .print-value:empty::after { content: ''; color: var(--ink-muted); }
          #audits-printable th:nth-child(1),
          #audits-printable td:nth-child(1) {
            width: 5ch !important;
            white-space: nowrap !important;
          }
        }

      `}</style>

      {/* --- your toolbar --- */}
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

        {/* PRINT BUTTON */}
        <button
          type="button"
          onClick={() => setTimeout(() => window.print(), 50)}
          style={{ ...btnStyle, marginLeft: 8 }}
          className="screen-only"
          title="Print visible rows"
        >
          🖨️ Print
        </button>

        <div style={entriesStyle}>Total entries: {filtered.length}</div>
      </div>

      {/* --- PRINTABLE AREA --- */}
      <div id="audits-printable">
        {/* Print header (shows only on print) */}
        <div className="print-only" style={{ margin: '0 0 12px 0' }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>Audit Register</div>
          <div style={{ fontSize: 12 }}>
            AY: {currentYear} • Printed: {new Date().toLocaleString('en-IN')}
            {search?.trim() ? ` • Filter: "${search.trim()}"` : ''}
          </div>
        </div>

        <AuditsTable
          rows={filtered}
          onCellEdit={onCellEdit}
          caOptions={caOptions}
          accountantOptions={accountantOptions}
          year={currentYear}
        />
      </div>

      {/* dialogs (won't print) */}
      <AuditsDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleDialogSubmit}
        caOptions={caOptions}
        accountantOptions={accountantOptions}
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
