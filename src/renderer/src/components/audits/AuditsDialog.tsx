import React, { useEffect, useMemo, useState } from 'react'
import {
  backdrop,
  modal,
  header,
  body,
  grid,
  label,
  input,
  footer,
  saveBtnStyle
} from './AuditsDialog.styles'

type Props = {
  open: boolean
  onClose: () => void
  onSubmit: (data: AuditEntry) => void
  caOptions?: string[]
  accountantOptions?: string[]
}

const EMPTY_YEAR_DATA: YearlyAuditData = {
  lastYearFee: undefined,
  sentToCA: '',
  sentOn: '',
  receivedOn: '',
  dateOfUpload: '',
  itrFiledOn: '',
  fee: undefined,
  accountant: ''
}

const AuditsDialog: React.FC<Props> = ({
  open,
  onClose,
  onSubmit,
  caOptions = [],
  accountantOptions = []
}) => {
  const currentYear = localStorage.getItem('selectedYear')! // assessment year

  const [pan, setPan] = useState('')
  const [name, setName] = useState('')
  const [accounts, setAccounts] = useState<{ [year: string]: YearlyAuditData }>({})

  useEffect(() => {
    if (open) {
      setPan('')
      setName('')
      setAccounts({
        [currentYear]: { ...EMPTY_YEAR_DATA }
      })
    }
  }, [open, currentYear]) // removed emptyYearData from deps to avoid bug

  const valid = useMemo(() => {
    return pan.trim().length > 0 && name.trim().length > 0
  }, [pan, name])

  if (!open) return null

  const handleChange = (year: string, key: keyof YearlyAuditData, value: any) => {
    setAccounts((prev) => ({
      ...prev,
      [year]: {
        ...prev[year],
        [key]: value
      }
    }))
  }

  return (
    <div style={backdrop} onClick={onClose}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        <div style={header}>New Audit Entry</div>

        <div style={body}>
          <div style={grid}>
            <div>
              <div style={label}>PAN of Assessee *</div>
              <input
                style={input}
                type="text"
                placeholder="PAN Number"
                value={pan}
                onChange={(e) => setPan(e.target.value)}
              />
            </div>
            <div>
              <div style={label}>Name of Assessee *</div>
              <input
                style={input}
                type="text"
                placeholder="Assessee name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

          {Object.entries(accounts).map(([year, data]) => (
            <div key={year} style={{ marginTop: 20 }}>
              <h3 style={{ marginBottom: 10 }}>{year}</h3>
              <div style={grid}>
                <div>
                  <div style={label}>Last Year Fee</div>
                  <input
                    style={input}
                    type="number"
                    value={data.lastYearFee ?? ''}
                    onChange={(e) => handleChange(year, 'lastYearFee', Number(e.target.value))}
                  />
                </div>
                <div>
                  <div style={label}>Sent To CA</div>
                  <input
                    style={input}
                    list="audit-ca-options"
                    type="text"
                    value={data.sentToCA ?? ''}
                    onChange={(e) => handleChange(year, 'sentToCA', e.target.value)}
                  />
                  <datalist id="audit-ca-options">
                    {caOptions.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <div style={label}>Sent On</div>
                  <input
                    style={input}
                    type="date"
                    value={data.sentOn ?? ''}
                    onChange={(e) => handleChange(year, 'sentOn', e.target.value)}
                  />
                </div>
                <div>
                  <div style={label}>Received On</div>
                  <input
                    style={input}
                    type="date"
                    value={data.receivedOn ?? ''}
                    onChange={(e) => handleChange(year, 'receivedOn', e.target.value)}
                  />
                </div>
                <div>
                  <div style={label}>Date of Upload</div>
                  <input
                    style={input}
                    type="date"
                    value={data.dateOfUpload ?? ''}
                    onChange={(e) => handleChange(year, 'dateOfUpload', e.target.value)}
                  />
                </div>
                <div>
                  <div style={label}>ITR Filed On</div>
                  <input
                    style={input}
                    type="date"
                    value={data.itrFiledOn ?? ''}
                    onChange={(e) => handleChange(year, 'itrFiledOn', e.target.value)}
                  />
                </div>
                <div>
                  <div style={label}>Fee</div>
                  <input
                    style={input}
                    type="number"
                    value={data.fee ?? ''}
                    onChange={(e) => handleChange(year, 'fee', Number(e.target.value))}
                  />
                </div>
                <div>
                  <div style={label}>Accountant</div>
                  <input
                    style={input}
                    list="audit-accountant-options"
                    type="text"
                    value={data.accountant ?? ''}
                    onChange={(e) => handleChange(year, 'accountant', e.target.value)}
                  />
                  <datalist id="audit-accountant-options">
                    {accountantOptions.map((a) => (
                      <option key={a} value={a} />
                    ))}
                  </datalist>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={footer}>
          <button
            onClick={onClose}
            style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #e5e7eb' }}
          >
            Cancel
          </button>
          <button
            disabled={!valid}
            onClick={() =>
              onSubmit({
                pan: pan.trim(),
                name: name.trim(),
                accounts
              })
            }
            style={saveBtnStyle(!!valid)}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

export default AuditsDialog
