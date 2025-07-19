import { useEffect } from 'react'
import Layout from './Layout'

const ManageBook = () => {
  useEffect(() => {
    const renderTable = (data: { name: string; pan: string }[]) => {
      const tbody = document.getElementById('entryBody')
      if (!tbody) return

      tbody.innerHTML = ''
      for (const entry of data) {
        const tr = document.createElement('tr')
        tr.innerHTML = `<td style="padding: 10px 16px;">${entry.name}</td><td style="padding: 10px 16px;">${entry.pan}</td>`
        tr.className = 'hoverable-row'
        tbody.appendChild(tr)
      }
    }

    window.electronAPI.loadEntries().then((entries) => {
      renderTable(entries)

      const searchInput = document.getElementById('searchInput') as HTMLInputElement
      if (!searchInput) return

      searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase()
        const filtered = entries.filter(
          (entry) =>
            entry.name.toLowerCase().includes(query) || entry.pan.toLowerCase().includes(query)
        )
        renderTable(filtered)
      })
    })
  }, [])

  return (
    <Layout title="📚 Manage Book">
      <style>
        {`
        .hoverable-row:hover {
          background-color: #eef2ff; /* light indigo */
        }
      `}
      </style>
      <input
        type="text"
        id="searchInput"
        placeholder="Search by Name or PAN"
        style={{
          width: '100%',
          padding: '10px 15px',
          fontSize: '16px',
          borderRadius: '6px',
          border: '1px solid #ccc',
          marginBottom: '20px',
          outline: 'none'
        }}
      />

      <table
        id="entryTable"
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          backgroundColor: 'white',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}
      >
        <thead>
          <tr style={{ backgroundColor: '#4f46e5', color: 'white' }}>
            <th style={thStyle}>Name</th>
            <th style={thStyle}>PAN</th>
          </tr>
        </thead>
        <tbody id="entryBody" />
      </table>
    </Layout>
  )
}

const thStyle: React.CSSProperties = {
  padding: '12px 16px',
  textAlign: 'left',
  fontWeight: 'bold'
}

export default ManageBook
