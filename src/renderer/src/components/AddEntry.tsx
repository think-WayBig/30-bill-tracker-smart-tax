import React, { useEffect, useState } from 'react'
import Layout from './Layout'

const AddEntry: React.FC = () => {
  const [name, setName] = useState('')
  const [pan, setPan] = useState('')
  const [message, setMessage] = useState('')

  // Clear message after 5 seconds
  useEffect(() => {
    if (message) {
      const timeout = setTimeout(() => setMessage(''), 5000)
      return () => clearTimeout(timeout) // Cleanup on unmount or next message
    }
    return undefined
  }, [message])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const result = await window.electronAPI.saveEntry({ name, pan })

    if (result.success) {
      setMessage('✅ Entry saved successfully!')
      setName('')
      setPan('')
    } else {
      setMessage(`❌ Error: ${result.error}`)
    }
  }

  return (
    <Layout title="Add Entry">
      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          maxWidth: '450px',
          backgroundColor: '#fff',
          borderRadius: '12px',
          padding: '2rem',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
          border: '1px solid #e0e7ff'
        }}
      >
        <label style={{ fontWeight: 600, color: '#4f46e5' }}>Name</label>
        <input
          type="text"
          placeholder="Enter Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          style={{
            padding: '10px',
            border: '1px solid #a5b4fc',
            borderRadius: '8px',
            fontSize: '16px',
            backgroundColor: '#f9fafe'
          }}
        />

        <label style={{ fontWeight: 600, color: '#4f46e5' }}>PAN Card</label>
        <input
          type="text"
          placeholder="Enter PAN"
          value={pan}
          onChange={(e) => setPan(e.target.value)}
          required
          style={{
            padding: '10px',
            border: '1px solid #a5b4fc',
            borderRadius: '8px',
            fontSize: '16px',
            backgroundColor: '#f9fafe'
          }}
        />

        <button
          type="submit"
          style={{
            padding: '10px',
            backgroundColor: '#4f46e5',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            marginTop: '10px'
          }}
        >
          Save Entry
        </button>

        {message && (
          <div
            style={{
              marginTop: '10px',
              color: message.startsWith('✅') ? '#4f46e5' : '#dc2626',
              fontWeight: 500
            }}
          >
            {message}
          </div>
        )}
      </form>
    </Layout>
  )
}

export default AddEntry
