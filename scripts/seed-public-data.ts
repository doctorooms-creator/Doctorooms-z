import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const db = new PrismaClient()

const DOCTOR_NAMES = [
  { name: 'Dr. Aarav Mehta', spec: 'Cardiologist', city: 'Mumbai', state: 'Maharashtra', fees: 1200, exp: '15 Years', edu: 'MBBS, MD (Cardiology), AIIMS Delhi', desc: 'Dr. Aarav Mehta is a renowned cardiologist with over 15 years of experience in interventional cardiology. He specializes in angioplasty and pacemaker implantation.' },
  { name: 'Dr. Ishita Reddy', spec: 'Dermatologist', city: 'Hyderabad', state: 'Telangana', fees: 800, exp: '10 Years', edu: 'MBBS, MD (Dermatology), Nizam Institute', desc: 'Dr. Ishita Reddy is a board-certified dermatologist known for her expertise in cosmetic dermatology and treatment of complex skin conditions.' },
  { name: 'Dr. Vikram Singh', spec: 'Orthopedic', city: 'Delhi', state: 'Delhi', fees: 1000, exp: '12 Years', edu: 'MBBS, MS (Orthopedics), MAMC Delhi', desc: 'Dr. Vikram Singh is a leading orthopedic surgeon specializing in joint replacement surgery and sports injuries with 12 years of clinical experience.' },
  { name: 'Dr. Priya Nair', spec: 'Gynecologist', city: 'Chennai', state: 'Tamil Nadu', fees: 900, exp: '18 Years', edu: 'MBBS, MS (OBG), CMC Vellore', desc: 'Dr. Priya Nair is a senior gynecologist with expertise in high-risk pregnancies, laparoscopic surgery, and reproductive health.' },
  { name: 'Dr. Arjun Kapoor', spec: 'Pediatrician', city: 'Bangalore', state: 'Karnataka', fees: 700, exp: '8 Years', edu: 'MBBS, MD (Pediatrics), St. Johns Medical College', desc: 'Dr. Arjun Kapoor is a compassionate pediatrician who specializes in neonatal care and childhood developmental disorders.' },
  { name: 'Dr. Meera Joshi', spec: 'Neurologist', city: 'Pune', state: 'Maharashtra', fees: 1500, exp: '20 Years', edu: 'MBBS, DM (Neurology), KEM Hospital Mumbai', desc: 'Dr. Meera Joshi is one of the most experienced neurologists in the region, treating conditions like epilepsy, stroke, and movement disorders.' },
  { name: 'Dr. Rohan Gupta', spec: 'ENT Specialist', city: 'Jaipur', state: 'Rajasthan', fees: 600, exp: '7 Years', edu: 'MBBS, MS (ENT), SMS Medical College', desc: 'Dr. Rohan Gupta is an ENT specialist with expertise in endoscopic sinus surgery, cochlear implants, and sleep apnea treatment.' },
  { name: 'Dr. Ananya Sharma', spec: 'Psychiatrist', city: 'Mumbai', state: 'Maharashtra', fees: 1100, exp: '11 Years', edu: 'MBBS, MD (Psychiatry), NIMHANS Bangalore', desc: 'Dr. Ananya Sharma is a psychiatrist specializing in anxiety disorders, depression, and cognitive behavioral therapy.' },
  { name: 'Dr. Kunal Verma', spec: 'General Physician', city: 'Kolkata', state: 'West Bengal', fees: 500, exp: '5 Years', edu: 'MBBS, R G Kar Medical College', desc: 'Dr. Kunal Verma is a dedicated general physician providing comprehensive primary care with a focus on preventive medicine.' },
  { name: 'Dr. Sneha Patel', spec: 'Ophthalmologist', city: 'Ahmedabad', state: 'Gujarat', fees: 900, exp: '13 Years', edu: 'MBBS, MS (Ophthalmology), Aravind Eye Hospital', desc: 'Dr. Sneha Patel is an experienced ophthalmologist specializing in cataract surgery, glaucoma treatment, and refractive surgery.' },
  { name: 'Dr. Rahul Deshmukh', spec: 'Urologist', city: 'Mumbai', state: 'Maharashtra', fees: 1300, exp: '16 Years', edu: 'MBBS, MS (Urology), Tata Memorial Hospital', desc: 'Dr. Rahul Deshmukh is a leading urologist with expertise in minimally invasive urological surgery and kidney stone management.' },
  { name: 'Dr. Pooja Iyer', spec: 'Dentist', city: 'Chennai', state: 'Tamil Nadu', fees: 400, exp: '6 Years', edu: 'BDS, MDS (Orthodontics), Saveetha University', desc: 'Dr. Pooja Iyer is a skilled dentist specializing in orthodontics, dental implants, and cosmetic dentistry.' },
]

