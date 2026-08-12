import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const db = new PrismaClient()

// ============ HELPER: Parse OPD timings string into schedule entries ============
function parseOpdTimings(opdTimings: string): { day: string; startTime: string; endTime: string }[] {
  // Examples: "Mon/Wed/Fri 10:00-1:00" → [{day:"Monday", startTime:"10:00", endTime:"13:00"}]
  //           "Tue/Thu/Sat 9:00-12:00" → [{day:"Tuesday", startTime:"09:00", endTime:"12:00"}]
  //           "Mon-Sat 10:00-2:00" → [Mon..Sat]
  const dayMap: Record<string, string> = {
    Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday',
    Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday',
  }

  const schedules: { day: string; startTime: string; endTime: string }[] = []
  const parts = opdTimings.split(' ')
  if (parts.length < 2) return schedules

  const daysPart = parts[0]
  const timePart = parts[1]

  // Parse time: "10:00-1:00" or "10:00-13:00"
  const [startStr, endStr] = timePart.split('-')
  const startTime = padTime(startStr)
  const endTime = padTime(endStr)

  // Parse days: "Mon/Wed/Fri" (slash = explicit list) or "Mon-Sat" (dash = range)
  const dayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  let dayAbbrs: string[]
  if (daysPart.includes('/')) {
    dayAbbrs = daysPart.split('/')
  } else {
    // Range: "Mon-Sat" → expand to Mon..Sat
    const [start, end] = daysPart.split('-')
    const startIdx = dayOrder.indexOf(start)
    const endIdx = dayOrder.indexOf(end)
    if (startIdx !== -1 && endIdx !== -1 && startIdx <= endIdx) {
      dayAbbrs = dayOrder.slice(startIdx, endIdx + 1)
    } else {
      dayAbbrs = [daysPart] // fallback
    }
  }

  for (const abbr of dayAbbrs) {
    const fullDay = dayMap[abbr.trim()]
    if (fullDay) {
      schedules.push({ day: fullDay, startTime, endTime })
    }
  }

  return schedules
}

