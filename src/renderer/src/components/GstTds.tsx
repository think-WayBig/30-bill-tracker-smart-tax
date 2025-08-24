import React, { useEffect, useMemo, useState } from 'react'
import Layout from './Layout'

const initialFormState: Bill = {
  name: '',
  pan: '',
  gstNumber: '',
  type: 'GST',
  paymentType: 'Yearly'
}

const GstTds = () => {
  const [activeTab, setActiveTab] = useState<'GST' | 'TDS'>('GST')
  const [activeSubTab, setActiveSubTab] = useState<'Yearly' | 'Monthly' | 'Quarterly'>('Yearly')
  const [bills, setBills] = useState<Bill[]>([])
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<'name' | 'pan' | 'paymentType' | ''>('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(initialFormState)

  useEffect(() => {
    const fetchBills = async () => {
      const loadedBills = await window.electronAPI.loadBills()
      setBills(loadedBills)
    }
    fetchBills()
  }, [])

  const filteredBills = useMemo(() => {
    const q = search.toLowerCase()
    return bills
      .filter((bill) => bill.type === activeTab)
      .filter((bill) => bill.paymentType === activeSubTab)
      .filter(
        (bill) =>
          bill.name.toLowerCase().includes(q) ||
          (bill.pan?.toLowerCase() ?? '').includes(q) ||
          (bill.gstNumber?.toLowerCase() ?? '').includes(q) ||
          bill.paymentType.toLowerCase().includes(q)
      )
  }, [activeTab, activeSubTab, bills, search])

  const sortedBills = useMemo(() => {
    if (!sortKey) return filteredBills
    return [...filteredBills].sort((a, b) => {
      const aVal = (a as any)[sortKey]
      const bVal = (b as any)[sortKey]
      return sortOrder === 'asc'
        ? String(aVal).localeCompare(String(bVal), undefined, { numeric: true })
        : String(bVal).localeCompare(String(aVal), undefined, { numeric: true })
    })
  }, [filteredBills, sortKey, sortOrder])

  const handleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortOrder('asc')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.type || !form.paymentType) return

    const payload: Bill = {
      name: form.name,
      paymentType: form.paymentType as PaymentType,
      type: form.type,
      ...(form.type === 'GST' ? { gstNumber: form.gstNumber } : {}),
      ...(form.type === 'TDS' ? { pan: form.pan } : {})
    }

    const saveBill =
      form.type === 'GST' ? window.electronAPI.saveGstBill : window.electronAPI.saveTdsBill

    const result = await saveBill(payload)

    if (result.success) {
      alert(`✅ ${form.type} Bill saved successfully!`)
      setBills((prev) => [...prev, payload])
      setForm({
        name: '',
        pan: '',
        gstNumber: '',
        type: 'GST',
        paymentType: 'Yearly'
      })
      setShowForm(false)
    } else {
      alert(`❌ Error: ${result.error}`)
    }
  }

  return (
    <Layout title="📝 Track GST/TDS Bills" financialYear>
      {/* Heading */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#4f46e5' }}>
          {activeTab === 'GST' ? 'GST Bills' : 'TDS Bills'}
        </h1>
        <p style={{ fontSize: '16px', color: '#6b7280' }}>
          {activeTab === 'GST'
            ? 'Manage and track your GST bills here.'
            : 'Manage and track your TDS bills here.'}
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '20px',
          borderBottom: '2px solid #e5e7eb',
          marginBottom: '20px'
        }}
      >
        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '16px',
            paddingBottom: '10px',
            paddingRight: '20px',
            alignItems: 'center',
            borderRight: '1px solid #e5e7eb'
          }}
        >
          {/* Main Tabs */}
          <button
            onClick={() => {
              setActiveTab('GST')
              setActiveSubTab('Yearly')
            }}
            style={{
              padding: '10px 20px',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'GST' ? '#6366f1' : 'transparent',
              color: activeTab === 'GST' ? '#fff' : '#333',
              cursor: 'pointer'
            }}
          >
            GST
          </button>
          <button
            onClick={() => {
              setActiveTab('TDS')
              setActiveSubTab('Yearly')
            }}
            style={{
              padding: '10px 20px',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === 'TDS' ? '#6366f1' : 'transparent',
              color: activeTab === 'TDS' ? '#fff' : '#333',
              cursor: 'pointer'
            }}
          >
            TDS
          </button>
        </div>

        {/* Sub-Tabs */}

        <div
          style={{
            display: 'flex',
            gap: '16px',
            paddingBottom: '10px',
            alignItems: 'center'
          }}
        >
          <button
            onClick={() => setActiveSubTab('Yearly')}
            style={{
              padding: '10px 20px',
              borderRadius: '6px',
              border: 'none',
              background: activeSubTab === 'Yearly' ? '#6366f1' : 'transparent',
              color: activeSubTab === 'Yearly' ? '#fff' : '#333',
              cursor: 'pointer'
            }}
          >
            Yearly
          </button>
          {activeTab === 'GST' && (
            <button
              onClick={() => setActiveSubTab('Monthly')}
              style={{
                padding: '10px 20px',
                borderRadius: '6px',
                border: 'none',
                background: activeSubTab === 'Monthly' ? '#6366f1' : 'transparent',
                color: activeSubTab === 'Monthly' ? '#fff' : '#333',
                cursor: 'pointer'
              }}
            >
              Monthly
            </button>
          )}
          {activeTab === 'TDS' && (
            <button
              onClick={() => setActiveSubTab('Quarterly')}
              style={{
                padding: '10px 20px',
                borderRadius: '6px',
                border: 'none',
                background: activeSubTab === 'Quarterly' ? '#6366f1' : 'transparent',
                color: activeSubTab === 'Quarterly' ? '#fff' : '#333',
                cursor: 'pointer'
              }}
            >
              Quarterly
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <input
          type="text"
          placeholder="Search bills..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            padding: '10px',
            fontSize: '16px',
            borderRadius: '6px',
            border: '1px solid #ccc'
          }}
        />

        {/* Create */}
        <button
          style={{
            padding: '10px 40px',
            borderRadius: '6px',
            background: '#6366f1',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
          onClick={() => {
            return (
              setShowForm(true),
              setForm({
                ...initialFormState,
                ...(activeTab === 'GST' ? { type: 'GST' } : { type: 'TDS' })
              })
            )
          }}
        >
          Create Bill
        </button>
      </div>

      {/* Table */}
      <div style={{ width: '100%', background: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        {sortedBills.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 20, color: '#666' }}>No data</div>
        ) : (
          <>
            {/* Header */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 200px',
                backgroundColor: '#4f46e5',
                color: 'white',
                fontWeight: 'bold',
                padding: '10px 16px'
              }}
            >
              <div style={{ cursor: 'pointer' }} onClick={() => handleSort('name')}>
                Name {sortKey === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
              </div>
              {/* Unified ID column */}
              <div>{activeTab === 'GST' ? 'GST No.' : 'PAN'}</div>
            </div>

            {/* Rows */}
            {sortedBills.map((bill, index) => (
              <div
                key={index}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 200px ',
                  alignItems: 'center',
                  borderBottom: '1px solid #eee',
                  padding: '10px 16px'
                }}
              >
                <div>{bill.name}</div>
                <div>{bill.pan || bill.gstNumber}</div>
              </div>
            ))}
          </>
        )}
      </div>

      {showForm && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setShowForm(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <form
            onSubmit={handleSubmit}
            onClick={(e) => e.stopPropagation()}
            style={dialogCardStyle}
          >
            {/* Header */}
            <div style={dialogHeaderStyle}>
              <div>
                <h3 style={dialogTitleStyle}>Create Bill</h3>
              </div>
              <button
                type="button"
                aria-label="Close"
                style={closeBtnStyle}
                onClick={() => setShowForm(false)}
              >
                ×
              </button>
            </div>

            {/* Top row: Type & Payment Type */}
            <div style={formGridStyle}>
              <label style={fieldStyle}>
                <span style={labelStyle}>
                  Bill Type <span style={{ color: 'red' }}>*</span>
                </span>
                <select
                  name="type"
                  value={form.type || ''}
                  onChange={handleChange}
                  required
                  style={inputBaseStyle}
                >
                  <option value="" disabled>
                    Select type
                  </option>
                  <option value="GST">GST</option>
                  <option value="TDS">TDS</option>
                </select>
              </label>

              <label style={fieldStyle}>
                <span style={labelStyle}>
                  Payment Type <span style={{ color: 'red' }}>*</span>
                </span>
                <select
                  name="paymentType"
                  value={form.paymentType}
                  onChange={handleChange}
                  required
                  disabled={!form.type}
                  style={{
                    ...inputBaseStyle,
                    backgroundColor: !form.type ? '#f9fafb' : 'white'
                  }}
                >
                  <option value="" disabled>
                    Select payment type
                  </option>
                  <option value="Yearly">Yearly</option>
                  {form.type === 'GST' && <option value="Monthly">Monthly</option>}
                  {form.type === 'TDS' && <option value="Quarterly">Quarterly</option>}
                </select>
              </label>
            </div>

            {/* Middle row: Name & Identifier */}
            <div style={formGridStyle}>
              <label style={fieldStyle}>
                <span style={labelStyle}>
                  Name <span style={{ color: 'red' }}>*</span>
                </span>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  autoFocus
                  style={inputBaseStyle}
                  placeholder="e.g., ABC Pvt Ltd"
                />
              </label>

              {/* Conditional ID field */}
              {form.type === 'GST' ? (
                <label style={fieldStyle}>
                  <span style={labelStyle}>
                    GST Number <span style={{ color: 'red' }}>*</span>
                  </span>
                  <input
                    name="gstNumber"
                    value={form.gstNumber}
                    onChange={handleChange}
                    required
                    maxLength={15}
                    style={inputBaseStyle}
                    placeholder="15‑char GSTIN"
                  />
                </label>
              ) : form.type === 'TDS' ? (
                <label style={fieldStyle}>
                  <span style={labelStyle}>
                    PAN <span style={{ color: 'red' }}>*</span>
                  </span>
                  <input
                    name="pan"
                    value={form.pan}
                    onChange={handleChange}
                    required
                    maxLength={10}
                    style={inputBaseStyle}
                    placeholder="10‑char PAN"
                  />
                </label>
              ) : (
                <div />
              )}
            </div>

            {/* Footer */}
            <div style={footerStyle}>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setForm(initialFormState)
                }}
                style={secondaryBtnStyle}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={primaryBtnStyle}
                disabled={!form.type || !form.paymentType}
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </Layout>
  )
}