const HOSPITAL_NAMES = [
  { name: 'City Hospital Admin', hospitalName: 'City General Hospital', city: 'Mumbai', state: 'Maharashtra', address: '45 Marine Drive, Colaba', contact: '022-2345-6789' },
  { name: 'Sunrise Health Admin', hospitalName: 'Sunrise Multispecialty Hospital', city: 'Delhi', state: 'Delhi', address: '12 Connaught Place, New Delhi', contact: '011-2345-6789' },
  { name: 'Green Valley Admin', hospitalName: 'Green Valley Medical Center', city: 'Bangalore', state: 'Karnataka', address: '78 MG Road, Koramangala', contact: '080-2345-6789' },
  { name: 'Care Well Admin', hospitalName: 'CareWell Super Speciality', city: 'Hyderabad', state: 'Telangana', address: '56 Banjara Hills, Road No. 2', contact: '040-2345-6789' },
  { name: 'Phoenix Hospital Admin', hospitalName: 'Phoenix Hospital & Research Center', city: 'Chennai', state: 'Tamil Nadu', address: '34 Anna Salai, Guindy', contact: '044-2345-6789' },
  { name: 'Lifeline Medical Admin', hospitalName: 'Lifeline Medical Institute', city: 'Pune', state: 'Maharashtra', address: '90 FC Road, Shivajinagar', contact: '020-2345-6789' },
  { name: 'MediCare Plus Admin', hospitalName: 'MediCare Plus Hospital', city: 'Kolkata', state: 'West Bengal', address: '23 Park Street', contact: '033-2345-6789' },
  { name: 'Royal Health Admin', hospitalName: 'Royal Health & Wellness', city: 'Jaipur', state: 'Rajasthan', address: '67 MI Road, Civil Lines', contact: '0141-2345-6789' },
]

