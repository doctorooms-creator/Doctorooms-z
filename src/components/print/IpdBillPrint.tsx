'use client'

import { PrintLayout } from '@/components/shared/PrintLayout'
import { formatCurrency, formatDate, formatDateTime, numberToWords } from '@/lib/print-utils'

interface IpdBillPrintProps {
  bill: any
  admission: any
  hospital: any
}

export function IpdBillPrint({ bill, admission, hospital }: IpdBillPrintProps) {
  return (
    <PrintLayout
      title={`IPD Bill — ${bill.billNo || 'Draft'}`}
      hospitalName={hospital?.name || 'Doctorooms Hospital'}
      hospitalAddress={hospital?.address ? `${hospital.address}, ${hospital.city || ''} ${hospital.state || ''}` : ''}
      hospitalPhone={hospital?.phone || ''}
    >
      {/* Patient & Admission Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '11px' }}>
        <div>
          <p><strong>Patient:</strong> {admission?.patientName || '—'}</p>
          <p><strong>Age/Gender:</strong> {admission?.patientAge || '—'} / {admission?.patientGender || '—'}</p>
          <p><strong>Blood Group:</strong> {admission?.bloodGroup || '—'}</p>
          <p><strong>Mobile:</strong> {admission?.mobileNo || '—'}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p><strong>Admission No:</strong> {admission?.admissionNo || '—'}</p>
          <p><strong>Ward / Bed:</strong> {admission?.wardName || '—'} / {admission?.bedName || '—'}</p>
          <p><strong>Admission Date:</strong> {admission?.admissionDate ? formatDate(admission.admissionDate) : '—'}</p>
          <p><strong>Discharge Date:</strong> {admission?.dischargeDate ? formatDate(admission.dischargeDate) : '—'}</p>
          <p><strong>Attending Doctor:</strong> {admission?.attendingDoctorName || '—'}</p>
        </div>
      </div>

      {/* Bill Status */}
      <div style={{ marginBottom: '8px', fontSize: '11px' }}>
        <strong>Bill Status:</strong>{' '}
        <span style={{
          padding: '1px 8px',
          border: '1px solid #333',
          fontWeight: 600,
          fontSize: '10px',
        }}>
          {bill?.status || 'Draft'}
        </span>
        {bill?.finalizedAt && (
          <span> (Finalized: {formatDateTime(bill.finalizedAt)})</span>
        )}
      </div>

      {/* Line Items Table */}
      {bill?.lineItems && bill.lineItems.length > 0 && (
        <table style={{ marginBottom: '12px' }}>
          <thead>
            <tr>
              <th style={{ width: '5%' }}>#</th>
              <th style={{ width: '35%' }}>Item</th>
              <th style={{ width: '15%' }}>Unit Type</th>
              <th style={{ width: '10%', textAlign: 'right' }}>Qty</th>
              <th style={{ width: '15%', textAlign: 'right' }}>Rate</th>
              <th style={{ width: '10%', textAlign: 'right' }}>Tax %</th>
              <th style={{ width: '10%', textAlign: 'right' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {bill.lineItems.map((item: any, idx: number) => (
              <tr key={item.id || idx}>
                <td>{idx + 1}</td>
                <td>{item.itemName}{item.description ? ` — ${item.description}` : ''}</td>
                <td>{item.unitType}</td>
                <td style={{ textAlign: 'right' }}>{item.quantity}</td>
                <td style={{ textAlign: 'right' }}>{formatCurrency(item.rate)}</td>
                <td style={{ textAlign: 'right' }}>{item.taxPercent}%</td>
                <td style={{ textAlign: 'right' }}>{formatCurrency(item.totalAmount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Summary */}
      <div style={{ width: '260px', marginLeft: 'auto', marginBottom: '12px', fontSize: '11px' }}>
        <div className="summary-row">
          <span>Room Rent</span>
          <span>{formatCurrency(bill?.roomRentAmount || 0)}</span>
        </div>
        <div className="summary-row">
          <span>Services</span>
          <span>{formatCurrency(bill?.serviceAmount || 0)}</span>
        </div>
        <div className="summary-row">
          <span>Laboratory</span>
          <span>{formatCurrency(bill?.labAmount || 0)}</span>
        </div>
        <div className="summary-row">
          <span>Medicines</span>
          <span>{formatCurrency(bill?.medicineAmount || 0)}</span>
        </div>
        <div className="summary-row">
          <span>OT Charges</span>
          <span>{formatCurrency(bill?.otAmount || 0)}</span>
        </div>
        <div className="summary-row">
          <span>Other Charges</span>
          <span>{formatCurrency(bill?.otherAmount || 0)}</span>
        </div>
        <div className="summary-row">
          <span>Subtotal</span>
          <span>{formatCurrency(bill?.subtotal || 0)}</span>
        </div>
        <div className="summary-row">
          <span>Tax</span>
          <span>{formatCurrency(bill?.taxAmount || 0)}</span>
        </div>
        {bill?.discountAmount > 0 && (
          <div className="summary-row">
            <span>Discount</span>
            <span>-{formatCurrency(bill.discountAmount)}</span>
          </div>
        )}
        <div className="summary-row">
          <strong>Total Amount</strong>
          <strong>{formatCurrency(bill?.totalAmount || 0)}</strong>
        </div>
        <div className="summary-row">
          <span>Advance Adjusted</span>
          <span>-{formatCurrency(bill?.advanceAdjusted || 0)}</span>
        </div>
        <div className="summary-row total-row">
          <strong>Net Payable</strong>
          <strong>{formatCurrency(bill?.netPayable || 0)}</strong>
        </div>
      </div>

      {/* Amount in Words */}
      <div style={{ fontSize: '11px', marginBottom: '12px' }}>
        <strong>Amount in Words:</strong> {numberToWords(Math.round(bill?.netPayable || 0))}
      </div>

      {/* Payment History */}
      {bill?.payments && bill.payments.length > 0 && (
        <>
          <h3 style={{ fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Payment History</h3>
          <table style={{ marginBottom: '12px' }}>
            <thead>
              <tr>
                <th>Receipt No</th>
                <th>Date</th>
                <th>Method</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                <th>Received By</th>
              </tr>
            </thead>
            <tbody>
              {bill.payments.map((p: any, idx: number) => (
                <tr key={p.id || idx}>
                  <td>{p.receiptNo || '—'}</td>
                  <td>{formatDateTime(p.paymentDate)}</td>
                  <td>{p.paymentMethod}{p.paymentRef ? ` (${p.paymentRef})` : ''}</td>
                  <td style={{ textAlign: 'right' }}>{formatCurrency(p.amount)}</td>
                  <td>{p.receivedByName || p.receivedBy || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* Signatures */}
      <div className="signature-section">
        <div className="signature-line">Prepared By</div>
        <div className="signature-line">Accounts Dept.</div>
        <div className="signature-line">Hospital Authority</div>
      </div>
    </PrintLayout>
  )
}
