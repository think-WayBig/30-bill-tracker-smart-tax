import { useEffect, useMemo, useState } from 'react'
import Layout from '../helpers/Layout'

type AcknoEntry = {
  num: string
  year: string
  filePath: string
}

type Entry = {
  name: string
  fileCode: string
  pan: string
  startYear: string
  endYear?: string
  ackno?: AcknoEntry[]
  ackDate?: { date: string; year: string }[]
  billingStatus?: { status: 'Not started' | 'Pending' | 'Paid'; year: string }[]
  group?: string
  remarks?: { remark: string; year: string }[]
  docsComplete?: { value: boolean; year: string; completedOn?: string }[]
}

const Book = ({ activeScreen }: { activeScreen: string }) => {
  const currentYear = localStorage.getItem('selectedYear')!
  const [entries, setEntries] = useState<Entry[]>([])
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<'name' | 'fileCode' | 'pan' | 'group' | 'ackDate' | ''>('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const isDocsIncompleteView = activeScreen === 'book-entries-docs-incomplete'
  const isDocsCompleteView = activeScreen === 'book-entries-docs-complete'
  const isManageNonPending = activeScreen === 'book-entries-completed'

  useEffect(() => {
    const loadAndRender = async () => {
      const folderPath = localStorage.getItem('selectedFolder')
      const loaded = await window.electronAPI.loadEntries()

      const extractAckDate = (ackNum: string): string | undefined => {
        if (!ackNum || ackNum.length < 6) return undefined
        const dateDigits = ackNum.slice(-6)
        const day = dateDigits.slice(0, 2)
        const month = dateDigits.slice(2, 4)
        const year = dateDigits.slice(4)
        return `${day}-${month}-${year}`
      }

      if (folderPath) {
        await Promise.all(
          loaded.map(async (entry) => {
            const alreadyHas = entry.ackno?.some((a) => a.year === currentYear)
            if (!alreadyHas) {
              try {
                const result = await window.electronAPI.getAcknoFromFile(
                  entry.pan,
                  folderPath,
                  currentYear
                )
                if (result.success && result.ackno) {
                  if (!Array.isArray(entry.ackno)) entry.ackno = []
                  entry.ackno.push(result.ackno)

                  const ackDate = extractAckDate(result.ackno.num)
                  if (!Array.isArray(entry.ackDate)) entry.ackDate = []
                  entry.ackDate = entry.ackDate.filter((a) => a.year !== currentYear)
                  if (ackDate) {
                    entry.ackDate.push({ year: currentYear, date: ackDate })
                  }

                  await window.electronAPI.updateEntryAckno(entry.pan, entry.ackno)
                  await window.electronAPI.updateEntryAckDate(entry.pan, entry.ackDate)
                }
              } catch (err) {
                console.error(`Error fetching ackNo for ${entry.pan}`, err)
              }
            }
          })
        )
      }

      setEntries(loaded)
    }

    loadAndRender()
  }, [currentYear])

  const filtered = useMemo(() => {
    return entries
      .filter((e) => {
        const hasAck = e.ackno?.some((a) => a.year === currentYear && a.num?.trim())

        if (isManageNonPending) return hasAck

        const docsStatus = e.docsComplete?.find((d) => d.year === currentYear)?.value ?? false
        if (isDocsCompleteView) return docsStatus && !hasAck
        if (isDocsIncompleteView) return !docsStatus

        return true
      })
      .filter((e) => {
        const q = search.toLowerCase()
        const ack = e.ackno?.find((a) => a.year === currentYear)?.num || ''
        const billingStatus =
          e.billingStatus?.find((b) => b.year === currentYear)?.status || 'Not started'
        const remarks = e.remarks?.find((r) => r.year === currentYear)?.remark || ''

        return (
          e.fileCode.toLowerCase().includes(q) ||
          e.name.toLowerCase().includes(q) ||
          e.pan.toLowerCase().includes(q) ||
          ack.toLowerCase().includes(q) ||
          billingStatus.toLowerCase().includes(q) ||
          (e.group || '').toLowerCase().includes(q) ||
          remarks.toLowerCase().includes(q)
        )
      })
  }, [entries, currentYear, isManageNonPending, isDocsCompleteView, isDocsIncompleteView, search])

  const handleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortOrder('asc')
    }
  }

  const sorted = useMemo(() => {
    if (!sortKey) return filtered

    return [...filtered].sort((a, b) => {
      let aVal: string = ''
      let bVal: string = ''

      if (sortKey === 'ackDate') {
        aVal =
          a.ackDate
            ?.find((d) => d.year === currentYear)
            ?.date?.split('-')
            .reverse()
            .join('-') || ''
        bVal =
          b.ackDate
            ?.find((d) => d.year === currentYear)
            ?.date?.split('-')
            .reverse()
            .join('-') || ''
      } else {
        aVal = (a[sortKey] || '').toString()
        bVal = (b[sortKey] || '').toString()
      }

      return sortOrder === 'asc'
        ? aVal.localeCompare(bVal, undefined, { numeric: true, sensitivity: 'base' })
        : bVal.localeCompare(aVal, undefined, { numeric: true, sensitivity: 'base' })
    })
  }, [filtered, sortKey, sortOrder, currentYear])

  const keyLabelMap = {
    fileCode: 'File Code',
    name: 'Name',
    pan: 'PAN',
    group: 'Group',
    ackDate: 'Ack Date'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Not started':
        return '#eab308'
      case 'Pending':
        return '#dc2626'
      case 'Paid':
        return '#16a34a'
      default:
        return '#374151'
    }
  }

  return (
    <Layout title="📚 Manage Book">
      <style>
        {`
        .hoverable-row:hover { background-color: #eef2ff; }
        a.ack-link {
          color: #2563eb;
          text-decoration: underline;
          cursor: pointer;
        }
      `}
      </style>

      <div
        style={{
          display: 'flex',
          top: '80px',
          position: 'sticky',
          alignItems: 'center',
          gap: 8,
          marginBottom: 20
        }}
      >
        <input
          type="text"
          placeholder="Search Entry"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            padding: '10px 15px',
            fontSize: '16px',
            borderRadius: '6px',
            border: '1px solid #ccc',
            outline: 'none'
          }}
        />
        <div
          style={{
            padding: '8px 16px',
            backgroundColor: '#f3f4f6',
            borderRadius: '6px',
            fontSize: '15px',
            fontWeight: 500,
            color: '#374151'
          }}
        >
          <b>Total entries:</b> {sorted.length}
        </div>
      </div>

      <div style={{ overflowX: 'auto', width: '100%' }}>
        <table
          style={{
            minWidth: '100%',
            width: 'max-content',
            borderCollapse: 'collapse',
            backgroundColor: 'white'
          }}
        >
          <thead>
            <tr style={{ backgroundColor: '#4f46e5', color: 'white' }}>
              {(['fileCode', 'name', 'pan', 'group', 'ackDate'] as const).map((key) => (
                <th
                  key={key}
                  style={{
                    ...thStyle,
                    cursor: 'pointer',
                    width: key === 'name' || key === 'group' ? '300px' : undefined // adjust width here
                  }}
                  onClick={() => handleSort(key)}
                >
                  {keyLabelMap[key]} {sortKey === key && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
              ))}

              <th style={thStyle}>Docs Complete</th>
              <th style={thStyle}>Docs Received On</th>
              <th style={thStyle}>AckNo.</th>
              <th style={thStyle}>Billing Status</th>
              <th style={thStyle}>Remarks</th>
              <th style={thStyle}>Start Year</th>
              <th style={thStyle}>End Year</th>
            </tr>
          </thead>

          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                  No data available
                </td>
              </tr>
            ) : (
              sorted.map((entry) => {
                const ack = entry.ackno?.find((a) => a.year === currentYear)
                const billing = entry.billingStatus?.find((b) => b.year === currentYear)?.status
                const remark = entry.remarks?.find((r) => r.year === currentYear)?.remark || ''

                return (
                  <tr key={entry.pan} className="hoverable-row">
                    <td style={tdStyle}>{entry.fileCode}</td>
                    <td style={tdStyle}>{entry.name}</td>
                    <td style={tdStyle}>{entry.pan}</td>
                    <td style={tdStyle}>{entry.group || 'None'}</td>
                    <td style={tdStyle}>
                      {entry.ackDate?.find((a) => a.year === currentYear)?.date || '-'}
                    </td>
                    <td
                      style={{
                        ...tdStyle,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginTop: '7px'
                      }}
                    >
                      <input
                        type="checkbox"
                        style={{ transform: 'scale(1.8)' }}
                        checked={
                          entry.docsComplete?.find((d) => d.year === currentYear)?.value ?? false
                        }
                        onChange={async (e) => {
                          const value = e.target.checked

                          // Update UI state
                          setEntries((prev) =>
                            prev.map((en) => {
                              if (en.pan !== entry.pan) return en
                              const updatedDocs = [...(en.docsComplete || [])]
                              const index = updatedDocs.findIndex((d) => d.year === currentYear)
                              const dateNow = value
                                ? new Date().toISOString().split('T')[0]
                                : undefined
                              if (index !== -1) {
                                updatedDocs[index].value = value
                                updatedDocs[index].completedOn = dateNow
                              } else {
                                updatedDocs.push({ year: currentYear, value, completedOn: dateNow })
                              }
                              return { ...en, docsComplete: updatedDocs }
                            })
                          )

                          // Persist to backend
                          const updatedDocs = [...(entry.docsComplete || [])]
                          const idx = updatedDocs.findIndex((d) => d.year === currentYear)
                          const dateNow = value ? new Date().toISOString().split('T')[0] : undefined
                          if (idx !== -1) {
                            updatedDocs[idx].value = value
                            updatedDocs[idx].completedOn = dateNow
                          } else {
                            updatedDocs.push({ year: currentYear, value, completedOn: dateNow })
                          }
                          await window.electronAPI.updateDocsComplete(entry.pan, updatedDocs)
                        }}
                      />
                    </td>
                    <td style={tdStyle}>
                      {entry.docsComplete?.find((d) => d.year === currentYear && d.value)
                        ?.completedOn || '-'}
                    </td>
                    <td style={tdStyle}>
                      {ack?.num && ack.filePath ? (
                        <a
                          className="ack-link"
                          onClick={() => window.electronAPI.openContainingFolder(ack.filePath)}
                        >
                          {ack.num}
                        </a>
                      ) : (
                        'Pending'
                      )}
                    </td>

                    <td style={{ ...tdStyle, color: getStatusColor(billing || 'Not started') }}>
                      {billing || 'Not started'}
                    </td>
                    <td style={{ ...tdStyle, width: '300px' }}>
                      <input
                        type="text"
                        value={remark}
                        onChange={async (e) => {
                          const newRemark = e.target.value
                          setEntries((prev) =>
                            prev.map((en) => {
                              if (en.pan !== entry.pan) return en
                              const remarks = [...(en.remarks || [])]
                              const index = remarks.findIndex((r) => r.year === currentYear)
                              if (index !== -1) remarks[index].remark = newRemark
                              else remarks.push({ year: currentYear, remark: newRemark })
                              return { ...en, remarks }
                            })
                          )

                          const remarksCopy = [...(entry.remarks || [])]
                          const idx = remarksCopy.findIndex((r) => r.year === currentYear)
                          if (idx !== -1) remarksCopy[idx].remark = newRemark
                          else remarksCopy.push({ year: currentYear, remark: newRemark })
                          await window.electronAPI.updateRemarks(entry.pan, remarksCopy)
                        }}
                        style={{
                          width: '100%',
                          padding: '6px 10px',
                          fontSize: '14px',
                          borderRadius: '4px',
                          border: '1px solid #ccc',
                          outline: 'none'
                        }}
                      />
                    </td>
                    <td style={tdStyle}>{entry.startYear}</td>
                    <td style={tdStyle}>{entry.endYear || 'Not set'}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  )
}

const thStyle: React.CSSProperties = {
  padding: '12px 16px',
  textAlign: 'left',
  fontWeight: 'bold'
}

const tdStyle: React.CSSProperties = {
  padding: '10px 16px'
}

export default Book
