import React, { useEffect, useMemo, useRef, useState } from 'react'
import Layout from '../helpers/Layout'
import { SectionHeader } from '../helpers/SectionHeader'
import {
  importBtnStyle,
  searchBarContainerStyle,
  searchBarStyle,
  feeTableContainerStyle,
  feeTableStyle,
  feeHeaderCellStyle,
  feeRowStyle,
  feeCellStyle,
  feeInputStyle,
  feeNameCellStyle,
  feeEmptyStyle
} from './FeeManagement.styles'

type CurrentFeeEntry = {
  name: string
  gstFee: string
  itFee: string
  tdsFee: string
  auditFee: string
  paidByFY?: Record<string, boolean>
}
type FeeMap = Record<string, CurrentFeeEntry>

const SAVE_DEBOUNCE_MS = 400
type SaveTimers = Map<string, number>

const normalizeNameKey = (name: string) => (name || '').trim().replace(/\s+/g, ' ').toUpperCase()

const toNum = (v?: string) => {
  const n = Number(
    String(v ?? '')
      .replace(/,/g, '')
      .trim()
  )
  return Number.isFinite(n) ? n : 0
}

const totalFee = (e?: CurrentFeeEntry) =>
  toNum(e?.gstFee) + toNum(e?.itFee) + toNum(e?.tdsFee) + toNum(e?.auditFee)

// localStorage key: "selectedYear"
const getSelectedYear = () => {
  const y = Number(localStorage.getItem('selectedYear'))
  return Number.isFinite(y) && y > 1900 ? y : new Date().getFullYear()
}

// returns FY start year (e.g., 02/04/25 => 2025, 31/03/25 => 2024)
const getRowFY = (r: BankStatementRow) => {
  const anyR = r as any
  const raw = anyR.date ?? anyR.valueDt ?? anyR.valueDate ?? anyR.txnDate ?? anyR.transactionDate
  if (!raw) return undefined

  const s = String(raw).trim()
  if (!s) return undefined

  const parseDdMmYyOrYyyy = (): { d: number; m: number; y: number } | undefined => {
    let m1 = s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2})$/)
    if (m1) return { d: +m1[1], m: +m1[2], y: 2000 + +m1[3] }

    let m2 = s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/)
    if (m2) return { d: +m2[1], m: +m2[2], y: +m2[3] }

    const t = Date.parse(s)
    if (!Number.isNaN(t)) {
      const dt = new Date(t)
      return { d: dt.getDate(), m: dt.getMonth() + 1, y: dt.getFullYear() }
    }

    return undefined
  }

  const p = parseDdMmYyOrYyyy()
  if (!p || !Number.isFinite(p.y) || !Number.isFinite(p.m)) return undefined

  // FY starts in April
  return p.m >= 4 ? p.y : p.y - 1
}

const isInSelectedFY = (r: BankStatementRow, selectedFY: number) => getRowFY(r) === selectedFY

const NARRATION_TOKEN = '646904'

const narrationMatches = (r: BankStatementRow) =>
  String((r as any).narration ?? '').includes(NARRATION_TOKEN)

const receivedForName = (rows: BankStatementRow[], nameKey: string) =>
  rows
    .filter((r) => !(r as any).deleted)
    .filter(narrationMatches) // ✅ only rows with 646904 in narration
    .filter((r) => normalizeNameKey((r as any).name) === nameKey)
    .reduce((sum, r: any) => sum + (toNum(r.deposit) - toNum(r.withdrawal)), 0)

// update helper (keeps other years intact)
const patchPaidForFY = (e: CurrentFeeEntry, fy: number, paid: boolean): CurrentFeeEntry => ({
  ...e,
  paidByFY: { ...(e.paidByFY ?? {}), [String(fy)]: paid }
})