const BLOG_POSTS = [
  {
    title: '10 Essential Tips for a Healthy Heart',
    permalink: '10-essential-tips-healthy-heart',
    type: 'Blog',
    content: `<h2>Introduction</h2><p>Heart disease remains one of the leading causes of death worldwide. However, the good news is that most heart-related conditions are preventable through lifestyle modifications and early detection. In this comprehensive guide, we explore ten essential tips backed by medical research that can help you maintain a healthy heart.</p><h2>1. Maintain a Balanced Diet</h2><p>A heart-healthy diet is rich in fruits, vegetables, whole grains, and lean proteins. The Mediterranean diet, which emphasizes olive oil, fish, and nuts, has been shown to reduce the risk of heart disease by up to 30%. Limit your intake of saturated fats, trans fats, and sodium.</p><h2>2. Exercise Regularly</h2><p>Aim for at least 150 minutes of moderate-intensity aerobic exercise per week. This can include brisk walking, swimming, cycling, or jogging. Regular exercise strengthens your heart muscle, improves blood circulation, and helps maintain a healthy weight.</p><h2>3. Manage Stress Effectively</h2><p>Chronic stress can contribute to high blood pressure and other risk factors for heart disease. Practice relaxation techniques such as deep breathing, meditation, or yoga. Taking time for hobbies and social connections also helps manage stress levels.</p><h2>4. Get Regular Health Check-ups</h2><p>Regular screening for blood pressure, cholesterol levels, and blood sugar can help detect potential problems early. Adults should have their blood pressure checked at least once every two years, and cholesterol levels tested every four to six years.</p><h2>5. Quit Smoking</h2><p>Smoking is a major risk factor for heart disease. It damages the lining of your arteries, reduces oxygen in your blood, and raises your blood pressure. Quitting smoking, even after years of the habit, can significantly reduce your risk of heart disease.</p><h2>Conclusion</h2><p>Taking care of your heart is a lifelong commitment. By incorporating these ten tips into your daily routine, you can significantly reduce your risk of heart disease and enjoy a healthier, more active life. Remember, small changes can lead to big improvements in your cardiovascular health.</p>`,
  },
  {
    title: 'Understanding Diabetes: Causes, Symptoms, and Management',
    permalink: 'understanding-diabetes-causes-symptoms-management',
    type: 'Blog',
    content: `<h2>What is Diabetes?</h2><p>Diabetes is a chronic metabolic condition characterized by elevated blood glucose levels. It occurs either when the pancreas does not produce enough insulin (Type 1) or when the body cannot effectively use the insulin it produces (Type 2). According to the International Diabetes Federation, over 537 million adults worldwide are living with diabetes.</p><h2>Common Symptoms</h2><p>Recognizing the early signs of diabetes is crucial for timely intervention. Common symptoms include frequent urination, excessive thirst, unexplained weight loss, fatigue, blurred vision, and slow-healing wounds. If you experience these symptoms, consult a healthcare professional promptly.</p><h2>Risk Factors</h2><p>Several factors increase the risk of developing Type 2 diabetes: family history, obesity, physical inactivity, age (45+), and gestational diabetes during pregnancy. Understanding these risk factors can help you take preventive measures.</p><h2>Management Strategies</h2><p>Effective diabetes management involves a combination of medication, diet control, regular exercise, and blood sugar monitoring. Working closely with your healthcare team to develop a personalized management plan is essential for maintaining quality of life.</p><h2>Prevention</h2><p>While Type 1 diabetes cannot be prevented, Type 2 diabetes can often be delayed or prevented through lifestyle modifications. Maintaining a healthy weight, staying physically active, and eating a balanced diet are key preventive strategies.</p>`,
  },
  {
    title: 'New AI-Powered Diagnostic Tools Transforming Healthcare',
    permalink: 'ai-powered-diagnostic-tools-transforming-healthcare',
    type: 'News',
    content: `<h2>The AI Revolution in Medicine</h2><p>Artificial intelligence is rapidly transforming the healthcare landscape, with diagnostic tools becoming increasingly sophisticated and accurate. From detecting cancer in medical images to predicting patient outcomes, AI is enabling faster and more precise diagnoses than ever before.</p><h2>Breakthrough Technologies</h2><p>Recent developments include AI systems that can analyze chest X-rays for pneumonia with accuracy surpassing that of radiologists, and algorithms that can detect early signs of diabetic retinopathy from retinal images. These tools are particularly valuable in resource-limited settings where specialist expertise may be scarce.</p><h2>Impact on Patient Care</h2><p>The integration of AI diagnostics is reducing waiting times for results, improving diagnostic accuracy, and enabling personalized treatment plans. Patients benefit from earlier detection of diseases, which often leads to better treatment outcomes and reduced healthcare costs.</p><h2>Challenges Ahead</h2><p>Despite the promise, challenges remain in terms of data privacy, algorithmic bias, and the need for regulatory frameworks. The medical community is working to address these concerns while continuing to harness the potential of AI in healthcare.</p>`,
  },
  {
    title: 'Mental Health Awareness: Breaking the Stigma',
    permalink: 'mental-health-awareness-breaking-stigma',
    type: 'Blog',
    content: `<h2>Why Mental Health Matters</h2><p>Mental health is just as important as physical health, yet it often receives far less attention. According to the WHO, one in four people globally will experience a mental health condition at some point in their lives. Despite this prevalence, stigma and misconceptions continue to prevent many from seeking help.</p><h2>Common Mental Health Conditions</h2><p>Depression, anxiety disorders, bipolar disorder, and PTSD are among the most common mental health conditions. Each of these conditions can significantly impact daily functioning, relationships, and overall quality of life. Early recognition and treatment are crucial.</p><h2>Seeking Help is Strength</h2><p>One of the most persistent myths about mental health is that seeking help is a sign of weakness. In reality, acknowledging that you need support and taking steps to get it is a courageous act. Therapy, medication, and lifestyle changes can all play important roles in recovery.</p><h2>Building a Supportive Community</h2><p>Creating an environment where people feel comfortable discussing their mental health is essential. This starts with education, open conversations, and treating mental health with the same importance as physical health.</p>`,
  },
  {
    title: 'Telemedicine: The Future of Healthcare Access in India',
    permalink: 'telemedicine-future-healthcare-access-india',
    type: 'News',
    content: `<h2>The Rise of Telemedicine in India</h2><p>India has witnessed a dramatic increase in telemedicine adoption since 2020, with the market projected to reach $5.5 billion by 2025. The combination of widespread smartphone penetration and improved internet connectivity has made virtual healthcare consultations accessible to millions across the country.</p><h2>Bridging the Urban-Rural Divide</h2><p>One of the most significant benefits of telemedicine is its ability to connect patients in rural and underserved areas with specialist doctors in urban centers. This is particularly impactful in a country where over 65% of the population lives in rural areas with limited access to healthcare facilities.</p><h2>Government Initiatives</h2><p>The Indian government has launched several initiatives to promote digital health, including the National Telemedicine Portal and the Ayushman Bharat Digital Mission. These programs aim to create a comprehensive digital health ecosystem that benefits all citizens.</p><h2>Challenges and Opportunities</h2><p>While telemedicine offers tremendous potential, challenges such as digital literacy, internet reliability in rural areas, and regulatory frameworks need to be addressed. However, the overall trajectory is overwhelmingly positive, with telemedicine set to play a central role in India's healthcare future.</p>`,
  },
  {
    title: 'Childhood Vaccinations: A Complete Guide for Parents',
    permalink: 'childhood-vaccinations-complete-guide-parents',
    type: 'Blog',
    content: `<h2>Why Vaccinations Matter</h2><p>Vaccinations are one of the greatest public health achievements in history. They have eliminated or drastically reduced many deadly diseases that once killed or disabled millions of children. Following the recommended vaccination schedule is one of the most important things parents can do to protect their children's health.</p><h2>The Recommended Schedule</h2><p>The Indian Academy of Pediatrics recommends a comprehensive vaccination schedule starting from birth. Key vaccines include BCG, OPV, Hepatitis B, DPT, MMR, and many others. Each vaccine is carefully timed to provide maximum protection when a child is most vulnerable.</p><h2>Addressing Common Concerns</h2><p>Many parents have questions about vaccine safety. It is important to know that vaccines undergo rigorous testing before approval and continuous monitoring after. Side effects are generally mild and temporary, while the protection they offer against serious diseases is immense.</p><h2>Conclusion</h2><p>Keeping your child's vaccinations up to date is one of the best investments you can make in their long-term health. Work closely with your pediatrician to ensure your child receives all recommended vaccines on schedule.</p>`,
  },
  {
    title: 'The Benefits of Yoga for Chronic Pain Management',
    permalink: 'benefits-yoga-chronic-pain-management',
    type: 'Blog',
    content: `<h2>Yoga and Chronic Pain</h2><p>Chronic pain affects millions of people worldwide and can significantly impact quality of life. While conventional treatments like medication and physical therapy are important,越来越多的研究支持瑜伽作为一种有效的辅助疗法来管理慢性疼痛。</p><h2>Scientific Evidence</h2><p>Numerous studies have demonstrated that regular yoga practice can reduce chronic lower back pain by up to 40%. Research published in the Annals of Internal Medicine found that yoga was as effective as physical therapy for chronic low back pain, with benefits lasting up to a year.</p><h2>Getting Started Safely</h2><p>If you are new to yoga and dealing with chronic pain, it is important to start gently and under proper guidance. Chair yoga and restorative yoga are excellent starting points. Always consult your healthcare provider before beginning any new exercise regimen.</p><h2>Mind-Body Connection</h2><p>Yoga's effectiveness in pain management goes beyond physical stretching. The mindfulness and breathing components help reduce stress, which is known to amplify pain perception. This mind-body approach is what makes yoga uniquely beneficial for chronic pain sufferers.</p>`,
  },
  {
    title: 'Government Launches National Digital Health Mission 2.0',
    permalink: 'government-launches-national-digital-health-mission-2',
    type: 'News',
    content: `<h2>NDHM 2.0: What's New</h2><p>The Indian government has announced the next phase of the National Digital Health Mission (NDHM 2.0), expanding its scope to integrate AI-powered diagnostics, telemedicine services, and personalized health records for all citizens. This ambitious initiative aims to create a universal health ID system linked to comprehensive digital health records.</p><h2>Key Features</h2><p>The updated platform will include real-time health monitoring through wearable device integration, AI-assisted preliminary diagnosis, and seamless connection between patients, doctors, and hospitals across the country. The government has allocated significant funding for infrastructure development and training programs.</p><h2>Impact on Healthcare Delivery</h2><p>Healthcare experts predict that NDHM 2.0 will significantly reduce diagnostic errors, improve treatment outcomes, and make healthcare more accessible and affordable. The integration of digital health records will enable better continuity of care and reduce unnecessary duplicate tests.</p><h2>Implementation Timeline</h2><p>The phased rollout is expected to begin in major metropolitan areas by the end of this year, with complete national coverage targeted within three years. The government is collaborating with private healthcare providers and technology companies to ensure smooth implementation.</p>`,
  },
  {
    title: 'Summer Health Tips: Staying Safe in the Heat',
    permalink: 'summer-health-tips-staying-safe-heat',
    type: 'Blog',
    content: `<h2>Beat the Heat Safely</h2><p>As temperatures soar during the Indian summer, it is essential to take precautions to protect your health. Heat-related illnesses can range from mild heat cramps to life-threatening heat stroke. Here are practical tips to stay safe and healthy during the hot months.</p><h2>Stay Hydrated</h2><p>Drinking plenty of water is the most important step. Aim for at least 8-10 glasses of water daily, and increase this if you are physically active. Avoid excessive caffeine and alcohol, as they can contribute to dehydration. Include water-rich fruits like watermelon and cucumber in your diet.</p><h2>Time Your Activities</h2><p>Avoid outdoor activities during peak heat hours (10 AM to 4 PM). If you must be outdoors, take frequent breaks in shaded areas and wear light-colored, loose-fitting clothing. Apply sunscreen with at least SPF 30 to protect your skin from UV damage.</p><h2>Recognize Warning Signs</h2><p>Be aware of heat exhaustion symptoms: heavy sweating, weakness, cold and clammy skin, fast and weak pulse, nausea, and fainting. If you or someone else experiences these symptoms, move to a cooler place, apply cool cloths, and sip water. Seek medical attention if symptoms worsen.</p>`,
  },
  {
    title: 'India Achieves Milestone in Universal Immunization Coverage',
    permalink: 'india-milestone-universal-immunization-coverage',
    type: 'News',
    content: `<h2>A Historic Achievement</h2><p>India has reached a significant public health milestone with universal immunization coverage now exceeding 90% for all basic childhood vaccines. This achievement, announced by the Ministry of Health and Family Welfare, represents years of concerted effort through programs like Mission Indradhanush and Intensified Mission Indradhanush.</p><h2>The Numbers</h2><p>According to the latest National Family Health Survey data, full immunization coverage among children aged 12-23 months has increased from 62% in 2015-16 to over 90% in the current survey round. This improvement translates to millions of additional children being protected against vaccine-preventable diseases.</p><h2>Key Success Factors</h2><p>Experts attribute this success to several factors: improved cold chain infrastructure, mobile vaccination units reaching remote areas, awareness campaigns, and the dedication of healthcare workers at the grassroots level. Technology has also played a role, with digital tracking systems helping identify and reach unvaccinated children.</p><h2>Looking Ahead</h2><p>While celebrating this milestone, health officials emphasize the need to sustain these gains and work toward introducing newer vaccines into the national program, including those for rotavirus, pneumococcal disease, and HPV.</p>`,
  },
]

