- Indian number formatting (en-IN locale, Crore/Lakh words)
- No lint or dev run executed per instructions

---
Task ID: 7-8-portal
Agent: Main
Task: Phase 7 (Family Portal) + Phase 8 (WebSocket + Admin Settings)

Work Log:

## Phase 7A: Family Portal Access APIs
- Created `src/app/api/family-access/generate/route.ts` — POST: Generate 6-char alphanumeric access code (unique, no ambiguous chars), create FamilyAccess record, auto-fill patientName, return { accessCode, shareableLink }. Auth: receptionist/hospital/admin.
- Created `src/app/api/family-access/[accessCode]/route.ts` — GET: PUBLIC endpoint (no auth). Finds FamilyAccess by accessCode, validates isActive. Returns patientName, ward, bed, department, attendingDoctor, admitDate, status. Conditionally includes vitals (if canViewVitals), diet orders (if canViewDiet), bill summary (if canViewBill). Explicitly excludes diagnosis, investigation details, doctor notes, contact info.
- Created `src/app/api/family-access/[id]/revoke/route.ts` — PUT: Revoke access. Auth: receptionist/hospital/admin. Sets isActive=false.
- Created `src/app/api/family-access/route.ts` — GET: List all family access records with optional status/hospitalId filter. Auth: receptionist/hospital/admin.

## Phase 7A: Receptionist Family Access Management Page
- Created `src/app/dashboard/receptionist/family-access/page.tsx` — Server component wrapper
- Created `src/app/dashboard/receptionist/family-access/client.tsx` — Full management UI:
  - 3 stat cards: Active Codes (teal), Revoked (slate), Total (violet)
  - Table: Patient, Admission No (violet badge), Access Code (copyable with Copy button), Relation, Mobile, Status (Active=emerald/Revoked=slate), Actions
  - Actions: Copy Code (with Check feedback), Copy Link, Revoke (red)
  - Generate Dialog: Admission select (admitted patients only), Relation Name/Mobile inputs, Permission toggles (Vitals, Diet, Bill) with descriptions
  - Revoke Confirmation AlertDialog with patient name context
  - Framer Motion table row animations, loading skeletons, empty states
  - TanStack Query for data fetching, sonner toasts
  - Responsive design with hidden columns on mobile

## Phase 7B: Public Family Portal
- Created `src/app/family/[accessCode]/page.tsx` — Server component with noindex/nofollow metadata, passes accessCode as promise to client
- Created `src/app/family/[accessCode]/client.tsx` — Clean mobile-friendly public portal:
  - NO sidebar/dashboard layout — standalone gradient background page
  - Patient Info Card: Name, Department, Ward/Bed, Attending Doctor, Admit Date, Ward Type, Status badge (color-coded)
  - Vitals Section (if allowed): 2x2 grid (Temp, Pulse, SpO2, BP) with abnormal value highlighting (red bg), recent readings table (last 10) with scroll, time-ago indicators
  - Diet Section (if allowed): Active diet orders with diet type, meal type badge, instructions
  - Bill Summary (if allowed): Line items (Room, Services, Lab, Medicines, OT, Other), Subtotal, Tax, Discount (emerald), Net Payable (teal bold), Advance Adjusted
  - Refresh button, auto-refresh every 30s via TanStack Query refetchInterval
  - Error states: Invalid access code (red ShieldAlert), Revoked access (orange ShieldAlert)
  - Footer: Hospital phone (clickable tel: link), privacy note, hospital name
  - No permissions message when all access is restricted

