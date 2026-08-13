import {
  type LucideIcon,
  LayoutDashboard, Users, Stethoscope, Building2, CalendarDays, FileText, MessageSquare, Settings, Pill, Clock, UserCircle, Images, PenSquare, Heart, Bell, UserPlus, KeyRound, IndianRupee, FlaskConical, PenLine, BarChart3, Printer, Shield, FolderOpen, Thermometer, CircleHelp, Lightbulb, Tag, Search, Table, ClipboardList, ListOrdered, Monitor, BedDouble, ArrowRightLeft, Activity, Tags, Wallet, CreditCard, Cross, Package, ShoppingCart, AlertTriangle, TrendingUp, Receipt, LogOut,
} from 'lucide-react'

export interface SidebarItem {
  label: string
  href: string
  icon: LucideIcon
  badge?: string | number
  children?: SidebarItem[]
}

type RoleSidebarMap = Record<string, SidebarItem[]>

export const sidebarConfig: RoleSidebarMap = {
  admin: [
    { label: 'Dashboard', href: '/dashboard/admin', icon: LayoutDashboard },
    { label: 'Users', href: '/dashboard/admin/users', icon: Users },
    { label: 'Doctors', href: '/dashboard/admin/doctors', icon: Stethoscope },
    { label: 'Hospitals', href: '/dashboard/admin/hospitals', icon: Building2 },
    { label: 'Appointments', href: '/dashboard/admin/appointments', icon: CalendarDays },
    { label: 'IPD Wards', href: '/dashboard/admin/wards', icon: BedDouble },
    { label: 'Staff Nurses', href: '/dashboard/admin/nurses', icon: Activity },
    {
      label: 'Billing',
      href: '/dashboard/admin/billing',
      icon: IndianRupee,
      children: [
        { label: 'All IPD Bills', href: '/dashboard/admin/billing/ipd', icon: FileText },
        { label: 'All OPD Bills', href: '/dashboard/admin/billing/opd', icon: Receipt },
      ],
    },
    { label: 'Blog', href: '/dashboard/admin/blog', icon: FileText },
    { label: 'Inquiries', href: '/dashboard/admin/inquiries', icon: MessageSquare },
    { label: 'Settings', href: '/dashboard/admin/settings', icon: Settings },
    { label: 'Change Password', href: '/dashboard/change-password', icon: KeyRound },
  ],
  doctor: [
    { label: 'Dashboard', href: '/dashboard/doctor', icon: LayoutDashboard },
    { label: 'Appointments', href: '/dashboard/doctor/appointments', icon: CalendarDays },
    { label: 'Prescriptions', href: '/dashboard/doctor/prescriptions', icon: FileText },
    { label: 'Earnings', href: '/dashboard/doctor/earnings', icon: IndianRupee },
    { label: 'Schedule', href: '/dashboard/doctor/schedule', icon: Clock },
    { label: 'Patients', href: '/dashboard/doctor/patients', icon: Users },
    { label: 'Medicine Master', href: '/dashboard/doctor/medicines', icon: FlaskConical },
    { label: 'Lab Results', href: '/dashboard/doctor/lab-results', icon: FlaskConical },
    { label: 'OT Surgeries', href: '/dashboard/doctor/ot-surgeries', icon: Cross },
    {
      label: 'Rx Settings',
      href: '/dashboard/doctor/prescription-settings',
      icon: Settings,
      children: [
        { label: 'Categories', href: '/dashboard/doctor/prescription-settings/categories', icon: FolderOpen },
        { label: 'Complaints', href: '/dashboard/doctor/prescription-settings/complaints', icon: Thermometer },
        { label: 'Questions', href: '/dashboard/doctor/prescription-settings/questions', icon: CircleHelp },
        { label: 'Suggestions', href: '/dashboard/doctor/prescription-settings/suggestions', icon: Lightbulb },
        { label: 'Labels', href: '/dashboard/doctor/prescription-settings/labels', icon: Tag },
        { label: 'Findings', href: '/dashboard/doctor/prescription-settings/findings', icon: Search },
        { label: 'Table Templates', href: '/dashboard/doctor/prescription-settings/table-templates', icon: Table },
        { label: 'Print Settings', href: '/dashboard/doctor/prescription-settings/print-settings', icon: Printer },
      ],
    },
    { label: 'Profile', href: '/dashboard/doctor/profile', icon: UserCircle },
    { label: 'Gallery', href: '/dashboard/doctor/gallery', icon: Images },
    { label: 'Posts', href: '/dashboard/doctor/posts', icon: PenSquare },
    { label: 'IPD Patients', href: '/dashboard/doctor/ipd', icon: BedDouble },
    { label: 'Change Password', href: '/dashboard/change-password', icon: KeyRound },
  ],
  patient: [
    { label: 'Dashboard', href: '/dashboard/patient', icon: LayoutDashboard },
    { label: 'Appointments', href: '/dashboard/patient/appointments', icon: CalendarDays },
    { label: 'Health Records', href: '/dashboard/patient/health-records', icon: Heart },
    { label: 'Rx Access', href: '/dashboard/patient/prescription-access', icon: Shield },
    { label: 'My Blog', href: '/dashboard/patient/blog', icon: PenLine },
    { label: 'Feedback', href: '/dashboard/patient/feedback', icon: MessageSquare },
    { label: 'Notifications', href: '/dashboard/patient/notifications', icon: Bell },
    { label: 'Profile', href: '/dashboard/patient/profile', icon: UserCircle },
    { label: 'Settings', href: '/dashboard/patient/settings', icon: Settings },
    { label: 'Change Password', href: '/dashboard/change-password', icon: KeyRound },
  ],
  hospital: [
    { label: 'Dashboard', href: '/dashboard/hospital', icon: LayoutDashboard },
    { label: 'Departments', href: '/dashboard/hospital/departments', icon: Building2 },
    { label: 'Manage Doctors', href: '/dashboard/hospital/department-doctors', icon: UserPlus },
    { label: 'Doctors', href: '/dashboard/hospital/doctors', icon: Stethoscope },
    { label: 'Appointments', href: '/dashboard/hospital/appointments', icon: CalendarDays },
    { label: 'Queue Display', href: '/dashboard/hospital/queue-display', icon: Monitor },
    { label: 'IPD Admissions', href: '/dashboard/receptionist/ipd', icon: BedDouble },
    { label: 'Charge Master', href: '/dashboard/hospital/charge-master', icon: Tags },
    {
      label: 'Billing',
      href: '/dashboard/hospital/billing',
      icon: IndianRupee,
      children: [
        { label: 'IPD Bills', href: '/dashboard/hospital/billing/ipd', icon: FileText },
        { label: 'OPD Bills', href: '/dashboard/hospital/billing/opd', icon: Receipt },
        { label: 'Payments', href: '/dashboard/hospital/billing/payments', icon: CreditCard },
        { label: 'Advance Deposits', href: '/dashboard/hospital/billing/advances', icon: Wallet },
        { label: 'Discharge', href: '/dashboard/hospital/billing/discharge', icon: LogOut },
      ],
    },
    {
      label: 'Lab',
      href: '/dashboard/hospital/lab',
      icon: FlaskConical,
      children: [
        { label: 'Test Master', href: '/dashboard/hospital/lab/test-master', icon: ListOrdered },
        { label: 'Lab Reports', href: '/dashboard/hospital/lab/reports', icon: FileText },
      ],
    },
    {
      label: 'Inventory',
      href: '/dashboard/hospital/inventory',
      icon: Package,
      children: [
        { label: 'Item Master', href: '/dashboard/hospital/inventory/items', icon: ListOrdered },
        { label: 'Stock Movements', href: '/dashboard/hospital/inventory/stock', icon: ArrowRightLeft },
        { label: 'Purchase Orders', href: '/dashboard/hospital/inventory/purchase-orders', icon: ShoppingCart },
        { label: 'Low Stock Alerts', href: '/dashboard/hospital/inventory/low-stock', icon: AlertTriangle },
      ],
    },
    {
      label: 'Reports',
      href: '/dashboard/hospital/reports',
      icon: BarChart3,
      children: [
        { label: 'Revenue', href: '/dashboard/hospital/reports/revenue', icon: IndianRupee },
        { label: 'IPD Analytics', href: '/dashboard/hospital/reports/ipd', icon: BedDouble },
        { label: 'OPD Analytics', href: '/dashboard/hospital/reports/opd', icon: CalendarDays },
        { label: 'Financial', href: '/dashboard/hospital/reports/financial', icon: TrendingUp },
        { label: 'Inventory', href: '/dashboard/hospital/reports/inventory', icon: Package },
        { label: 'Lab', href: '/dashboard/hospital/reports/lab', icon: FlaskConical },
      ],
    },
    { label: 'Operation Theater', href: '/dashboard/hospital/ot', icon: Cross },
    { label: 'Bed Transfer', href: '/dashboard/hospital/bed-transfer', icon: ArrowRightLeft },
    { label: 'Discharge Summaries', href: '/dashboard/hospital/discharge-summaries', icon: FileText },
    { label: 'Change Password', href: '/dashboard/change-password', icon: KeyRound },
  ],
  receptionist: [
    { label: 'Dashboard', href: '/dashboard/receptionist', icon: LayoutDashboard },
    { label: 'Appointments', href: '/dashboard/receptionist/appointments', icon: CalendarDays },
    { label: 'Pending Bookings', href: '/dashboard/receptionist/pending-bookings', icon: Clock },
    { label: 'Walk-in', href: '/dashboard/receptionist/walk-in', icon: UserPlus },
    { label: 'Queue', href: '/dashboard/receptionist/queue', icon: ListOrdered },
    { label: 'Print Queue', href: '/dashboard/receptionist/print-queue', icon: Printer },
    { label: 'Schedule', href: '/dashboard/receptionist/schedule', icon: Clock },
    { label: 'Medicines', href: '/dashboard/receptionist/medicines', icon: Pill },
    { label: 'Patients', href: '/dashboard/receptionist/patients', icon: Users },
    { label: 'IPD Admissions', href: '/dashboard/receptionist/ipd', icon: BedDouble },
    { label: 'Charge Master', href: '/dashboard/receptionist/charge-master', icon: Tags },
    {
      label: 'Billing',
      href: '/dashboard/receptionist/billing',
      icon: IndianRupee,
      children: [
        { label: 'IPD Bills', href: '/dashboard/receptionist/billing/ipd', icon: FileText },
        { label: 'OPD Bills', href: '/dashboard/receptionist/billing/opd', icon: Receipt },
        { label: 'Payments', href: '/dashboard/receptionist/billing/payments', icon: CreditCard },
        { label: 'Advance Deposits', href: '/dashboard/receptionist/billing/advances', icon: Wallet },
        { label: 'Discharge', href: '/dashboard/hospital/billing/discharge', icon: LogOut },
      ],
    },
    { label: 'Bed Transfer', href: '/dashboard/receptionist/bed-transfer', icon: ArrowRightLeft },
    { label: 'Family Access', href: '/dashboard/receptionist/family-access', icon: Users },
    { label: 'Reports', href: '/dashboard/receptionist/reports', icon: BarChart3 },
    { label: 'My Blog', href: '/dashboard/receptionist/blog', icon: PenLine },
    { label: 'Profile', href: '/dashboard/receptionist/profile', icon: UserCircle },
    { label: 'Notifications', href: '/dashboard/receptionist/notifications', icon: Bell },
    { label: 'Change Password', href: '/dashboard/change-password', icon: KeyRound },
  ],
  assistant: [
    { label: 'Dashboard', href: '/dashboard/assistant', icon: LayoutDashboard },
    { label: 'Appointments', href: '/dashboard/assistant/appointments', icon: CalendarDays },
    { label: 'Patients', href: '/dashboard/assistant/patients', icon: Users },
    { label: 'Rx Queue', href: '/dashboard/assistant/prescription-queue', icon: ClipboardList },
    { label: 'Change Password', href: '/dashboard/change-password', icon: KeyRound },
  ],
  pharmacist: [
    { label: 'Dashboard', href: '/dashboard/pharmacist', icon: LayoutDashboard },
    { label: 'Prescriptions', href: '/dashboard/pharmacist/prescriptions', icon: FileText },
    { label: 'Medicine List', href: '/dashboard/pharmacist/medicines', icon: Pill },
    { label: 'Change Password', href: '/dashboard/change-password', icon: KeyRound },
  ],
  nurse: [
    { label: 'Dashboard', href: '/dashboard/nurse', icon: LayoutDashboard },
    { label: 'My Patients', href: '/dashboard/nurse/patients', icon: Users },
    { label: 'Ward View', href: '/dashboard/nurse/ward-patients', icon: BedDouble },
    { label: 'Shift Handover', href: '/dashboard/nurse/handover', icon: ArrowRightLeft },
    { label: 'Profile', href: '/dashboard/nurse/profile', icon: UserCircle },
    { label: 'Change Password', href: '/dashboard/change-password', icon: KeyRound },
  ],
  lab_technician: [
    { label: 'Dashboard', href: '/dashboard/lab-technician', icon: LayoutDashboard },
    { label: 'Worklist', href: '/dashboard/lab-technician/worklist', icon: ClipboardList },
    { label: 'Result Entry', href: '/dashboard/lab-technician/result-entry', icon: PenLine },
    { label: 'Reports', href: '/dashboard/lab-technician/reports', icon: FileText },
    { label: 'Profile', href: '/dashboard/lab-technician/profile', icon: UserCircle },
    { label: 'Change Password', href: '/dashboard/change-password', icon: KeyRound },
  ],
}

export function getSidebarItems(role: string): SidebarItem[] {
  return sidebarConfig[role] || sidebarConfig.patient
}
