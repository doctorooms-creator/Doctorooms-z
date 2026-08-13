'use client'

import { PrintLayout } from '@/components/shared/PrintLayout'
import { formatCurrency, formatDate, formatDateTime, numberToWords } from '@/lib/print-utils'

interface OpdBillPrintProps {
  bill: any
  booking: any
  doctor: any
  hospital: any
}

export function OpdBillPrint({ bill, booking, doctor, hospital }: OpdBillPrintProps) {
  return (
    <PrintLayout
      title={`OPD Receipt — ${bill.receiptNo || '—'}`}
      hospitalName={hospital?.name || 'Doctorooms Hospital'}
      hospitalAddress={hospital?.address ? `${hospital.address}, ${hospital.city || ''} ${hospital.state || ''}` : ''}
      hospitalPhone={hospital?.phone || ''}
    >
      {/* Patient & Appointment Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '11px' }}>
        <div>
          <p><strong>Patient:</strong> {booking?.patientName || bill?.patientName || '—'}</p>
          <p><strong>Mobile:</strong> {booking?.patientMobile || '—'}</p>
          <p><strong>Gender:</strong> {booking?.patientGender || '—'}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p><strong>Receipt No:</strong> {bill.receiptNo || '—'}</p>
          <p><strong>Date:</strong> {formatDateTime(bill.paymentDate)}</p>
          <p><strong>Doctor:</strong> {doctor?.name || booking?.doctorName || '—'}</p>
          {booking?.departmentName && (
            <p><strong>Department:</strong> {booking.departmentName}</p>
          )}
          {booking?.date && (
            <p><strong>Appt Date:</strong> {formatDate(booking.date)}</p>
          )}
        </div>
      </div>

      {/* Bill Details */}
      <table style={{ marginBottom: '12px' }}>
        <thead>
          <tr>
            <th>Description</th>
            <th style={{ textAlign: 'right' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Consultation Fee</td>
            <td style={{ textAlign: 'right' }}>{formatCurrency(bill.consultationFee)}</td>
          </tr>
          {bill.labAmount > 0 && (
            <tr>
              <td>Laboratory Charges</td>
              <td style={{ textAlign: 'right' }}>{formatCurrency(bill.labAmount)}</td>
            </tr>
          )}
          {bill.medicineAmount > 0 && (
            <tr>
              <td>Medicine Charges</td>
              <td style={{ textAlign: 'right' }}>{formatCurrency(bill.medicineAmount)}</td>
            </tr>
          )}
          {bill.otherAmount > 0 && (
            <tr>
              <td>Other Charges</td>
              <td style={{ textAlign: 'right' }}>{formatCurrency(bill.otherAmount)}</td>
            </tr>
          )}
          <tr>
            <td>Subtotal</td>
            <td style={{ textAlign: 'right' }}>{formatCurrency(bill.subtotal)}</td>
          </tr>
          {bill.taxAmount > 0 && (
            <tr>
              <td>Tax</td>
              <td style={{ textAlign: 'right' }}>{formatCurrency(bill.taxAmount)}</td>
            </tr>
          )}
          {bill.discountAmount > 0 && (
            <tr>
              <td>Discount</td>
              <td style={{ textAlign: 'right' }}>-{formatCurrency(bill.discountAmount)}</td>
            </tr>
          )}
          <tr style={{ fontWeight: 700, borderTop: '2px solid #333' }}>
            <td><strong>Total</strong></td>
            <td style={{ textAlign: 'right' }}><strong>{formatCurrency(bill.totalAmount)}</strong></td>
          </tr>
        </tbody>
      </table>

      {/* Amount in Words */}
      <div style={{ fontSize: '11px', marginBottom: '12px' }}>
        <strong>Amount in Words:</strong> {numberToWords(Math.round(bill.totalAmount || 0))}
      </div>

      {/* Payment Info */}
      <div style={{ fontSize: '11px', marginBottom: '12px' }}>
        <p><strong>Payment Method:</strong> {bill.paymentMethod}{bill.paymentRef ? ` (${bill.paymentRef})` : ''}</p>
        <p><strong>Status:</strong> {bill.status}</p>
        {bill.receivedByName && <p><strong>Received By:</strong> {bill.receivedByName}</p>}
      </div>

      {/* Signatures */}
      <div className="signature-section">
        <div className="signature-line">Cashier</div>
        <div className="signature-line">Patient</div>
      </div>
    </PrintLayout>
  )
}