## Phase 8A: WebSocket Notification Service
- Created `mini-services/notification-service/package.json` — { name: 'notification-service', scripts: { dev: 'bun --hot index.ts' }, dependencies: { socket.io: '^4.7.5' } }
- Created `mini-services/notification-service/index.ts` — Socket.io server on port 3005:
  - Client auth via handshake.auth (userId, role, name, hospitalId)
  - Auto-joins rooms: `user:{userId}`, `role:{role}`, `hospital:{hospitalId}`
  - HTTP endpoint POST /emit for API routes to trigger events: { event, rooms[], payload }
  - 9 valid events: new-admission, vital-recorded, sample-ordered, lab-result-ready, bill-generated, payment-received, discharge-advised, ot-scheduled, low-stock-alert
  - Event validation against allowed list
  - Graceful shutdown (SIGTERM/SIGINT)

## Phase 8B: Real-time Notifications
- Created `src/hooks/useSocket.ts` — 'use client' hook:
  - `useSocket(options)`: Connects to `io('/?XTransformPort=3005')`, joins rooms, returns socket ref
  - `useAuthSocket()`: Auto-resolves userId/role from cookies (doctorooms_session, doctorooms_role)
  - Reconnection support (10 attempts, 2s delay)
  - Cleanup on unmount
- Created `src/components/shared/RealtimeNotification.tsx` — 'use client' component:
  - Uses useAuthSocket to connect
  - Listens for 9 events with role-based filtering (e.g. new-admission → receptionist/hospital/nurse/admin)
  - Shows sonner toast with event-specific icon + color
  - Deduplication: same event+payload within 5s shown only once
  - Role filter reads from cookie
  - Renders nothing visible (headless)
- Updated `src/app/layout.tsx` — Added RealtimeNotification import and rendered inside ThemeProvider

## Phase 8C: Admin Settings
- Updated `src/app/api/admin/settings/route.ts`:
  - Added new sections to ALLOWED_KEYS and DEFAULT_SETTINGS: hospitalInfo (7 fields), regional (5 fields), billing (5 fields), lab (4 fields)
  - Extended notifications section with realtimeEnabled, soundEnabled, desktopNotifications
  - Increased MAX_STRING_LENGTH to 500
- Updated `src/app/dashboard/admin/settings/page.tsx` — Enhanced with 4 new tab sections:
  - **Hospital Info Tab** (Building2 icon): Hospital Name, Phone, Email, Registration No., Address textarea, GST Number
  - **Billing Tab** (IndianRupee icon): Default Tax %, Bill Prefix, Payment Terms select (Due on Discharge/Net 15/Net 30/Immediate), Auto-generate Bill Numbers toggle, Show Discount Field toggle
  - **Lab Tab** (FlaskConical icon): Default TAT hours, Auto-verify Normal Results toggle, Report Header/Footer Note textareas
  - **Notifications Tab** enhanced: Split into 3 cards — Notification Channels (email/sms/push), Real-time Notifications (realtime/sound/desktop toggles), Appointment Reminder
  - Generic `updateSection()` helper replaces individual section updaters
  - useEffect to sync form state with fetched data (merges new sections with defaults)
  - TabsList now wraps on mobile with flex-wrap

## Technical Details
- 13 files created, 3 files modified
- Installed socket.io-client in main project
- Installed socket.io in notification-service mini-service
- Notification service started on port 3005
- All UI: shadcn/ui, TanStack Query, sonner, lucide-react, framer-motion
- Color scheme: teal (primary), emerald (success/active), amber (pending), violet (access codes/bills), red (danger/revoke/abnormal)
- No indigo/blue colors used
- Responsive design with Tailwind breakpoints
- No lint or dev run executed per instructions

Stage Summary:
- Phase 7A: Complete — 4 API routes + Receptionist Family Access management page
- Phase 7B: Complete — Public family portal with vitals/diet/bill sections, auto-refresh
- Phase 8A: Complete — WebSocket notification service on port 3005 with 9 event types
- Phase 8B: Complete — useSocket hook + RealtimeNotification component in layout
- Phase 8C: Complete — Admin settings with Hospital Info, Billing, Lab, enhanced Notifications
- Sidebar already had 'Family Access' link for receptionist — no sidebar changes needed
