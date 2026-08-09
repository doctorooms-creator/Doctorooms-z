'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { X } from 'lucide-react'

// ─── Data Types ───────────────────────────────────────────

export interface PrintMedicine {
  id?: string
  medicine: string
  morning: boolean
  afternoon: boolean
  evening: boolean
  tab: number
  dose: string
  description: string
}

export interface PrintLabel {
  id?: string
  label: string
  value: string
  labelUnit: string
}

export interface PrintSuggestion {
  id?: string
  question: string
  suggestions: string
}

export interface PrintDoctor {
  name?: string
  specialization?: string
  education?: string
  registrationDetail?: string
  city?: string
  state?: string
  address?: string
  hospitalAddress?: string
  phoneNo?: string
  mobileNo?: string
  fees?: number | string
  experience?: string
}

export interface PrescriptionPrintData {
  patientName: string
  patientAge?: string
  gender?: string
  bloodGroup?: string
  weight?: string
  bp?: string
  temperature?: string
  disease?: string
  description?: string
  createdAt: string
  medicines: PrintMedicine[]
  labels: PrintLabel[]
  suggestions?: PrintSuggestion[]
  doctor: PrintDoctor
}

interface PrescriptionPrintViewProps {
  data: PrescriptionPrintData
  onClose: () => void
  onPrint: () => void
}

// ─── Component ────────────────────────────────────────────