const FeeManagement: React.FC = () => {
  const [rawFileData, setRawFileData] = useState<BankStatementRow[]>([])
  const [query, setQuery] = useState('')
  const [feeMap, setFeeMap] = useState<FeeMap>({})
  const saveTimersRef = useRef<SaveTimers>(new Map())
  const [showUnpaidOnly, setShowUnpaidOnly] = useState(false)

  const [selectedYear, setSelectedYear] = useState<number>(() => getSelectedYear())

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'selectedYear') setSelectedYear(getSelectedYear())
    }
    window.addEventListener('storage', onStorage)

    const onYearChange = () => setSelectedYear(getSelectedYear())
    window.addEventListener('app:selectedYearChanged' as any, onYearChange)

    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('app:selectedYearChanged' as any, onYearChange)
    }
  }, [])

  useEffect(() => {
    ;(async () => {
      const rows = await window.electronAPI.loadStatements()
      setRawFileData(rows ?? [])

      const entries: CurrentFeeEntry[] = await window.electronAPI.loadCurrentFeeEntries()
      const map: FeeMap = {}
      for (const e of entries ?? []) {
        // loading entries
        map[normalizeNameKey(e.name)] = {
          name: e.name,
          gstFee: (e as any).gstFee ?? '',
          itFee: (e as any).itFee ?? '',
          tdsFee: (e as any).tdsFee ?? '',
          auditFee: (e as any).auditFee ?? '',
          paidByFY: (e as any).paidByFY ?? {}
        }
      }
      setFeeMap(map)
    })()
  }, [])

  const fyRows = useMemo(
    () =>
      rawFileData.filter((r) => !(r as any).deleted).filter((r) => isInSelectedFY(r, selectedYear)),
    [rawFileData, selectedYear]
  )

  const names = useMemo(() => {
    const uniq = new Map<string, string>()
    for (const r of fyRows) {
      const n = String((r as any).name ?? '').trim()
      if (!n) continue
      const key = normalizeNameKey(n)
      if (!uniq.has(key)) uniq.set(key, n)
    }

    let list = Array.from(uniq.values())
    if (showUnpaidOnly) {
      list = list.filter((n) => {
        const key = normalizeNameKey(n)
        const entry = feeMap[key]
        const paid = Boolean(entry?.paidByFY?.[String(selectedYear)])
        return !paid
      })
    }

    const q = query.trim().toLowerCase()
    if (q) list = list.filter((n) => n.toLowerCase().includes(q))
    list.sort((a, b) => a.localeCompare(b))
    return list
  }, [showUnpaidOnly, query, fyRows, feeMap, selectedYear])

  const scheduleSaveEntry = (entry: CurrentFeeEntry) => {
    const key = normalizeNameKey(entry.name)
    const prev = saveTimersRef.current.get(key)
    if (prev) window.clearTimeout(prev)

    const t = window.setTimeout(async () => {
      try {
        const res = await window.electronAPI.upsertCurrentFeeEntry(entry)
        if (!res?.success) throw new Error(res?.error || 'Failed to save')
      } catch (e: any) {
        alert(`❌ Failed to save fee for ${entry.name}: ${e?.message || e}`)
      } finally {
        saveTimersRef.current.delete(key)
      }
    }, SAVE_DEBOUNCE_MS)

    saveTimersRef.current.set(key, t)
  }

  const updateFeeField = (name: string, patch: Partial<Omit<CurrentFeeEntry, 'name'>>) => {
    const key = normalizeNameKey(name)
    setFeeMap((m) => {
      const prev = m[key] ?? { name, gstFee: '', itFee: '', tdsFee: '', auditFee: '' }
      const next = { ...prev, ...patch, name }
      scheduleSaveEntry(next)
      return { ...m, [key]: next }
    })
  }

  // helper
  const totalDue = (total: number, received: number) => total - received

  const isPaidForFY = (e: CurrentFeeEntry | undefined, fy: number) =>
    Boolean(e?.paidByFY?.[String(fy)])

  return (
    <Layout title="💰 Fee Management" financialYear>
      <SectionHeader title="Fee Management" description={`Year ${selectedYear}.`} />

      <div style={searchBarContainerStyle}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name..."
          aria-label="Search name"
          style={searchBarStyle}
        />
        <div style={{ width: 1, alignSelf: 'stretch', background: '#e5e7eb' }} />

        <button type="button" onClick={() => setShowUnpaidOnly((v) => !v)} style={importBtnStyle}>
          {showUnpaidOnly ? 'Show all' : 'Show unpaid'}
        </button>

        <button
          type="button"
          onClick={() => {
            const screen = 'excel'
            localStorage.setItem('activeScreen', screen)
            window.dispatchEvent(new CustomEvent('app:navigate', { detail: { screen } }))
          }}
          style={importBtnStyle}
        >
          ← Back
        </button>
      </div>

      <div style={{ marginTop: 12, overflow: 'auto' }}>
        <div style={feeTableContainerStyle}>
          <table style={feeTableStyle}>
            <thead>
              <tr>
                <th style={feeHeaderCellStyle}>Name</th>
                <th style={feeHeaderCellStyle}>GST Fee</th>
                <th style={feeHeaderCellStyle}>IT Fee</th>
                <th style={feeHeaderCellStyle}>TDS Fee</th>
                <th style={feeHeaderCellStyle}>Audit Fee</th>
                <th style={feeHeaderCellStyle}>Total Fee</th>
                <th style={feeHeaderCellStyle}>Received</th>
                <th style={feeHeaderCellStyle}>Total Due</th>
                <th style={feeHeaderCellStyle}>Payment Status</th>
              </tr>
            </thead>

            <tbody>
              {names.map((name, idx) => {
                const key = normalizeNameKey(name)
                // default entry
                const entry = feeMap[key] ?? {
                  name,
                  gstFee: '',
                  itFee: '',
                  tdsFee: '',
                  auditFee: '',
                  paidByFY: {}
                }

                const paid = isPaidForFY(entry, selectedYear)
                const total = totalFee(entry)
                const received = receivedForName(fyRows, key)
                const due = totalDue(total, received)

                return (
                  <tr key={key} style={feeRowStyle(idx)}>
                    <td style={feeNameCellStyle}>{name}</td>
                    <td style={feeCellStyle}>
                      <input
                        value={entry.gstFee}
                        onChange={(e) => updateFeeField(name, { gstFee: e.target.value })}
                        placeholder="GST"
                        style={feeInputStyle}
                      />
                    </td>
                    <td style={feeCellStyle}>
                      <input
                        value={entry.itFee}
                        onChange={(e) => updateFeeField(name, { itFee: e.target.value })}
                        placeholder="IT"
                        style={feeInputStyle}
                      />
                    </td>
                    <td style={feeCellStyle}>
                      <input
                        value={entry.tdsFee}
                        onChange={(e) => updateFeeField(name, { tdsFee: e.target.value })}
                        placeholder="TDS"
                        style={feeInputStyle}
                      />
                    </td>
                    <td style={feeCellStyle}>
                      <input
                        value={entry.auditFee}
                        onChange={(e) => updateFeeField(name, { auditFee: e.target.value })}
                        placeholder="Audit"
                        style={feeInputStyle}
                      />
                    </td>
                    <td style={feeCellStyle}>
                      <div style={{ fontWeight: 700 }}>{total ? total.toFixed(2) : ''}</div>
                    </td>
                    <td style={feeCellStyle}>
                      <div
                        style={{
                          fontWeight: 700,
                          color: received < 0 ? '#dc2626' : '#16a34a' // red / green
                        }}
                      >
                        {received ? received.toFixed(2) : ''}
                      </div>
                    </td>
                    <td style={feeCellStyle}>
                      <div style={{ fontWeight: 700, color: due < 0 ? '#dc2626' : undefined }}>
                        {due ? due.toFixed(2) : ''}
                      </div>
                    </td>
                    <td style={feeCellStyle}>
                      <input
                        type="checkbox"
                        checked={paid}
                        onChange={(e) => {
                          const next = patchPaidForFY(entry, selectedYear, e.target.checked)
                          updateFeeField(name, { paidByFY: next.paidByFY })
                        }}
                      />
                    </td>
                  </tr>
                )
              })}

              {names.length === 0 && (
                <tr>
                  <td colSpan={9} style={feeEmptyStyle}>
                    No names found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}

export default FeeManagement
