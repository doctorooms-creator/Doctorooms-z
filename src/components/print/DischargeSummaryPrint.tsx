'use client'

import { PrintLayout } from '@/components/shared/PrintLayout'
import { formatDate, formatDateTime } from '@/lib/print-utils'

interface DischargeSummaryPrintProps {
  admission: any
  hospital: any
}

export function DischargeSummaryPrint({ admission, hospital }: DischargeSummaryPrintProps) {
  return (
    <PrintLayout
      title="Discharge Summary"
      hospitalName={hospital?.name || 'Doctorooms Hospital'}
      hospitalAddress={hospital?.address ? `${hospital.address}, ${hospital.city || ''} ${hospital.state || ''}` : ''}
      hospitalPhone={hospital?.phone || ''}
    >
      {/* Demographics */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '11px' }}>
        <div>
          <p><strong>Patient Name:</strong> {admission.patientName}</p>
          <p><strong>Age / Gender:</strong> {admission.patientAge} / {admission.patientGender}</p>
          <p><strong>Blood Group:</strong> {admission.bloodGroup || '—'}</p>
          <p><strong>Marital Status:</strong> {admission.maritalStatus || '—'}</p>
          <p><strong>Occupation:</strong> {admission.occupation || '—'}</p>
          <p><strong>Religion:</strong> {admission.religion || '—'}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p><strong>Admission No:</strong> {admission.admissionNo}</p>
          <p><strong>Ward / Bed:</strong> {admission.wardName || '—'} / {admission.bedName || '—'}</p>
          <p><strong>Department:</strong> {admission.departmentName || '—'}</p>
          <p><strong>Admission Date:</strong> {formatDateTime(admission.admissionDate)}</p>
          <p><strong>Discharge Date:</strong> {admission.dischargeDate ? formatDateTime(admission.dischargeDate) : '—'}</p>
          <p><strong>Discharge Type:</strong> {admission.dischargeType || '—'}</p>
        </div>
      </div>

      {/* Contact Details */}
      <div style={{ fontSize: '11px', marginBottom: '8px' }}>
        <p><strong>Father/Husband:</strong> {admission.fatherName || admission.husbandWifeName || '—'}</p>
        <p><strong>Address:</strong> {admission.address}{admission.village ? `, ${admission.village}` : ''}{admission.taluka ? `, ${admission.taluka}` : ''}{admission.district ? `, ${admission.district}` : ''}{admission.state ? `, ${admission.state}` : ''}{admission.pinCode ? ` - ${admission.pinCode}` : ''}</p>
        <p><strong>Mobile:</strong> {admission.mobileNo}</p>
        <p><strong>Contact Person:</strong> {admission.contactPersonName || '—'} {admission.contactPersonRelation ? `(${admission.contactPersonRelation})` : ''} {admission.contactPersonMobile ? `— ${admission.contactPersonMobile}` : ''}</p>
      </div>

      {/* Diagnosis Section */}
      <h3 style={{ fontSize: '12px', fontWeight: 600, marginBottom: '4px', borderTop: '1px solid #333', paddingTop: '6px' }}>Diagnosis</h3>
      <div style={{ fontSize: '11px', marginBottom: '8px' }}>
        <p><strong>Initial Diagnosis:</strong> {admission.initialDiagnosis || '—'}</p>
        <p><strong>Final Diagnosis:</strong> {admission.finalDiagnosis || '—'}</p>
        <p><strong>Chief Complaints:</strong> {admission.chiefComplaints || '—'}</p>
        {admission.mlcCase && (
          <p><strong>MLC Case:</strong> Yes</p>
        )}
      </div>

      {/* Treatment / History */}
      <h3 style={{ fontSize: '12px', fontWeight: 600, marginBottom: '4px', borderTop: '1px solid #333', paddingTop: '6px' }}>History & Treatment</h3>
      <div style={{ fontSize: '11px', marginBottom: '8px' }}>
        <p><strong>Informant:</strong> {admission.informant || '—'}</p>
        <p><strong>Past History:</strong> {admission.pastHistory || '—'}</p>
        <p><strong>Drug History:</strong> {admission.drugHistory || '—'}</p>
        <p><strong>Previous Hospitalization:</strong> {admission.previousHospitalization || '—'}</p>
      </div>

      {/* Examination */}
      <h3 style={{ fontSize: '12px', fontWeight: 600, marginBottom: '4px', borderTop: '1px solid #333', paddingTop: '6px' }}>Physical Examination</h3>
      <div style={{ fontSize: '11px', marginBottom: '8px' }}>
        <p><strong>Consciousness:</strong> {admission.consciousnessLevel || '—'} | <strong>Obeys Commands:</strong> {admission.obeyingCommands ? 'Yes' : 'No'} | <strong>Speech:</strong> {admission.speech || '—'}</p>
        <p><strong>Examination Notes:</strong> {admission.examinationNotes || '—'}</p>
      </div>

      {/* Discharge Summary Text */}
      {admission.dischargeSummary && (
        <>
          <h3 style={{ fontSize: '12px', fontWeight: 600, marginBottom: '4px', borderTop: '1px solid #333', paddingTop: '6px' }}>Discharge Summary</h3>
          <div style={{ fontSize: '11px', marginBottom: '8px', whiteSpace: 'pre-wrap' }}>
            {admission.dischargeSummary}
          </div>
        </>
      )}

      {/* Follow-up */}
      <h3 style={{ fontSize: '12px', fontWeight: 600, marginBottom: '4px', borderTop: '1px solid #333', paddingTop: '6px' }}>Follow-up</h3>
      <div style={{ fontSize: '11px', marginBottom: '12px' }}>
        <p><strong>Follow-up Date:</strong> {admission.followUpDate ? formatDate(admission.followUpDate) : '—'}</p>
        <p><strong>Follow-up Notes:</strong> {admission.followUpNotes || '—'}</p>
      </div>

      {/* Attending Doctor */}
      <div style={{ fontSize: '11px', marginBottom: '8px' }}>
        <p><strong>Attending Doctor:</strong> {admission.attendingDoctorName || '—'}</p>
        {admission.referringDoctorName && (
          <p><strong>Referring Doctor:</strong> {admission.referringDoctorName}</p>
        )}
      </div>

      {/* Signatures */}
      <div className="signature-section">
        <div className="signature-line">Attending Doctor</div>
        <div className="signature-line">Medical Superintendent</div>
      </div>
    </PrintLayout>
  )
}