function padTime(t: string): string {
  const parts = t.split(':')
  if (parts.length === 2) return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`
  // If no colon, assume it's like "1:00" → "01:00" or just "1" → "01:00"
  return `${parts[0].padStart(2, '0')}:00`
}

// ============ TYPES ============
interface HospitalSeed {
  name: string
  email: string
  password: string
  hospitalName: string
  address: string
  city: string
  state: string
  pincode: string
  contactNo: string
  departments: DepartmentSeed[]
}

interface DepartmentSeed {
  name: string
  nameHi: string
  description: string
  icon: string
  floorNo: string
  opdRoom: string
  sortOrder: number
  doctors: DoctorSeed[]
}

interface DoctorSeed {
  name: string
  email: string
  gender: string
  specialization: string
  experience: string
  education: string
  designation: string
  fees: number
  opdTimings: string
  existingDoctor?: boolean // if true, link existing doctor instead of creating new
}

// ============ SEED DATA ============

const hospitals: HospitalSeed[] = [
  // ---- ZYDUS HOSPITAL ----
  {
    name: 'Zydus Hospital',
    email: 'zydus@hospital.com',
    password: 'Hospital@123',
    hospitalName: 'Zydus Hospital',
    address: 'Zydus Hospitals, Thaltej',
    city: 'Ahmedabad',
    state: 'Gujarat',
    pincode: '380054',
    contactNo: '+91-79-6688-1000',
    departments: [
      {
        name: 'Cardiology',
        nameHi: 'कार्डियोलॉजी',
        description: 'Comprehensive heart care including interventional cardiology, cardiac surgery, and cardiac rehabilitation.',
        icon: 'HeartPulse',
        floorNo: 'Floor 2',
        opdRoom: 'OPD Room 201',
        sortOrder: 1,
        doctors: [
          { name: 'Dr. Amit Shah', email: 'amit.shah@zydus.com', gender: 'Male', specialization: 'Cardiology', experience: '18 years', education: 'MBBS, MD, DM (Cardiology)', designation: 'Senior Consultant', fees: 800, opdTimings: 'Mon/Wed/Fri 10:00-1:00' },
          { name: 'Dr. Priya Patel', email: 'priya.patel@zydus.com', gender: 'Female', specialization: 'Cardiology', experience: '12 years', education: 'MBBS, MD, DM (Cardiology)', designation: 'Consultant', fees: 500, opdTimings: 'Tue/Thu/Sat 9:00-12:00' },
        ],
      },
      {
        name: 'Orthopedics',
        nameHi: 'ऑर्थोपेडिक्स',
        description: 'Advanced orthopedic care including joint replacement, sports medicine, and spine surgery.',
        icon: 'Bone',
        floorNo: 'Floor 3',
        opdRoom: 'OPD Room 301',
        sortOrder: 2,
        doctors: [
          { name: 'Dr. Rakesh Gupta', email: 'rakesh.gupta@zydus.com', gender: 'Male', specialization: 'Orthopedics', experience: '22 years', education: 'MBBS, MS (Ortho)', designation: 'HOD', fees: 1000, opdTimings: 'Mon/Wed 2:00-5:00' },
          { name: 'Dr. Suresh Jain', email: 'suresh.jain@zydus.com', gender: 'Male', specialization: 'Orthopedics', experience: '10 years', education: 'MBBS, MS (Ortho)', designation: 'Consultant', fees: 600, opdTimings: 'Tue/Thu/Fri 10:00-1:00' },
        ],
      },
      {
        name: 'Dermatology',
        nameHi: 'डर्मेटोलॉजी',
        description: 'Expert skin care including cosmetic dermatology, laser treatments, and allergy management.',
        icon: 'Scan',
        floorNo: 'Floor 1',
        opdRoom: 'OPD Room 105',
        sortOrder: 3,
        doctors: [
          { name: 'Dr. Rajesh Kumar', email: 'rajesh@skinclinic.com', gender: 'Male', specialization: 'Dermatology', experience: '15 years', education: 'MBBS, MD (Dermatology)', designation: 'Consultant', fees: 400, opdTimings: 'Mon-Sat 10:00-2:00', existingDoctor: true },
          { name: 'Dr. Neha Patel', email: 'neha.patel@zydus.com', gender: 'Female', specialization: 'Dermatology', experience: '6 years', education: 'MBBS, MD (Dermatology)', designation: 'Junior Consultant', fees: 200, opdTimings: 'Mon/Wed/Fri 3:00-5:00' },
        ],
      },
      {
        name: 'Neurology',
        nameHi: 'न्यूरोलॉजी',
        description: 'Specialized neurological care for brain, spine, and nervous system disorders.',
        icon: 'Brain',
        floorNo: 'Floor 4',
        opdRoom: 'OPD Room 401',
        sortOrder: 4,
        doctors: [
          { name: 'Dr. Vikram Singh', email: 'vikram.singh@zydus.com', gender: 'Male', specialization: 'Neurology', experience: '20 years', education: 'MBBS, MD, DM (Neurology)', designation: 'Senior Consultant', fees: 900, opdTimings: 'Mon/Tue/Thu 11:00-2:00' },
          { name: 'Dr. Anita Desai', email: 'anita.desai@zydus.com', gender: 'Female', specialization: 'Neurology', experience: '8 years', education: 'MBBS, MD, DM (Neurology)', designation: 'Consultant', fees: 500, opdTimings: 'Wed/Fri/Sat 10:00-1:00' },
        ],
      },
      {
        name: 'General Medicine',
        nameHi: 'सामान्य चिकित्सा',
        description: 'Comprehensive internal medicine for routine health checkups, chronic disease management, and preventive care.',
        icon: 'Stethoscope',
        floorNo: 'Ground Floor',
        opdRoom: 'OPD Room 101',
        sortOrder: 5,
        doctors: [
          { name: 'Dr. Mahesh Mehta', email: 'mahesh.mehta@zydus.com', gender: 'Male', specialization: 'General Medicine', experience: '16 years', education: 'MBBS, MD (Medicine)', designation: 'Senior Consultant', fees: 400, opdTimings: 'Mon-Sat 9:00-12:00' },
          { name: 'Dr. Swati Rao', email: 'swati.rao@zydus.com', gender: 'Female', specialization: 'General Medicine', experience: '9 years', education: 'MBBS, MD (Medicine)', designation: 'Consultant', fees: 300, opdTimings: 'Mon/Wed/Fri 2:00-5:00' },
        ],
      },
      {
        name: 'Ophthalmology',
        nameHi: 'नेत्र विज्ञान',
        description: 'Complete eye care services including cataract surgery, LASIK, glaucoma treatment, and retinal care.',
        icon: 'Eye',
        floorNo: 'Floor 2',
        opdRoom: 'OPD Room 205',
        sortOrder: 6,
        doctors: [
          { name: 'Dr. Sanjay Verma', email: 'sanjay.verma@zydus.com', gender: 'Male', specialization: 'Ophthalmology', experience: '14 years', education: 'MBBS, MS (Ophthalmology)', designation: 'Consultant', fees: 500, opdTimings: 'Tue/Thu/Sat 10:00-1:00' },
          { name: 'Dr. Kavita Sharma', email: 'kavita.sharma@zydus.com', gender: 'Female', specialization: 'Ophthalmology', experience: '7 years', education: 'MBBS, MS (Ophthalmology)', designation: 'Junior Consultant', fees: 300, opdTimings: 'Mon/Wed/Fri 11:00-2:00' },
        ],
      },
      {
        name: 'Pediatrics',
        nameHi: 'बाल चिकित्सा',
        description: 'Specialized child healthcare from newborn care to adolescent medicine, including vaccinations.',
        icon: 'Baby',
        floorNo: 'Floor 1',
        opdRoom: 'OPD Room 102',
        sortOrder: 7,
        doctors: [
          { name: 'Dr. Pooja Iyer', email: 'pooja.iyer@zydus.com', gender: 'Female', specialization: 'Pediatrics', experience: '11 years', education: 'MBBS, MD (Pediatrics)', designation: 'Consultant', fees: 400, opdTimings: 'Mon/Tue/Wed 10:00-1:00' },
          { name: 'Dr. Rajiv Nair', email: 'rajiv.nair@zydus.com', gender: 'Male', specialization: 'Pediatrics', experience: '8 years', education: 'MBBS, DCH, MD (Pediatrics)', designation: 'Consultant', fees: 350, opdTimings: 'Thu/Fri/Sat 10:00-1:00' },
        ],
      },
      {
        name: 'ENT',
        nameHi: 'ईएनटी',
        description: 'Ear, Nose, and Throat specialist care including endoscopic sinus surgery and audiology.',
        icon: 'Ear',
        floorNo: 'Floor 2',
        opdRoom: 'OPD Room 210',
        sortOrder: 8,
        doctors: [
          { name: 'Dr. Deepak Joshi', email: 'deepak.joshi@zydus.com', gender: 'Male', specialization: 'ENT', experience: '15 years', education: 'MBBS, MS (ENT)', designation: 'Senior Consultant', fees: 500, opdTimings: 'Mon/Wed/Fri 9:00-12:00' },
          { name: 'Dr. Meera Reddy', email: 'meera.reddy@zydus.com', gender: 'Female', specialization: 'ENT', experience: '6 years', education: 'MBBS, MS (ENT)', designation: 'Junior Consultant', fees: 300, opdTimings: 'Tue/Thu/Sat 2:00-5:00' },
        ],
      },
      {
        name: 'Gynecology',
        nameHi: 'स्त्री रोग विज्ञान',
        description: "Women's health services including obstetrics, fertility treatments, and laparoscopic surgeries.",
        icon: 'Heart',
        floorNo: 'Floor 3',
        opdRoom: 'OPD Room 310',
        sortOrder: 9,
        doctors: [
          { name: 'Dr. Nisha Agarwal', email: 'nisha.agarwal@zydus.com', gender: 'Female', specialization: 'Gynecology', experience: '18 years', education: 'MBBS, MS (OBG)', designation: 'Senior Consultant', fees: 600, opdTimings: 'Mon/Tue/Thu 10:00-1:00' },
          { name: 'Dr. Sneha Kapoor', email: 'sneha.kapoor@zydus.com', gender: 'Female', specialization: 'Gynecology', experience: '9 years', education: 'MBBS, DNB (OBG)', designation: 'Consultant', fees: 400, opdTimings: 'Wed/Fri/Sat 10:00-1:00' },
        ],
      },
      {
        name: 'Urology',
        nameHi: 'यूरोलॉजी',
        description: 'Specialized care for kidney stones, prostate issues, urological cancers, and minimally invasive surgeries.',
        icon: 'Droplets',
        floorNo: 'Floor 3',
        opdRoom: 'OPD Room 315',
        sortOrder: 10,
        doctors: [
          { name: 'Dr. Arvind Menon', email: 'arvind.menon@zydus.com', gender: 'Male', specialization: 'Urology', experience: '16 years', education: 'MBBS, MS, MCh (Urology)', designation: 'Senior Consultant', fees: 700, opdTimings: 'Mon/Wed/Fri 11:00-2:00' },
          { name: 'Dr. Tanvi Bhatt', email: 'tanvi.bhatt@zydus.com', gender: 'Female', specialization: 'Urology', experience: '7 years', education: 'MBBS, MS, MCh (Urology)', designation: 'Consultant', fees: 500, opdTimings: 'Tue/Thu/Sat 10:00-1:00' },
        ],
      },
    ],
  },

  // ---- SHALBY HOSPITAL ----
  {
    name: 'Shalby Hospital',
    email: 'shalby@hospital.com',
    password: 'Hospital@123',
    hospitalName: 'Shalby Hospital',
    address: 'Shalby Hospitals, SG Highway',
    city: 'Ahmedabad',
    state: 'Gujarat',
    pincode: '380015',
    contactNo: '+91-79-4020-4000',
    departments: [
      {
        name: 'Cardiology',
        nameHi: 'कार्डियोलॉजी',
        description: 'World-class cardiac care with advanced catheterization lab and cardiac surgery facilities.',
        icon: 'HeartPulse',
        floorNo: 'Floor 1',
        opdRoom: 'OPD Room 101',
        sortOrder: 1,
        doctors: [
          { name: 'Dr. Hitesh Patel', email: 'hitesh.patel@shalby.com', gender: 'Male', specialization: 'Cardiology', experience: '20 years', education: 'MBBS, MD, DM (Cardiology)', designation: 'Director', fees: 1000, opdTimings: 'Mon/Wed 10:00-1:00' },
          { name: 'Dr. Aarti Shah', email: 'aarti.shah@shalby.com', gender: 'Female', specialization: 'Cardiology', experience: '13 years', education: 'MBBS, MD, DM (Cardiology)', designation: 'Senior Consultant', fees: 700, opdTimings: 'Tue/Thu/Sat 9:00-12:00' },
        ],
      },
      {
        name: 'Orthopedics',
        nameHi: 'ऑर्थोपेडिक्स',
        description: 'Renowned joint replacement center with robotic surgery and sports injury rehabilitation.',
        icon: 'Bone',
        floorNo: 'Floor 2',
        opdRoom: 'OPD Room 201',
        sortOrder: 2,
        doctors: [
          { name: 'Dr. Bharat Trivedi', email: 'bharat.trivedi@shalby.com', gender: 'Male', specialization: 'Orthopedics', experience: '25 years', education: 'MBBS, MS (Ortho)', designation: 'HOD', fees: 1200, opdTimings: 'Mon/Tue/Thu 10:00-1:00' },
          { name: 'Dr. Kiran Rao', email: 'kiran.rao@shalby.com', gender: 'Male', specialization: 'Orthopedics', experience: '12 years', education: 'MBBS, MS (Ortho)', designation: 'Consultant', fees: 700, opdTimings: 'Wed/Fri/Sat 10:00-1:00' },
        ],
      },
      {
        name: 'General Surgery',
        nameHi: 'सामान्य सर्जरी',
        description: 'Minimally invasive and open surgical procedures for hernia, gallbladder, appendicitis, and more.',
        icon: 'Scissors',
        floorNo: 'Floor 3',
        opdRoom: 'OPD Room 301',
        sortOrder: 3,
        doctors: [
          { name: 'Dr. Yogesh Pandey', email: 'yogesh.pandey@shalby.com', gender: 'Male', specialization: 'General Surgery', experience: '17 years', education: 'MBBS, MS (General Surgery)', designation: 'Senior Consultant', fees: 600, opdTimings: 'Mon/Wed/Fri 11:00-2:00' },
          { name: 'Dr. Rekha Saxena', email: 'rekha.saxena@shalby.com', gender: 'Female', specialization: 'General Surgery', experience: '10 years', education: 'MBBS, MS (General Surgery)', designation: 'Consultant', fees: 450, opdTimings: 'Tue/Thu/Sat 10:00-1:00' },
        ],
      },
      {
        name: 'Neurology',
        nameHi: 'न्यूरोलॉजी',
        description: 'Comprehensive neurological services for stroke, epilepsy, movement disorders, and headaches.',
        icon: 'Brain',
        floorNo: 'Floor 4',
        opdRoom: 'OPD Room 401',
        sortOrder: 4,
        doctors: [
          { name: 'Dr. Sunil Chauhan', email: 'sunil.chauhan@shalby.com', gender: 'Male', specialization: 'Neurology', experience: '19 years', education: 'MBBS, MD, DM (Neurology)', designation: 'Senior Consultant', fees: 800, opdTimings: 'Mon/Tue/Thu 10:00-1:00' },
          { name: 'Dr. Divya Iyer', email: 'divya.iyer@shalby.com', gender: 'Female', specialization: 'Neurology', experience: '8 years', education: 'MBBS, MD, DM (Neurology)', designation: 'Consultant', fees: 500, opdTimings: 'Wed/Fri/Sat 10:00-1:00' },
        ],
      },
      {
        name: 'Dermatology',
        nameHi: 'डर्मेटोलॉजी',
        description: 'Skin, hair, and nail care with advanced laser treatments and cosmetic procedures.',
        icon: 'Scan',
        floorNo: 'Ground Floor',
        opdRoom: 'OPD Room 105',
        sortOrder: 5,
        doctors: [
          { name: 'Dr. Manish Agarwal', email: 'manish.agarwal@shalby.com', gender: 'Male', specialization: 'Dermatology', experience: '14 years', education: 'MBBS, MD (Dermatology)', designation: 'Consultant', fees: 500, opdTimings: 'Mon/Tue/Wed 10:00-1:00' },
          { name: 'Dr. Prachi Goyal', email: 'prachi.goyal@shalby.com', gender: 'Female', specialization: 'Dermatology', experience: '5 years', education: 'MBBS, MD (Dermatology)', designation: 'Junior Consultant', fees: 300, opdTimings: 'Thu/Fri/Sat 10:00-1:00' },
        ],
      },
      {
        name: 'ENT',
        nameHi: 'ईएनटी',
        description: 'Ear, Nose, and Throat care with modern endoscopic and microscopic techniques.',
        icon: 'Ear',
        floorNo: 'Floor 1',
        opdRoom: 'OPD Room 110',
        sortOrder: 6,
        doctors: [
          { name: 'Dr. Anil Tiwari', email: 'anil.tiwari@shalby.com', gender: 'Male', specialization: 'ENT', experience: '16 years', education: 'MBBS, MS (ENT)', designation: 'Senior Consultant', fees: 500, opdTimings: 'Mon/Wed/Fri 10:00-1:00' },
          { name: 'Dr. Shikha Bhatnagar', email: 'shikha.bhatnagar@shalby.com', gender: 'Female', specialization: 'ENT', experience: '7 years', education: 'MBBS, MS (ENT)', designation: 'Consultant', fees: 350, opdTimings: 'Tue/Thu/Sat 2:00-5:00' },
        ],
      },
      {
        name: 'Ophthalmology',
        nameHi: 'नेत्र विज्ञान',
        description: 'Advanced eye care including phacoemulsification, retinal surgery, and corneal treatments.',
        icon: 'Eye',
        floorNo: 'Floor 2',
        opdRoom: 'OPD Room 210',
        sortOrder: 7,
        doctors: [
          { name: 'Dr. Rajat Gupta', email: 'rajat.gupta@shalby.com', gender: 'Male', specialization: 'Ophthalmology', experience: '13 years', education: 'MBBS, MS (Ophthalmology)', designation: 'Consultant', fees: 500, opdTimings: 'Mon/Wed/Fri 10:00-1:00' },
          { name: 'Dr. Sumanlata Devi', email: 'suman.devi@shalby.com', gender: 'Female', specialization: 'Ophthalmology', experience: '8 years', education: 'MBBS, MS (Ophthalmology)', designation: 'Junior Consultant', fees: 350, opdTimings: 'Tue/Thu/Sat 10:00-1:00' },
        ],
      },
      {
        name: 'Pediatrics',
        nameHi: 'बाल चिकित्सा',
        description: 'Child-friendly pediatric care with vaccination programs, growth monitoring, and neonatal ICU.',
        icon: 'Baby',
        floorNo: 'Ground Floor',
        opdRoom: 'OPD Room 102',
        sortOrder: 8,
        doctors: [
          { name: 'Dr. Neha Khanna', email: 'neha.khanna@shalby.com', gender: 'Female', specialization: 'Pediatrics', experience: '12 years', education: 'MBBS, MD (Pediatrics)', designation: 'Senior Consultant', fees: 450, opdTimings: 'Mon/Tue/Wed 10:00-1:00' },
          { name: 'Dr. Varun Malik', email: 'varun.malik@shalby.com', gender: 'Male', specialization: 'Pediatrics', experience: '7 years', education: 'MBBS, DCH, MD (Pediatrics)', designation: 'Consultant', fees: 350, opdTimings: 'Thu/Fri/Sat 10:00-1:00' },
        ],
      },
    ],
  },

  // ---- AIIMS HOSPITAL ----
  {
    name: 'AIIMS Hospital',
    email: 'aiims@hospital.com',
    password: 'Hospital@123',
    hospitalName: 'AIIMS Hospital',
    address: 'AIIMS, Ansari Nagar',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110029',
    contactNo: '+91-11-2658-8500',
    departments: [
      {
        name: 'Cardiology',
        nameHi: 'कार्डियोलॉजी',
        description: "India's premier cardiac center with cutting-edge interventional and surgical cardiology.",
        icon: 'HeartPulse',
        floorNo: 'Floor 3',
        opdRoom: 'OPD Room 301',
        sortOrder: 1,
        doctors: [
          { name: 'Dr. Srinivas Kulkarni', email: 'srinivas.k@aiims.com', gender: 'Male', specialization: 'Cardiology', experience: '25 years', education: 'MBBS, MD, DM (Cardiology), FACC', designation: 'Professor & HOD', fees: 300, opdTimings: 'Mon/Tue/Thu 9:00-12:00' },
          { name: 'Dr. Madhuri Dixit', email: 'madhuri.d@aiims.com', gender: 'Female', specialization: 'Cardiology', experience: '15 years', education: 'MBBS, MD, DM (Cardiology)', designation: 'Associate Professor', fees: 200, opdTimings: 'Wed/Fri/Sat 10:00-1:00' },
          { name: 'Dr. Rohit Kumar', email: 'rohit.kumar@aiims.com', gender: 'Male', specialization: 'Cardiology', experience: '8 years', education: 'MBBS, MD, DM (Cardiology)', designation: 'Assistant Professor', fees: 100, opdTimings: 'Mon/Wed/Fri 2:00-5:00' },
        ],
      },
      {
        name: 'Neurology',
        nameHi: 'न्यूरोलॉजी',
        description: 'Advanced neuroscience center with neurosurgery, neuro-rehabilitation, and EEG facilities.',
        icon: 'Brain',
        floorNo: 'Floor 5',
        opdRoom: 'OPD Room 501',
        sortOrder: 2,
        doctors: [
          { name: 'Dr. Ashok Jha', email: 'ashok.jha@aiims.com', gender: 'Male', specialization: 'Neurology', experience: '28 years', education: 'MBBS, MD, DM (Neurology)', designation: 'Professor & HOD', fees: 300, opdTimings: 'Mon/Tue/Wed 9:00-12:00' },
          { name: 'Dr. Pallavi Nair', email: 'pallavi.nair@aiims.com', gender: 'Female', specialization: 'Neurology', experience: '12 years', education: 'MBBS, MD, DM (Neurology)', designation: 'Associate Professor', fees: 200, opdTimings: 'Thu/Fri/Sat 10:00-1:00' },
        ],
      },
      {
        name: 'Orthopedics',
        nameHi: 'ऑर्थोपेडिक्स',
        description: 'National referral center for complex orthopedic cases, trauma, and joint replacements.',
        icon: 'Bone',
        floorNo: 'Floor 4',
        opdRoom: 'OPD Room 401',
        sortOrder: 3,
        doctors: [
          { name: 'Dr. Pradeep Sharma', email: 'pradeep.s@aiims.com', gender: 'Male', specialization: 'Orthopedics', experience: '22 years', education: 'MBBS, MS (Ortho), MCh', designation: 'Professor', fees: 300, opdTimings: 'Mon/Wed/Fri 10:00-1:00' },
          { name: 'Dr. Kavitha Menon', email: 'kavitha.m@aiims.com', gender: 'Female', specialization: 'Orthopedics', experience: '10 years', education: 'MBBS, MS (Ortho)', designation: 'Assistant Professor', fees: 150, opdTimings: 'Tue/Thu/Sat 10:00-1:00' },
        ],
      },
      {
        name: 'General Medicine',
        nameHi: 'सामान्य चिकित्सा',
        description: 'Primary internal medicine department handling complex medical cases and referrals.',
        icon: 'Stethoscope',
        floorNo: 'Ground Floor',
        opdRoom: 'OPD Room 101',
        sortOrder: 4,
        doctors: [
          { name: 'Dr. Vinod Tiwari', email: 'vinod.t@aiims.com', gender: 'Male', specialization: 'General Medicine', experience: '20 years', education: 'MBBS, MD (Medicine)', designation: 'Professor', fees: 200, opdTimings: 'Mon-Sat 9:00-12:00' },
          { name: 'Dr. Sangeeta Roy', email: 'sangeeta.r@aiims.com', gender: 'Female', specialization: 'General Medicine', experience: '14 years', education: 'MBBS, MD (Medicine)', designation: 'Associate Professor', fees: 150, opdTimings: 'Mon/Wed/Fri 2:00-5:00' },
        ],
      },
      {
        name: 'Dermatology',
        nameHi: 'डर्मेटोलॉजी',
        description: 'Specialized dermatology and venereology services for skin diseases, leprosy, and cosmetic dermatology.',
        icon: 'Scan',
        floorNo: 'Floor 2',
        opdRoom: 'OPD Room 205',
        sortOrder: 5,
        doctors: [
          { name: 'Dr. Girish Rathi', email: 'girish.r@aiims.com', gender: 'Male', specialization: 'Dermatology', experience: '18 years', education: 'MBBS, MD (Dermatology)', designation: 'Professor', fees: 200, opdTimings: 'Mon/Tue/Thu 10:00-1:00' },
          { name: 'Dr. Priyanka Sen', email: 'priyanka.s@aiims.com', gender: 'Female', specialization: 'Dermatology', experience: '9 years', education: 'MBBS, MD (Dermatology)', designation: 'Assistant Professor', fees: 100, opdTimings: 'Wed/Fri/Sat 10:00-1:00' },
        ],
      },
      {
        name: 'Ophthalmology',
        nameHi: 'नेत्र विज्ञान',
        description: 'Comprehensive eye care including corneal transplantation, retinal surgery, and ocular oncology.',
        icon: 'Eye',
        floorNo: 'Floor 3',
        opdRoom: 'OPD Room 310',
        sortOrder: 6,
        doctors: [
          { name: 'Dr. Rajendra Prasad', email: 'rajendra.p@aiims.com', gender: 'Male', specialization: 'Ophthalmology', experience: '21 years', education: 'MBBS, MS (Ophthalmology)', designation: 'Professor', fees: 200, opdTimings: 'Mon/Wed/Fri 10:00-1:00' },
          { name: 'Dr. Alpana Verma', email: 'alpana.v@aiims.com', gender: 'Female', specialization: 'Ophthalmology', experience: '11 years', education: 'MBBS, MS (Ophthalmology)', designation: 'Associate Professor', fees: 150, opdTimings: 'Tue/Thu/Sat 10:00-1:00' },
        ],
      },
      {
        name: 'Pediatrics',
        nameHi: 'बाल चिकित्सा',
        description: 'Tertiary-level pediatric care with dedicated PICU, NICU, and specialized pediatric clinics.',
        icon: 'Baby',
        floorNo: 'Floor 1',
        opdRoom: 'OPD Room 102',
        sortOrder: 7,
        doctors: [
          { name: 'Dr. Suresh Mohan', email: 'suresh.m@aiims.com', gender: 'Male', specialization: 'Pediatrics', experience: '19 years', education: 'MBBS, MD (Pediatrics), Fellowship', designation: 'Professor', fees: 200, opdTimings: 'Mon/Tue/Wed 9:00-12:00' },
          { name: 'Dr. Anjali Bhatia', email: 'anjali.b@aiims.com', gender: 'Female', specialization: 'Pediatrics', experience: '10 years', education: 'MBBS, MD (Pediatrics)', designation: 'Assistant Professor', fees: 100, opdTimings: 'Thu/Fri/Sat 10:00-1:00' },
        ],
      },
      {
        name: 'Gastroenterology',
        nameHi: 'गैस्ट्रोएंटेरोलॉजी',
        description: 'Advanced GI care including endoscopy, ERCP, liver diseases, and inflammatory bowel disease management.',
        icon: 'Pill',
        floorNo: 'Floor 4',
        opdRoom: 'OPD Room 405',
        sortOrder: 8,
        doctors: [
          { name: 'Dr. Narendra Singh', email: 'narendra.s@aiims.com', gender: 'Male', specialization: 'Gastroenterology', experience: '23 years', education: 'MBBS, MD, DM (Gastro)', designation: 'Professor & HOD', fees: 300, opdTimings: 'Mon/Wed 10:00-1:00' },
          { name: 'Dr. Ritu Agarwal', email: 'ritu.a@aiims.com', gender: 'Female', specialization: 'Gastroenterology', experience: '11 years', education: 'MBBS, MD, DM (Gastro)', designation: 'Associate Professor', fees: 200, opdTimings: 'Tue/Thu/Fri 10:00-1:00' },
        ],
      },
    ],
  },
]

// ============ MAIN SEED FUNCTION ============

async function main() {
  console.log('🌱 Starting multi-specialty hospital seed...\n')

  const HOSPITAL_PWD = await hash('Hospital@123', 10)
  const DOCTOR_PWD = await hash('Doctor@123', 10)

  // Check for existing Dr. Rajesh
  const existingRajesh = await db.user.findUnique({
    where: { email: 'rajesh@skinclinic.com' },
    include: { doctor: true },
  })
  if (existingRajesh?.doctor) {
    console.log(`✅ Found existing Dr. Rajesh (userId: ${existingRajesh.id}, doctorId: ${existingRajesh.doctor.id})`)
  }

  // Collect all doctor emails that already exist in the DB
  const allNewDoctorEmails = hospitals.flatMap(h =>
    h.departments.flatMap(d =>
      d.doctors.filter(doc => !doc.existingDoctor).map(doc => doc.email)
    )
  )
  const existingDoctors = await db.user.findMany({
    where: { email: { in: allNewDoctorEmails } },
    select: { email: true },
  })
  const existingEmails = new Set(existingDoctors.map(u => u.email))

  let totalHospitalsCreated = 0
  let totalDepartmentsCreated = 0
  let totalDoctorsCreated = 0
  let totalDoctorLinksCreated = 0
  let totalSchedulesCreated = 0

  for (const hospitalData of hospitals) {
    console.log(`\n🏥 Processing: ${hospitalData.hospitalName}`)

    // ---- 1. Create Hospital User (upsert) ----
    const hospitalUser = await db.user.upsert({
      where: { email: hospitalData.email },
      update: {},
      create: {
        name: hospitalData.name,
        email: hospitalData.email,
        password: HOSPITAL_PWD,
        role: 'hospital',
        status: 'Active',
        mobileNo: hospitalData.contactNo,
      },
    })
    console.log(`   👤 Hospital user: ${hospitalUser.email} (id: ${hospitalUser.id})`)

    // ---- 2. Create Hospital record (upsert) ----
    const hospital = await db.hospital.upsert({
      where: { userId: hospitalUser.id },
      update: {},
      create: {
        userId: hospitalUser.id,
        hospitalName: hospitalData.hospitalName,
        address: hospitalData.address,
        city: hospitalData.city,
        state: hospitalData.state,
        pincode: hospitalData.pincode,
        email: hospitalData.email,
        contactNo: hospitalData.contactNo,
        hospitalType: 'Multi-Specialty',
        status: 'Active',
      },
    })
    totalHospitalsCreated++
    console.log(`   🏢 Hospital record: ${hospital.hospitalName} (id: ${hospital.id})`)

    // ---- 3. Create Departments ----
    for (const deptData of hospitalData.departments) {
      const department = await db.department.create({
        data: {
          hospitalId: hospital.id,
          name: deptData.name,
          nameHi: deptData.nameHi,
          description: deptData.description,
          icon: deptData.icon,
          floorNo: deptData.floorNo,
          opdRoom: deptData.opdRoom,
          status: 'Active',
          sortOrder: deptData.sortOrder,
        },
      })
      totalDepartmentsCreated++
      console.log(`   🏷️  Department: ${deptData.name} (${deptData.floorNo}, ${deptData.opdRoom})`)

      // ---- 4. Create Doctors + DoctorRecords + Schedules + DoctorHospital Links ----
      for (const docData of deptData.doctors) {
        let doctorId: string

        if (docData.existingDoctor && existingRajesh?.doctor) {
          // Link existing doctor
          doctorId = existingRajesh.doctor.id
          console.log(`      🔗 Linked existing doctor: ${docData.name} (${docData.email})`)
        } else {
          if (existingEmails.has(docData.email)) {
            console.log(`      ⏭️  Skipping existing doctor: ${docData.name} (${docData.email})`)
            continue
          }

          // Create User
          const doctorUser = await db.user.create({
            data: {
              name: docData.name,
              email: docData.email,
              password: DOCTOR_PWD,
              role: 'doctor',
              status: 'Active',
              gender: docData.gender,
            },
          })

          // Create Doctor record
          const doctor = await db.doctor.create({
            data: {
              userId: doctorUser.id,
              specialization: docData.specialization,
              experience: docData.experience,
              education: docData.education,
              fees: docData.fees,
              city: hospitalData.city,
              state: hospitalData.state,
            },
          })
          doctorId = doctor.id
          totalDoctorsCreated++
          console.log(`      👨‍⚕️  New doctor: ${docData.name} (${docData.email})`)
        }

        // Create DoctorHospital link
        const doctorHospital = await db.doctorHospital.create({
          data: {
            doctorId,
            hospitalId: hospital.id,
            departmentId: department.id,
            designation: docData.designation,
            fees: docData.fees,
            opdTimings: docData.opdTimings,
            isAvailable: true,
            status: 'Active',
          },
        })
        totalDoctorLinksCreated++

        // Create DoctorSchedule entries based on OPD timings
        const schedules = parseOpdTimings(docData.opdTimings)
        for (const sched of schedules) {
          await db.doctorSchedule.create({
            data: {
              doctorId,
              day: sched.day,
              startTime: sched.startTime,
              endTime: sched.endTime,
              slotDuration: 15,
            },
          })
          totalSchedulesCreated++
        }

        if (schedules.length > 0) {
          console.log(`      📅 Created ${schedules.length} schedule entries for ${docData.name} (${docData.opdTimings})`)
        }
      }
    }
  }

  // ============ SUMMARY ============
  console.log('\n\n' + '='.repeat(60))
  console.log('📊 SEED COMPLETE — SUMMARY')
  console.log('='.repeat(60))
  console.log(`   Hospitals created:     ${totalHospitalsCreated}`)
  console.log(`   Departments created:    ${totalDepartmentsCreated}`)
  console.log(`   New doctors created:    ${totalDoctorsCreated}`)
  console.log(`   DoctorHospital links:   ${totalDoctorLinksCreated}`)
  console.log(`   Schedule entries:       ${totalSchedulesCreated}`)
  console.log('='.repeat(60))
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
