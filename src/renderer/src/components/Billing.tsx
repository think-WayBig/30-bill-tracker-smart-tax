import { useEffect, useState } from 'react'
import Layout from './Layout'

type BillingStatus = 'Not started' | 'Pending' | 'Paid'

type BillingEntry = {
  name: string
  pan: string
  billingStatus?: BillingStatus
  fileCode: string
}

export default function Billing() {
  const [entries, setEntries] = useState<BillingEntry[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchEntries = async () => {
      const loaded = await window.electronAPI.loadEntries()
      setEntries(loaded)
    }
    fetchEntries()
  }, [])

  const handleBillingStatusChange = async (pan: string, newStatus: BillingStatus) => {
    setEntries((prev) =>
      prev.map((entry) => (entry.pan === pan ? { ...entry, billingStatus: newStatus } : entry))
    )

    await window.electronAPI.updateBillingStatus(pan, newStatus)
  }

  const filteredEntries = entries.filter(
    (e) =>
      e.fileCode.toLowerCase().includes(search.toLowerCase()) ||
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.pan.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Layout title="💳 Manage Billing">
      <style>
        {`
        .hoverable-row:hover {
          background-color: #eef2ff;
        }

        select.billing-dropdown {
          padding: 6px 10px;
          font-size: 15px;
          border-radius: 6px;
          border: 1px solid #ccc;
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
            <th style={thStyle}>Billing Status</th>
          </tr>
        </thead>
        <tbody>
          {filteredEntries.length === 0 ? (
            <tr>
              <td colSpan={4} style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                No data available
              </td>
            </tr>
          ) : (
            filteredEntries.map((entry) => (
              <tr key={entry.pan} className="hoverable-row">
                <td style={tdStyle}>{entry.fileCode || '—'}</td>
                <td style={tdStyle}>{entry.name}</td>
                <td style={tdStyle}>{entry.pan}</td>
                <td style={tdStyle}>
                  <select
                    className="billing-dropdown"
                    value={entry.billingStatus || 'Not started'}
                    onChange={(e) =>
                      handleBillingStatusChange(entry.pan, e.target.value as BillingStatus)
                    }
                  >
                    <option value="Not started">Not started</option>
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                  </select>
                </td>
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
