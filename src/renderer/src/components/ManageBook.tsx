import { useEffect } from 'react'
import Layout from './Layout'

const ManageBook = () => {
  useEffect(() => {
    const renderTable = (
      data: {
        name: string
        pan: string
        ackno?: string
        billingStatus?: 'Due' | 'Paid'
        group?: string
      }[]
    ) => {
      const tbody = document.getElementById('entryBody')
      if (!tbody) return

      tbody.innerHTML = ''

      if (data.length === 0) {
        const tr = document.createElement('tr')
        const td = document.createElement('td')
        td.colSpan = 5
        td.style.textAlign = 'center'
        td.style.padding = '20px'
        td.style.color = '#666'
        td.textContent = 'No data available'
        tr.appendChild(td)
        tbody.appendChild(tr)
        return
      }

      for (const entry of data) {
        const tr = document.createElement('tr')
        tr.className = 'hoverable-row'

        const ackNo = entry.ackno || 'N/A'
        const billingStatus = entry.billingStatus || 'Due'
        const group = entry.group || 'None'

        tr.innerHTML = `
          <td style="padding: 10px 16px;">${entry.name}</td>
          <td style="padding: 10px 16px;">${entry.pan}</td>
          <td style="padding: 10px 16px;">${ackNo}</td>
          <td style="padding: 10px 16px;">${billingStatus}</td>
          <td style="padding: 10px 16px;">${group}</td>
        `
        tbody.appendChild(tr)
      }
    }

    const loadAndRender = async () => {
      const folderPath = localStorage.getItem('selectedFolder')
      const entries = await window.electronAPI.loadEntries()

      if (folderPath) {
        for (const entry of entries) {
          if (!entry.ackno) {
            try {
              const result = await window.electronAPI.getAcknoFromFile(entry.pan, folderPath)
              if (result.success && result.ackno) {
                entry.ackno = result.ackno

                // Save updated ackNo back to system (entry storage)
                await window.electronAPI.updateEntryAckno(entry.pan, result.ackno)
              }
            } catch (err) {
              console.error(`Error fetching ackNo for ${entry.pan}`, err)
            }
          }
        }
      }

      renderTable(entries)

      const searchInput = document.getElementById('searchInput') as HTMLInputElement
      if (!searchInput) return

      searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase()
        const filtered = entries.filter(
          (entry) =>
            entry.name.toLowerCase().includes(query) ||
            entry.pan.toLowerCase().includes(query) ||
            (entry.ackno || '').toLowerCase().includes(query) ||
            (entry.billingStatus || '').toLowerCase().includes(query) ||
            (entry.group || '').toLowerCase().includes(query)
        )
        renderTable(filtered)
      })
    }

    loadAndRender()
  }, [])

  return (
    <Layout title="📚 Manage Book">
      <style>
        {`
        .hoverable-row:hover {
          background-color: #eef2ff;
        }
      `}
      </style>

      <input
        type="text"
        id="searchInput"
        placeholder="Search by Name, PAN, Ack No., Billing Status or Group"
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
            <th style={thStyle}>Acknowledgement No.</th>
            <th style={thStyle}>Billing Status</th>
            <th style={thStyle}>Group</th>
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
