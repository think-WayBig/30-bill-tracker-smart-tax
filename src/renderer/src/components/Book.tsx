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
  ackno?: AcknoEntry[]
  billingStatus?: { status: 'Not started' | 'Pending' | 'Paid'; year: string }[]
  group?: string
  remarks?: { remark: string; year: string }[]
}

const Book = () => {
  const [entries, setEntries] = useState<Entry[]>([])
  const [search, setSearch] = useState('')

  const currentYear = localStorage.getItem('selectedYear')!

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
                const currentAck = result.ackno

                if (!Array.isArray(entry.ackno)) {
                  entry.ackno = []
                }

                entry.ackno.push(currentAck)
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

  const filtered = entries.filter((e) => {
    const q = search.toLowerCase()
    const ack = e.ackno?.find((a) => a.year === currentYear)?.num || ''
    const billingStatus = e.billingStatus?.find((b) => b.year === currentYear)?.status || ''
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

  return (
    <Layout title="📚 Manage Book">
      <style>
        {`
        .hoverable-row:hover {
          background-color: #eef2ff;
        }
        a.ack-link {
          color: #2563eb;
          text-decoration: underline;
          cursor: pointer;
        }
      `}
      </style>

      <input
        type="text"
        placeholder="Search Entry"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: '100%',
          padding: '10px 15px',
          fontSize: '16px',
          borderRadius: '6px',
          border: '1px solid #ccc',
          marginBottom: '20px',
          outline: 'none'
        }}
      />

      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          backgroundColor: 'white',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}
      >
        <thead>
          <tr style={{ backgroundColor: '#4f46e5', color: 'white' }}>
            <th style={thStyle}>File Code</th>
            <th style={thStyle}>Name</th>
            <th style={thStyle}>PAN</th>
            <th style={thStyle}>Acknowledgement No.</th>
            <th style={thStyle}>Billing Status</th>
            <th style={thStyle}>Group</th>
            <th style={thStyle}>Remarks</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td colSpan={6} style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                No data available
              </td>
            </tr>
          ) : (
            filtered.map((entry) => {
              const ackEntry = entry.ackno?.find((a) => a.year === currentYear)
              const billingStatus = entry.billingStatus?.find((b) => b.year === currentYear)?.status

              return (
                <tr key={entry.pan} className="hoverable-row">
                  <td style={tdStyle}>{entry.fileCode}</td>
                  <td style={tdStyle}>{entry.name}</td>
                  <td style={tdStyle}>{entry.pan}</td>
                  <td style={tdStyle}>
                    {ackEntry?.num && ackEntry?.filePath ? (
                      <a
                        className="ack-link"
                        onClick={() => window.electronAPI.openContainingFolder(ackEntry.filePath)}
                      >
                        {ackEntry.num}
                      </a>
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td style={tdStyle}>{billingStatus || 'Not started'}</td>
                  <td style={tdStyle}>{entry.group || 'None'}</td>
                  <td style={tdStyle}>
                    <input
                      type="text"
                      value={entry.remarks?.find((r) => r.year === currentYear)?.remark || ''}
                      onChange={async (e) => {
                        const newRemark = e.target.value

                        // update UI
                        setEntries((prev) =>
                          prev.map((en) => {
                            if (en.pan !== entry.pan) return en

                            const remarks = Array.isArray(en.remarks) ? [...en.remarks] : []
                            const index = remarks.findIndex((r) => r.year === currentYear)

                            if (index !== -1) {
                              remarks[index].remark = newRemark
                            } else {
                              remarks.push({ remark: newRemark, year: currentYear })
                            }

                            return { ...en, remarks }
                          })
                        )

                        // update backend
                        const updatedRemarks = Array.isArray(entry.remarks)
                          ? [...entry.remarks]
                          : []
                        const idx = updatedRemarks.findIndex((r) => r.year === currentYear)

                        if (idx !== -1) {
                          updatedRemarks[idx].remark = newRemark
                        } else {
                          updatedRemarks.push({ remark: newRemark, year: currentYear })
                        }

                        await window.electronAPI.updateRemarks(entry.pan, updatedRemarks)
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
