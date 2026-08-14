import { z } from 'zod/v4'
import { cuidSchema } from './common'

export const createAdmissionSchema = z.object({
  wardId: cuidSchema,
  bedId: cuidSchema,
  departmentId: cuidSchema,
  attendingDoctorId: cuidSchema,
  patientName: z.string().min(1, 'Patient name required').max(200),
  patientAge: z.coerce.number().min(0).max(200),
  patientGender: z.enum(['Male', 'Female', 'Other']),
  bloodGroup: z.string().max(20).optional(),
  maritalStatus: z.string().max(50).optional(),
  mobileNo: z.string().max(20).optional(),
  aadharNo: z.string().max(20).optional(),
  fatherName: z.string().max(200).optional(),
  motherName: z.string().max(200).optional(),
  husbandWifeName: z.string().max(200).optional(),
  contactPersonName: z.string().max(200).optional(),
  contactPersonMobile: z.string().max(20).optional(),
  contactPersonRelation: z.string().max(100).optional(),
  address: z.string().max(500).optional(),
  village: z.string().max(200).optional(),
  taluka: z.string().max(200).optional(),
  district: z.string().max(200).optional(),
  state: z.string().max(200).optional(),
  pinCode: z.string().max(10).optional(),
  mlcCase: z.boolean().optional(),
  previousHospitalization: z.string().max(1000).optional(),
  mediClaimDetails: z.string().max(1000).optional(),
  initialDiagnosis: z.string().max(2000).optional(),
})

export const DISCHARGE_TYPES = ['Normal', 'DAMA', 'LAMA', 'Referred', 'Expired'] as const

export const dischargeAdvisedSchema = z.object({
  dischargeType: z.enum(DISCHARGE_TYPES),
  dischargeDate: z.string().min(1, 'Discharge date required'),
  notes: z.string().max(2000).optional(),
})

/** Alias — the discharge route imports this name */
export const dischargeSchema = dischargeAdvisedSchema

export const completeDischargeSchema = z.object({
  finalDiagnosis: z.string().max(2000).optional(),
  dischargeSummary: z.string().max(5000).optional(),
})

export type CreateAdmissionInput = z.infer<typeof createAdmissionSchema>
export type DischargeAdvisedInput = z.infer<typeof dischargeAdvisedSchema>
export type CompleteDischargeInput = z.infer<typeof completeDischargeSchema>
