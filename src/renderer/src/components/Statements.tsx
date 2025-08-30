import React, { useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import Layout from './Layout'
import { StatementsEditorDialog } from './StatementsEditorDialog'

type Cell = string

const normalize = (data: any[][]): string[][] =>
  (data ?? []).map((row) => row.map((c) => (c == null ? '' : String(c))))

const Statements: React.FC = () => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [fileData, setFileData] = useState<Cell[][]>([])
  const [showDialog, setShowDialog] = useState(false)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const data = await file.arrayBuffer()

      // READ: enable date parsing at workbook level
      const workbook = XLSX.read(data, {
        type: 'array',
        cellDates: true // read date cells as Date where possible
      })

      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]

      // PARSE: format values (so dates aren’t serials). Choose the format you prefer.
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        raw: false, // apply number/date formatting
        dateNF: 'yyyy-mm-dd' // e.g., 2025-04-01
      }) as any[][]

      setFileData(normalize(jsonData))
      setShowDialog(true)
    } catch (error) {
      alert(`❌ Failed to import file: ${error}`)
    } finally {
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleImportClick = () => inputRef.current?.click()

  const handleSaveToApp = (updated: Cell[][]) => {
    // TODO: Save the modified data to the software
    console.log('Saving data:', updated)
    alert('✅ Data saved successfully!')
    setFileData(updated)
    setShowDialog(false)
  }

  return (
    <Layout title="🏦 Manage Bank Statements" hideAssessmentYear>
      <div style={{ maxWidth: 800, margin: '2rem auto', textAlign: 'center' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#4f46e5' }}>
          Manage Bank Statements
        </h1>
        <p style={{ fontSize: '16px', color: '#6b7280', marginBottom: '1.5rem' }}>
          Import and manage your bank statements by uploading an Excel file.
        </p>

        <div
          style={{
            background: '#fff',
            padding: '2rem',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            textAlign: 'center'
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls"
            id="excel-upload"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={handleImportClick}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#fff',
              background: '#6366f1',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'background 0.3s'
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = '#4f46e5')}
            onMouseOut={(e) => (e.currentTarget.style.background = '#6366f1')}
          >
            Import Excel File
          </button>
        </div>
      </div>

      <StatementsEditorDialog
        open={showDialog}
        data={fileData}
        onClose={() => setShowDialog(false)}
        onSave={handleSaveToApp}
      />
    </Layout>
  )
}

export default Statements
