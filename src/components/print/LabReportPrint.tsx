'use client'

import { PrintLayout } from '@/components/shared/PrintLayout'
import { formatDate, formatDateTime } from '@/lib/print-utils'

interface LabReportPrintProps {
  report: any
  hospital: any
}

export function LabReportPrint({ report, hospital }: LabReportPrintProps) {
  const testName = report.testMasterName || report.testName || '—'
  const urgency = report.urgency || 'Normal'
  const status = report.status || '—'

  return (
    <PrintLayout
      title={`Lab Report — ${report.reportNo || '—'}`}
      hospitalName={hospital?.name || 'Doctorooms Hospital'}
      hospitalAddress={hospital?.address ? `${hospital.address}, ${hospital.city || ''} ${hospital.state || ''}` : ''}
      hospitalPhone={hospital?.phone || ''}
    >
      {/* Patient & Test Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '11px' }}>
        <div>
          <p><strong>Patient:</strong> {report.patientName || '—'}</p>
          <p><strong>Age / Gender:</strong> {report.patientAge || '—'} / {report.patientGender || '—'}</p>
          {report.admissionNo && (
            <p><strong>IPD No:</strong> {report.admissionNo}</p>
          )}
          {report.bookingId && (
            <p><strong>Booking ID:</strong> {report.bookingId}</p>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          <p><strong>Report No:</strong> {report.reportNo || '—'}</p>
          <p><strong>Test:</strong> {testName}</p>
          <p><strong>Urgency:</strong> {urgency}</p>
          <p><strong>Status:</strong> {status}</p>
          <p><strong>Ordered By:</strong> {report.orderedByName || report.doctorName || '—'}</p>
        </div>
      </div>

      {/* Timestamps */}
      <div style={{ fontSize: '11px', marginBottom: '10px' }}>
        {report.sampleCollectedAt && (
          <p><strong>Sample Collected:</strong> {formatDateTime(report.sampleCollectedAt)} {report.sampleCollectedByName ? `by ${report.sampleCollectedByName}` : ''}</p>
        )}
        {report.resultEnteredAt && (
          <p><strong>Result Entered:</strong> {formatDateTime(report.resultEnteredAt)} {report.resultEnteredByName ? `by ${report.resultEnteredByName}` : ''}</p>
        )}
        {report.verifiedAt && (
          <p><strong>Verified:</strong> {formatDateTime(report.verifiedAt)} {report.verifiedByName ? `by ${report.verifiedByName}` : ''}</p>
        )}
      </div>

      {/* Parameters Table */}
      {report.parameterValues && report.parameterValues.length > 0 && (
        <table style={{ marginBottom: '12px' }}>
          <thead>
            <tr>
              <th style={{ width: '5%' }}>#</th>
              <th style={{ width: '30%' }}>Parameter</th>
              <th style={{ width: '20%' }}>Result</th>
              <th style={{ width: '10%' }}>Unit</th>
              <th style={{ width: '25%' }}>Reference Range</th>
              <th style={{ width: '10%' }}>Flag</th>
            </tr>
          </thead>
          <tbody>
            {report.parameterValues.map((pv: any, idx: number) => {
              const normalRange = pv.isAbnormal
                ? (report.patientGender === 'Female'
                    ? `${pv.normalFemaleMin} - ${pv.normalFemaleMax}`
                    : `${pv.normalMaleMin} - ${pv.normalMaleMax}`)
                : `${pv.normalMaleMin} - ${pv.normalMaleMax}`

              return (
                <tr key={pv.id || idx} style={pv.isAbnormal ? { backgroundColor: '#fee2e2' } : undefined}>
                  <td>{idx + 1}</td>
                  <td>{pv.paramName || pv.name || '—'}</td>
                  <td style={{ fontWeight: pv.isAbnormal ? 700 : 400 }}>{pv.value || '—'}</td>
                  <td>{pv.unit || '—'}</td>
                  <td>{normalRange}</td>
                  <td style={{ textAlign: 'center' }}>
                    {pv.isAbnormal ? 'H' : ''}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {/* Notes */}
      {report.notes && (
        <div style={{ fontSize: '11px', marginBottom: '12px' }}>
          <strong>Notes:</strong> {report.notes}
        </div>
      )}

      {/* Legend */}
      <div style={{ fontSize: '10px', color: '#555', marginBottom: '8px' }}>
        <span style={{ backgroundColor: '#fee2e2', padding: '0 4px' }}>H</span> = Abnormal (outside reference range)
      </div>

      {/* Signatures */}
      <div className="signature-section">
        <div className="signature-line">Lab Technician</div>
        <div className="signature-line">Pathologist / Verified By</div>
      </div>
    </PrintLayout>
  )
}