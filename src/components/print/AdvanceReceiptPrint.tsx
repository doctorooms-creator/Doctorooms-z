'use client'

import { PrintLayout } from '@/components/shared/PrintLayout'
import { formatCurrency, formatDateTime, numberToWords } from '@/lib/print-utils'

interface AdvanceReceiptPrintProps {
  advance: any
  admission: any
  hospital: any
}

export function AdvanceReceiptPrint({ advance, admission, hospital }: AdvanceReceiptPrintProps) {
  return (
    <PrintLayout
      title={`Advance Deposit Receipt — ${advance.receiptNo || '—'}`}
      hospitalName={hospital?.name || 'Doctorooms Hospital'}
      hospitalAddress={hospital?.address ? `${hospital.address}, ${hospital.city || ''} ${hospital.state || ''}` : ''}
      hospitalPhone={hospital?.phone || ''}
    >
      {/* Patient & Admission Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '11px' }}>
        <div>
          <p><strong>Patient:</strong> {admission?.patientName || '—'}</p>
          <p><strong>Age/Gender:</strong> {admission?.patientAge || '—'} / {admission?.patientGender || '—'}</p>
          <p><strong>Mobile:</strong> {admission?.mobileNo || '—'}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p><strong>Receipt No:</strong> {advance.receiptNo || '—'}</p>
          <p><strong>Admission No:</strong> {admission?.admissionNo || '—'}</p>
          <p><strong>Ward / Bed:</strong> {admission?.wardName || '—'} / {admission?.bedName || '—'}</p>
          <p><strong>Date:</strong> {formatDateTime(advance.createdAt)}</p>
        </div>
      </div>

      {/* Payment Details */}
      <table style={{ marginBottom: '12px' }}>
        <tbody>
          <tr>
            <td><strong>Amount Received</strong></td>
            <td style={{ textAlign: 'right' }}>{formatCurrency(advance.amount)}</td>
          </tr>
          <tr>
            <td><strong>Payment Method</strong></td>
            <td style={{ textAlign: 'right' }}>{advance.paymentMethod}{advance.paymentRef ? ` (${advance.paymentRef})` : ''}</td>
          </tr>
          {advance.receivedByName && (
            <tr>
              <td><strong>Received By</strong></td>
              <td style={{ textAlign: 'right' }}>{advance.receivedByName}</td>
            </tr>
          )}
          {advance.notes && (
            <tr>
              <td><strong>Notes</strong></td>
              <td style={{ textAlign: 'right' }}>{advance.notes}</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Amount in Words */}
      <div style={{ fontSize: '11px', marginBottom: '12px' }}>
        <strong>Amount in Words:</strong> {numberToWords(Math.round(advance.amount || 0))}
      </div>

      <div style={{ fontSize: '10px', color: '#555', fontStyle: 'italic', marginBottom: '12px' }}>
        This is an advance deposit against IPD admission. Amount will be adjusted in the final bill.
      </div>

      {/* Signatures */}
      <div className="signature-section">
        <div className="signature-line">Cashier</div>
        <div className="signature-line">Patient / Relative</div>
      </div>
    </PrintLayout>
  )
}
