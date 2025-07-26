import React, { useState } from 'react'
import Layout from './Layout'

const currentYear = new Date().getFullYear()
const yearOptions = Array.from({ length: 11 }, (_, i) => (2020 + i).toString())

const Entry: React.FC = () => {
  const [name, setName] = useState('')
  const [fileCode, setFileCode] = useState('')
  const [pan, setPan] = useState('')
  const [startYear, setStartYear] = useState(currentYear.toString())
  const [deleteFileCode, setDeleteFileCode] = useState('')

  const [updateFileCode, setUpdateFileCode] = useState('')
  const [newEndYear, setNewEndYear] = useState(currentYear.toString())

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const result = await window.electronAPI.saveEntry({
      name,
      pan,
      fileCode,
      startYear,
      billingStatus: [{ status: 'Not started', year: startYear }]
    })

    if (result.success) {
      alert('✅ Entry saved successfully!')
      setName('')
      setFileCode('')
      setPan('')
      setStartYear(currentYear.toString())
    } else {
      alert(`❌ Error: ${result.error}`)
    }
  }

  const handleDeleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const confirmDelete = confirm(
      `Are you sure you want to delete entry with PAN: ${deleteFileCode}?`
    )
    if (!confirmDelete) return

    const result = await window.electronAPI.deleteEntry(deleteFileCode)

    if (result.success) {
      alert('✅ Entry deleted successfully!')
      setDeleteFileCode('')
    } else {
      alert(`❌ Error: ${result.error}`)
    }
  }

  const handleEndYearUpdate = async (e: React.FormEvent) => {
    e.preventDefault()

    const entries = await window.electronAPI.loadEntries()
    const match = entries.find((e) => e.fileCode === updateFileCode)

    if (!match) {
      alert('❌ No entry found for that file code')
      return
    }

    const save = await window.electronAPI.updateEndYear(updateFileCode, newEndYear)

    if (save.success) {
      alert('✅ End year updated successfully!')
      setUpdateFileCode('')
      setNewEndYear(currentYear.toString())
    } else {
      alert(`❌ Error: ${save.error}`)
    }
  }

  return (
    <Layout title="👤 Add, Remove or Update Entry">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
        {/* Add Entry Form */}
        <form onSubmit={handleAddSubmit} style={formStyle}>
          <label style={labelStyle}>Name</label>
          <input
            type="text"
            placeholder="Enter Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={inputStyle}
          />

          <label style={labelStyle}>File Code</label>
          <input
            type="text"
            placeholder="Enter File Code"
            value={fileCode}
            onChange={(e) => setFileCode(e.target.value)}
            required
            style={inputStyle}
          />

          <label style={labelStyle}>PAN Card</label>
          <input
            type="text"
            placeholder="Enter PAN"
            value={pan}
            onChange={(e) => setPan(e.target.value)}
            required
            style={inputStyle}
          />

          <label style={labelStyle}>Start Year</label>
          <select
            value={startYear}
            onChange={(e) => setStartYear(e.target.value)}
            style={inputStyle}
          >
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>

          <button type="submit" style={buttonStyle}>
            Save Entry
          </button>
        </form>

        {/* Delete Entry Form */}
        <form onSubmit={handleDeleteSubmit} style={formStyle}>
          <label style={labelStyle}>File Code to Delete</label>
          <input
            type="text"
            placeholder="Enter File Code to delete"
            value={deleteFileCode}
            onChange={(e) => setDeleteFileCode(e.target.value)}
            required
            style={inputStyle}
          />

          <button type="submit" style={{ ...buttonStyle, backgroundColor: '#dc2626' }}>
            Delete Entry
          </button>
        </form>

        {/* Update End Year Form */}
        <form onSubmit={handleEndYearUpdate} style={formStyle}>
          <label style={labelStyle}>File Code</label>
          <input
            type="text"
            placeholder="Enter File Code"
            value={updateFileCode}
            onChange={(e) => setUpdateFileCode(e.target.value)}
            required
            style={inputStyle}
          />

          <label style={labelStyle}>End Year</label>
          <select
            value={newEndYear}
            onChange={(e) => setNewEndYear(e.target.value)}
            style={inputStyle}
          >
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>

          <button type="submit" style={{ ...buttonStyle, backgroundColor: '#059669' }}>
            Update End Year
          </button>
        </form>
      </div>
    </Layout>
  )
}

export default Entry

const formStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  maxWidth: '450px',
  backgroundColor: '#fff',
  borderRadius: '12px',
  padding: '2rem',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
  border: '1px solid #e0e7ff',
  flex: '1'
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
