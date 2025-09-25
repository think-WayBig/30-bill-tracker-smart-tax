import React from 'react'
import { inputStyle, tdStyle, thStyle } from './Audits.styles'

export type OnAuditCellEdit = (
  pan: string,
  key: keyof NonNullable<AuditEntry['accounts'][number]>,
  value: string | number
) => void

type Props = {
  rows: AuditEntry[]
  year: number
  onCellEdit: OnAuditCellEdit
  caOptions?: string[]
  accountantOptions?: string[]
}

const NAME_CA_DATALIST_ID = 'audit-ca-options'
const ACCOUNTANT_DATALIST_ID = 'audit-accountant-options'

// percentage widths so table spans 100%
const COLUMN_WIDTHS: Record<string, string> = {
  pan: '5%',
  name: '15%',
  sentToCA: '10%',
  sentOn: '10%',
  receivedOn: '10%',
  dateOfUpload: '10%',
  itrFiledOn: '10%',
  lastYearFee: '10%',
  fee: '10%',
  feeDate: '130px',
  accountant: '160px'
}

const SUMMARY_H = 40 // px; tweak to match your th height
const summaryThStyle: React.CSSProperties = {
  ...thStyle,
  height: SUMMARY_H,
  position: 'sticky',
  top: 0,
  zIndex: 3,
  background: '#eef2ff'
}
const labelsThStyle: React.CSSProperties = {
  ...thStyle,
  position: 'sticky',
  top: SUMMARY_H,
  zIndex: 2,
  background: '#4f46e5',
  color: 'white'
}

