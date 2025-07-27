import { useEffect, useState } from 'react'
import Layout from './Layout'

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
  endYear: string
  ackno?: AcknoEntry[]
  billingStatus?: { status: 'Not started' | 'Pending' | 'Paid'; year: string }[]
  group?: string
  remarks?: { remark: string; year: string }[]
}

const Book = ({ activeScreen }: { activeScreen: string }) => {
  const currentYear = localStorage.getItem('selectedYear')!
  const [entries, setEntries] = useState<Entry[]>([])
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<'name' | 'fileCode' | 'pan' | 'group' | ''>('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const isManagePending = activeScreen === 'book-entries-pending'
  const isManageNonPending = activeScreen === 'book-entries-completed'

  useEffect(() => {
    const loadAndRender = async () => {
      const folderPath = localStorage.getItem('selectedFolder')
      const loaded = await window.electronAPI.loadEntries()

      if (folderPath) {
        for (const entry of loaded) {
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
                await window.electronAPI.updateEntryAckno(entry.pan, entry.ackno)
              }
            } catch (err) {
              console.error(`Error fetching ackNo for ${entry.pan}`, err)
            }
          }
        }
      }

      setEntries(loaded)
    }

    loadAndRender()
  }, [currentYear])

  const filtered = entries
    .filter((e) => {
      const hasAck = e.ackno?.some((a) => a.year === currentYear && a.num?.trim())

      if (isManagePending) return !hasAck
      if (isManageNonPending) return hasAck
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

  const handleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortOrder('asc')
    }
  }

  const sorted = [...filtered].sort((a, b) => {
    const aVal = (a[sortKey] || '').toString()
    const bVal = (b[sortKey] || '').toString()
    return sortOrder === 'asc'
      ? aVal.localeCompare(bVal, undefined, { numeric: true, sensitivity: 'base' })
      : bVal.localeCompare(aVal, undefined, { numeric: true, sensitivity: 'base' })
  })

  const keyLabelMap = {
    fileCode: 'File Code',
    name: 'Name',
    pan: 'PAN',
    group: 'Group'
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

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
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

      <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white' }}>
        <thead>
          <tr style={{ backgroundColor: '#4f46e5', color: 'white' }}>
            {(['fileCode', 'name', 'pan', 'group'] as const).map((key) => (
              <th
                key={key}
                style={{ ...thStyle, cursor: 'pointer' }}
                onClick={() => handleSort(key)}
              >
                {keyLabelMap[key]} {sortKey === key && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
            ))}
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
                  <td style={tdStyle}>
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
