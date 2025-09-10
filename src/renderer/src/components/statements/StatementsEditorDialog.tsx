import React, { useEffect, useMemo, useRef, useState } from 'react'

type Cell = string

export interface StatementsEditorDialogProps {
  open: boolean
  data: Cell[][]
  onClose: () => void
  onSave: (updated: Cell[][]) => void
}

const DEFAULT_COL_WIDTH = 240 // wider default

export const StatementsEditorDialog: React.FC<StatementsEditorDialogProps> = ({
  open,
  data,
  onClose,
  onSave
}) => {
  const [draft, setDraft] = useState<Cell[][]>(data ?? [])
  const [colWidths, setColWidths] = useState<number[]>([])
  const shellRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => setDraft(data ?? []), [data])

  // Measure text width using canvas for accurate auto-fit
  const measureText = (text: string) => {
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas')
    }
    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return text.length * 8 // fallback
    // Match textarea font roughly
    ctx.font = '14px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif'
    return ctx.measureText(text).width
  }

  const headers = useMemo<string[]>(() => {
    const first = draft?.[0] ?? []
    const anyValue = first.some((c) => String(c || '').trim() !== '')
    if (anyValue) return first.map((h, i) => String(h || '').trim() || `Column ${i + 1}`)
    const maxCols = draft.reduce((m, r) => Math.max(m, r.length), 0)
    return Array.from({ length: maxCols }, (_, i) => `Column ${i + 1}`)
  }, [draft])

  const bodyStartIndex = useMemo(() => {
    const first = draft?.[0] ?? []
    return first.some((c) => String(c || '').trim() !== '') ? 1 : 0
  }, [draft])

  // Initialize column widths when headers change
  useEffect(() => {
    if (!headers.length) return
    setColWidths((prev) => {
      if (prev.length === headers.length) return prev
      const next = Array.from({ length: headers.length }, (_, i) => prev[i] ?? DEFAULT_COL_WIDTH)
      return next
    })
  }, [headers])

  const handleEdit = (rowIndex: number, colIndex: number, value: string) => {
    setDraft((prev) => {
      const next = prev.map((r) => [...r])
      if (!next[rowIndex]) next[rowIndex] = []
      next[rowIndex][colIndex] = value
      return next
    })
  }

  const autoGrow = (el: HTMLTextAreaElement | null) => {
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }

  // ===== Column Resize Logic =====
  const startResize = (colIndex: number, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const startX = e.clientX
    const startWidth = colWidths[colIndex] ?? DEFAULT_COL_WIDTH

    // Lock selection/cursor while dragging
    const prevUserSelect = document.body.style.userSelect
    const prevCursor = document.body.style.cursor
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'col-resize'

    const onMove = (ev: MouseEvent) => {
      const delta = ev.clientX - startX
      setColWidths((w) => {
        const next = [...w]
        next[colIndex] = Math.max(120, startWidth + delta) // clamp minimum
        return next
      })
    }

    const onUp = () => {
      document.body.style.userSelect = prevUserSelect
      document.body.style.cursor = prevCursor
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  const autoFitColumn = (colIndex: number) => {
    // Find longest content in this column (header + body)
    const candidates: string[] = []
    const headerText = headers[colIndex] ?? ''
    candidates.push(String(headerText))
    for (let r = bodyStartIndex; r < draft.length; r++) {
      candidates.push(String(draft[r]?.[colIndex] ?? ''))
    }

    const maxWidth =
      Math.max(
        ...candidates.map((t) => Math.ceil(measureText(t)) + 26) // padding + border
      ) + 20 // small buffer

    setColWidths((w) => {
      const next = [...w]
      next[colIndex] = Math.min(Math.max(140, maxWidth), 800) // clamp
      return next
    })
  }

  // Close on ESC
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      onKeyDown={onKeyDown}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
    >
      <div
        ref={shellRef}
        style={{
          width: '96vw',
          maxWidth: 1400,
          height: '86vh',
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 20px 50px rgba(2, 6, 23, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Sticky header with actions */}
        <div
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '12px 16px',
            borderBottom: '1px solid #e5e7eb',
            background: 'linear-gradient(#ffffff, #ffffff)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#111827' }}>
              Edit Imported Data
            </h2>
            <span style={{ fontSize: 12, color: '#6b7280' }}>
              {Math.max(0, draft.length - bodyStartIndex)} rows • {headers.length} columns
            </span>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={onClose}
              style={{
                padding: '8px 14px',
                background: '#f3f4f6',
                border: '1px solid #e5e7eb',
                color: '#111827',
                borderRadius: 8,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(draft)}
              style={{
                padding: '8px 14px',
                background: '#4f46e5',
                border: '1px solid #4f46e5',
                color: '#fff',
                borderRadius: 8,
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(79,70,229,0.3)'
              }}
            >
              Save
            </button>
          </div>
        </div>

        {/* Scroll containers:
            - outer: vertical scroll
            - inner: horizontal scroll for wide tables */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            background: '#fafafa'
          }}
        >
          <div style={{ padding: 16 }}>
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: 10,
                overflow: 'hidden'
              }}
            >
              <div style={{ overflowX: 'auto' }}>
                <table
                  style={{
                    width: 'max-content', // let columns be as wide as they need
                    borderCollapse: 'separate',
                    borderSpacing: 0
                  }}
                >
                  {/* colgroup drives column widths */}
                  <colgroup>
                    {headers.map((_, i) => (
                      <col key={i} style={{ width: (colWidths[i] ?? DEFAULT_COL_WIDTH) + 'px' }} />
                    ))}
                  </colgroup>

                  <thead>
                    <tr>
                      {headers.map((h, colIndex) => (
                        <th
                          key={colIndex}
                          style={{
                            position: 'sticky',
                            top: 0,
                            zIndex: 1,
                            background: '#f8fafc',
                            textAlign: 'left',
                            padding: '12px 10px',
                            borderBottom: '1px solid #e2e8f0',
                            fontWeight: 700,
                            color: '#0f172a',
                            fontSize: 13
                          }}
                        >
                          <div style={{ position: 'relative', paddingRight: 8 }}>
                            {h}
                            {/* Resize handle */}
                            <div
                              onMouseDown={(e) => startResize(colIndex, e)}
                              onDoubleClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                autoFitColumn(colIndex)
                              }}
                              title="Drag to resize • Double-click to auto-fit"
                              style={{
                                position: 'absolute',
                                right: -4,
                                top: 0,
                                height: '100%',
                                width: 8,
                                cursor: 'col-resize',
                                userSelect: 'none'
                              }}
                            />
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {draft.slice(bodyStartIndex).map((row, i) => {
                      const rowIndex = i + bodyStartIndex
                      const cols = Math.max(headers.length, row.length)
                      const zebra = i % 2 === 0
                      return (
                        <tr key={rowIndex} style={{ background: zebra ? '#ffffff' : '#fbfbfd' }}>
                          {Array.from({ length: cols }).map((_, colIndex) => {
                            const cell = row?.[colIndex] ?? ''
                            return (
                              <td
                                key={colIndex}
                                style={{
                                  padding: 8,
                                  borderBottom: '1px solid #f1f5f9',
                                  verticalAlign: 'top'
                                }}
                              >
                                <textarea
                                  value={cell}
                                  onChange={(e) => handleEdit(rowIndex, colIndex, e.target.value)}
                                  onInput={(e) => autoGrow(e.currentTarget)}
                                  rows={2}
                                  style={{
                                    width: '100%',
                                    font: 'inherit',
                                    lineHeight: 1.5,
                                    color: '#0f172a',
                                    background: '#ffffff',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: 8,
                                    padding: '8px 10px',
                                    resize: 'none',
                                    overflow: 'hidden',
                                    outline: 'none',
                                    boxShadow: 'inset 0 1px 1px rgba(0,0,0,0.02)'
                                  }}
                                  onFocus={(e) => {
                                    e.currentTarget.style.borderColor = '#4f46e5'
                                    e.currentTarget.style.boxShadow =
                                      '0 0 0 3px rgba(79,70,229,0.15)'
                                  }}
                                  onBlur={(e) => {
                                    e.currentTarget.style.borderColor = '#e5e7eb'
                                    e.currentTarget.style.boxShadow =
                                      'inset 0 1px 1px rgba(0,0,0,0.02)'
                                  }}
                                />
                              </td>
                            )
                          })}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
