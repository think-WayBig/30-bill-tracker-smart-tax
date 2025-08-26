import React, { useEffect, useMemo, useState } from 'react'
import Layout from './Layout'
import {
  inputBaseStyle,
  dialogCardStyle,
  dialogHeaderStyle,
  dialogTitleStyle,
  closeBtnStyle,
  formGridStyle,
  fieldStyle,
  labelStyle,
  footerStyle,
  secondaryBtnStyle,
  primaryBtnStyle
} from './GstTds.styles'

const initialFormState: Bill = {
  name: '',
  pan: '',
  gstNumber: '',
  type: 'GST',
  paymentType: 'Yearly'
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
] as const

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'] as const

// Selected year comes from localStorage
const currentYear = localStorage.getItem('selectedYear')!

// helpers for date <-> string(yyyy-MM-dd)
const todayYMD = () => {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

const isYMD = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s)

// unique row key (prefer official IDs if you add them later)
const getBillKey = (b: Bill) => b.gstNumber || b.pan

// Type guards
const isMonthlyArray = (a: any): a is MonthlyAmount[] =>
  Array.isArray(a) && a.length > 0 && 'month' in a[0]

const isQuarterlyArray = (a: any): a is QuarterlyAmount[] =>
  Array.isArray(a) && a.length > 0 && 'quarter' in a[0]

const isYearlyAmount = (a: unknown): a is YearlyAmount =>
  !!a &&
  typeof a === 'object' &&
  'value' in (a as any) &&
  'date' in (a as any) &&
  !('month' in (a as any)) &&
  !('quarter' in (a as any))
// /Type guards

// const isMonthlyAmounts = (a: any): a is MonthlyAmount[] =>
//   Array.isArray(a) && a.length > 0 && 'month' in a[0]

// const isQuarterlyAmounts = (a: any): a is QuarterlyAmount[] =>
//   Array.isArray(a) && a.length > 0 && 'quarter' in a[0]

