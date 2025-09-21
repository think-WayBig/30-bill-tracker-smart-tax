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
}

const NAME_CA_DATALIST_ID = 'audit-ca-options'

// percentage widths so table spans 100%
const COLUMN_WIDTHS: Record<string, string> = {
  pan: '5%',
  name: '15%',
  lastYearFee: '10%',
  sentToCA: '10%',
  sentOn: '10%',
  receivedOn: '10%',
  dateOfUpload: '10%',
  itrFiledOn: '10%',
  fee: '10%'
}

const AuditsTable: React.FC<Props> = ({ rows, year, onCellEdit, caOptions = [] }) => {
  const [sortAsc, setSortAsc] = React.useState<boolean | null>(null) // null = no sort, true = asc, false = desc

  const sortedRows = React.useMemo(() => {
    if (sortAsc === null) return rows
    return [...rows].sort((a, b) =>
      sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
    )
  }, [rows, sortAsc])

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

  return (
    <div style={{ overflowX: 'auto', width: '100%' }}>
      <datalist id={NAME_CA_DATALIST_ID}>
        {caOptions.map((n) => (
          <option key={n} value={n} />
        ))}
      </datalist>

      <table
        style={{
          borderCollapse: 'collapse',
          width: '100%',
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
        </colgroup>

        <thead>
          {/* Top summary row */}
          <tr style={{ backgroundColor: '#eef2ff', color: '#111827' }}>
            <th style={thStyle}> </th> {/* PAN */}
            <th style={thStyle}> </th> {/* Name */}
            <th style={thStyle}> </th> {/* Sent To CA */}
            <th style={thStyle}>Count: {stats.sentOn}</th> {/* Sent On */}
            <th style={thStyle}>Count: {stats.receivedOn}</th> {/* Received On */}
            <th style={thStyle}>Count: {stats.dateOfUpload}</th> {/* Date of Upload */}
            <th style={thStyle}>Count: {stats.itrFiledOn}</th> {/* ITR Filed On */}
            <th style={thStyle}>Total: {stats.lastYearFeeTotal}</th>
            <th style={thStyle}>Total: {stats.feeTotal}</th> {/* Fee */}
          </tr>

          {/* Existing labels row */}
          <tr style={{ backgroundColor: '#4f46e5', color: 'white' }}>
            <th style={thStyle}>PAN</th>
            <th
              style={{ ...thStyle, cursor: 'pointer' }}
              onClick={() => setSortAsc((prev) => (prev === null ? true : !prev))}
            >
              Name {sortAsc === null ? '' : sortAsc ? '🔼' : '🔽'}
            </th>
            <th style={thStyle}>Sent To CA</th>
            <th style={thStyle}>Sent On</th>
            <th style={thStyle}>Received On</th>
            <th style={thStyle}>Date of Upload</th>
            <th style={thStyle}>ITR Filed On</th>
            <th style={thStyle}>Last Year Fee</th>
            <th style={thStyle}>Fee</th>
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={9} style={{ ...tdStyle, textAlign: 'center', color: '#6b7280' }}>
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