const AuditsTable: React.FC<Props> = ({
  rows,
  year,
  onCellEdit,
  accountantOptions = [],
  caOptions = []
}) => {
  type DateField = 'sentOn' | 'receivedOn' | 'dateOfUpload' | 'itrFiledOn'

  const [sortKey, setSortKey] = React.useState<'name' | DateField | null>(null)
  const [sortAsc, setSortAsc] = React.useState(true) // still used for Name only

  const compareDateField = (a: AuditEntry, b: AuditEntry, field: DateField, yr: number) => {
    const aVal = a.accounts?.[yr]?.[field] ?? ''
    const bVal = b.accounts?.[yr]?.[field] ?? ''
    const aEmpty = aVal.trim() === ''
    const bEmpty = bVal.trim() === ''
    if (aEmpty && !bEmpty) return -1
    if (!aEmpty && bEmpty) return 1
    if (aEmpty && bEmpty) return 0
    // both non-empty (YYYY-MM-DD from <input type="date">)
    return Date.parse(bVal) - Date.parse(aVal) // newer first
  }

  const sortedRows = React.useMemo(() => {
    if (sortKey === null) return rows
    const copy = [...rows]

    if (sortKey === 'name') {
      copy.sort((a, b) => (sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)))
      return copy
    }

    copy.sort((a, b) => compareDateField(a, b, sortKey as DateField, year))
    return copy
  }, [sortKey, rows, sortAsc, year])

  const stats = React.useMemo(() => {
    let sentOn = 0
    let receivedOn = 0
    let dateOfUpload = 0
    let itrFiledOn = 0
    let lastYearFeeTotal = 0
    let feeTotal = 0

    for (const r of rows) {
      const acc = r.accounts?.[year] || {}
      if (acc.sentOn) sentOn++
      if (acc.receivedOn) receivedOn++
      if (acc.dateOfUpload) dateOfUpload++
      if (acc.itrFiledOn) itrFiledOn++
      if (acc.lastYearFee != null) lastYearFeeTotal += Number(acc.lastYearFee) || 0
      if (acc.fee != null) feeTotal += Number(acc.fee) || 0
    }

    return { sentOn, receivedOn, dateOfUpload, itrFiledOn, lastYearFeeTotal, feeTotal }
  }, [rows, year])

  const getDisplayCA = React.useCallback((entry: AuditEntry, yr: number) => {
    // prefer exact current-year value so typing works
    const cur = entry.accounts?.[yr]?.sentToCA
    if (typeof cur === 'string') return cur

    // find the most recent CA at or before this year
    const years = Object.keys(entry.accounts || {})
      .map(Number)
      .sort((a, b) => a - b)
    for (let i = years.length - 1; i >= 0; i--) {
      const y = years[i]
      if (y <= yr) {
        const v = entry.accounts[y]?.sentToCA ?? ''
        if (v) return v
      }
    }
    // no CA set at or before this year -> show empty
    return ''
  }, [])

  const getDisplayAccountant = React.useCallback((entry: AuditEntry, yr: number) => {
    const cur = entry.accounts?.[yr]?.accountant
    if (typeof cur === 'string') return cur
    const years = Object.keys(entry.accounts || {})
      .map(Number)
      .sort((a, b) => a - b)
    for (let i = years.length - 1; i >= 0; i--) {
      const y = years[i]
      if (y <= yr) {
        const v = entry.accounts[y]?.accountant ?? ''
        if (v) return v
      }
    }
    return ''
  }, [])

  return (
    <div style={{ overflow: 'auto', width: '100%', maxHeight: '85vh' }}>
      <datalist id={NAME_CA_DATALIST_ID}>
        {caOptions.map((n) => (
          <option key={n} value={n} />
        ))}
      </datalist>

      <datalist id={ACCOUNTANT_DATALIST_ID}>
        {(accountantOptions ?? []).map((n) => (
          <option key={n} value={n} />
        ))}
      </datalist>

      <table
        style={{
          borderCollapse: 'collapse',
          width: '100%',
          minWidth: '1350px',
          background: '#fff',
          tableLayout: 'fixed'
        }}
      >
        <colgroup>
          <col style={{ width: COLUMN_WIDTHS.pan }} />
          <col style={{ width: COLUMN_WIDTHS.name }} />
          <col style={{ width: COLUMN_WIDTHS.sentToCA }} />
          <col style={{ width: COLUMN_WIDTHS.sentOn }} />
          <col style={{ width: COLUMN_WIDTHS.receivedOn }} />
          <col style={{ width: COLUMN_WIDTHS.dateOfUpload }} />
          <col style={{ width: COLUMN_WIDTHS.itrFiledOn }} />
          <col style={{ width: COLUMN_WIDTHS.lastYearFee }} />
          <col style={{ width: COLUMN_WIDTHS.fee }} />
          <col style={{ width: COLUMN_WIDTHS.feeDate }} />
          <col style={{ width: COLUMN_WIDTHS.accountant }} />
        </colgroup>

        <thead>
          <tr>
            <th style={summaryThStyle}></th>
            <th style={summaryThStyle}></th>
            <th style={summaryThStyle}></th>
            <th style={summaryThStyle}>Count: {stats.sentOn}</th>
            <th style={summaryThStyle}>Count: {stats.receivedOn}</th>
            <th style={summaryThStyle}>Count: {stats.dateOfUpload}</th>
            <th style={summaryThStyle}>Count: {stats.itrFiledOn}</th>
            <th style={summaryThStyle}>Total: {stats.lastYearFeeTotal}</th>
            <th style={summaryThStyle}>Total: {stats.feeTotal}</th>
            <th style={summaryThStyle}></th>
            <th style={summaryThStyle}></th>
          </tr>
          <tr>
            <th style={labelsThStyle}>PAN</th>
            <th
              style={{ ...labelsThStyle, cursor: 'pointer' }}
              onClick={() => {
                setSortKey((k) => {
                  if (k === 'name') setSortAsc((asc) => !asc)
                  else setSortAsc(true)
                  return 'name'
                })
              }}
            >
              Name {sortKey === 'name' ? (sortAsc ? '🔼' : '🔽') : ''}
            </th>
            <th style={labelsThStyle}>Sent To CA</th>
            <th
              style={{ ...labelsThStyle, cursor: 'pointer' }}
              onClick={() => setSortKey((k) => (k === 'sentOn' ? null : 'sentOn'))}
              title="Empty dates first, then newest → oldest"
            >
              Sent On {sortKey === 'sentOn' ? '↓' : ''}
            </th>

            <th
              style={{ ...labelsThStyle, cursor: 'pointer' }}
              onClick={() => setSortKey((k) => (k === 'receivedOn' ? null : 'receivedOn'))}
              title="Empty dates first, then newest → oldest"
            >
              Received On {sortKey === 'receivedOn' ? '↓' : ''}
            </th>

            <th
              style={{ ...labelsThStyle, cursor: 'pointer' }}
              onClick={() => setSortKey((k) => (k === 'dateOfUpload' ? null : 'dateOfUpload'))}
              title="Empty dates first, then newest → oldest"
            >
              Date of Upload {sortKey === 'dateOfUpload' ? '↓' : ''}
            </th>

            <th
              style={{ ...labelsThStyle, cursor: 'pointer' }}
              onClick={() => setSortKey((k) => (k === 'itrFiledOn' ? null : 'itrFiledOn'))}
              title="Empty dates first, then newest → oldest"
            >
              ITR Filed On {sortKey === 'itrFiledOn' ? '↓' : ''}
            </th>
            <th style={labelsThStyle}>Last Year Fee</th>
            <th style={labelsThStyle}>Fee</th>
            <th style={labelsThStyle}>Fee Date</th>
            <th style={labelsThStyle}>Accountant</th>
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={11} style={{ ...tdStyle, textAlign: 'center', color: '#6b7280' }}>
                No data available
              </td>
            </tr>
          ) : (
            sortedRows.map((r) => {
              const acc = r.accounts[year] || {}
              return (
                <tr key={r.pan} className="hoverable-row">
                  <td
                    style={{
                      ...tdStyle,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {r.pan}
                  </td>
                  <td
                    style={{
                      ...tdStyle,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {r.name}
                  </td>

                  <td style={tdStyle}>
                    <input
                      type="text"
                      list={NAME_CA_DATALIST_ID}
                      value={getDisplayCA(r, year)}
                      onChange={(e) => onCellEdit(r.pan, 'sentToCA', e.target.value)}
                      style={inputStyle}
                    />
                  </td>
                  <td style={tdStyle}>
                    <input
                      type="date"
                      value={acc.sentOn ?? ''}
                      onChange={(e) => onCellEdit(r.pan, 'sentOn', e.target.value)}
                      style={inputStyle}
                    />
                  </td>
                  <td style={tdStyle}>
                    <input
                      type="date"
                      value={acc.receivedOn ?? ''}
                      onChange={(e) => onCellEdit(r.pan, 'receivedOn', e.target.value)}
                      style={inputStyle}
                    />
                  </td>
                  <td style={tdStyle}>
                    <input
                      type="date"
                      value={acc.dateOfUpload ?? ''}
                      onChange={(e) => onCellEdit(r.pan, 'dateOfUpload', e.target.value)}
                      style={inputStyle}
                    />
                  </td>
                  <td style={tdStyle}>
                    <input
                      type="date"
                      value={acc.itrFiledOn ?? ''}
                      onChange={(e) => onCellEdit(r.pan, 'itrFiledOn', e.target.value)}
                      style={inputStyle}
                    />
                  </td>
                  <td style={tdStyle}>
                    <input
                      type="number"
                      disabled
                      value={acc.lastYearFee ?? ''}
                      onChange={(e) => onCellEdit(r.pan, 'lastYearFee', Number(e.target.value))}
                      style={inputStyle}
                    />
                  </td>
                  <td style={tdStyle}>
                    <input
                      type="number"
                      value={acc.fee ?? ''}
                      onChange={(e) => onCellEdit(r.pan, 'fee', Number(e.target.value))}
                      style={inputStyle}
                    />
                  </td>
                  <td style={tdStyle}>
                    <input
                      type="date"
                      value={acc.feeDate ?? ''}
                      onChange={(e) => onCellEdit(r.pan, 'feeDate', e.target.value)}
                      style={inputStyle}
                    />
                  </td>
                  <td style={tdStyle}>
                    <input
                      type="text"
                      list={ACCOUNTANT_DATALIST_ID}
                      value={getDisplayAccountant(r, year)}
                      onChange={(e) => onCellEdit(r.pan, 'accountant', e.target.value)}
                      style={inputStyle}
                    />
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}

export default AuditsTable
