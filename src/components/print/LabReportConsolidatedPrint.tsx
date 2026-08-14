'use client'

import React from 'react'
import { Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { triggerPrint, formatDateTime } from '@/lib/print-utils'

interface LabReportConsolidatedPrintProps {
  patientName: string
  patientAge: number
  patientGender: string
  admissionNo: string
  department: string
  attendingDoctor: string
  hospitalName: string
  hospitalAddress: string
  hospitalContact: string
  reports: {
    id: string
    testName: string
    testCode: string
    category: string
    specimenType: string
    collectedAt: string | null
    reportedAt: string | null
    status: string
    verifiedAt: string | null
    parameters: {
      id: string
      parameterName: string
      value: string
      unit: string
      normalRangeMale: string
      normalRangeFemale: string
      isAbnormal: boolean
    }[]
  }[]
  reportDate?: string
}

export function LabReportConsolidatedPrint({
  patientName,
  patientAge,
  patientGender,
  admissionNo,
  department,
  attendingDoctor,
  hospitalName,
  hospitalAddress,
  hospitalContact,
  reports,
  reportDate,
}: LabReportConsolidatedPrintProps) {
  const printDate = reportDate
    ? new Date(reportDate)
    : new Date()

  return (
    <div className="relative">
      {/* Print button — hidden on print */}
      <div className="no-print mb-4 flex justify-end">
        <Button onClick={triggerPrint} className="gap-2">
          <Printer className="h-4 w-4" />
          Print Consolidated Report
        </Button>
      </div>

      {/* ─── Printable A4 area ─── */}
      <div className="print-area" style={{ position: 'relative' }}>

        {/* ── Hospital Header ── */}
        <div style={{ textAlign: 'center', marginBottom: '0' }}>
          <h1 style={{
            fontSize: '18px',
            fontWeight: 800,
            color: '#0f766e',   // teal-700
            margin: '0 0 2px 0',
            letterSpacing: '0.02em',
          }}>
            {hospitalName}
          </h1>
          {hospitalAddress && (
            <p style={{ fontSize: '11px', color: '#444', margin: '0 0 1px 0' }}>
              {hospitalAddress}
            </p>
          )}
          {hospitalContact && (
            <p style={{ fontSize: '11px', color: '#444', margin: '0 0 1px 0' }}>
              Tel: {hospitalContact}
            </p>
          )}
        </div>

        {/* Teal separator */}
        <div style={{
          borderBottom: '2.5px solid #0d9488',
          margin: '8px 0 12px 0',
        }} />

        {/* ── Title ── */}
        <h2 style={{
          textAlign: 'center',
          fontSize: '14px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: '#115e59',
          margin: '0 0 12px 0',
        }}>
          Consolidated Laboratory Report
        </h2>

        {/* ── Patient Info Row ── */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px 24px',
          fontSize: '11px',
          padding: '6px 10px',
          backgroundColor: '#f0fdfa',
          border: '1px solid #99f6e4',
          borderRadius: '4px',
          marginBottom: '12px',
        }}>
          <span><strong>Patient Name:</strong> {patientName}</span>
          <span><strong>Age / Gender:</strong> {patientAge} / {patientGender}</span>
          <span><strong>Admission No:</strong> {admissionNo}</span>
          <span><strong>Department:</strong> {department}</span>
          <span><strong>Doctor:</strong> {attendingDoctor}</span>
        </div>

        {/* Horizontal rule */}
        <div style={{ borderBottom: '1px solid #cbd5e1', margin: '0 0 14px 0' }} />

        {/* ── Reports ── */}
        {reports.map((report, reportIdx) => {
          const isVerified = report.status === 'Verified'
          const isPending = report.status === 'Pending'

          return (
            <div
              key={report.id}
              style={{
                pageBreakInside: 'avoid',
                marginBottom: reportIdx < reports.length - 1 ? '16px' : '0',
              }}
            >
              {/* Report Heading */}
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '6px 16px',
                fontSize: '11px',
                marginBottom: '8px',
              }}>
                {/* Test Name */}
                <span style={{ fontWeight: 700, fontSize: '12px', color: '#115e59' }}>
                  {report.testName}
                </span>

                {/* Category badge */}
                <span style={{
                  display: 'inline-block',
                  padding: '1px 8px',
                  fontSize: '10px',
                  fontWeight: 600,
                  borderRadius: '9999px',
                  backgroundColor: '#ccfbf1',
                  color: '#0f766e',
                  border: '1px solid #99f6e4',
                }}>
                  {report.category}
                </span>

                {/* Specimen */}
                <span style={{ color: '#64748b' }}>
                  Specimen: {report.specimenType || '—'}
                </span>

                {/* Status badge */}
                <span style={{
                  display: 'inline-block',
                  padding: '1px 8px',
                  fontSize: '10px',
                  fontWeight: 600,
                  borderRadius: '9999px',
                  backgroundColor: isVerified ? '#d1fae5' : isPending ? '#fef3c7' : '#f1f5f9',
                  color: isVerified ? '#065f46' : isPending ? '#92400e' : '#475569',
                  border: `1px solid ${isVerified ? '#6ee7b7' : isPending ? '#fcd34d' : '#e2e8f0'}`,
                }}>
                  {report.status}
                </span>

                {/* Spacer */}
                <span style={{ flex: 1 }} />

                {/* Report Date */}
                {report.reportedAt && (
                  <span style={{ color: '#64748b', fontSize: '10px' }}>
                    Reported: {formatDateTime(report.reportedAt)}
                  </span>
                )}
                {report.collectedAt && !report.reportedAt && (
                  <span style={{ color: '#64748b', fontSize: '10px' }}>
                    Collected: {formatDateTime(report.collectedAt)}
                  </span>
                )}
                {report.verifiedAt && (
                  <span style={{ color: '#64748b', fontSize: '10px' }}>
                    Verified: {formatDateTime(report.verifiedAt)}
                  </span>
                )}
              </div>

              {/* Parameters Table */}
              {report.parameters.length > 0 && (
                <table style={{ marginBottom: '8px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f0fdfa' }}>
                      <th style={{ width: '4%', textAlign: 'center' }}>#</th>
                      <th style={{ width: '28%' }}>Parameter</th>
                      <th style={{ width: '15%', textAlign: 'center' }}>Result</th>
                      <th style={{ width: '10%', textAlign: 'center' }}>Unit</th>
                      <th style={{ width: '25%', textAlign: 'center' }}>Normal Range</th>
                      <th style={{ width: '8%', textAlign: 'center' }}>Flag</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.parameters.map((param, pIdx) => {
                      const normalRange =
                        patientGender === 'Female'
                          ? param.normalRangeFemale
                          : param.normalRangeMale

                      return (
                        <tr
                          key={param.id}
                          style={{
                            backgroundColor: param.isAbnormal ? '#fef2f2' : pIdx % 2 === 0 ? '#ffffff' : '#f8fafc',
                          }}
                        >
                          <td style={{ textAlign: 'center' }}>{pIdx + 1}</td>
                          <td>{param.parameterName}</td>
                          <td style={{
                            textAlign: 'center',
                            fontWeight: param.isAbnormal ? 700 : 400,
                            color: param.isAbnormal ? '#dc2626' : '#000',
                          }}>
                            {param.value || '—'}
                          </td>
                          <td style={{ textAlign: 'center' }}>{param.unit || '—'}</td>
                          <td style={{ textAlign: 'center' }}>{normalRange || '—'}</td>
                          <td style={{ textAlign: 'center' }}>
                            {param.isAbnormal && (
                              <span style={{ color: '#dc2626', fontSize: '12px' }} title="Abnormal value">
                                ▲
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}

              {/* No parameters state */}
              {report.parameters.length === 0 && (
                <p style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic', marginBottom: '8px' }}>
                  No parameters recorded for this test.
                </p>
              )}

              {/* Separator between reports (not after last) */}
              {reportIdx < reports.length - 1 && (
                <div style={{
                  borderBottom: '1px solid #e2e8f0',
                  margin: '10px 0 0 0',
                }} />
              )}
            </div>
          )
        })}

        {/* No reports state */}
        {reports.length === 0 && (
          <p style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>
            No lab reports available for this admission.
          </p>
        )}

        {/* ── Legend ── */}
        <div style={{ fontSize: '10px', color: '#64748b', margin: '12px 0 0 0' }}>
          <span style={{ color: '#dc2626' }}>▲</span> = Abnormal (outside reference range) &nbsp;&nbsp;
          <span style={{ display: 'inline-block', width: '12px', height: '12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', verticalAlign: 'middle', marginRight: '2px' }} />
          Highlighted rows indicate abnormal results
        </div>

        {/* ── Signatures ── */}
        <div className="signature-section" style={{ marginTop: '32px' }}>
          <div className="signature-line">Lab Technician</div>
          <div className="signature-line">Pathologist / Verified By</div>
        </div>

        {/* ── Footer Disclaimer ── */}
        <div style={{
          marginTop: '24px',
          paddingTop: '8px',
          borderTop: '1px solid #cbd5e1',
          textAlign: 'center',
          fontSize: '10px',
          color: '#94a3b8',
        }}>
          <p style={{ margin: '0 0 2px 0' }}>
            This is a computer-generated report. No signature is required for electronic reports.
          </p>
          <p style={{ margin: 0 }}>
            Printed on {formatDateTime(printDate)} | {reports.length} report{reports.length !== 1 ? 's' : ''} consolidated
          </p>
        </div>

      </div>
    </div>
  )
}
