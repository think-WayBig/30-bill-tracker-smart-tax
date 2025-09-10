import React, { useEffect, useMemo, useState } from 'react'
import Layout from '../helpers/Layout'
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
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
  'January',
  'February',
  'March'
] as const

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'] as const

const LS = {
  tab: 'taxes.activeTab',
  subTab: 'taxes.activeSubTab',
  search: 'taxes.search',
  unpaid: 'taxes.unpaidOnly'
}

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

const STICKY_TOP = 69 // match your Layout’s top bar height
const stickyWrapStyle: React.CSSProperties = {
  position: 'sticky',
  top: STICKY_TOP,
  zIndex: 40, // above table header
  background: 'white',
  padding: '20px 10px 10px 10px',
  borderBottom: '1px solid #e5e7eb',
  boxShadow: '0 8px 8px -8px rgba(0,0,0,0.12)'
}

const GstTds = () => {
  const [bills, setBills] = useState<Bill[]>([])

  const [sortKey, setSortKey] = useState<'name' | 'pan' | 'paymentType' | ''>('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [periodFilter, setPeriodFilter] = useState<string>('All')

  // === local storage initialization ===
  const [activeTab, setActiveTab] = useState<'GST' | 'TDS'>(() => {
    const v = localStorage.getItem(LS.tab)
    return v === 'TDS' ? 'TDS' : 'GST'
  })

  const [activeSubTab, setActiveSubTab] = useState<'Yearly' | 'Monthly' | 'Quarterly'>(() => {
    const v = localStorage.getItem(LS.subTab)
    return v === 'Monthly' || v === 'Quarterly' || v === 'Yearly' ? v : 'Yearly'
  })

  const [search, setSearch] = useState<string>(() => localStorage.getItem(LS.search) ?? '')
  const [unpaidOnly, setUnpaidOnly] = useState<boolean>(
    () => localStorage.getItem(LS.unpaid) === '1'
  )

  useEffect(() => {
    localStorage.setItem(LS.tab, activeTab)
  }, [activeTab])
  useEffect(() => {
    localStorage.setItem(LS.subTab, activeSubTab)
  }, [activeSubTab])
  useEffect(() => {
    localStorage.setItem(LS.search, search)
  }, [search])
  useEffect(() => {
    localStorage.setItem(LS.unpaid, unpaidOnly ? '1' : '0')
  }, [unpaidOnly])

  useEffect(() => {
    localStorage.setItem('taxes.activeTab', activeTab) // 'GST' | 'TDS'
    window.dispatchEvent(new CustomEvent('taxes:tab-changed', { detail: activeTab }))
  }, [activeTab])
  // === end of local storage initialization ===

  const [form, setForm] = useState(initialFormState)
  const [showForm, setShowForm] = useState(false)

  // Accent colors switch by active tab
  const ACCENT = React.useMemo(
    () =>
      activeTab === 'GST'
        ? { solid: '#6366f1', dark: '#4f46e5', text: '#ffffff' } // indigo
        : { solid: '#038260ff', dark: '#038260ff', text: '#ffffff' }, // amber
    [activeTab]
  )

  const SMOOTH: React.CSSProperties = {
    transition:
      'background-color 240ms ease, color 240ms ease, border-color 240ms ease, box-shadow 240ms ease'
  }

  const hexMixWithWhite = (hex: string, whiteRatio = 0.88) => {
    let h = hex.replace('#', '').toLowerCase()
    if (h.length === 3)
      h = h
        .split('')
        .map((c) => c + c)
        .join('')
    if (h.length === 8) h = h.slice(0, 6) // ignore alpha if present
    if (h.length !== 6) return '#eef2ff' // fallback
    const r = parseInt(h.slice(0, 2), 16)
    const g = parseInt(h.slice(2, 4), 16)
    const b = parseInt(h.slice(4, 6), 16)
    const mix = (c: number) => Math.round(c + (255 - c) * whiteRatio)
    const toHex = (n: number) => n.toString(16).padStart(2, '0')
    return `#${toHex(mix(r))}${toHex(mix(g))}${toHex(mix(b))}`
  }

  const HOVER_BG = hexMixWithWhite(ACCENT.solid, 0.88) // lighter
  const HOVER_BG_STICKY = hexMixWithWhite(ACCENT.solid, 0.8) // a

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

  // =========================
  // paging for All view
  const PAGE_SIZE = 150
  const [page, setPage] = useState(1)
  const isAllView = activeSubTab !== 'Yearly' && periodFilter === 'All'

  // debounced search so we don't filter on every keystroke
  const [searchDebounced, setSearchDebounced] = useState(search)
  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 180)
    return () => clearTimeout(t)
  }, [search])

  // reset paging when filters change
  useEffect(() => {
    setPage(1)
  }, [activeTab, activeSubTab, periodFilter, searchDebounced])

  // build a quick lookup for months/quarters to avoid many Array.find calls
  const buildPeriodLookup = (bill: Bill) => {
    const yearEntry = bill.bill?.find((b) => b.year === currentYear)
    const amt = yearEntry?.amount
    if (activeSubTab === 'Monthly' && isMonthlyArray(amt)) {
      const byMonth = new Map<string, MonthlyAmount>()
      for (const m of amt) byMonth.set(m.month, m)
      return { byMonth }
    }
    if (activeSubTab === 'Quarterly' && isQuarterlyArray(amt)) {
      const byQuarter = new Map<string, QuarterlyAmount>()
      for (const q of amt) byQuarter.set(q.quarter, q)
      return { byQuarter }
    }
    return {}
  }
  // =========================

  const isYearlyPaid = (amt: unknown) => isYearlyAmount(amt) && !!amt.date

  const isMonthlyPeriodPaid = (amt: unknown, month: (typeof MONTHS)[number]) => {
    if (!isMonthlyArray(amt)) return false
    const found = amt.find((m) => m.month === month)
    return !!found?.date
  }

  const isQuarterlyPeriodPaid = (amt: unknown, quarter: (typeof QUARTERS)[number]) => {
    if (!isQuarterlyArray(amt)) return false
    const found = amt.find((q) => q.quarter === quarter)
    return !!found?.date
  }

  /** true if this bill has at least one unpaid item in the *current* view */
  const hasAnyUnpaidForCurrentView = React.useCallback(
    (bill: Bill) => {
      const amt = bill.bill?.find((b) => b.year === currentYear)?.amount

      if (activeSubTab === 'Yearly') {
        // unpaid if there is no yearly amount or no date
        return !isYearlyPaid(amt)
      }

      if (activeSubTab === 'Monthly') {
        if (periodFilter === 'All') {
          return MONTHS.some((m) => !isMonthlyPeriodPaid(amt, m))
        }
        return !isMonthlyPeriodPaid(amt, periodFilter as (typeof MONTHS)[number])
      }

      if (activeSubTab === 'Quarterly') {
        if (periodFilter === 'All') {
          return QUARTERS.some((q) => !isQuarterlyPeriodPaid(amt, q))
        }
        return !isQuarterlyPeriodPaid(amt, periodFilter as (typeof QUARTERS)[number])
      }

      return true
    },
    [activeSubTab, periodFilter]
  )

  // Update the filtering to handle new amount types
  const filteredBills = useMemo(() => {
    const q = searchDebounced.toLowerCase()

    const base = bills
      .filter((bill) => bill.type === activeTab)
      .filter((bill) => bill.paymentType === activeSubTab)
      .filter((bill) => {
        const pool: string[] = [bill.name, bill.pan ?? '', bill.gstNumber ?? '']
        const yearEntry = bill.bill?.find((b) => b.year === currentYear)
        const amt = yearEntry?.amount
        if (Array.isArray(amt)) {
          for (const a of amt) {
            if ('month' in a && a.month) pool.push(a.month)
            if ('quarter' in a && a.quarter) pool.push(a.quarter)
            if ('remarks' in a && a.remarks) pool.push(String(a.remarks))
          }
        } else if (isYearlyAmount(amt) && amt.remarks) {
          pool.push(String(amt.remarks))
        }
        return pool.some((s) => s.toLowerCase().includes(q))
      })

    if (!unpaidOnly) return base

    // keep only bills that have at least one unpaid item for the current view
    return base.filter(hasAnyUnpaidForCurrentView)
  }, [searchDebounced, bills, unpaidOnly, hasAnyUnpaidForCurrentView, activeTab, activeSubTab])

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

  const visibleSortedBills = useMemo(() => {
    if (!isAllView) return sortedBills
    return sortedBills.slice(0, page * PAGE_SIZE)
  }, [sortedBills, isAllView, page])

  const totalCount = sortedBills.length
  const visibleCount = visibleSortedBills.length

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
    const amt = bill.bill?.find((b) => b.year === currentYear)?.amount
    if (activeSubTab === 'Yearly') {
      return isYearlyAmount(amt) ? (amt.remarks ?? '') : ''
    }
    if (activeSubTab === 'Monthly' && periodFilter !== 'All' && isMonthlyArray(amt)) {
      return amt.find((m) => m.month === periodFilter)?.remarks ?? ''
    }
    if (activeSubTab === 'Quarterly' && periodFilter !== 'All' && isQuarterlyArray(amt)) {
      return amt.find((q) => q.quarter === periodFilter)?.remarks ?? ''
    }
    return ''
  }

  // Upsert helpers that preserve other periods
  // UPSERT helpers (unchanged from earlier except they’re used with currentYear via callers)
  const upsertMonth = (
    arr: MonthlyAmount[] | undefined,
    month: string,
    value: string,
    prevDate?: string,
    prevRemarks?: string
  ) => {
    const list = [...(arr ?? [])]
    const i = list.findIndex((m) => m.month === month)
    const dateToUse = prevDate || (value.trim() ? todayYMD() : '')
    const remarksToUse = prevRemarks
    if (i >= 0) list[i] = { month, value, date: dateToUse, remarks: remarksToUse }
    else list.push({ month, value, date: dateToUse, remarks: remarksToUse })
    return list
  }

  const upsertQuarter = (
    arr: QuarterlyAmount[] | undefined,
    quarter: string,
    value: string,
    prevDate?: string,
    prevRemarks?: string
  ) => {
    const list = [...(arr ?? [])]
    const i = list.findIndex((q) => q.quarter === quarter)
    const dateToUse = prevDate || (value.trim() ? todayYMD() : '')
    const remarksToUse = prevRemarks
    if (i >= 0) list[i] = { quarter, value, date: dateToUse, remarks: remarksToUse }
    else list.push({ quarter, value, date: dateToUse, remarks: remarksToUse })
    return list
  }

  // Build a new Bill with an updated amount (and first-time date auto-fill)
  // WRITE helpers
  const applyAmount = (orig: Bill, newAmount: string): Bill => {
    const prevBills = Array.isArray(orig.bill) ? [...orig.bill] : []
    const index = prevBills.findIndex((b) => b.year === currentYear)
    const yearlyBill = prevBills[index]
    const prevAmt = yearlyBill?.amount

    let nextAmount: YearlyAmount | MonthlyAmount[] | QuarterlyAmount[]

    if (activeSubTab === 'Yearly') {
      const existing = isYearlyAmount(prevAmt) ? prevAmt : { value: '', date: '', remarks: '' }
      nextAmount = {
        value: newAmount,
        date: existing.date || (newAmount.trim() ? todayYMD() : ''),
        remarks: existing.remarks
      }
    } else if (activeSubTab === 'Monthly' && periodFilter !== 'All') {
      const prev = isMonthlyArray(prevAmt) ? prevAmt : undefined
      const prevItem = prev?.find((m) => m.month === periodFilter)
      nextAmount = upsertMonth(prev, periodFilter, newAmount, prevItem?.date, prevItem?.remarks)
    } else if (activeSubTab === 'Quarterly' && periodFilter !== 'All') {
      const prev = isQuarterlyArray(prevAmt) ? prevAmt : undefined
      const prevItem = prev?.find((q) => q.quarter === periodFilter)
      nextAmount = upsertQuarter(prev, periodFilter, newAmount, prevItem?.date, prevItem?.remarks)
    } else {
      return orig
    }

    const nextBillBlock: BillBill = {
      year: currentYear,
      amount: nextAmount
    }

    if (index >= 0) prevBills[index] = nextBillBlock
    else prevBills.push(nextBillBlock)

    return { ...orig, bill: prevBills }
  }

  const applyDate = (orig: Bill, newDate: string): Bill => {
    const list = Array.isArray(orig.bill) ? [...orig.bill] : []
    const idx = list.findIndex((b) => b.year === currentYear)

    const prevYear = idx >= 0 ? list[idx] : undefined
    const amt = prevYear?.amount

    let nextAmount: YearlyAmount | MonthlyAmount[] | QuarterlyAmount[]

    if (activeSubTab === 'Yearly') {
      const prev = isYearlyAmount(amt) ? amt : { value: '', date: '', remarks: '' }
      nextAmount = { value: prev.value, date: newDate, remarks: prev.remarks }
    } else if (activeSubTab === 'Monthly' && periodFilter !== 'All') {
      const prev = isMonthlyArray(amt) ? [...amt] : []
      const i = prev.findIndex((m) => m.month === periodFilter)
      if (i >= 0) prev[i] = { ...prev[i], date: newDate }
      else prev.push({ month: periodFilter, value: '', date: newDate, remarks: '' })
      nextAmount = prev
    } else if (activeSubTab === 'Quarterly' && periodFilter !== 'All') {
      const prev = isQuarterlyArray(amt) ? [...amt] : []
      const i = prev.findIndex((q) => q.quarter === periodFilter)
      if (i >= 0) prev[i] = { ...prev[i], date: newDate }
      else prev.push({ quarter: periodFilter, value: '', date: newDate, remarks: '' })
      nextAmount = prev
    } else {
      return orig
    }

    const updatedYearEntry: BillBill = {
      year: currentYear,
      amount: nextAmount
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

    let nextAmount: YearlyAmount | MonthlyAmount[] | QuarterlyAmount[]

    if (activeSubTab === 'Yearly') {
      const prevYearly = isYearlyAmount(amt) ? amt : { value: '', date: '', remarks: '' }
      nextAmount = { ...prevYearly, remarks: newRemarks || undefined }
    } else if (activeSubTab === 'Monthly' && periodFilter !== 'All') {
      const prevArr = isMonthlyArray(amt) ? [...amt] : []
      const i = prevArr.findIndex((m) => m.month === periodFilter)
      if (i >= 0) prevArr[i] = { ...prevArr[i], remarks: newRemarks || undefined }
      else
        prevArr.push({ month: periodFilter, value: '', date: '', remarks: newRemarks || undefined })
      nextAmount = prevArr
    } else if (activeSubTab === 'Quarterly' && periodFilter !== 'All') {
      const prevArr = isQuarterlyArray(amt) ? [...amt] : []
      const i = prevArr.findIndex((q) => q.quarter === periodFilter)
      if (i >= 0) prevArr[i] = { ...prevArr[i], remarks: newRemarks || undefined }
      else
        prevArr.push({
          quarter: periodFilter,
          value: '',
          date: '',
          remarks: newRemarks || undefined
        })
      nextAmount = prevArr
    } else {
      return orig
    }

    const updatedYearEntry: BillBill = {
      year: currentYear,
      amount: nextAmount
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

  // --- Edit Bill modal state ---
  const [showEditForm, setShowEditForm] = useState(false)
  const [editForm, setEditForm] = useState<Bill>({
    name: '',
    pan: '',
    gstNumber: '',
    type: activeTab, // default to current tab
    paymentType: 'Yearly'
  })

  useEffect(() => {
    // keep type aligned with the active tab when opening a fresh edit
    if (!showEditForm) {
      setEditForm((prev) => ({ ...prev, type: activeTab }))
    }
  }, [activeTab, showEditForm])

  const resetEditForm = () =>
    setEditForm({
      name: '',
      pan: '',
      gstNumber: '',
      type: activeTab,
      paymentType: 'Yearly'
    })

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setEditForm((prev) => ({ ...prev, [name]: value }))
  }

  // Prefill name/paymentType from current list (user enters Type + GST/PAN, clicks Load)
  const loadExistingIntoEdit = () => {
    const { type, gstNumber, pan } = editForm
    const found = bills.find((b) =>
      type === 'GST'
        ? b.type === 'GST' && b.gstNumber === gstNumber
        : b.type === 'TDS' && b.pan === pan
    )
    if (found) {
      setEditForm((prev) => ({
        ...prev,
        name: found.name || '',
        paymentType: found.paymentType || 'Yearly'
      }))
    } else {
      alert('No bill found for that Type and ID.')
    }
  }

  // Update an existing bill (Type + GST/PAN used as identifier)
  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload: Bill = {
      type: editForm.type,
      name: editForm.name.trim(),
      paymentType: editForm.paymentType,
      ...(editForm.type === 'GST'
        ? { gstNumber: editForm.gstNumber?.trim(), pan: '' }
        : { pan: editForm.pan?.trim(), gstNumber: '' })
    }

    try {
      const result = await window.electronAPI.updateBill?.(payload)
      if (!result?.success) throw new Error(result?.error || 'Unknown error')

      // update local state
      setBills((prev) =>
        prev.map((b) => {
          if (payload.type === 'GST') {
            return b.type === 'GST' && b.gstNumber === payload.gstNumber ? { ...b, ...payload } : b
          }
          return b.type === 'TDS' && b.pan === payload.pan ? { ...b, ...payload } : b
        })
      )

      alert('✅ Bill updated')
      setShowEditForm(false)
      resetEditForm()
    } catch (err) {
      alert(`❌ Update failed: ${err}`)
    }
  }

  // Delete by Type + GST/PAN only
  const deleteBillNow = async () => {
    if (!confirm('Delete this bill? This cannot be undone.')) return
    const idOk =
      (editForm.type === 'GST' && editForm.gstNumber?.trim()) ||
      (editForm.type === 'TDS' && editForm.pan?.trim())
    if (!idOk) {
      alert('Please select the Type and enter GST/PAN to delete.')
      return
    }

    const payload =
      editForm.type === 'GST'
        ? { type: 'GST', gstNumber: editForm.gstNumber?.trim() }
        : { type: 'TDS', pan: editForm.pan?.trim() }

    try {
      const result = await window.electronAPI.deleteBill?.(payload as any)
      if (!result?.success) throw new Error(result?.error || 'Unknown error')

      // remove from local state
      setBills((prev) =>
        prev.filter((b) =>
          editForm.type === 'GST'
            ? !(b.type === 'GST' && b.gstNumber === editForm.gstNumber?.trim())
            : !(b.type === 'TDS' && b.pan === editForm.pan?.trim())
        )
      )

      alert('🗑️ Bill deleted')
      setShowEditForm(false)
      resetEditForm()
    } catch (err) {
      alert(`❌ Delete failed: ${err}`)
    }
  }

  return (
    <Layout title="📝 Track GST/TDS Bills" color={ACCENT.dark} financialYear>
      {/* Sticky top section */}
      <div style={stickyWrapStyle}>
        {/* Heading */}
        <div style={{ marginBottom: 12 }}>
          <h1
            style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: ACCENT.dark,
              margin: 0,
              ...SMOOTH
            }}
          >
            {activeTab === 'GST' ? 'GST Bills' : 'TDS Bills'}
          </h1>
          <p style={{ fontSize: '16px', color: '#6b7280', margin: '6px 0 0' }}>
            {activeTab === 'GST'
              ? 'Manage and track your GST bills here.'
              : 'Manage and track your TDS bills here.'}
          </p>
        </div>

        {/* Tabs row (GST/TDS + sub-tabs) */}
        <div
          style={{
            display: 'flex',
            gap: 20,
            paddingBottom: 10,
            borderBottom:
              activeSubTab === 'Monthly' || activeSubTab === 'Quarterly'
                ? '2px solid #e5e7eb'
                : 'none'
          }}
        >
          {/* Main Tabs */}
          <div
            style={{
              display: 'flex',
              gap: 16,
              paddingRight: 20,
              alignItems: 'center',
              borderRight: '1px solid #e5e7eb'
            }}
          >
            <button
              onClick={() => {
                setActiveTab('GST')
                setActiveSubTab('Yearly')
                setPeriodFilter('All')
              }}
              style={{
                padding: '10px 20px',
                borderRadius: 6,
                border: 'none',
                background: activeTab === 'GST' ? ACCENT.solid : 'transparent',
                color: activeTab === 'GST' ? '#fff' : '#333',
                cursor: 'pointer',
                ...SMOOTH
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
                borderRadius: 6,
                border: 'none',
                background: activeTab === 'TDS' ? ACCENT.solid : 'transparent',
                color: activeTab === 'TDS' ? '#fff' : '#333',
                cursor: 'pointer',
                ...SMOOTH
              }}
            >
              TDS
            </button>
          </div>

          {/* Sub-Tabs */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <button
              onClick={() => {
                setActiveSubTab('Yearly')
                setPeriodFilter('All')
              }}
              style={{
                padding: '10px 20px',
                borderRadius: 6,
                border: 'none',
                background: activeSubTab === 'Yearly' ? ACCENT.solid : 'transparent',
                color: activeSubTab === 'Yearly' ? '#fff' : '#333',
                cursor: 'pointer',
                ...SMOOTH
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
                  borderRadius: 6,
                  border: 'none',
                  background: activeSubTab === 'Monthly' ? ACCENT.solid : 'transparent',
                  color: activeSubTab === 'Monthly' ? '#fff' : '#333',
                  cursor: 'pointer',
                  ...SMOOTH
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
                  borderRadius: 6,
                  border: 'none',
                  background: activeSubTab === 'Quarterly' ? ACCENT.solid : 'transparent',
                  color: activeSubTab === 'Quarterly' ? '#fff' : '#333',
                  cursor: 'pointer',
                  ...SMOOTH
                }}
              >
                Quarterly
              </button>
            )}
          </div>
        </div>

        {/* Period chips (only for Monthly / Quarterly) */}
        {(activeSubTab === 'Monthly' || activeSubTab === 'Quarterly') && (
          <div style={{ display: 'flex', gap: 10, padding: '10px 0' }}>
            <button
              onClick={() => setPeriodFilter('All')}
              style={{
                padding: '8px 14px',
                borderRadius: 6,
                border: 'none',
                background: periodFilter === 'All' ? ACCENT.solid : 'transparent',
                color: periodFilter === 'All' ? ACCENT.text : '#333',
                cursor: 'pointer',
                ...SMOOTH
              }}
            >
              All
            </button>
            {(activeSubTab === 'Monthly' ? MONTHS : QUARTERS).map((p) => (
              <button
                key={p}
                onClick={() => setPeriodFilter(p)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 6,
                  border: 'none',
                  background: periodFilter === p ? ACCENT.solid : 'transparent',
                  color: periodFilter === p ? ACCENT.text : '#333',
                  cursor: 'pointer',
                  ...SMOOTH
                }}
              >
                {p}
              </button>
            ))}
          </div>
        )}

        {/* Search & actions */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', paddingBottom: 8 }}>
          <input
            type="text"
            placeholder="Search bills..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              padding: '10px',
              fontSize: 16,
              borderRadius: 6,
              border: '1px solid #ccc'
            }}
          />
          <div
            style={{
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              marginLeft: 12,
              paddingLeft: 12,
              borderLeft: '1px solid #e5e7eb'
            }}
          >
            <button
              onClick={() => setUnpaidOnly(false)}
              style={{
                padding: '8px 14px',
                borderRadius: 6,
                border: 'none',
                background: !unpaidOnly ? ACCENT.solid : 'transparent',
                color: !unpaidOnly ? ACCENT.text : '#333',
                cursor: 'pointer',
                ...SMOOTH
              }}
            >
              All Bills
            </button>
            <button
              onClick={() => setUnpaidOnly(true)}
              style={{
                padding: '8px 14px',
                borderRadius: 6,
                border: 'none',
                background: unpaidOnly ? ACCENT.solid : 'transparent',
                color: unpaidOnly ? ACCENT.text : '#333',
                cursor: 'pointer',
                ...SMOOTH
              }}
            >
              Unpaid Only
            </button>
          </div>
          {isAllView && (
            <div style={{ fontSize: 13, color: '#6b7280', minWidth: 140, textAlign: 'right' }}>
              Showing {visibleCount}/{totalCount}
            </div>
          )}
          <button
            style={{
              padding: '10px 20px',
              borderRadius: 6,
              background: ACCENT.solid,
              color: ACCENT.text,
              border: 'none',
              cursor: 'pointer',
              ...SMOOTH,
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
            <span style={{ fontSize: '17px' }}>+</span> Create
          </button>

          <button
            style={{
              padding: '10px 20px',
              borderRadius: 6,
              background: 'transparent',
              color: ACCENT.dark,
              border: `1px solid ${ACCENT.solid}`,
              cursor: 'pointer',
              ...SMOOTH,
              fontWeight: 'bold'
            }}
            onClick={() => {
              resetEditForm()
              setShowEditForm(true)
            }}
          >
            <span style={{ fontSize: '15px' }}>✎</span> Edit
          </button>
        </div>
      </div>

      {/* Table */}
      <style>
        {`
          .hoverable-row { transition: background-color 120ms ease-in-out; }
          .hoverable-row:hover td { background: ${HOVER_BG}; }
          .hoverable-row:hover td.sticky-cell { background: ${HOVER_BG_STICKY} !important; }

          .hide-text { visibility: hidden; }
        `}
      </style>

      <div style={{ width: '100%', background: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        {sortedBills.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 20, color: '#666' }}>No data</div>
        ) : activeSubTab !== 'Yearly' && periodFilter === 'All' ? (
          //
          //
          /* ===================== READ-ONLY: Monthly/Quarterly → All ===================== */
          //
          //

          <div style={{ overflowX: 'auto' }}>
            {(() => {
              const periodLabel = activeSubTab === 'Monthly' ? 'Month' : 'Quarter'

              // borders
              const THIN = '1px solid #e5e7eb' // slate-200
              const GROUP = '1.5px solid #94a3b8' // slate-400 (darker outline)

              const tableStyle: React.CSSProperties = {
                width: '100%',
                minWidth: 900,
                borderCollapse: 'separate',
                borderSpacing: 0,
                background: 'white'
              }
              const theadTh: React.CSSProperties = {
                position: 'sticky',
                top: 0,
                zIndex: 3,
                background: ACCENT.dark,
                color: 'white',
                textAlign: 'left',
                padding: '10px 16px',
                fontWeight: 700,
                fontSize: 14
              }
              const tdBase: React.CSSProperties = {
                padding: '10px 16px',
                borderBottom: THIN,
                verticalAlign: 'middle',
                whiteSpace: 'nowrap'
              }
              // NOTE: row-spanned sticky cell draws the group separator at the bottom of the whole block
              const stickyNameCellBase: React.CSSProperties = {
                ...tdBase,
                position: 'sticky',
                left: 0,
                zIndex: 2,
                boxShadow: '2px 0 0 rgba(0,0,0,0.06)', // left separator
                minWidth: 240,
                maxWidth: 360
              }
              const periodCellBase: React.CSSProperties = { ...tdBase, minWidth: 120 }
              const amountCellBase: React.CSSProperties = { ...tdBase, minWidth: 120 }
              const dateCellBase: React.CSSProperties = {
                ...tdBase,
                minWidth: 140,
                fontVariantNumeric: 'tabular-nums'
              }
              const remarksCellBase: React.CSSProperties = {
                ...tdBase,
                minWidth: 260,
                whiteSpace: 'normal'
              }

              return (
                <>
                  <table style={tableStyle}>
                    <thead>
                      <tr>
                        <th style={{ ...theadTh, left: 0, zIndex: 4, position: 'sticky' }}>
                          {activeTab === 'GST' ? 'Name / GST' : 'Name / PAN'}
                        </th>
                        <th style={theadTh}>{periodLabel}</th>
                        <th style={theadTh}>Amount</th>
                        <th style={theadTh}>Date</th>
                        <th style={theadTh}>Remarks</th>
                      </tr>
                    </thead>

                    {visibleSortedBills.map((bill) => {
                      const key = bill.pan || bill.gstNumber || bill.name
                      const { byMonth, byQuarter } = buildPeriodLookup(bill)

                      let rows = (activeSubTab === 'Monthly' ? MONTHS : QUARTERS).map((p) => {
                        let v = '',
                          d = '',
                          r = ''
                        if (byMonth) {
                          const item = byMonth.get(p as any)
                          v = item?.value ?? ''
                          d = item?.date ?? ''
                          r = item?.remarks ?? ''
                        } else if (byQuarter) {
                          const item = byQuarter.get(p as any)
                          v = item?.value ?? ''
                          d = item?.date ?? ''
                          r = item?.remarks ?? ''
                        }
                        return { period: p, amount: v, date: d, remarks: r }
                      })

                      if (unpaidOnly) rows = rows.filter((r) => !r.date)
                      if (rows.length === 0) return null

                      return (
                        <tbody key={key}>
                          {rows.map((r, i) => {
                            const isLast = i === rows.length - 1

                            const stickyPartyCell: React.CSSProperties = {
                              ...stickyNameCellBase, // reuse your existing base (left sticky, shadow, etc.)
                              minWidth: 320,
                              maxWidth: 420,
                              whiteSpace: 'normal',
                              background: 'white',
                              borderBottom: isLast ? GROUP : THIN
                            }
                            const periodCell: React.CSSProperties = {
                              ...periodCellBase,
                              borderBottom: isLast ? GROUP : THIN
                            }
                            const amountCell: React.CSSProperties = {
                              ...amountCellBase,
                              borderBottom: isLast ? GROUP : THIN
                            }
                            const dateCell: React.CSSProperties = {
                              ...dateCellBase,
                              borderBottom: isLast ? GROUP : THIN
                            }
                            const remarksCell: React.CSSProperties = {
                              ...remarksCellBase,
                              borderBottom: isLast ? GROUP : THIN
                            }

                            return (
                              <tr key={`${key}-${r.period}`} className="hoverable-row">
                                {/* ONE sticky column with Name + ID. Duplicate per row; hide text after first */}
                                <td className="sticky-cell" style={stickyPartyCell}>
                                  <div className={i > 0 ? 'hide-text' : ''} aria-hidden={i > 0}>
                                    <div style={{ fontWeight: 600 }}>{bill.name}</div>
                                    <div style={{ fontSize: 12, color: '#6b7280' }}>
                                      {bill.pan || bill.gstNumber}
                                    </div>
                                  </div>
                                </td>

                                <td style={periodCell}>{r.period}</td>
                                <td style={amountCell}>{r.amount || '-'}</td>
                                <td style={dateCell}>{r.date || '-'}</td>
                                <td style={remarksCell}>{r.remarks || '-'}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      )
                    })}
                  </table>
                  {isAllView && visibleCount < totalCount && (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '12px' }}>
                      <button
                        onClick={() => setPage((p) => p + 1)}
                        style={{
                          padding: '8px 16px',
                          borderRadius: 6,
                          border: '1px solid #c7d2fe',
                          background: '#eef2ff',
                          color: '#4338ca',
                          cursor: 'pointer',
                          fontWeight: 600
                        }}
                      >
                        Load more ({Math.min(PAGE_SIZE, totalCount - visibleCount)} more)
                      </button>
                    </div>
                  )}
                </>
              )
            })()}
          </div>
        ) : (
          //
          //
          //
          /* ===================== EXISTING EDITABLE VIEW (unchanged) ===================== */
          <>
            {/* Header */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `250px 200px ${tableHasEditors ? '120px 180px 1fr' : ''}`,
                backgroundColor: ACCENT.dark,
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

            {/* Rows */}
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
                      {/* Amount (editable) */}
                      <div style={{ paddingRight: '20px' }}>
                        <input
                          value={shownAmount}
                          onChange={(e) => {
                            const next = applyAmount(bill, e.target.value)
                            replaceBillInState(next)
                            saveBillNow(next)
                          }}
                          style={{ ...inputBaseStyle, padding: '6px 8px' }}
                          placeholder="Amount"
                        />
                      </div>

                      {/* Date (editable) */}
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

                      {/* Remarks (editable) */}
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
      {showEditForm && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setShowEditForm(false)}
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
            onSubmit={submitEdit}
            onClick={(e) => e.stopPropagation()}
            style={{
              ...dialogCardStyle,
              borderTop: `4px solid ${ACCENT.solid}`,
              boxShadow: '0 12px 28px rgba(0,0,0,0.12)'
            }}
          >
            {/* Header */}
            <div
              style={{
                ...dialogHeaderStyle
              }}
            >
              <div>
                <h3>Edit / Delete Bill</h3>
              </div>
              <button
                type="button"
                aria-label="Close"
                style={{ ...closeBtnStyle, color: ACCENT.text, background: 'transparent' }}
                onClick={() => setShowEditForm(false)}
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
                  value={editForm.type}
                  onChange={handleEditChange}
                  required
                  style={inputBaseStyle}
                >
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
                  value={editForm.paymentType}
                  onChange={handleEditChange}
                  required
                  style={inputBaseStyle}
                >
                  <option value="Yearly">Yearly</option>
                  {editForm.type === 'GST' && <option value="Monthly">Monthly</option>}
                  {editForm.type === 'TDS' && <option value="Quarterly">Quarterly</option>}
                </select>
              </label>
            </div>

            {/* Middle row: Identifier + Load + Name */}
            <div style={formGridStyle}>
              {/* ID field (GST or PAN) */}
              {editForm.type === 'GST' ? (
                <label style={fieldStyle}>
                  <span style={labelStyle}>
                    GST Number (to identify) <span style={{ color: 'red' }}>*</span>
                  </span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      name="gstNumber"
                      value={editForm.gstNumber}
                      onChange={handleEditChange}
                      required
                      maxLength={15}
                      style={{ ...inputBaseStyle, flex: 1 }}
                      placeholder="15-char GSTIN"
                    />
                    <button
                      type="button"
                      onClick={loadExistingIntoEdit}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 6,
                        border: `1px solid ${ACCENT.solid}`,
                        background: 'transparent',
                        color: ACCENT.dark,
                        cursor: 'pointer',
                        fontWeight: 600
                      }}
                    >
                      Load
                    </button>
                  </div>
                </label>
              ) : (
                <label style={fieldStyle}>
                  <span style={labelStyle}>
                    PAN (to identify) <span style={{ color: 'red' }}>*</span>
                  </span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      name="pan"
                      value={editForm.pan}
                      onChange={handleEditChange}
                      required
                      maxLength={10}
                      style={{ ...inputBaseStyle, flex: 1 }}
                      placeholder="10-char PAN"
                    />
                    <button
                      type="button"
                      onClick={loadExistingIntoEdit}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 6,
                        border: `1px solid ${ACCENT.solid}`,
                        background: 'transparent',
                        color: ACCENT.dark,
                        cursor: 'pointer',
                        fontWeight: 600
                      }}
                    >
                      Load
                    </button>
                  </div>
                </label>
              )}

              {/* Name */}
              <label style={fieldStyle}>
                <span style={labelStyle}>
                  Name <span style={{ color: 'red' }}>*</span>
                </span>
                <input
                  name="name"
                  value={editForm.name}
                  onChange={handleEditChange}
                  required
                  style={inputBaseStyle}
                  placeholder="e.g., ABC Pvt Ltd"
                />
              </label>
            </div>

            {/* Footer */}
            <div style={{ ...footerStyle, display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={() => {
                  setShowEditForm(false)
                  resetEditForm()
                }}
                style={{
                  ...secondaryBtnStyle,
                  borderColor: ACCENT.solid,
                  color: ACCENT.dark
                }}
              >
                Cancel
              </button>

              <button
                type="submit"
                style={{
                  ...primaryBtnStyle,
                  background: ACCENT.solid,
                  color: ACCENT.text,
                  border: `1px solid ${ACCENT.dark}`
                }}
                disabled={
                  !editForm.type ||
                  !editForm.paymentType ||
                  !editForm.name.trim() ||
                  (editForm.type === 'GST' ? !editForm.gstNumber?.trim() : !editForm.pan?.trim())
                }
              >
                Update
              </button>

              <button
                type="button"
                onClick={deleteBillNow}
                style={{
                  ...secondaryBtnStyle,
                  borderColor: '#ef4444',
                  color: '#ef4444'
                }}
                disabled={
                  !(editForm.type === 'GST' ? editForm.gstNumber?.trim() : editForm.pan?.trim())
                }
                title="Delete by Type + GST/PAN"
              >
                Delete
              </button>
            </div>
          </form>
        </div>
      )}
    </Layout>
  )
}

export default GstTds
