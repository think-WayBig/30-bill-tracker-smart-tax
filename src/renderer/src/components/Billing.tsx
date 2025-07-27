import { useEffect, useState } from 'react'
import Layout from './Layout'

type BillingStatus = { status: 'Not started' | 'Pending' | 'Paid'; year: string }

type BillingEntry = {
  name: string
  pan: string
  billingStatus?: BillingStatus[]
  fileCode: string
  group?: string
  startYear: string
  endYear?: string
}

export default function Billing({ activeScreen }: { activeScreen: string }) {
  const billingStatusFilterMap: Record<string, BillingStatus['status']> = {
    'billing-not-started': 'Not started',
    'billing-pending': 'Pending',
    'billing-paid': 'Paid'
  }

  const billingStatusFilter = billingStatusFilterMap[activeScreen] || null

  const [entries, setEntries] = useState<BillingEntry[]>([])
  const [search, setSearch] = useState('')
  const currentYear = localStorage.getItem('selectedYear') || new Date().getFullYear().toString()

  useEffect(() => {
    const fetchEntries = async () => {
      const loaded = await window.electronAPI.loadEntries()
      setEntries(loaded)
    }
    fetchEntries()
  }, [])

  const handleBillingStatusChange = async (
    panOrGroup: string,
    newStatus: BillingStatus['status'],
    isGroup: boolean
  ) => {
    setEntries((prev) =>
      prev.map((entry) => {
        const match = isGroup ? entry.group === panOrGroup : entry.pan === panOrGroup
        if (!match) return entry

        const updatedStatus: BillingStatus[] = Array.isArray(entry.billingStatus)
          ? [
              ...entry.billingStatus.filter((b) => b.year !== currentYear),
              { status: newStatus, year: currentYear }
            ]
          : [{ status: newStatus, year: currentYear }]

        return { ...entry, billingStatus: updatedStatus }
      })
    )

    const matchedEntries = entries.filter((entry) =>
      isGroup ? entry.group === panOrGroup : entry.pan === panOrGroup
    )

    for (const entry of matchedEntries) {
      await window.electronAPI.updateBillingStatus(
        entry.pan,
        { status: newStatus, year: currentYear },
        currentYear
      )
    }
  }

  const groupedMap = new Map<string, BillingEntry[]>()
  const individualEntries: BillingEntry[] = []

  for (const entry of entries) {
    if (entry.group) {
      if (!groupedMap.has(entry.group)) groupedMap.set(entry.group, [])
      groupedMap.get(entry.group)!.push(entry)
    } else {
      individualEntries.push(entry)
    }
  }

  const mergedDisplayRows = [
    ...Array.from(groupedMap.entries()).map(([groupName, groupEntries]) => {
      const displayName = groupName
      const billingStatus = groupEntries
        .find((e) => e.billingStatus?.some((b) => b.year === currentYear))
        ?.billingStatus?.find((b) => b.year === currentYear)?.status

      return {
        name: displayName,
        pan: groupName,
        fileCode: 'N/A',
        billingStatus,
        isGroup: true
      }
    }),
    ...individualEntries.map((e) => ({
      name: e.name,
      pan: e.pan,
      fileCode: e.fileCode,
      billingStatus: e.billingStatus?.find((b) => b.year === currentYear)?.status,
      isGroup: false
    }))
  ]

  const filteredRows = mergedDisplayRows
    .filter(
      (row) =>
        row.name.toLowerCase().includes(search.toLowerCase()) ||
        row.pan.toLowerCase().includes(search.toLowerCase()) ||
        row.fileCode.toLowerCase().includes(search.toLowerCase())
    )
    .filter((row) => {
      if (!billingStatusFilter) return true // show all
      return row.billingStatus === billingStatusFilter
    })

  const [sortKey, setSortKey] = useState<'name' | 'fileCode' | 'pan' | ''>('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const handleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortOrder('asc')
    }
  }

  const sortedRows = [...filteredRows].sort((a, b) => {
    if (!sortKey) return 0

    const aVal = (a[sortKey] || '').toString()
    const bVal = (b[sortKey] || '').toString()

    return sortOrder === 'asc'
      ? aVal.localeCompare(bVal, undefined, { numeric: true, sensitivity: 'base' })
      : bVal.localeCompare(aVal, undefined, { numeric: true, sensitivity: 'base' })
  })

  return (
    <Layout title="💳 Manage Billing">
      <style>
        {`
        .hoverable-row:hover {
          background-color: #eef2ff;
        }

        select.billing-dropdown {
          padding: 6px 10px;
          font-size: 15px;
          border-radius: 6px;
          border: 1px solid #ccc;
          cursor: pointer;
        }
      `}
      </style>

      <div
        style={{
          top: '80px',
          position: 'sticky',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 4,
          marginBottom: '20px'
        }}
      >
        <input
          type="text"
          placeholder="Search Entry"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 15px',
            fontSize: '16px',
            borderRadius: '6px',
            border: '1px solid #ccc',
            outline: 'none'
          }}
        />

        <div
          style={{
            padding: '8px 16px',
            backgroundColor: '#f3f4f6',
            borderRadius: '6px',
            fontSize: '15px',
            fontWeight: 500,
            color: '#374151',
            display: 'inline-block',
            flexShrink: 0
          }}
        >
          <b>Total entries:</b> {sortedRows.length}
        </div>
      </div>

      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          backgroundColor: 'white',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}
      >
        <thead>
          <tr style={{ backgroundColor: '#4f46e5', color: 'white' }}>
            {['fileCode', 'name', 'pan'].map((key) => (
              <th
                key={key}
                style={{ ...thStyle, cursor: 'pointer', userSelect: 'none' }}
                onClick={() => handleSort(key as typeof sortKey)}
              >
                {key === 'fileCode' ? 'File Code' : key.charAt(0).toUpperCase() + key.slice(1)}
                {sortKey === key && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
              </th>
            ))}
            <th style={thStyle}>Billing Status</th>
          </tr>
        </thead>

        <tbody>
          {sortedRows.length === 0 ? (
            <tr>
              <td colSpan={4} style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                No data available
              </td>
            </tr>
          ) : (
            sortedRows.map((row) => (
              <tr key={row.pan} className="hoverable-row">
                <td style={tdStyle}>{row.fileCode}</td>
                <td style={tdStyle}>{row.name}</td>
                <td style={tdStyle}>{row.isGroup ? 'Group' : row.pan}</td>
                <td style={tdStyle}>
                  <select
                    className="billing-dropdown"
                    value={row.billingStatus || 'Not started'}
                    onChange={(e) =>
                      handleBillingStatusChange(
                        row.pan,
                        e.target.value as BillingStatus['status'],
                        row.isGroup
                      )
                    }
                  >
                    <option value="Not started">Not started</option>
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                  </select>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </Layout>
  )
}

const thStyle: React.CSSProperties = {
  padding: '12px 16px',
  textAlign: 'left',
  fontWeight: 'bold'
}

const tdStyle: React.CSSProperties = {
  padding: '10px 16px'
}
