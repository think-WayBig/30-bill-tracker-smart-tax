import React, { useEffect, useState } from 'react'
import Layout from './Layout'

type Notice = {
  name: string
  date: string
  type: 'GST' | 'ITR'
  done?: boolean
}

const Notices: React.FC = () => {
  const [gstName, setGstName] = useState('')
  const [gstDate, setGstDate] = useState('')
  const [itrName, setItrName] = useState('')
  const [itrDate, setItrDate] = useState('')
  const [notices, setNotices] = useState<Notice[]>([])

  const [gstSearch, setGstSearch] = useState('')
  const [itrSearch, setItrSearch] = useState('')

  const [gstSortAsc, setGstSortAsc] = useState(true)
  const [itrSortAsc, setItrSortAsc] = useState(true)

  useEffect(() => {
    const loadNotices = async () => {
      const data = await window.electronAPI.loadNotices()
      const sorted = data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      setNotices(sorted)
    }
    loadNotices()
  }, [gstName, gstDate, itrName, itrDate])

  const handleGstSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = await window.electronAPI.saveGstNotice({ name: gstName, date: gstDate })
    if (result.success) {
      alert('✅ GST Notice saved successfully!')
      setGstName('')
      setGstDate('')
    } else {
      alert(`❌ Error: ${result.error}`)
    }
  }

  const handleItrSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = await window.electronAPI.saveItrNotice({ name: itrName, date: itrDate })
    if (result.success) {
      alert('✅ ITR Notice saved successfully!')
      setItrName('')
      setItrDate('')
    } else {
      alert(`❌ Error: ${result.error}`)
    }
  }

  const gstNotices = notices
    .filter((n) => n.type === 'GST' && n.name.toLowerCase().includes(gstSearch.toLowerCase()))
    .sort((a, b) =>
      gstSortAsc
        ? new Date(a.date).getTime() - new Date(b.date).getTime()
        : new Date(b.date).getTime() - new Date(a.date).getTime()
    )

  const itrNotices = notices
    .filter((n) => n.type === 'ITR' && n.name.toLowerCase().includes(itrSearch.toLowerCase()))
    .sort((a, b) =>
      itrSortAsc
        ? new Date(a.date).getTime() - new Date(b.date).getTime()
        : new Date(b.date).getTime() - new Date(a.date).getTime()
    )

  const handleToggleDone = async (updatedNotice: Notice) => {
    const result = await window.electronAPI.updateNotice(updatedNotice)
    if (result.success) {
      setNotices((prev) =>
        prev.map((n) =>
          n.name === updatedNotice.name &&
          n.date === updatedNotice.date &&
          n.type === updatedNotice.type
            ? updatedNotice
            : n
        )
      )
    } else {
      alert(`❌ Error: ${result.error}`)
    }
  }

  return (
    <Layout title="📬 Add GST / ITR Notices">
      <div style={containerStyle}>
        {/* GST Section */}
        <div style={columnStyle}>
          <form onSubmit={handleGstSubmit} style={formStyle}>
            <label style={labelStyle}>GST Name</label>
            <input
              type="text"
              placeholder="Enter Name"
              value={gstName}
              onChange={(e) => setGstName(e.target.value)}
              required
              style={inputStyle}
            />

            <label style={labelStyle}>GST Date</label>
            <input
              type="date"
              value={gstDate}
              onChange={(e) => setGstDate(e.target.value)}
              required
              style={inputStyle}
            />

            <button type="submit" style={buttonStyle}>
              Save GST Notice
            </button>
          </form>

          <div style={searchBarWrapperStyle}>
            <h3 style={tableHeadingStyle}>📄 GST Notices</h3>
            <input
              type="text"
              value={gstSearch}
              onChange={(e) => setGstSearch(e.target.value)}
              placeholder="Search GST notices"
              style={searchBarStyle}
            />
          </div>
          <NoticeTable
            notices={gstNotices}
            onToggleSort={() => setGstSortAsc((prev) => !prev)}
            sortAsc={gstSortAsc}
            onToggleDone={handleToggleDone}
          />
        </div>

        {/* ITR Section */}
        <div style={columnStyle}>
          <form onSubmit={handleItrSubmit} style={formStyle}>
            <label style={labelStyle}>ITR Name</label>
            <input
              type="text"
              placeholder="Enter Name"
              value={itrName}
              onChange={(e) => setItrName(e.target.value)}
              required
              style={inputStyle}
            />

            <label style={labelStyle}>ITR Date</label>
            <input
              type="date"
              value={itrDate}
              onChange={(e) => setItrDate(e.target.value)}
              required
              style={inputStyle}
            />

            <button type="submit" style={buttonStyle}>
              Save ITR Notice
            </button>
          </form>

          <div style={searchBarWrapperStyle}>
            <h3 style={tableHeadingStyle}>📄 ITR Notices</h3>
            <input
              type="text"
              value={itrSearch}
              onChange={(e) => setItrSearch(e.target.value)}
              placeholder="Search ITR notices"
              style={searchBarStyle}
            />
          </div>
          <NoticeTable
            notices={itrNotices}
            onToggleSort={() => setItrSortAsc((prev) => !prev)}
            sortAsc={itrSortAsc}
            onToggleDone={handleToggleDone}
          />
        </div>
      </div>
    </Layout>
  )
}

