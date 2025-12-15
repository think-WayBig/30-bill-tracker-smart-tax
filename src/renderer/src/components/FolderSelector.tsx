import { useEffect, useState } from 'react'

const FolderSelector = () => {
  const [showButton, setShowButton] = useState(false)

  const chooseFolder = async () => {
    const selected = await window.api.selectFolder()

    if (selected) {
      localStorage.setItem('selectedFolder', selected)
      localStorage.setItem('selectedYear', new Date().getFullYear().toString())
      setShowButton(false)
    } else {
      setShowButton(true)
    }
  }

  useEffect(() => {
    const savedFolder = localStorage.getItem('selectedFolder')
    if (!savedFolder) {
      chooseFolder()
    }
  }, [])

  if (!showButton) return null

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center'
      }}
    >
      <h2 style={{ marginBottom: '20px' }}>Choose the Directory to scan</h2>
      <button
        onClick={chooseFolder}
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          fontWeight: 500,
          border: 'none',
          borderRadius: '8px',
          backgroundColor: '#007bff',
          color: '#fff',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          transition: 'background-color 0.3s ease'
        }}
        onMouseEnter={(e) => ((e.target as HTMLButtonElement).style.backgroundColor = '#0056b3')}
        onMouseLeave={(e) => ((e.target as HTMLButtonElement).style.backgroundColor = '#007bff')}
      >
        Select Folder
      </button>
    </div>
  )
}

export default FolderSelector
