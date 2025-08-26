// generateDummyBills.ts
// Usage: ts-node generateDummyBills.ts 5000 > dummy-bills.json

type PaymentType = 'Yearly' | 'Monthly' | 'Quarterly'
type BillType = 'GST' | 'TDS'

interface YearlyAmount {
  value: string
  date: string
  remarks?: string
}
interface MonthlyAmount {
  month: string
  value: string
  date: string
  remarks?: string
}
interface QuarterlyAmount {
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4'
  value: string
  date: string
  remarks?: string
}
interface Bill {
  name: string
  gstNumber?: string
  pan?: string
  paymentType: PaymentType
  bill?: BillBill[]
  type: BillType
}

type BillBill = {
  year: string
  amount: YearlyAmount | MonthlyAmount[] | QuarterlyAmount[]
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

// ---------- random helpers ----------
const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
const chance = (p: number) => Math.random() < p
const pick = <T>(arr: readonly T[]) => arr[rand(0, arr.length - 1)]
const pickSubset = <T>(arr: readonly T[], p = 0.5): T[] => arr.filter(() => chance(p))

const randomAmountStr = () => String(rand(200, 5000))
const randomISODate = (year: number) =>
  `${year}-${String(rand(1, 12)).padStart(2, '0')}-${String(rand(1, 28)).padStart(2, '0')}`
const maybeRemark = () =>
  chance(0.4)
    ? pick([
        'Paid via NEFT',
        'Pending challan',
        'Interest included',
        'Provisional',
        'Docs awaited',
        'Late fee waived',
        'Credit note adjusted',
        'RCM adjusted',
        'Short payment, to rectify',
        'Advance received',
        'Partially offset via ITC'
      ])
    : undefined

// PAN: 5 letters + 4 digits + 1 letter
const randomPAN = () =>
  Array.from({ length: 5 }, () => String.fromCharCode(rand(65, 90))).join('') +
  String(rand(1000, 9999)) +
  String.fromCharCode(rand(65, 90))

// GSTIN-ish (not a full validator): 2 digits + PAN (10) + 1 entity + 'Z' + 1 checksum-ish
const randomGSTIN = () => {
  const state = String(rand(1, 35)).padStart(2, '0')
  const pan = randomPAN()
  const entity = String(rand(1, 9))
  const checksum = String.fromCharCode(rand(65, 90))
  return `${state}${pan}${entity}Z${checksum}`
}

const companyPrefixes = [
  'Acme',
  'Zenith',
  'Bright',
  'Orbit',
  'GreenLeaf',
  'Nova',
  'Innova',
  'Atlas',
  'Nimbus',
  'Vertex',
  'Quantum',
  'Pioneer',
  'Skyline',
  'Bluewave',
  'Northstar'
] as const

const companySuffixes = [
  'Traders',
  'Solutions',
  'Retail',
  'Foods',
  'Tech',
  'Build',
  'Finance',
  'Services'
] as const

const randomName = (type: BillType, payment: PaymentType) =>
  `${pick(companyPrefixes)} ${pick(companySuffixes)}${
    type === 'GST' && payment === 'Monthly'
      ? ' GST-M'
      : type === 'TDS' && payment === 'Quarterly'
        ? ' TDS-Q'
        : ''
  }`

// ---------- amount builders ----------
function buildYearly(year: number): YearlyAmount {
  const remarks = maybeRemark()
  return {
    value: randomAmountStr(),
    date: randomISODate(year),
    ...(remarks ? { remarks } : {})
  }
}

function buildMonthly(year: number): MonthlyAmount[] {
  // include ~60% of months to make data sparse/realistic
  const months = pickSubset(MONTHS, 0.6)
  // ensure at least one month exists
  const atLeastOne = months.length ? months : [pick(MONTHS)]
  return atLeastOne.map((m) => {
    const remarks = maybeRemark()
    return {
      month: m,
      value: randomAmountStr(),
      date: randomISODate(year),
      ...(remarks ? { remarks } : {})
    }
  })
}

function buildQuarterly(year: number): QuarterlyAmount[] {
  // include 2–4 quarters
  const count = rand(2, 4)
  const qs = [...QUARTERS].sort(() => Math.random() - 0.5).slice(0, count)
  return qs.map((q) => {
    const remarks = maybeRemark()
    return {
      quarter: q,
      value: randomAmountStr(),
      date: randomISODate(year),
      ...(remarks ? { remarks } : {})
    }
  })
}

// ---------- bill factory ----------
function makeBill(i: number): Bill {
  const type: BillType = chance(0.55) ? 'GST' : 'TDS'
  // GST: Yearly or Monthly. TDS: Yearly or Quarterly.
  const paymentType: PaymentType =
    type === 'GST' ? (chance(0.45) ? 'Yearly' : 'Monthly') : chance(0.5) ? 'Yearly' : 'Quarterly'

  const name = randomName(type, paymentType) + ` ${i + 1}`
  const years: number[] = chance(0.6) ? [2025, 2026] : [pick([2025, 2026])]

  const billBlocks: BillBill[] = years.map((y) => {
    if (paymentType === 'Yearly') {
      return { year: String(y), amount: buildYearly(y) }
    }
    if (paymentType === 'Monthly') {
      return { year: String(y), amount: buildMonthly(y) }
    }
    // Quarterly
    return { year: String(y), amount: buildQuarterly(y) }
  })

  const base: Bill = {
    name,
    paymentType,
    type,
    bill: billBlocks
  }

  if (type === 'GST') return { ...base, gstNumber: randomGSTIN() }
  return { ...base, pan: randomPAN() }
}

// ---------- main ----------
function makeDummyBills(count: number): Bill[] {
  return Array.from({ length: count }, (_, i) => makeBill(i))
}

// CLI
const arg = process.argv[2]
const count = Math.max(1, parseInt(arg || '1000', 10))
const data = makeDummyBills(count)
process.stdout.write(JSON.stringify(data, null, 2))
