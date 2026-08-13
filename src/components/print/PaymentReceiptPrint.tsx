'use client'

import { PrintLayout } from '@/components/shared/PrintLayout'
import { formatCurrency, formatDateTime, numberToWords } from '@/lib/print-utils'

interface PaymentReceiptPrintProps {
  payment: any
  bill: any
  admission: any
  hospital: any
}

export function PaymentReceiptPrint({ payment, bill, admission, hospital }: PaymentReceiptPrintProps) {
  return (
    <PrintLayout
      title={`Payment Receipt — ${payment.receiptNo || '—'}`}
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
          <p><strong>Receipt No:</strong> {payment.receiptNo || '—'}</p>
          <p><strong>Bill No:</strong> {bill?.billNo || '—'}</p>
          <p><strong>Admission No:</strong> {admission?.admissionNo || '—'}</p>
          <p><strong>Date:</strong> {formatDateTime(payment.paymentDate)}</p>
        </div>
      </div>

      {/* Payment Details */}
      <table style={{ marginBottom: '12px' }}>
        <tbody>
          <tr>
            <td><strong>Amount Paid</strong></td>
            <td style={{ textAlign: 'right' }}>{formatCurrency(payment.amount)}</td>
          </tr>
          <tr>
            <td><strong>Payment Method</strong></td>
            <td style={{ textAlign: 'right' }}>{payment.paymentMethod}{payment.paymentRef ? ` (${payment.paymentRef})` : ''}</td>
          </tr>
          {payment.receivedByName && (
            <tr>
              <td><strong>Received By</strong></td>
              <td style={{ textAlign: 'right' }}>{payment.receivedByName}</td>
            </tr>
          )}
          {payment.notes && (
            <tr>
              <td><strong>Notes</strong></td>
              <td style={{ textAlign: 'right' }}>{payment.notes}</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Bill Summary */}
      <div style={{ fontSize: '11px', marginBottom: '8px' }}>
        <p><strong>Total Bill:</strong> {formatCurrency(bill?.totalAmount || 0)}</p>
        <p><strong>Advance Adjusted:</strong> {formatCurrency(bill?.advanceAdjusted || 0)}</p>
        <p><strong>Net Payable:</strong> {formatCurrency(bill?.netPayable || 0)}</p>
      </div>

      {/* Amount in Words */}
      <div style={{ fontSize: '11px', marginBottom: '12px' }}>
        <strong>Amount in Words:</strong> {numberToWords(Math.round(payment.amount || 0))}
      </div>

      {/* Signatures */}
      <div className="signature-section">
        <div className="signature-line">Cashier</div>
        <div className="signature-line">Patient / Relative</div>
      </div>
    </PrintLayout>
  )
}