export function PrescriptionPrintView({ data, onClose, onPrint }: PrescriptionPrintViewProps) {
  const { patientName, patientAge, gender, bloodGroup, weight, bp, temperature, disease, description, createdAt, medicines, labels, suggestions, doctor } = data

  useEffect(() => {
    const timer = setTimeout(() => {
      onPrint()
    }, 150)
    return () => clearTimeout(timer)
  }, [])

  const timeSlots: string[] = []
  if (medicines.some((m) => m.morning)) timeSlots.push('Morning')
  if (medicines.some((m) => m.afternoon)) timeSlots.push('Afternoon')
  if (medicines.some((m) => m.evening)) timeSlots.push('Evening')

  return (
    <>
      {/* Print-only styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * { visibility: hidden; }
          .prescription-print-area, .prescription-print-area * { visibility: visible; }
          .prescription-print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .print-close-btn { display: none !important; }
          @page { size: A4; margin: 10mm; }
        }
      ` }} />

      <AnimatePresence>
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 overflow-y-auto py-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
          {/* Close button - hidden in print */}
          <button
            onClick={onClose}
            className="print-close-btn fixed top-4 right-4 z-[60] rounded-full bg-white/90 p-2 shadow-lg hover:bg-white transition-colors"
            aria-label="Close print preview"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>

          {/* Prescription document */}
          <motion.div
            className="prescription-print-area bg-white rounded-lg shadow-2xl"
            style={{ width: '210mm', maxWidth: '95vw' }}
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div style={{ padding: '24px 32px', fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif', color: '#1a1a1a', fontSize: '13px', lineHeight: '1.5' }}>

              {/* ── Header ── */}
              <div style={{ borderBottom: '2px solid #0d9488', paddingBottom: '14px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h1 style={{ margin: '0 0 2px 0', fontSize: '20px', fontWeight: 700, color: '#0d9488', letterSpacing: '0.3px' }}>
                      Dr. {doctor.name || 'Unknown'}
                    </h1>
                    {doctor.specialization && (
                      <p style={{ margin: '0 0 3px 0', fontSize: '13px', color: '#374151', fontWeight: 500 }}>
                        {doctor.specialization}
                      </p>
                    )}
                    {doctor.education && (
                      <p style={{ margin: '0 0 3px 0', fontSize: '12px', color: '#6b7280' }}>
                        {doctor.education}
                      </p>
                    )}
                    {doctor.registrationDetail && (
                      <p style={{ margin: '0', fontSize: '11px', color: '#6b7280' }}>
                        Reg. No: {doctor.registrationDetail}
                      </p>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#374151', fontWeight: 600 }}>
                      PRESCRIPTION
                    </p>
                    <p style={{ margin: '0 0 2px 0', fontSize: '11px', color: '#6b7280' }}>
                      Date: {format(new Date(createdAt), 'dd MMM yyyy')}
                    </p>
                    {(doctor.phoneNo || doctor.mobileNo) && (
                      <p style={{ margin: '0', fontSize: '11px', color: '#6b7280' }}>
                        Ph: {doctor.phoneNo || doctor.mobileNo}
                      </p>
                    )}
                  </div>
                </div>
                {(doctor.hospitalAddress || doctor.address) && (
                  <p style={{ margin: '8px 0 0 0', fontSize: '11px', color: '#6b7280' }}>
                    📍 {doctor.hospitalAddress || doctor.address}{doctor.city ? `, ${doctor.city}` : ''}{doctor.state ? `, ${doctor.state}` : ''}
                  </p>
                )}
              </div>

              {/* ── Patient Info ── */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '6px 24px', padding: '10px 14px', backgroundColor: '#f9fafb', borderRadius: '6px', marginBottom: '16px', fontSize: '12px' }}>
                <div>
                  <span style={{ color: '#6b7280' }}>Patient: </span>
                  <span style={{ fontWeight: 600 }}>{patientName}</span>
                </div>
                {patientAge && (
                  <div>
                    <span style={{ color: '#6b7280' }}>Age: </span>
                    <span style={{ fontWeight: 500 }}>{patientAge}</span>
                  </div>
                )}
                {gender && (
                  <div>
                    <span style={{ color: '#6b7280' }}>Gender: </span>
                    <span style={{ fontWeight: 500 }}>{gender}</span>
                  </div>
                )}
                {weight && (
                  <div>
                    <span style={{ color: '#6b7280' }}>Weight: </span>
                    <span style={{ fontWeight: 500 }}>{weight} kg</span>
                  </div>
                )}
                {bloodGroup && (
                  <div>
                    <span style={{ color: '#6b7280' }}>Blood Group: </span>
                    <span style={{ fontWeight: 500 }}>{bloodGroup}</span>
                  </div>
                )}
              </div>

              {/* ── Chief Complaints / Disease ── */}
              {disease && (
                <div style={{ marginBottom: '14px' }}>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '12px', fontWeight: 700, color: '#0d9488', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Chief Complaints / Diagnosis
                  </h3>
                  <p style={{ margin: 0, fontSize: '13px', color: '#1a1a1a' }}>{disease}</p>
                </div>
              )}

              {/* ── Vitals ── */}
              {(bp || temperature || weight) && (
                <div style={{ display: 'flex', gap: '16px', marginBottom: '14px', flexWrap: 'wrap' }}>
                  {bp && (
                    <div style={{ padding: '6px 12px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '12px' }}>
                      <span style={{ color: '#6b7280' }}>BP: </span>
                      <span style={{ fontWeight: 600 }}>{bp} mmHg</span>
                    </div>
                  )}
                  {temperature && (
                    <div style={{ padding: '6px 12px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '12px' }}>
                      <span style={{ color: '#6b7280' }}>Temp: </span>
                      <span style={{ fontWeight: 600 }}>{temperature}°F</span>
                    </div>
                  )}
                </div>
              )}

              {/* ── Medicines Table ── */}
              {medicines.length > 0 && (
                <div style={{ marginBottom: '14px' }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: 700, color: '#0d9488', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Rx — Medicines
                  </h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #0d9488' }}>
                        <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: '11px' }}>#</th>
                        <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: '11px' }}>Medicine</th>
                        <th style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 600, color: '#374151', fontSize: '11px' }}>Dose</th>
                        {timeSlots.map((slot) => (
                          <th key={slot} style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 600, color: '#374151', fontSize: '11px' }}>
                            {slot === 'Morning' ? 'M' : slot === 'Afternoon' ? 'A' : 'E'}
                          </th>
                        ))}
                        <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: '11px' }}>Instructions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {medicines.map((med, i) => (
                        <tr key={med.id || i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                          <td style={{ padding: '5px 8px', color: '#6b7280' }}>{i + 1}</td>
                          <td style={{ padding: '5px 8px', fontWeight: 600 }}>{med.medicine}</td>
                          <td style={{ padding: '5px 8px', textAlign: 'center' }}>{med.tab}× {med.dose || '—'}</td>
                          {timeSlots.map((slot) => (
                            <td key={slot} style={{ padding: '5px 8px', textAlign: 'center' }}>
                              {slot === 'Morning' && med.morning ? '✓' : ''}
                              {slot === 'Afternoon' && med.afternoon ? '✓' : ''}
                              {slot === 'Evening' && med.evening ? '✓' : ''}
                            </td>
                          ))}
                          <td style={{ padding: '5px 8px', color: '#6b7280' }}>{med.description || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* ── Labels / Lab Results ── */}
              {labels.length > 0 && (
                <div style={{ marginBottom: '14px' }}>
                  <h3 style={{ margin: '0 0 6px 0', fontSize: '12px', fontWeight: 700, color: '#0d9488', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Lab Results / Labels
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {labels.map((l) => (
                      <span
                        key={l.id || l.label}
                        style={{
                          padding: '3px 10px',
                          backgroundColor: '#f0fdfa',
                          border: '1px solid #99f6e4',
                          borderRadius: '4px',
                          fontSize: '11px',
                          color: '#0d9488',
                          fontWeight: 500,
                        }}
                      >
                        {l.label}: {l.value} {l.labelUnit}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Suggestions / Advice ── */}
              {suggestions && suggestions.length > 0 && (
                <div style={{ marginBottom: '14px' }}>
                  <h3 style={{ margin: '0 0 6px 0', fontSize: '12px', fontWeight: 700, color: '#0d9488', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Advice / Suggestions
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {suggestions.map((s) => (
                      <div key={s.id || s.question} style={{ display: 'flex', gap: '8px', fontSize: '12px' }}>
                        <span style={{ color: '#0d9488', fontWeight: 600, whiteSpace: 'nowrap' }}>• {s.question}:</span>
                        <span style={{ color: '#374151' }}>{s.suggestions}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Doctor's Notes ── */}
              {description && (
                <div style={{ marginBottom: '14px' }}>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '12px', fontWeight: 700, color: '#0d9488', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Doctor's Notes
                  </h3>
                  <p style={{ margin: 0, fontSize: '12px', color: '#374151', whiteSpace: 'pre-wrap' }}>{description}</p>
                </div>
              )}

              {/* ── Footer / Signature ── */}
              <div style={{ marginTop: '24px', paddingTop: '14px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div style={{ fontSize: '10px', color: '#9ca3af' }}>
                  <p style={{ margin: 0 }}>This is a computer-generated prescription.</p>
                  <p style={{ margin: '2px 0 0 0' }}>Generated on {format(new Date(createdAt), 'dd MMM yyyy \'at\' hh:mm a')}</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: '140px', borderBottom: '1px solid #1a1a1a', marginBottom: '4px' }} />
                  <p style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: '#1a1a1a' }}>Dr. {doctor.name || ''}</p>
                  {doctor.specialization && (
                    <p style={{ margin: '2px 0 0 0', fontSize: '10px', color: '#6b7280' }}>{doctor.specialization}</p>
                  )}
                </div>
              </div>

            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </>
  )
}