import React, { useMemo, useState } from 'react'
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
  date: 120,
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
  selectedIds: Set<string>
  onToggleRow: (id: string, checked: boolean) => void
  onToggleAll: (checked: boolean, visibleIds: string[]) => void
  onSearchName: (name: string) => void
}

export const StatementsTable: React.FC<Props> = ({
  rows,
  onCellEdit,
  editMode,
  showUnnamed,
  editingNameRowId,
  setEditingNameRowId,
  query = '',
  selectedIds,
  onToggleRow,
  onToggleAll,
  onSearchName
}) => {
  const [dateSortDir, setDateSortDir] = useState<'asc' | 'desc'>('asc') // default asc

  const parseDMY = (s?: string): number => {
    if (!s) return NaN
    // eslint-disable-next-line no-useless-escape
    const parts = s.split(/[\/.-]/).map((t) => t.trim())
    if (parts.length < 3) return NaN
    const d = Number(parts[0])
    const m = Number(parts[1])
    const yy = parts[2]
    const y = yy.length === 2 ? Number(`20${yy}`) : Number(yy)
    const dt = new Date(y, m - 1, d)
    return isNaN(dt.getTime()) ? NaN : dt.getTime()
  }

  const lcQuery = query.trim().toLowerCase()

  const filtered = useMemo(() => {
    let res = lcQuery
      ? rows.filter(
          (r) =>
            (r.name ?? '').toLowerCase().includes(lcQuery) ||
            (r.narration ?? '').toLowerCase().includes(lcQuery) ||
            (r.chqNo ?? '').toLowerCase().includes(lcQuery) ||
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

    const sorted = [...res].sort((a, b) => {
      const ta = parseDMY(a.date)
      const tb = parseDMY(b.date)
      // push invalid to bottom
      if (isNaN(ta) && isNaN(tb)) return 0
      if (isNaN(ta)) return 1
      if (isNaN(tb)) return -1
      return dateSortDir === 'asc' ? ta - tb : tb - ta
    })

    return sorted
  }, [rows, lcQuery, showUnnamed, editingNameRowId, dateSortDir])

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

  const normalizeChq = (s?: string) => (s ?? '').toString().replace(/\s+/g, '').toUpperCase()

  const dupFlags = useMemo(() => {
    // count normalized chqNos
    const counts = new Map<string, number>()
    for (const r of filtered) {
      const key = normalizeChq(r.chqNo)
      if (!key) continue
      counts.set(key, (counts.get(key) || 0) + 1)
    }
    // flag rows where count > 1
    return filtered.map((r) => {
      const key = normalizeChq(r.chqNo)
      return !!key && (counts.get(key) || 0) > 1
    })
  }, [filtered])

  if (!rows.length) {
    return (
      <div style={tableEmptyStyle}>No data yet. Import an Excel file to see and edit rows.</div>
    )
  }

  const sumColumn = (key: keyof BankStatementRow) =>
    filtered.reduce((acc, r) => acc + (parseFloat(String(r[key]) || '0') || 0), 0)

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

      .name-cell { position: relative; }
      .name-search-btn {
        display: none;
        position: absolute;
        right: 10px;
        top: 50%;
        transform: translateY(-50%);
        padding: 4px 8px;
        border-radius: 6px;
        border: 1px solid #e5e7eb;
        background: #fff;
        color: #111;
        cursor: pointer;
        font-size: 12px;
        z-index: 5;
      }
      .name-cell:hover .name-search-btn { display: inline-flex; }
    `}</style>
      <table style={{ borderCollapse: 'collapse', tableLayout: 'fixed', width: '100%' }}>
        <colgroup>
          <col style={{ width: 36 }} />
          {HEADERS.map((key) => (
            <col key={key} style={{ width: toCss(COLUMN_WIDTHS[key]) }} />
          ))}
          {/* <col style={{ width: 100 }} /> */}
        </colgroup>

        <thead>
          <tr style={{ background: '#4f46e5', color: '#fff' }}>
            <th style={{ ...tableHeaderStyle, width: 36, textAlign: 'center' }}>
              <input
                type="checkbox"
                aria-label="Select all visible"
                checked={filtered.length > 0 && filtered.every((r) => selectedIds.has(r.id!))}
                ref={(el) => {
                  if (!el) return
                  const some =
                    filtered.some((r) => selectedIds.has(r.id!)) &&
                    !filtered.every((r) => selectedIds.has(r.id!))
                  el.indeterminate = some
                }}
                onChange={(e) =>
                  onToggleAll(
                    e.currentTarget.checked,
                    filtered.map((r) => r.id!)
                  )
                }
              />
            </th>

            {HEADERS.map((h) => (
              <th
                key={h}
                style={{
                  ...tableHeaderStyle,
                  cursor: h === 'date' ? 'pointer' : 'default',
                  userSelect: 'none',
                  whiteSpace: 'nowrap'
                }}
                onClick={
                  h === 'date'
                    ? () => setDateSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
                    : undefined
                }
                title={
                  h === 'date'
                    ? `Sort ${dateSortDir === 'asc' ? 'descending' : 'ascending'}`
                    : undefined
                }
              >
                {label(h)}
                {h === 'date' && (
                  <span style={{ marginLeft: 6, fontSize: 12 }}>
                    {dateSortDir === 'asc' ? '🔼' : '🔽'}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {filtered.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className={dupFlags[rowIndex] ? 'dupe-row' : undefined}
              style={{
                ...tableRowStyle(rowIndex)
              }}
            >
              <td style={{ padding: 8, textAlign: 'center' }}>
                <input
                  type="checkbox"
                  checked={selectedIds.has(row.id!)}
                  onChange={(e) => onToggleRow(row.id!, e.currentTarget.checked)}
                  aria-label={`Select row ${rowIndex + 1}`}
                />
              </td>
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
                      <div className="name-cell">
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
                            pointerEvents: isLocked ? 'none' : 'auto',
                            paddingRight: 72 // ✅ space for button
                          }}
                          readOnly={isLocked}
                          placeholder="Name"
                        />

                        {!!row.name?.trim() && (
                          <button
                            type="button"
                            className="name-search-btn"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => onSearchName(row.name.trim())}
                            title={`Search "${row.name.trim()}"`}
                          >
                            Search
                          </button>
                        )}
                      </div>
                    ) : (
                      <textarea
                        rows={2}
                        value={row[key] ?? ''}
                        onChange={(e) => !isLocked && onCellEdit(row.id!, key, e.target.value)}
                        className={`editable-textarea ${isLocked ? 'disabled' : ''}`}
                        style={{
                          ...textAreaStyle,
                          backgroundColor:
                            key === 'narration'
                              ? row.narration.includes('50100394646904')
                                ? '#fed7aa'
                                : row.narration.includes('50200054036440')
                                  ? '#b4e4ffff'
                                  : isLocked
                                    ? ''
                                    : '#fff'
                              : isLocked
                                ? '#f9fafb'
                                : '#fff'
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
            <td />
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
