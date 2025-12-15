let a = {
  name: 'AJAY  SEHGAL',
  fileCode: '567',
  pan: 'AFQPS5501P',
  group: 'ROHIT JIT PAL BHATIA',
  startYear: '2024',
  billingStatus: [
    {
      status: 'Not started',
      year: '2025'
    }
  ],
  ackno: [
    {
      num: '681093330061124',
      year: '2024',
      filePath:
        '/Users/manasgupta/Downloads/K drive - folder is - SmartTax - next folder is - ITRV2024 - all ITR V are here/AFQPS5501P_ITRV.txt'
    }
  ],
  docsComplete: [
    {
      year: '2025',
      value: false
    }
  ],
  auditCase: [
    {
      year: '2025',
      value: true
    },
    {
      year: '2026',
      value: false
    }
  ]
}

console.log(a.auditCase)
