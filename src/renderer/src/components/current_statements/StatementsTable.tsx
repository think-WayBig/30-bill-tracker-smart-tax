import React, { useMemo } from 'react'
import {
  // deleteBtnStyle,
  tableContainerStyle,
  tableEmptyStyle,
  tableHeaderStyle,
  tableRowStyle,
  textAreaStyle
} from './Statement.styles'

export type OnCellEdit = (rowId: string, key: keyof BankStatementRow, value: string) => void

export type OnRowDelete = (rowId: string) => void

const HEADERS = [
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

type HeaderKeys = (typeof HEADERS)[number]

const label = (key: HeaderKeys): string => {
  switch (key) {
    case 'chqNo':
      return 'Chq No.'
    case 'valueDt':
      return 'Value Dt'
    case 'txnType':
      return 'Txn Type'
    default:
      return key.charAt(0).toUpperCase() + key.slice(1)
  }
}

const placeholderFor = (key: HeaderKeys): string => {
  switch (key) {
    case 'date':
    case 'valueDt':
      return 'dd/mm/yyyy'
    case 'withdrawal':
    case 'deposit':
    case 'closing':
      return '--'
    case 'narration':
      return 'Narration'
    case 'name':
      return 'Name'
    case 'txnType':
      return 'Type'
    case 'chqNo':
      return 'Cheque No.'
    default:
      return 'Not meant to show'
  }
}

const COLUMN_WIDTHS: Partial<Record<keyof BankStatementRow, number | string>> = {
  date: 100,
  narration: 360,
  chqNo: 180,
  valueDt: 120,
  withdrawal: 120,
  deposit: 120,
  closing: 140,
  name: 320,
  txnType: 180
}

/** === Not required anymore === */
// const TOTAL_WIDTH = (() => {
//   let width = 0
//   for (const key in COLUMN_WIDTHS) {
//     const val = COLUMN_WIDTHS[key as keyof BankStatementRow]
//     if (typeof val === 'number') {
//       width += val
//     }
//   }
//   // add actions column
//   width += 100
//   return width
// })()

const toCss = (w?: number | string) => (typeof w === 'number' ? `${w}px` : w)

const NAME_DATALIST_ID = 'name-options'

type Props = {
  rows: BankStatementRow[]
  onCellEdit: OnCellEdit
  onRowDelete: OnRowDelete // This is not required for now
  query?: string
  editMode: boolean
  showUnnamed: boolean
  editingNameRowId: string | null
  setEditingNameRowId: (id: string | null) => void
}

export const StatementsTable: React.FC<Props> = ({
  rows,
  onCellEdit,
  editMode,
  showUnnamed,
  editingNameRowId,
  setEditingNameRowId,
  query = ''
}) => {
  const lcQuery = query.trim().toLowerCase()

  const filtered = useMemo(() => {
    let res = lcQuery
      ? rows.filter(
          (r) =>
            (r.name ?? '').toLowerCase().includes(lcQuery) ||
            (r.narration ?? '').toLowerCase().includes(lcQuery) ||
            (r.withdrawal ?? '').toLowerCase().includes(lcQuery) ||
            (r.deposit ?? '').toLowerCase().includes(lcQuery) ||
            (r.closing ?? '').toLowerCase().includes(lcQuery) ||
            (r.txnType ?? '').toLowerCase().includes(lcQuery)
        )
      : rows

    if (showUnnamed) {
      res = res.filter((r) => {
        const isUnnamed = !r.name || r.name.trim() === ''
        const isBeingEdited = editingNameRowId === r.id
        return isUnnamed || isBeingEdited
      })
    }

    return res
  }, [rows, lcQuery, showUnnamed, editingNameRowId])

  // Unique names, computed once per rows change
  const nameOptions = useMemo(() => {
    const set = new Set<string>()
    for (const r of rows) {
      const n = (r.name ?? '').trim()
      if (n) set.add(n)
    }
    // Sort and cap to avoid huge DOM lists
    return Array.from(set)
      .sort((a, b) => a.localeCompare(b))
      .slice(0, 200)
  }, [rows])

  if (!rows.length) {
    return (
      <div style={tableEmptyStyle}>No data yet. Import an Excel file to see and edit rows.</div>
    )
  }

  const sumColumn = (key: keyof BankStatementRow) =>
    filtered.reduce((acc, r) => acc + (parseFloat(r[key] || '0') || 0), 0)

  const totalWithdrawal = sumColumn('withdrawal')
  const totalDeposit = sumColumn('deposit')
  const net = totalDeposit - totalWithdrawal

  const countCredits = filtered.filter((r) => parseFloat(r.deposit || '0') > 0).length
  const countDebits = filtered.filter((r) => parseFloat(r.withdrawal || '0') > 0).length

  return (
    <div style={tableContainerStyle}>
      <datalist id={NAME_DATALIST_ID}>
        {nameOptions.map((n) => (
          <option key={n} value={n} />
        ))}
      </datalist>
      <style>{`
      .editable-textarea {
        width: 100%;
        min-height: 48px;
        font-size: 13px;
        padding: 8px 10px;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        outline: none;
        background: #fff;
        resize: none;
      }
      .editable-cell:hover .editable-textarea {
        resize: vertical;
      }
      .editable-textarea.disabled {
        resize: none !important;
      }
    `}</style>
      <table style={{ borderCollapse: 'collapse', tableLayout: 'fixed', width: '100%' }}>
        <colgroup>
          {HEADERS.map((key) => (
            <col key={key} style={{ width: toCss(COLUMN_WIDTHS[key]) }} />
          ))}
          {/* <col style={{ width: 100 }} /> */}
        </colgroup>

        <thead>
          <tr style={{ background: '#4f46e5', color: '#fff' }}>
            {HEADERS.map((h) => (
              <th key={h} style={tableHeaderStyle}>
                {label(h)}
              </th>
            ))}
            {/* <th style={tableHeaderStyle}>Actions</th> */}
          </tr>
        </thead>

        <tbody>
          {filtered.map((row, rowIndex) => (
            <tr key={rowIndex} style={tableRowStyle(rowIndex)}>
              {HEADERS.map((key) => {
                const isLocked =
                  !editMode &&
                  [
                    'date',
                    'narration',
                    'chqNo',
                    'valueDt',
                    'withdrawal',
                    'deposit',
                    'closing'
                  ].includes(key)

                return (
                  <td
                    key={String(key)}
                    style={{ padding: 8, verticalAlign: 'top' }}
                    className="editable-cell"
                  >
                    {key === 'name' ? (
                      <input
                        type="text"
                        list={NAME_DATALIST_ID}
                        value={row.name ?? ''}
                        onFocus={() => setEditingNameRowId(row.id!)}
                        onBlur={() => setEditingNameRowId(null)}
                        onChange={(e) => !isLocked && onCellEdit(row.id!, 'name', e.target.value)}
                        style={{
                          ...textAreaStyle,
                          backgroundColor: isLocked ? '#f9fafb' : '#fff',
                          pointerEvents: isLocked ? 'none' : 'auto'
                        }}
                        readOnly={isLocked}
                        placeholder="Name"
                      />
                    ) : (
                      <textarea
                        rows={2}
                        value={row[key] ?? ''}
                        onChange={(e) => !isLocked && onCellEdit(row.id!, key, e.target.value)}
                        className={`editable-textarea ${isLocked ? 'disabled' : ''}`}
                        style={{
                          ...textAreaStyle,
                          backgroundColor: isLocked ? '#f9fafb' : '#fff'
                        }}
                        readOnly={isLocked}
                        placeholder={placeholderFor(key)}
                      />
                    )}
                  </td>
                )
              })}
              {/* <td style={{ padding: 8 }}>
                <button
                  type="button"
                  data-rowid={row.id}
                  style={deleteBtnStyle}
                  onClick={() => {
                    if (window.confirm('Are you sure you want to remove this row?')) {
                      onRowDelete(row.id)
                    }
                  }}
                  title="Remove"
                >
                  Remove
                </button>
              </td> */}
            </tr>
          ))}
        </tbody>

        <tfoot>
          <tr style={{ background: '#f3f4f6' }}>
            {HEADERS.map((key) => {
              if (key === 'narration') {
                return (
                  <td
                    key={key}
                    colSpan={2}
                    style={{
                      padding: 8,
                      paddingLeft: 12,
                      fontWeight: 600,
                      textAlign: 'end'
                    }}
                  >
                    Credits: {countCredits} &nbsp;&nbsp; Debits: {countDebits}
                  </td>
                )
              }
              if (key === 'chqNo') {
                return (
                  <td key={key} style={{ padding: 8, paddingLeft: 12, fontWeight: 600 }}>
                    Totals
                  </td>
                )
              }
              if (key === 'valueDt') {
                return (
                  <td key={key} style={{ padding: 8, paddingLeft: 12 }}>
                    {totalWithdrawal.toFixed(2)}
                  </td>
                )
              }
              if (key === 'withdrawal') {
                return (
                  <td key={key} style={{ padding: 8, paddingLeft: 12 }}>
                    {totalDeposit.toFixed(2)}
                  </td>
                )
              }
              if (key === 'deposit') {
                return (
                  <td
                    key={key}
                    style={{
                      padding: 8,
                      paddingLeft: 12,
                      fontWeight: 600,
                      color: net >= 0 ? 'green' : 'red'
                    }}
                  >
                    {net.toFixed(2)}
                  </td>
                )
              }
              return <td key={key} style={{ padding: 8, paddingLeft: 12 }} />
            })}
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