const SCHEDULES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

async function main() {
  console.log('Seeding public data...')

  // Seed Admin user for blog author
  const adminEmail = 'admin@doctorooms.com'
  let adminUser = await db.user.findUnique({ where: { email: adminEmail } })
  if (!adminUser) {
    adminUser = await db.user.create({
      data: {
        name: 'Doctorooms Admin',
        email: adminEmail,
        password: await hash('admin123', 10),
        role: 'admin',
        status: 'Active',
        profileImg: 'default.png',
      },
    })
    console.log('Created admin user')
  }

  // Seed Doctors
  const doctorUsers = []
  for (const d of DOCTOR_NAMES) {
    const email = d.name.toLowerCase().replace(/[^a-z]/g, '').slice(0, 8) + '@doctorooms.com'
    let user = await db.user.findUnique({ where: { email } })
    if (!user) {
      user = await db.user.create({
        data: {
          name: d.name,
          email,
          password: await hash('doctor123', 10),
          role: 'doctor',
          status: 'Active',
          profileImg: 'default.png',
          mobileNo: `98765${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
          doctor: {
            create: {
              specialization: d.spec,
              city: d.city,
              state: d.state,
              fees: d.fees,
              emergencyCharge: Math.round(d.fees * 1.5),
              experience: d.exp,
              education: d.edu,
              description: d.desc,
              address: `${Math.floor(Math.random() * 500) + 1}, Health Avenue`,
              contactNo: `0${Math.floor(Math.random() * 9000 + 1000)}-234-${Math.floor(Math.random() * 9000 + 1000)}`,
              isEmergency: Math.random() > 0.6,
              doctorType: d.spec,
            },
          },
        },
      })
      console.log(`Created doctor: ${d.name}`)
    } else {
      user = await db.user.findUnique({
        where: { email },
        include: { doctor: true },
      })
    }
    // Re-fetch with doctor relation included for new users too
    if (!user!.doctor) {
      user = await db.user.findUnique({
        where: { email },
        include: { doctor: true },
      })
    }
    doctorUsers.push(user!)

    // Create schedules for doctor
    const existingSchedules = await db.doctorSchedule.count({
      where: { doctorId: user!.doctor!.id },
    })
    if (existingSchedules === 0) {
      for (const day of SCHEDULES) {
        const startHour = 9 + Math.floor(Math.random() * 2)
        const endHour = 16 + Math.floor(Math.random() * 3)
        await db.doctorSchedule.create({
          data: {
            doctorId: user!.doctor!.id,
            day,
            startTime: `${startHour.toString().padStart(2, '0')}:00`,
            endTime: `${endHour.toString().padStart(2, '0')}:00`,
            slotDuration: 30,
          },
        })
      }
    }
  }

  // Seed ratings for doctors
  const ratingUser = await db.user.findFirst({ where: { role: 'patient' } })
  const patientUsers = await db.user.findMany({ where: { role: 'patient', status: 'Active' }, take: 20 })
  if (patientUsers.length === 0 && ratingUser) {
    patientUsers.push(ratingUser)
  }

  for (const docUser of doctorUsers) {
    if (!docUser.doctor) continue
    const existingRatings = await db.doctorRating.count({
      where: { doctorId: docUser.id },
    })
    if (existingRatings > 0) continue

    const numRatings = 10 + Math.floor(Math.random() * 30)
    for (let i = 0; i < numRatings; i++) {
      const patientId = patientUsers.length > 0
        ? patientUsers[i % patientUsers.length].id
        : docUser.id
      await db.doctorRating.create({
        data: {
          patientId,
          doctorId: docUser.id,
          star: 3 + Math.floor(Math.random() * 3),
          consultationRating: 3 + Math.floor(Math.random() * 3),
          waitTimeRating: 3 + Math.floor(Math.random() * 3),
          staffRating: 3 + Math.floor(Math.random() * 3),
          review: [
            'Excellent doctor, very knowledgeable and patient.',
            'Good experience overall. Would recommend.',
            'Very thorough examination and clear explanation.',
            'Satisfied with the treatment plan.',
            'Professional and caring approach.',
          ][Math.floor(Math.random() * 5)],
          wouldRecommend: Math.random() > 0.15,
        },
      })
    }
    console.log(`Created ratings for ${docUser.name}`)
  }

  // Seed Hospitals
  for (const h of HOSPITAL_NAMES) {
    const email = h.name.toLowerCase().replace(/[^a-z]/g, '').slice(0, 8) + '@hospital.com'
    const existing = await db.user.findUnique({ where: { email } })
    if (!existing) {
      await db.user.create({
        data: {
          name: h.name,
          email,
          password: await hash('hospital123', 10),
          role: 'hospital',
          status: 'Active',
          profileImg: 'default.png',
          mobileNo: `99876${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
          hospital: {
            create: {
              hospitalName: h.hospitalName,
              city: h.city,
              state: h.state,
              address: h.address,
              contactNo: h.contact,
            },
          },
        },
      })
      console.log(`Created hospital: ${h.hospitalName}`)
    }
  }

  // Seed Blog Posts
  for (const post of BLOG_POSTS) {
    const existing = await db.post.findUnique({ where: { permalink: post.permalink } })
    if (!existing) {
      await db.post.create({
        data: {
          title: post.title,
          permalink: post.permalink,
          content: post.content,
          type: post.type,
          status: 'Published',
          authorId: adminUser!.id,
          blogImg: 'default.png',
        },
      })
      console.log(`Created post: ${post.title}`)
    }
  }

  console.log('\n✅ Seeding complete!')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
