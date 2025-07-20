declare global {
  interface Window {
    api: {
      selectFolder: () => Promise<string | null>
    }
  }
}

import { useEffect, useState } from 'react'
import FolderSelector from './components/FolderSelector'
import MainView from './components/MainView'
import './App.css'

function App() {
  const [folderPath, setFolderPath] = useState<string | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('selectedFolder')
    if (saved) setFolderPath(saved)
  }, [])

  const handleChangeFolder = async () => {
    const selected = await window.api.selectFolder()
    if (selected) {
      localStorage.setItem('selectedFolder', selected)
      setFolderPath(selected)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <MainView />

      {/* Right Panel */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        {/* FolderSelector */}
        <FolderSelector onFolderSelected={setFolderPath} />

        {/* Bottom Bar */}
        {folderPath && (
          <div
            style={{
              height: '5vh',
              padding: '0 20px',
              fontSize: '14px',
              background: '#f0f0f0',
              color: '#333',
              borderTop: '1px solid #ccc',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <span>
              📁 Current Directory:{' '}
              <a href="#" onClick={() => window.electronAPI.openContainingFolder(folderPath)}>
                {folderPath}
              </a>
            </span>
            <button
              onClick={handleChangeFolder}
              style={{
                padding: '6px 16px',
                fontSize: '13px',
                backgroundColor: '#4f46e5',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                marginLeft: '12px',
                transition: 'background-color 0.3s ease'
              }}
              onMouseEnter={(e) =>
                ((e.target as HTMLButtonElement).style.backgroundColor = '#4f46b1')
              }
              onMouseLeave={(e) =>
                ((e.target as HTMLButtonElement).style.backgroundColor = '#4f46e5')
              }
            >
              Change
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