export default GstTds

// UI helpers (above return)
const dialogCardStyle: React.CSSProperties = {
  background: '#fff',
  padding: 20,
  borderRadius: 12,
  width: 'min(560px, 92vw)',
  boxShadow: '0 12px 40px rgba(0,0,0,0.16)',
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  position: 'relative',
  zoom: 1.3
}

const dialogHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 4
}

const dialogTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 18,
  fontWeight: 700,
  color: '#111827'
}

const closeBtnStyle: React.CSSProperties = {
  border: 'none',
  background: 'transparent',
  fontSize: 22,
  lineHeight: 1,
  cursor: 'pointer',
  color: '#6b7280',
  padding: 4,
  margin: -4,
  borderRadius: 6
}

const formGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 12
}

const fieldStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6
}

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: '#374151'
}

const inputBaseStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid #e5e7eb',
  fontSize: 14
}

const footerStyle: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  justifyContent: 'flex-end',
  marginTop: 4
}

const secondaryBtnStyle: React.CSSProperties = {
  ...inputBaseStyle,
  padding: '8px 14px',
  borderRadius: 8,
  background: '#f3f4f6',
  border: '1px solid #e5e7eb',
  cursor: 'pointer'
}

const primaryBtnStyle: React.CSSProperties = {
  ...inputBaseStyle,
  padding: '8px 14px',
  borderRadius: 8,
  background: '#6366f1',
  color: '#fff',
  border: '1px solid #6366f1',
  cursor: 'pointer'
}
