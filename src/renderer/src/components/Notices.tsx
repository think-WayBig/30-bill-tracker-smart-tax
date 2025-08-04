import React, { useEffect, useState } from 'react'
import Layout from './Layout'

type Notice = {
  name: string
  date: string
  type: 'GST' | 'ITR'
  dueDate: string
  year: string
  done?: boolean
}

const generateYears = () => {
  const currentYear = new Date().getFullYear()
  const years: string[] = []
  for (let i = currentYear + 1; i >= 2020; i--) {
    years.push(`${i - 1}-${i}`) // format: 2024-2025
  }
  return years
}

const Notices: React.FC = () => {
  const [gstName, setGstName] = useState('')
  const [gstDate, setGstDate] = useState('')
  const [itrName, setItrName] = useState('')
  const [itrDate, setItrDate] = useState('')
  const [notices, setNotices] = useState<Notice[]>([])

  const years = generateYears()
  const [gstYear, setGstYear] = useState(years[0])
  const [itrYear, setItrYear] = useState(years[0])

  const [gstSearch, setGstSearch] = useState('')
  const [itrSearch, setItrSearch] = useState('')

  const [gstDueDate, setGstDueDate] = useState('')
  const [itrDueDate, setItrDueDate] = useState('')

  const [gstSortAsc, setGstSortAsc] = useState(true)
  const [itrSortAsc, setItrSortAsc] = useState(true)

  const [showDoneGst, setShowDoneGst] = useState(false)
  const [showDoneItr, setShowDoneItr] = useState(false)

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
    const result = await window.electronAPI.saveGstNotice({
      name: gstName,
      date: gstDate,
      dueDate: gstDueDate,
      year: gstYear
    })

    if (result.success) {
      alert('✅ GST Notice saved successfully!')
      setGstName('')
      setGstYear(years[0])
      setGstDueDate('')
      setGstDate('')
    } else {
      alert(`❌ Error: ${result.error}`)
    }
  }

  const handleItrSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = await window.electronAPI.saveItrNotice({
      name: itrName,
      date: itrDate,
      dueDate: itrDueDate,
      year: itrYear
    })

    if (result.success) {
      alert('✅ ITR Notice saved successfully!')
      setItrName('')
      setItrYear(years[0])
      setItrDueDate('')
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

  const handleDelete = async (toDelete: Notice) => {
    const confirmed = window.confirm(`Delete "${toDelete.name}" notice?`)
    if (!confirmed) return

    const result = await window.electronAPI.deleteNotice(toDelete)
    if (result.success) {
      setNotices((prev) =>
        prev.filter(
          (n) => !(n.name === toDelete.name && n.date === toDelete.date && n.type === toDelete.type)
        )
      )
    } else {
      alert(`❌ Error deleting notice: ${result.error}`)
    }
  }

  const gstActive = gstNotices.filter((n) => !n.done)
  const gstDone = gstNotices.filter((n) => n.done)

  const itrActive = itrNotices.filter((n) => !n.done)
  const itrDone = itrNotices.filter((n) => n.done)

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

            <label style={labelStyle}>Financial Year</label>
            <select
              value={gstYear}
              onChange={(e) => setGstYear(e.target.value)}
              required
              style={inputStyle}
            >
              {generateYears().map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>

            <label style={labelStyle}>GST Issue Date</label>
            <input
              type="date"
              value={gstDate}
              onChange={(e) => setGstDate(e.target.value)}
              required
              style={inputStyle}
            />

            <label style={labelStyle}>GST Due Date</label>
            <input
              type="date"
              value={gstDueDate}
              onChange={(e) => setGstDueDate(e.target.value)}
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
            notices={gstActive}
            doneNotices={gstDone}
            onToggleSort={() => setGstSortAsc((prev) => !prev)}
            sortAsc={gstSortAsc}
            onToggleDone={handleToggleDone}
            showDone={showDoneGst}
            onToggleShowDone={() => setShowDoneGst((v) => !v)}
            onDelete={handleDelete}
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

            <label style={labelStyle}>Assessment Year</label>
            <select
              value={itrYear}
              onChange={(e) => setItrYear(e.target.value)}
              required
              style={inputStyle}
            >
              {generateYears().map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>

            <label style={labelStyle}>ITR Issue Date</label>
            <input
              type="date"
              value={itrDate}
              onChange={(e) => setItrDate(e.target.value)}
              required
              style={inputStyle}
            />

            <label style={labelStyle}>ITR Due Date</label>
            <input
              type="date"
              value={itrDueDate}
              onChange={(e) => setItrDueDate(e.target.value)}
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
            notices={itrActive}
            doneNotices={itrDone}
            onToggleSort={() => setItrSortAsc((prev) => !prev)}
            sortAsc={itrSortAsc}
            onToggleDone={handleToggleDone}
            showDone={showDoneItr}
            onToggleShowDone={() => setShowDoneItr((v) => !v)}
            onDelete={handleDelete}
          />
        </div>
      </div>
    </Layout>
  )
}

export default Notices

const NoticeTable = ({
  notices,
  doneNotices,
  onToggleSort,
  sortAsc,
  onToggleDone,
  onDelete,
  showDone,
  onToggleShowDone
}: {
  notices: Notice[]
  doneNotices: Notice[]
  onToggleSort: () => void
  sortAsc: boolean
  onToggleDone: (updated: Notice) => void
  onDelete: (notice: Notice) => void
  showDone: boolean
  onToggleShowDone: () => void
}) => (
  <div style={{ marginTop: '1rem' }}>
    <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
      <thead>
        <tr style={{ backgroundColor: '#4f46e5', color: 'white' }}>
          <th style={thStyle}>Name</th>
          <th style={thStyle}>Year</th>
          <th style={{ ...thStyle, cursor: 'pointer' }} onClick={onToggleSort}>
            Issue Date {sortAsc ? '↑' : '↓'}
          </th>
          <th style={thStyle}>Due Date</th>
          <th style={{ ...thStyle, textAlign: 'center' }}>Done</th>
          <th style={{ ...thStyle, textAlign: 'center' }}>Delete</th>
        </tr>
      </thead>
      <tbody>
        {notices.length === 0 ? (
          <tr>
            <td colSpan={6} style={{ padding: '16px', textAlign: 'center', color: '#666' }}>
              No pending notices
            </td>
          </tr>
        ) : (
          notices.map((n, i) => (
            <tr key={i} className="hoverable-row">
              <td style={{ ...tdStyle, maxWidth: '200px' }}>{n.name}</td>
              <td style={tdStyle}>{n.year || '-'}</td>
              <td style={tdStyle}>{n.date}</td>
              <td style={tdStyle}>{n.dueDate}</td>
              <td style={{ ...tdStyle, textAlign: 'center' }}>
                <input
                  type="checkbox"
                  checked={n.done ?? false}
                  onChange={() => onToggleDone({ ...n, done: !n.done })}
                  style={{ transform: 'scale(1.8)' }}
                />
              </td>
              <td style={{ ...tdStyle, textAlign: 'center' }}>
                <button
                  onClick={() => onDelete(n)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#ef4444',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '20px'
                  }}
                  title="Delete notice"
                >
                  🗑️
                </button>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>

    {doneNotices.length > 0 && (
      <div style={{ marginTop: '1rem' }}>
        <button onClick={onToggleShowDone} style={expanderButtonStyle}>
          {showDone ? 'Hide' : 'Show'} Done ({doneNotices.length})
        </button>

        {showDone && (
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              background: '#f8f8f8',
              marginTop: '0.5rem'
            }}
          >
            <thead>
              <tr style={{ backgroundColor: '#4f46e5', color: 'white' }}>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Year</th>
                <th style={{ ...thStyle, cursor: 'pointer' }} onClick={onToggleSort}>
                  Issue Date {sortAsc ? '↑' : '↓'}
                </th>
                <th style={thStyle}>Due Date</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Done</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Delete</th>
              </tr>
            </thead>
            <tbody>
              {doneNotices.map((n, i) => (
                <tr key={i} className="hoverable-row">
                  <td style={{ ...tdStyle, maxWidth: '200px' }}>{n.name}</td>
                  <td style={tdStyle}>{n.year || '-'}</td>
                  <td style={tdStyle}>{n.date}</td>
                  <td style={tdStyle}>{n.dueDate}</td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={n.done ?? false}
                      onChange={() => onToggleDone({ ...n, done: !n.done })}
                      style={{ transform: 'scale(1.8)' }}
                    />
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <button
                      onClick={() => onDelete(n)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '20px'
                      }}
                      title="Delete notice"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    )}
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

const expanderButtonStyle: React.CSSProperties = {
  padding: '8px 12px',
  backgroundColor: '#e0e7ff',
  color: '#1e1b4b',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: 600
}