export default Notices

const NoticeTable = ({
  notices,
  onToggleSort,
  sortAsc,
  onToggleDone
}: {
  notices: Notice[]
  onToggleSort: () => void
  sortAsc: boolean
  onToggleDone: (updated: Notice) => void
}) => (
  <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
    <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
      <thead>
        <tr style={{ backgroundColor: '#4f46e5', color: 'white' }}>
          <th style={thStyle}>Name</th>
          <th style={{ ...thStyle, cursor: 'pointer' }} onClick={onToggleSort}>
            Date {sortAsc ? '↑' : '↓'}
          </th>
          <th style={thStyle}>Done</th>
        </tr>
      </thead>
      <tbody>
        {notices.length === 0 ? (
          <tr>
            <td colSpan={3} style={{ padding: '16px', textAlign: 'center', color: '#666' }}>
              No notices yet
            </td>
          </tr>
        ) : (
          notices.map((n, i) => (
            <tr key={i} className="hoverable-row">
              <td style={tdStyle}>{n.name}</td>
              <td style={tdStyle}>{n.date}</td>
              <td style={tdStyle}>
                <input
                  type="checkbox"
                  checked={n.done ?? false}
                  onChange={() => onToggleDone({ ...n, done: !n.done })}
                  style={{ transform: 'scale(1.8)' }}
                />
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
)

const containerStyle: React.CSSProperties = {
  display: 'flex',
  gap: '2rem',
  flexWrap: 'wrap'
}

const columnStyle: React.CSSProperties = {
  flex: '1 1 45%',
  display: 'flex',
  flexDirection: 'column'
}

const formStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  backgroundColor: '#fff',
  borderRadius: '12px',
  padding: '2rem',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
  border: '1px solid #e0e7ff',
  minWidth: '350px'
}

const inputStyle: React.CSSProperties = {
  padding: '10px',
  border: '1px solid #a5b4fc',
  borderRadius: '8px',
  fontSize: '16px',
  backgroundColor: '#f9fafe'
}

const labelStyle: React.CSSProperties = {
  fontWeight: 600,
  color: '#4f46e5'
}

const buttonStyle: React.CSSProperties = {
  padding: '10px',
  backgroundColor: '#4f46e5',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '16px',
  marginTop: '10px'
}

const tableHeadingStyle: React.CSSProperties = {
  color: '#4f46e5',
  backgroundColor: '#f5f7ff',
  paddingTop: 40,
  paddingBottom: 15
}

const thStyle: React.CSSProperties = {
  padding: '12px 16px',
  textAlign: 'left',
  fontWeight: 'bold'
}

const tdStyle: React.CSSProperties = {
  padding: '10px 16px'
}

const searchBarWrapperStyle: React.CSSProperties = {
  position: 'sticky',
  top: '70px',
  zIndex: 10,
  paddingBottom: '0.5rem'
}

const searchBarStyle: React.CSSProperties = {
  padding: '10px 14px',
  width: '100%',
  fontSize: '15px',
  borderRadius: '8px',
  border: '1px solid #ccc',
  outline: 'none'
}
