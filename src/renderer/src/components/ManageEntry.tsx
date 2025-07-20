import React, { useState } from 'react'
import Layout from './Layout'

const AddEntry: React.FC = () => {
  const [name, setName] = useState('')
  const [fileCode, setFileCode] = useState('')
  const [pan, setPan] = useState('')
  const [deletePan, setDeletePan] = useState('')

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = await window.electronAPI.saveEntry({ name, pan, fileCode })

    if (result.success) {
      alert('✅ Entry saved successfully!')
      setName('')
      setPan('')
    } else {
      alert(`❌ Error: ${result.error}`)
    }
  }

  const handleDeleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const confirmDelete = confirm(`Are you sure you want to delete entry with PAN: ${deletePan}?`)
    if (!confirmDelete) return

    const result = await window.electronAPI.deleteEntry(deletePan)

    if (result.success) {
      alert('✅ Entry deleted successfully!')
      setDeletePan('')
    } else {
      alert(`❌ Error: ${result.error}`)
    }
  }

  return (
    <Layout title="👤 Add or Remove Entry">
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

          <button type="submit" style={buttonStyle}>
            Save Entry
          </button>
        </form>

        {/* Delete Entry Form */}
        <form onSubmit={handleDeleteSubmit} style={formStyle}>
          <label style={labelStyle}>PAN Card to Delete</label>
          <input
            type="text"
            placeholder="Enter PAN to delete"
            value={deletePan}
            onChange={(e) => setDeletePan(e.target.value)}
            required
            style={inputStyle}
          />

          <button type="submit" style={{ ...buttonStyle, backgroundColor: '#dc2626' }}>
            Delete Entry
          </button>
        </form>
      </div>
    </Layout>
  )
}

export default AddEntry

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