const GstTds = () => {
  const [bills, setBills] = useState<Bill[]>([])

  const [activeTab, setActiveTab] = useState<'GST' | 'TDS'>('GST')
  const [activeSubTab, setActiveSubTab] = useState<'Yearly' | 'Monthly' | 'Quarterly'>('Yearly')

  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<'name' | 'pan' | 'paymentType' | ''>('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [periodFilter, setPeriodFilter] = useState<string>('All')

  const [form, setForm] = useState(initialFormState)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    const fetchBills = async () => {
      const loadedBills = await window.electronAPI.loadBills()
      setBills(loadedBills)
    }
    fetchBills()
  }, [])

  const tableHasEditors =
    activeSubTab === 'Yearly' ||
    (activeSubTab === 'Monthly' && periodFilter !== 'All') ||
    (activeSubTab === 'Quarterly' && periodFilter !== 'All')

  // Update the filtering to handle new amount types
  const filteredBills = useMemo(() => {
    const q = search.toLowerCase()

    return bills
      .filter((bill) => bill.type === activeTab)
      .filter((bill) => bill.paymentType === activeSubTab)
      .filter((bill) => {
        const yearEntry = bill.bill?.find((b) => b.year === currentYear)

        if (!yearEntry) return true // Allow empty rows

        if (activeSubTab === 'Monthly' || activeSubTab === 'Quarterly') {
          if (periodFilter === 'All') return true
        }

        return true // Yearly
      })
      .filter((bill) => {
        const pool: string[] = [bill.name, bill.pan ?? '', bill.gstNumber ?? '']

        const yearEntry = bill.bill?.find((b) => b.year === currentYear)
        const amt = yearEntry?.amount
        if (Array.isArray(amt)) {
          for (const a of amt) {
            if ('month' in a && a.month) pool.push(a.month)
            if ('quarter' in a && a.quarter) pool.push(a.quarter)
          }
        }

        return pool.some((s) => s.toLowerCase().includes(q))
      })
  }, [activeTab, activeSubTab, bills, periodFilter, search])

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

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    const updatedForm = { ...form, [name]: value }

    setForm(updatedForm)

    await handleSave(updatedForm)
  }

  const handleSave = async (updatedForm: typeof form) => {
    if (!updatedForm.type || !updatedForm.paymentType) return

    const payload: Bill = {
      name: updatedForm.name,
      paymentType: updatedForm.paymentType,
      type: updatedForm.type,
      ...(updatedForm.type === 'GST' ? { gstNumber: updatedForm.gstNumber } : {}),
      ...(updatedForm.type === 'TDS' ? { pan: updatedForm.pan } : {})
    }

    try {
      const updateBill = window.electronAPI.updateBill

      const result = await updateBill(payload)

      if (result.success) {
        setBills((prev) =>
          prev.map((bill) =>
            bill.type === updatedForm.type &&
            ((bill.gstNumber && bill.gstNumber === updatedForm.gstNumber) ||
              (bill.pan && bill.pan === updatedForm.pan))
              ? { ...bill, ...payload }
              : bill
          )
        )
      }
    } catch (error) {
      alert(`❌ Autosave error: ${error}`)
    }
  }

  // Read values to show in inputs from DB (bills state) for the selectedYear
  // READ helpers
  const getShownAmount = (bill: Bill): string => {
    const yearlyBill = bill.bill?.find((b) => b.year === currentYear)
    if (!yearlyBill) return ''
    const amt = yearlyBill.amount

    if (activeSubTab === 'Yearly') {
      return isYearlyAmount(amt) ? (amt.value ?? '') : ''
    }

    if (activeSubTab === 'Monthly' && periodFilter !== 'All' && isMonthlyArray(amt)) {
      return amt.find((m) => m.month === periodFilter)?.value ?? ''
    }

    if (activeSubTab === 'Quarterly' && periodFilter !== 'All' && isQuarterlyArray(amt)) {
      return amt.find((q) => q.quarter === periodFilter)?.value ?? ''
    }

    return ''
  }

  const getShownDate = (bill: Bill): string => {
    const yearlyBill = bill.bill?.find((b) => b.year === currentYear)
    if (!yearlyBill) return ''
    const amt = yearlyBill.amount

    if (activeSubTab === 'Yearly') {
      return isYearlyAmount(amt) ? (amt.date ?? '') : ''
    }

    if (activeSubTab === 'Monthly' && periodFilter !== 'All' && isMonthlyArray(amt)) {
      return amt.find((m) => m.month === periodFilter)?.date ?? ''
    }

    if (activeSubTab === 'Quarterly' && periodFilter !== 'All' && isQuarterlyArray(amt)) {
      return amt.find((q) => q.quarter === periodFilter)?.date ?? ''
    }

    return ''
  }

  const getShownRemarks = (bill: Bill): string => {
    const yearlyBill = bill.bill?.find((b) => b.year === currentYear)
    return yearlyBill?.remarks ?? ''
  }

  // Upsert helpers that preserve other periods
  // UPSERT helpers (unchanged from earlier except they’re used with currentYear via callers)
  const upsertMonth = (
    arr: MonthlyAmount[] | undefined,
    month: string,
    value: string,
    prevDate?: string
  ) => {
    const list = [...(arr ?? [])]
    const i = list.findIndex((m) => m.month === month)
    const dateToUse = prevDate || (value.trim() ? todayYMD() : '')
    if (i >= 0) list[i] = { month, value, date: dateToUse }
    else list.push({ month, value, date: dateToUse })
    return list
  }

  const upsertQuarter = (
    arr: QuarterlyAmount[] | undefined,
    quarter: string,
    value: string,
    prevDate?: string
  ) => {
    const list = [...(arr ?? [])]
    const i = list.findIndex((q) => q.quarter === quarter)
    const dateToUse = prevDate || (value.trim() ? todayYMD() : '')
    if (i >= 0) list[i] = { quarter, value, date: dateToUse }
    else list.push({ quarter, value, date: dateToUse })
    return list
  }

  // Build a new Bill with an updated amount (and first-time date auto-fill)
  // WRITE helpers
  const applyAmount = (orig: Bill, newAmount: string): Bill => {
    const prevBills = Array.isArray(orig.bill) ? [...orig.bill] : []
    const index = prevBills.findIndex((b) => b.year === currentYear)
    const yearlyBill = prevBills[index]
    const prevAmt = yearlyBill?.amount
    const prevRemarks = yearlyBill?.remarks

    let nextAmount: YearlyAmount | MonthlyAmount[] | QuarterlyAmount[]

    if (activeSubTab === 'Yearly') {
      const existing = isYearlyAmount(prevAmt) ? prevAmt : { value: '', date: '' }
      nextAmount = {
        value: newAmount,
        date: existing.date || (newAmount.trim() ? todayYMD() : '')
      }
    } else if (activeSubTab === 'Monthly' && periodFilter !== 'All') {
      const prev = isMonthlyArray(prevAmt) ? prevAmt : undefined
      const prevDateForThis = prev?.find((m) => m.month === periodFilter)?.date
      nextAmount = upsertMonth(prev, periodFilter, newAmount, prevDateForThis)
    } else if (activeSubTab === 'Quarterly' && periodFilter !== 'All') {
      const prev = isQuarterlyArray(prevAmt) ? prevAmt : undefined
      const prevDateForThis = prev?.find((q) => q.quarter === periodFilter)?.date
      nextAmount = upsertQuarter(prev, periodFilter, newAmount, prevDateForThis)
    } else {
      return orig
    }

    const nextBillBlock: BillBill = {
      year: currentYear,
      amount: nextAmount,
      remarks: prevRemarks
    }

    if (index >= 0) prevBills[index] = nextBillBlock
    else prevBills.push(nextBillBlock)

    return { ...orig, bill: prevBills }
  }

  const applyDate = (orig: Bill, newDate: string): Bill => {
    const list = Array.isArray(orig.bill) ? [...orig.bill] : []
    const idx = list.findIndex((b) => b.year === currentYear)

    const prevYear = idx >= 0 ? list[idx] : undefined
    const prevRemarks = prevYear?.remarks
    const amt = prevYear?.amount

    let nextAmount: YearlyAmount | MonthlyAmount[] | QuarterlyAmount[]

    if (activeSubTab === 'Yearly') {
      const prev = isYearlyAmount(amt) ? amt : { value: '', date: '' }
      nextAmount = { value: prev.value, date: newDate }
    } else if (activeSubTab === 'Monthly' && periodFilter !== 'All') {
      const prev = isMonthlyArray(amt) ? [...amt] : []
      const i = prev.findIndex((m) => m.month === periodFilter)
      if (i >= 0) prev[i] = { ...prev[i], date: newDate }
      else prev.push({ month: periodFilter, value: '', date: newDate })
      nextAmount = prev
    } else if (activeSubTab === 'Quarterly' && periodFilter !== 'All') {
      const prev = isQuarterlyArray(amt) ? [...amt] : []
      const i = prev.findIndex((q) => q.quarter === periodFilter)
      if (i >= 0) prev[i] = { ...prev[i], date: newDate }
      else prev.push({ quarter: periodFilter, value: '', date: newDate })
      nextAmount = prev
    } else {
      return orig
    }

    const updatedYearEntry: BillBill = {
      year: currentYear,
      amount: nextAmount,
      remarks: prevRemarks
    }

    if (idx >= 0) list[idx] = updatedYearEntry
    else list.push(updatedYearEntry)

    return { ...orig, bill: list }
  }

  const applyRemarks = (orig: Bill, newRemarks: string): Bill => {
    const list = Array.isArray(orig.bill) ? [...orig.bill] : []
    const idx = list.findIndex((b) => b.year === currentYear)
    const prev = idx >= 0 ? list[idx] : undefined
    const amt = prev?.amount

    let amount: YearlyAmount | MonthlyAmount[] | QuarterlyAmount[]
    if (activeSubTab === 'Yearly') {
      amount = isYearlyAmount(amt) ? amt : { value: '', date: '' }
    } else if (activeSubTab === 'Monthly') {
      amount = isMonthlyArray(amt) ? amt : ([] as MonthlyAmount[])
    } else {
      amount = isQuarterlyArray(amt) ? amt : ([] as QuarterlyAmount[])
    }

    const updatedYearEntry: BillBill = {
      year: currentYear,
      amount,
      remarks: newRemarks || undefined
    }

    if (idx >= 0) list[idx] = updatedYearEntry
    else list.push(updatedYearEntry)

    return { ...orig, bill: list }
  }

  // Persist updated bill (optimistic UI)
  const saveBillNow = async (updated: Bill) => {
    try {
      const result = await window.electronAPI.updateBill?.(updated)
      if (!result?.success && result?.error) {
        console.error('Autosave error:', result.error)
      }
    } catch (e) {
      console.error('Autosave error:', e)
    }
  }

  // Replace a bill in state by its key
  const replaceBillInState = (next: Bill) => {
    const key = getBillKey(next)
    setBills((prev) => prev.map((b) => (getBillKey(b) === key ? next : b)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.type || !form.paymentType) return

    const payload: Bill = {
      name: form.name,
      paymentType: form.paymentType,
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
          borderBottom:
            activeSubTab === 'Monthly' || activeSubTab === 'Quarterly'
              ? '2px solid #e5e7eb'
              : 'none'
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
              setPeriodFilter('All')
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
              setPeriodFilter('All')
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
            onClick={() => {
              setActiveSubTab('Yearly')
              setPeriodFilter('All')
            }}
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
              onClick={() => {
                setActiveSubTab('Monthly')
                setPeriodFilter('All')
              }}
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
              onClick={() => {
                setActiveSubTab('Quarterly')
                setPeriodFilter('All')
              }}
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

      {/* Period Tabs Row (only for Monthly / Quarterly) */}
      {(activeSubTab === 'Monthly' || activeSubTab === 'Quarterly') && (
        <div
          style={{
            display: 'flex',
            gap: '10px',
            padding: '10px 0'
          }}
        >
          {/* All period */}
          <button
            onClick={() => setPeriodFilter('All')}
            style={{
              padding: '8px 14px',
              borderRadius: '6px',
              border: 'none',
              background: periodFilter === 'All' ? '#6366f1' : 'transparent',
              color: periodFilter === 'All' ? '#fff' : '#333',
              cursor: 'pointer'
            }}
          >
            All
          </button>

          {/* Months or Quarters */}
          {(activeSubTab === 'Monthly' ? MONTHS : QUARTERS).map((p) => (
            <button
              key={p}
              onClick={() => setPeriodFilter(p)}
              style={{
                padding: '8px 14px',
                borderRadius: '6px',
                border: 'none',
                background: periodFilter === p ? '#6366f1' : 'transparent',
                color: periodFilter === p ? '#fff' : '#333',
                cursor: 'pointer'
              }}
            >
              {p}
            </button>
          ))}
        </div>
      )}

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
          onClick={() => (
            setShowForm(true),
            setForm({
              ...initialFormState,
              ...(activeTab === 'GST' ? { type: 'GST' } : { type: 'TDS' })
            }),
            setPeriodFilter('All')
          )}
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
                gridTemplateColumns: `250px 200px ${tableHasEditors ? '120px 180px 1fr' : ''}`,
                backgroundColor: '#4f46e5',
                color: 'white',
                fontWeight: 'bold',
                padding: '10px 16px'
              }}
            >
              <div style={{ cursor: 'pointer' }} onClick={() => handleSort('name')}>
                Name {sortKey === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
              </div>
              <div>{activeTab === 'GST' ? 'GST No.' : 'PAN'}</div>

              {tableHasEditors && (
                <>
                  <div>Amount</div>
                  <div>Date</div>
                  <div>Remarks</div>
                </>
              )}
            </div>

            {sortedBills.map((bill, index) => {
              const shownAmount = getShownAmount(bill)
              const shownDate = getShownDate(bill)
              const shownRemarks = getShownRemarks(bill)

              return (
                <div
                  key={index}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `250px 200px ${tableHasEditors ? '120px 180px 1fr' : ''}`,
                    alignItems: 'center',
                    borderBottom: '1px solid #eee',
                    padding: '10px 16px'
                  }}
                >
                  <div>{bill.name}</div>
                  <div>{bill.pan || bill.gstNumber}</div>

                  {tableHasEditors && (
                    <>
                      {/* Amount (autosave, first-time date fill if needed) */}
                      <div style={{ paddingRight: '20px' }}>
                        <input
                          value={shownAmount}
                          onChange={(e) => {
                            const next = applyAmount(bill, e.target.value)
                            replaceBillInState(next) // optimistic
                            saveBillNow(next) // persist
                          }}
                          style={{ ...inputBaseStyle, padding: '6px 8px' }}
                          placeholder="Amount"
                        />
                      </div>

                      {/* Date (only user edits change date) */}
                      <div style={{ paddingRight: '20px' }}>
                        <input
                          type="date"
                          value={shownDate}
                          onChange={(e) => {
                            const v = isYMD(e.target.value) ? e.target.value : ''
                            const next = applyDate(bill, v)
                            replaceBillInState(next)
                            saveBillNow(next)
                          }}
                          style={{ ...inputBaseStyle, padding: '6px 8px' }}
                        />
                      </div>

                      {/* Remarks (never touches date) */}
                      <div style={{ paddingRight: '20px' }}>
                        <input
                          value={shownRemarks}
                          onChange={(e) => {
                            const next = applyRemarks(bill, e.target.value)
                            replaceBillInState(next)
                            saveBillNow(next)
                          }}
                          style={{ ...inputBaseStyle, padding: '6px 8px' }}
                          placeholder="Optional"
                        />
                      </div>
                    </>
                  )}
                </div>
              )
            })}
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
