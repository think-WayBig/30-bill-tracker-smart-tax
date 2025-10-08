import React, { useEffect, useMemo, useRef, useState } from 'react'
import Layout from '../helpers/Layout'
import { SectionHeader } from '../helpers/SectionHeader'

type BankStatementRow = {
  id?: string
  date: string
  narration: string
  chqNo: string
  valueDt: string
  withdrawal: string
  deposit: string
  closing: string
  name: string
  txnType: string
}

type SummaryRow = {
  name: string
  credits: number // number of credit txns
  debits: number // number of debit txns
  totalWithdrawal: number
  totalDeposit: number
  sumtotal: number // totalDeposit - totalWithdrawal
}

const currency = (n: number) =>
  n.toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 })

const parseAmount = (raw: string): number => {
  if (!raw) return 0
  // remove commas, currency symbols, spaces
  const cleaned = String(raw).replace(/[,\s]/g, '')
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : 0
}

const exportCSV = (rows: SummaryRow[]) => {
  const header = ['Name', 'Credits', 'Debits', 'Total Withdrawal', 'Total Deposit', 'Sumtotal']
  const csv = [
    header.join(','),
    ...rows.map((r) =>
      [
        `"${r.name.replace(/"/g, '""')}"`,
        r.credits,
        r.debits,
        r.totalWithdrawal,
        r.totalDeposit,
        r.sumtotal
      ].join(',')
    )
  ].join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `statements-summary-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

const sumColor = (val: number): React.CSSProperties => ({
  color: val < 0 ? '#dc2626' : val > 0 ? '#16a34a' : '#111', // red / green / neutral
  fontWeight: 700
})

const toolbarBtn: React.CSSProperties = {
  appearance: 'none',
  background: '#6366f1',
  color: '#fff',
  border: 0,
  borderRadius: 8,
  padding: '10px 14px',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'background .15s ease'
}

const inputStyle: React.CSSProperties = {
  flex: 1,
  height: 40,
  padding: '0 12px',
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  outline: 'none',
  fontSize: 14
}

const divider: React.CSSProperties = { width: 1, alignSelf: 'stretch', background: '#e5e7eb' }

const StatementsSummary: React.FC = () => {
  const [rows, setRows] = useState<BankStatementRow[]>([])
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState<keyof SummaryRow>('sumtotal')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const printBtnRef = useRef<HTMLButtonElement>(null)

  const selected = localStorage.getItem('selectedYear')!
  const toFull = (y: string) => (y.length === 2 ? Number(`20${y}`) : Number(y))

  let startYear: number, endYear: number
  if (selected.includes('-')) {
    const [a, b] = selected.split('-').map((s) => s.trim())
    startYear = toFull(a)
    endYear = toFull(b)
  } else {
    const y = selected ? toFull(selected) : new Date().getFullYear()
    startYear = y
    endYear = y + 1
  }

  const startTs = new Date(startYear, 3, 1).getTime() // 01-Apr startYear
  const endTs = new Date(endYear, 2, 31, 23, 59, 59, 999).getTime() // 31-Mar endYear

  // strict DD/MM/YY | DD/MM/YYYY -> timestamp, reject rollovers like 31/04/25
  const parseDMYStrict = (s?: string): number => {
    if (!s) return NaN
    // eslint-disable-next-line no-useless-escape
    const m = s.trim().match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2}|\d{4})$/)
    if (!m) return NaN
    const d = Number(m[1]),
      mo = Number(m[2])
    const y = m[3].length === 2 ? Number(`20${m[3]}`) : Number(m[3])
    const dt = new Date(y, mo - 1, d)
    return dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d
      ? dt.getTime()
      : NaN
  }

  // rows limited to selected FY
  const rowsFY = React.useMemo(() => {
    return rows.filter((r) => {
      const ts = parseDMYStrict(r.date)
      return !Number.isNaN(ts) && ts >= startTs && ts <= endTs
    })
  }, [rows, startTs, endTs])

  useEffect(() => {
    ;(async () => {
      const r = await window.electronAPI.loadStatements()
      setRows(r ?? [])
    })()
  }, [])

  const data: SummaryRow[] = useMemo(() => {
    const map = new Map<string, SummaryRow>()
    // for (const r of rows) {   // ❌ old
    for (const r of rowsFY) {
      // ✅ only rows in selected FY
      const key = (r.name?.trim() || '(Unnamed)').toString()
      const dep = parseAmount(r.deposit)
      const wit = parseAmount(r.withdrawal)

      if (!map.has(key)) {
        map.set(key, {
          name: key,
          credits: 0,
          debits: 0,
          totalWithdrawal: 0,
          totalDeposit: 0,
          sumtotal: 0
        })
      }
      const agg = map.get(key)!
      if (dep > 0) agg.credits += 1
      if (wit > 0) agg.debits += 1
      agg.totalDeposit += dep
      agg.totalWithdrawal += wit
      agg.sumtotal = agg.totalDeposit - agg.totalWithdrawal
    }

    let list = Array.from(map.values())

    // filter by search
    const q = query.trim().toLowerCase()
    if (q) list = list.filter((r) => r.name.toLowerCase().includes(q))

    // sort
    list.sort((a, b) => {
      const A = a[sortKey] as any,
        B = b[sortKey] as any
      if (A < B) return sortDir === 'asc' ? -1 : 1
      if (A > B) return sortDir === 'asc' ? 1 : -1
      return 0
    })

    return list
  }, [rowsFY, query, sortKey, sortDir])

  const toggleSort = (key: keyof SummaryRow) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  return (
    <Layout title="📊 Statements Summary" financialYear color="#6366f1">
      <style>{`
        :root {
          --accent: #6366f1;
          --border: #e5e7eb;
          --bg: #f1f5ffff;           /* soft header bg on screen */
          --bg-hover: #e6efffff;     /* row hover */
          --zebra: #f9fafb;        /* zebra stripe */
          --text: #111;
        }

        /* ===== Screen styles ===== */
        #printable {
          font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial;
          color: var(--text);
        }

        #printable .table-wrap {
          overflow: auto;
          border: 1px solid var(--border);
          border-radius: 12px;
          background: #fff;
          box-shadow: 0 1px 2px rgba(0,0,0,.04);
        }

        #printable table {
          width: 100%;
          border-collapse: collapse;
          min-width: 760px;
        }

        #printable th,
        #printable td {
          border: 1px solid var(--border);
          padding: 10px 12px;
          line-height: 1.25;
          background: #fff;
        }

        /* Sticky header with subtle elevation */
        #printable thead th {
          position: sticky;
          top: 0;
          z-index: 1;
          background: var(--bg);
          font-weight: 700;
          color: var(--text);
          border-bottom: 1px solid var(--border);
          white-space: nowrap;
          backdrop-filter: saturate(180%) blur(6px);
          box-shadow: 0 1px 0 rgba(0,0,0,.04);
          cursor: pointer;
        }

        /* Hover & zebra on screen */
        #printable tbody tr:nth-child(even) td { background: var(--zebra); }
        #printable tbody tr:hover td { background: var(--bg-hover); }

        /* Numeric alignment */
        #printable .num {
          text-align: right;
          font-variant-numeric: tabular-nums;
        }

        /* Footer emphasis */
        #printable tfoot td {
          background: #fff;
          font-weight: 700;
          border-top: 2px solid var(--accent);
        }

        /* Toolbar buttons (screen) */
        .screen-only .btn {
          appearance: none;
          background: var(--accent);
          color: #fff;
          border: 0;
          border-radius: 10px;
          padding: 10px 14px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background .15s ease, transform .05s ease;
        }
        .screen-only .btn:hover { background: #4f46e5; }
        .screen-only .btn:active { transform: translateY(1px); }
        .screen-only .btn:focus-visible {
          outline: 2px solid #111; outline-offset: 2px;
        }

        /* ===== Print styles ===== */
        @media print {
          @page { size: A4 landscape; margin: 8mm; }
          body * { visibility: hidden; }
          #printable, #printable * { visibility: visible; }
          #printable { position: absolute; inset: 0; width: 100%; }

          .screen-only { display: none !important; }

          #printable .table-wrap {
            border: 0.5pt solid var(--border);
            border-radius: 8px;
            box-shadow: none;
          }

          #printable table { table-layout: auto; }
          #printable th, #printable td { border: 0.5pt solid var(--border); padding: 6px 8px; }
          #printable thead { display: table-header-group; }
          #printable tfoot { display: table-footer-group; }
          #printable tr, #printable td, #printable th { page-break-inside: avoid; }

          /* Use strong accent for header in print */
          #printable thead th {
            background: var(--accent) !important;
            color: #fff !important;
            font-weight: 700;
            border-bottom: 1pt solid #333;
            box-shadow: none;
            backdrop-filter: none;
          }

          /* Softer zebra */
          #printable tbody tr:nth-child(even) td { background: #fafafa; }

          /* Footer with light accent tint */
          #printable tfoot td { background: #fff7f1ff !important; }

          /* Numeric alignment remains */
          #printable .num { text-align: right; font-variant-numeric: tabular-nums; }
        }
      `}</style>

      <SectionHeader
        title="Summary by Name"
        description={`Financial Year: 01/04/${startYear} - 31/03/${endYear}`}
        color="#6366f1"
      />

      {/* Toolbar */}
      <div
        className="screen-only"
        style={{
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          marginBottom: 14
        }}
      >
        <input
          placeholder="Search name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={inputStyle}
          aria-label="Search by name"
        />
        <div style={divider} />
        <button
          type="button"
          style={toolbarBtn}
          onMouseOver={(e) => (e.currentTarget.style.background = '#4f46e5')}
          onMouseOut={(e) => (e.currentTarget.style.background = '#6366f1')}
          onClick={() => window.print()}
          ref={printBtnRef}
          title="Print summary"
        >
          🖨️ Print
        </button>
        <button
          type="button"
          style={toolbarBtn}
          onMouseOver={(e) => (e.currentTarget.style.background = '#4f46e5')}
          onMouseOut={(e) => (e.currentTarget.style.background = '#6366f1')}
          onClick={() => exportCSV(data)}
          title="Export CSV"
        >
          ⬇️ Export CSV
        </button>
      </div>

      <div id="printable">
        {/* Table */}
        {data.length > 0 ? (
          <div style={{ overflow: 'auto', border: '1px solid #e5e7eb', borderRadius: 8 }}>
            <div id="printable">
              {data.length > 0 ? (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <Th
                          onClick={() => toggleSort('name')}
                          active={sortKey === 'name'}
                          dir={sortDir}
                        >
                          Name
                        </Th>
                        <Th
                          onClick={() => toggleSort('credits')}
                          active={sortKey === 'credits'}
                          dir={sortDir}
                        >
                          Credits
                        </Th>
                        <Th
                          onClick={() => toggleSort('debits')}
                          active={sortKey === 'debits'}
                          dir={sortDir}
                        >
                          Debits
                        </Th>
                        <Th
                          onClick={() => toggleSort('totalWithdrawal')}
                          active={sortKey === 'totalWithdrawal'}
                          dir={sortDir}
                          align="right"
                        >
                          Total Withdrawal
                        </Th>
                        <Th
                          onClick={() => toggleSort('totalDeposit')}
                          active={sortKey === 'totalDeposit'}
                          dir={sortDir}
                          align="right"
                        >
                          Total Deposit
                        </Th>
                        <Th
                          onClick={() => toggleSort('sumtotal')}
                          active={sortKey === 'sumtotal'}
                          dir={sortDir}
                          align="right"
                        >
                          Sumtotal
                        </Th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((r) => (
                        <tr key={r.name}>
                          <td style={{ fontWeight: 600 }}>{r.name}</td>
                          <td className="num">{r.credits}</td>
                          <td className="num">{r.debits}</td>
                          <td className="num"> {currency(r.totalWithdrawal)}</td>
                          <td className="num"> {currency(r.totalDeposit)}</td>
                          <td className="num" style={sumColor(r.sumtotal)}>
                            {currency(r.sumtotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div
                  style={{
                    border: '1px dashed var(--border)',
                    padding: 24,
                    borderRadius: 12,
                    color: '#6b7280',
                    background: '#fff'
                  }}
                >
                  No data found. Import statements first in the main screen.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div
            style={{
              border: '1px dashed #e5e7eb',
              padding: 24,
              borderRadius: 12,
              color: '#6b7280'
            }}
          >
            No data found. Import statements first in the main screen.
          </div>
        )}
      </div>
    </Layout>
  )
}

const Th: React.FC<{
  children: React.ReactNode
  onClick: () => void
  active?: boolean
  dir?: 'asc' | 'desc'
  align?: 'left' | 'right'
}> = ({ children, onClick, active, dir, align = 'left' }) => {
  return (
    <th
      onClick={onClick}
      style={{
        position: 'sticky',
        top: 0,
        background: '#f1f5ffff',
        color: '#111',
        textAlign: align,
        padding: '10px 12px',
        fontWeight: 700,
        borderBottom: '1px solid #e5e7eb',
        cursor: 'pointer',
        whiteSpace: 'nowrap'
      }}
      title="Click to sort"
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        {children} {active ? (dir === 'asc' ? ' 🔼' : ' 🔽') : ''}
      </span>
    </th>
  )
}

export default StatementsSummary
