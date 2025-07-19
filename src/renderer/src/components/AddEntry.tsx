import React, { useState } from 'react'

const AddEntry: React.FC = () => {
  const [name, setName] = useState('')
  const [pan, setPan] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    console.log('Calling saveEntry', { name, pan })

    console.log('electronAPI:', window.electronAPI)

    const result = await window.electronAPI.saveEntry({ name, pan })

    console.log('Save result:', result)

    if (result.success) {
      setMessage('✅ Entry saved successfully!')
      setName('')
      setPan('')
    } else {
      setMessage(`❌ Error: ${result.error}`)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
        minWidth: '500px',
        maxWidth: '900px',
        margin: '2rem auto',
        padding: '2rem',
        backgroundColor: '#eaf3fc',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0, 123, 255, 0.1)',
        fontFamily: 'Segoe UI, sans-serif',
        border: '1px solid #cce0ff'
      }}
    >
      <h2 style={{ marginBottom: '10px', color: '#0d6efd' }}>Add Entry</h2>

      <input
        type="text"
        placeholder="Enter Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        style={{
          padding: '10px',
          border: '1px solid #bcdfff',
          borderRadius: '8px',
          fontSize: '16px',
          outline: 'none',
          backgroundColor: '#ffffff',
          color: '#003366'
        }}
      />

      <input
        type="text"
        placeholder="Enter PAN Card"
        value={pan}
        onChange={(e) => setPan(e.target.value)}
        required
        style={{
          padding: '10px',
          border: '1px solid #bcdfff',
          borderRadius: '8px',
          fontSize: '16px',
          outline: 'none',
          backgroundColor: '#ffffff',
          color: '#003366'
        }}
      />

      <button
        type="submit"
        style={{
          padding: '10px',
          backgroundColor: '#0d6efd',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '16px',
          transition: 'background-color 0.3s ease'
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#0b5ed7')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0d6efd')}
      >
        Save Entry
      </button>

      {message && (
        <div
          style={{
            marginTop: '10px',
            color: message.startsWith('✅') ? '#0d6efd' : '#d00000',
            fontWeight: '500'
          }}
        >
          {message}
        </div>
      )}
    </form>
  )
}

export default AddEntry
