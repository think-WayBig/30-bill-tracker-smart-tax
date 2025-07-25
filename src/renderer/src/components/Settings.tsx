import { useEffect, useState } from 'react'
import Layout from './Layout'

export default function Settings() {
  const [folderPath, setFolderPath] = useState<string | null>(null)
  const [year, setYear] = useState<string>('')

  useEffect(() => {
    const savedFolder = localStorage.getItem('selectedFolder')
    const savedYear = localStorage.getItem('selectedYear')

    if (savedFolder) setFolderPath(savedFolder)
    if (savedYear) setYear(savedYear)
  }, [])

  const handleSelectFolder = async () => {
    const selected = await window.api.selectFolder()
    if (selected) {
      localStorage.setItem('selectedFolder', selected)
      setFolderPath(selected)
      window.location.reload()
    }
  }

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedYear = e.target.value
    setYear(selectedYear)
    localStorage.setItem('selectedYear', selectedYear)
    window.location.reload() // ✅ Force full app reload
  }

  const yearOptions = Array.from({ length: 11 }, (_, i) => (2020 + i).toString())

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
            margin-bottom: 20px;
          }
        `}
      </style>

      {/* Folder Selection */}
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

      {/* Year Selection */}
      <div className="settings-box">
        <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>
          📅 Select Assessment Year
        </label>

        <select
          className="input-style"
          value={year}
          onChange={handleYearChange}
          style={{ maxWidth: '200px' }}
        >
          <option value="" disabled>
            -- Choose Year --
          </option>
          {yearOptions.map((y) => {
            const startYear = Number(y)
            const endYear = (startYear + 1).toString().slice(-2)
            return (
              <option key={y} value={y}>
                {`${startYear}-${endYear}`}
              </option>
            )
          })}
        </select>
      </div>
    </Layout>
  )
}
