import { useEffect, useState } from 'react'
import Layout from './Layout'

type Entry = {
  name: string
  fileCode: string
  pan: string
  ackno?: string
  billingStatus?: 'Not started' | 'Pending' | 'Paid'
  group?: string
  filePath?: string
}

const Book = () => {
  const [entries, setEntries] = useState<Entry[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    const loadAndRender = async () => {
      const folderPath = localStorage.getItem('selectedFolder')
      const loaded = await window.electronAPI.loadEntries()

      if (folderPath) {
        for (const entry of loaded) {
          if (!entry.ackno) {
            try {
              const result = await window.electronAPI.getAcknoFromFile(entry.pan, folderPath)
              if (result.success && result.ackno && result.filePath) {
                entry.ackno = result.ackno
                entry.filePath = result.filePath
                await window.electronAPI.updateEntryAckno(entry.pan, result.ackno, result.filePath)
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
  }, [])

  const filtered = entries.filter((e) => {
    const q = search.toLowerCase()
    return (
      e.fileCode.toLowerCase().includes(q) ||
      e.name.toLowerCase().includes(q) ||
      e.pan.toLowerCase().includes(q) ||
      (e.ackno || '').toLowerCase().includes(q) ||
      (e.billingStatus || '').toLowerCase().includes(q) ||
      (e.group || '').toLowerCase().includes(q)
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
        placeholder="Search by Name, PAN, Ack No., Billing Status or Group"
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
            filtered.map((entry) => (
              <tr key={entry.pan} className="hoverable-row">
                <td style={tdStyle}>{entry.fileCode}</td>
                <td style={tdStyle}>{entry.name}</td>
                <td style={tdStyle}>{entry.pan}</td>
                <td style={tdStyle}>
                  {entry.ackno && entry.filePath ? (
                    <a
                      className="ack-link"
                      onClick={() => window.electronAPI.openContainingFolder(entry.filePath!)}
                    >
                      {entry.ackno}
                    </a>
                  ) : (
                    entry.ackno || 'N/A'
                  )}
                </td>
                <td style={tdStyle}>{entry.billingStatus}</td>
                <td style={tdStyle}>{entry.group || 'None'}</td>
              </tr>
            ))
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
