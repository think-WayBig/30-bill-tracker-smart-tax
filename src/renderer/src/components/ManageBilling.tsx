import { useEffect, useState } from 'react'
import Layout from './Layout'

type BillingEntry = {
  name: string
  pan: string
  billingStatus?: 'Due' | 'Paid'
}

export default function ManageBilling() {
  const [entries, setEntries] = useState<BillingEntry[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchEntries = async () => {
      const loaded = await window.electronAPI.loadEntries()
      setEntries(loaded)
    }
    fetchEntries()
  }, [])

  const handleCheckboxChange = async (pan: string, checked: boolean) => {
    const newStatus = checked ? 'Paid' : 'Due'

    setEntries((prev) =>
      prev.map((entry) => (entry.pan === pan ? { ...entry, billingStatus: newStatus } : entry))
    )

    await window.electronAPI.updateBillingStatus(pan, newStatus)
  }

  const filteredEntries = entries.filter(
    (entry) =>
      entry.name.toLowerCase().includes(search.toLowerCase()) ||
      entry.pan.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Layout title="💳 Manage Billing">
      <style>
        {`
        .hoverable-row:hover {
          background-color: #eef2ff;
        }

        .large-checkbox {
          width: 24px;
          height: 24px;
          cursor: pointer;
        }
      `}
      </style>

      <input
        type="text"
        placeholder="Search by Name or PAN"
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
            <th style={thStyle}>Name</th>
            <th style={thStyle}>PAN</th>
            <th style={thStyle}>Paid?</th>
          </tr>
        </thead>
        <tbody>
          {filteredEntries.length === 0 ? (
            <tr>
              <td colSpan={3} style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                No data available
              </td>
            </tr>
          ) : (
            filteredEntries.map((entry) => (
              <tr key={entry.pan} className="hoverable-row">
                <td style={tdStyle}>{entry.name}</td>
                <td style={tdStyle}>{entry.pan}</td>
                <td style={tdStyle}>
                  <input
                    type="checkbox"
                    className="large-checkbox"
                    checked={entry.billingStatus === 'Paid'}
                    onChange={(e) => handleCheckboxChange(entry.pan, e.target.checked)}
                  />
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
