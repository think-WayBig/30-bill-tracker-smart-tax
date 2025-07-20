import { useEffect, useState } from 'react'
import Layout from './Layout'

export default function Settings() {
  const [folderPath, setFolderPath] = useState<string | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('selectedFolder')
    if (saved) setFolderPath(saved)
  }, [])

  const handleSelectFolder = async () => {
    const selected = await window.api.selectFolder()
    if (selected) {
      localStorage.setItem('selectedFolder', selected)
      setFolderPath(selected)
    }
  }

  return (
    <Layout title="⚙️ Manage Settings">
      <style>
        {`
          .hoverable-row:hover {
            background-color: #eef2ff;
          }

          .input-style {
            padding: 10px 15px;
            font-size: 16px;
            border-radius: 6px;
            border: 1px solid #ccc;
            outline: none;
            width: 100%;
          }

          .btn-primary {
            padding: 10px 16px;
            background-color: #4f46e5;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 15px;
          }

          .btn-primary:hover {
            background-color: #4338ca;
          }

          .settings-box {
            background-color: white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            border-radius: 6px;
            padding: 20px;
          }
        `}
      </style>

      <div className="settings-box">
        <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>
          📁 Selected Folder
        </label>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            className="input-style"
            type="text"
            value={folderPath || ''}
            readOnly
            placeholder="No folder selected"
            style={{ flex: '1 1 300px' }}
          />
          <button className="btn-primary" onClick={handleSelectFolder}>
            Select Folder
          </button>
        </div>
      </div>
    </Layout>
  )
}
