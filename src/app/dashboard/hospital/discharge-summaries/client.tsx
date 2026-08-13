'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FileText, Eye, Search, CalendarDays } from 'lucide-react'
import { formatDate } from '@/lib/print-utils'

export default function DischargeSummariesClient() {
  const [search, setSearch] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [viewAdmission, setViewAdmission] = useState<any>(null)

  const { data, isLoading } = useQuery<{ data: any[] }>({
    queryKey: ['discharge-summaries', search, fromDate, toDate],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (fromDate) params.set('fromDate', fromDate)
      if (toDate) params.set('toDate', toDate)
      const res = await fetch(`/api/discharge-summaries?${params.toString()}`)
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
  })

  const records = data?.data || []

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Discharge Summaries</h1>
          <p className="text-muted-foreground text-sm mt-1">View and print discharge summaries</p>
        </div>
        <Badge variant="outline">{records.length} records</Badge>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search patient..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <Input type="date" className="w-40" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              <span className="text-muted-foreground">to</span>
              <Input type="date" className="w-40" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Discharged Patients</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : records.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p>No discharge records found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Admission No</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Age/Gender</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Discharge Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Diagnosis</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs">{r.admissionNo}</TableCell>
                      <TableCell className="font-medium">{r.patientName}</TableCell>
                      <TableCell>{r.patientAge}/{r.patientGender?.charAt(0)}</TableCell>
                      <TableCell>{r.doctorName}</TableCell>
                      <TableCell>{r.dischargeDate ? formatDate(r.dischargeDate) : '—'}</TableCell>
                      <TableCell><Badge variant="outline">{r.dischargeType || '—'}</Badge></TableCell>
                      <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">{r.finalDiagnosis || '—'}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" className="h-8 gap-1" onClick={() => setViewAdmission(r)}>
                          <Eye className="h-3 w-3" /> View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!viewAdmission} onOpenChange={() => setViewAdmission(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Discharge Summary — {viewAdmission?.admissionNo}</DialogTitle>
          </DialogHeader>
          {viewAdmission && (
            <div className="print-area">
              <div className="header">
                <h1>HOSPITAL NAME</h1>
                <p>Discharge Summary</p>
              </div>
              <div style={{ marginTop: 16 }}>
                <p><strong>Patient:</strong> {viewAdmission.patientName}</p>
                <p><strong>Admission No:</strong> {viewAdmission.admissionNo}</p>
                <p><strong>Age/Gender:</strong> {viewAdmission.patientAge}Y / {viewAdmission.patientGender}</p>
                <p><strong>Doctor:</strong> {viewAdmission.doctorName}</p>
                <p><strong>Discharge Date:</strong> {viewAdmission.dischargeDate ? formatDate(viewAdmission.dischargeDate) : '—'}</p>
                <p><strong>Type:</strong> {viewAdmission.dischargeType}</p>
                <p><strong>Final Diagnosis:</strong> {viewAdmission.finalDiagnosis || '—'}</p>
              </div>
              <div className="footer">
                <p>Generated on {new Date().toLocaleDateString('en-IN')}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
