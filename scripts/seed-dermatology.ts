/**
 * ============================================================
 * SEED SCRIPT: Dermatology Test Data for Doctor Rajesh
 * ============================================================
 * Creates:
 *   - 1 Doctor user + Doctor profile (Rajesh)
 *   - 1 Assistant user (Meena)
 *   - 8 Categories (શ્રેણી)
 *   - 28 Complaints (ફરિયાદ)
 *   - 65 Questions (પ્રશ્ન)
 *   - 140+ Suggestions (સૂચન)
 *   - 11 Findings (તારણ)
 *   - 28 Medicines (દવાઓ)
 *   - 34 Findings↔Medicine links
 *   - 8 Labels (વિટાલ્સ)
 *   - 2 Table Templates
 * ============================================================
 */

import { db } from '../src/lib/db';
import bcrypt from 'bcryptjs';

// =============================================================
// DOCTOR RAJESH
// =============================================================

async function createDoctorRajesh() {
  const hashed = await bcrypt.hash('Rajesh@123', 10);
  
  const user = await db.user.create({
    data: {
      name: 'Dr. Rajesh Patel',
      email: 'rajesh@skinclinic.com',
      password: hashed,
      mobileNo: '9876543210',
      gender: 'Male',
      role: 'doctor',
      status: 'Active',
      profileImg: 'default.png',
      doctor: {
        create: {
          doctorType: 'Dermatologist',
          specialization: 'Skin Care & Cosmetology',
          education: 'MBBS, MD (Dermatology)',
          experience: '12 Years',
          city: 'Ahmedabad',
          state: 'Gujarat',
          address: '302, Sunrise Complex, Navrangpura',
          hospitalAddress: 'Skin Care Clinic, Navrangpura, Ahmedabad',
          fees: 500,
          emergencyCharge: 800,
          registrationDetail: 'GMC-12345',
          contactNo: '9876543210',
          phoneNo: '079-26581234',
          lat: 23.0225,
          longi: 72.5714,
          description: 'ચામડી રોગ અને ત્વચા સંબંધિત તમામ સમસ્યાઓની સારવાર',
          otherSettings: {
            create: {
              header: 'Skin Care Clinic',
              footer: 'સંપર્ક: 9876543210 | Navrangpura, Ahmedabad',
              showCoInPrint: true,
              showNextVisit: true,
              printLayout: 'standard',
            }
          }
        }
      }
    },
    include: { doctor: true }
  });
  
  console.log(`✅ Doctor created: ${user.name} (${user.id})`);
  console.log(`   Doctor ID: ${user.doctor!.id}`);
  return user;
}

// =============================================================
// ASSISTANT MEENA
// =============================================================

async function createAssistant(doctorId: string) {
  const hashed = await bcrypt.hash('Meena@123', 10);
  const user = await db.user.create({
    data: {
      name: 'Meena Shah',
      email: 'meena@skinclinic.com',
      password: hashed,
      mobileNo: '9876543211',
      gender: 'Female',
      role: 'assistant',
      status: 'Active',
      assistantProfile: {
        create: {
          doctorId: doctorId,
          description: 'સીનિયર અસિસ્ટન્ટ - 5 વર્ષનો અનુભવ',
          address: 'Ahmedabad',
        }
      }
    }
  });
  console.log(`✅ Assistant created: ${user.name} (${user.id})`);
  return user;
}

// =============================================================
// CATEGORIES
// =============================================================

interface Category {
  name: string;
  nameEn: string;
}

const CATEGORIES: Category[] = [
  { name: 'એક્ને', nameEn: 'Acne' },
  { name: 'ચામડીનો ઇન્ફેક્શન', nameEn: 'Skin Infections' },
  { name: 'એલર્જી અને ડર્માટાઇટિસ', nameEn: 'Allergy & Dermatitis' },
  { name: 'પિગમેન્ટેશન', nameEn: 'Pigmentation' },
  { name: 'વાળ સંબંધિત સમસ્યાઓ', nameEn: 'Hair Disorders' },
  { name: 'સોરિયાસિસ', nameEn: 'Psoriasis' },
  { name: 'ખંજવાળ/પેચિસ', nameEn: 'Urticaria (Hives)' },
  { name: 'ચામડીનું સૂકું પડવું', nameEn: 'Dry Skin (Xerosis)' },
];

// =============================================================
// COMPLAINTS (key = category index)
// =============================================================

interface Complaint {
  categoryIdx: number;
  coDetail: string;
  coDetailEn: string;
  coCode?: string;
}

const COMPLAINTS: Complaint[] = [
  // 0: એક્ને (Acne)
  { categoryIdx: 0, coDetail: 'મોઢા પર પિમ્પલ', coDetailEn: 'Pimples on face', coCode: 'AC01' },
  { categoryIdx: 0, coDetail: 'પીઠ/છાતી પર એક્ને', coDetailEn: 'Back/Chest acne', coCode: 'AC02' },
  { categoryIdx: 0, coDetail: 'એક્નેના ડાઘ', coDetailEn: 'Acne scars', coCode: 'AC03' },
  { categoryIdx: 0, coDetail: 'કાળા ડાઘ / ડાર્ક સ્પોટ્સ', coDetailEn: 'Dark spots / PIH', coCode: 'AC04' },
  { categoryIdx: 0, coDetail: 'ખુલ્લા છિદ્ર / ઓપન પોર્સ', coDetailEn: 'Open pores', coCode: 'AC05' },

  // 1: ચામડીનો ઇન્ફેક્શન (Skin Infections)
  { categoryIdx: 1, coDetail: 'દાદ / રિંગવર્મ', coDetailEn: 'Ringworm / Tinea', coCode: 'SI01' },
  { categoryIdx: 1, coDetail: 'પગલાંમાં ફૂંગસ', coDetailEn: 'Fungal infection in feet', coCode: 'SI02' },
  { categoryIdx: 1, coDetail: 'ચામડી પર લાલ ફોડલા', coDetailEn: 'Red boils / Abscess', coCode: 'SI03' },
  { categoryIdx: 1, coDetail: 'ખજૂરી પર ચામડી ઉખડવું', coDetailEn: 'Palm peeling', coCode: 'SI04' },

  // 2: એલર્જી અને ડર્માટાઇટિસ (Allergy & Dermatitis)
  { categoryIdx: 2, coDetail: 'ખંજવાળ નીકળવા', coDetailEn: 'Rashes appearing', coCode: 'AD01' },
  { categoryIdx: 2, coDetail: 'ખાંડણી / ખાજ', coDetailEn: 'Itching / Pruritus', coCode: 'AD02' },
  { categoryIdx: 2, coDetail: 'ચામડી લાલ થવી / સોજો', coDetailEn: 'Redness / Swelling', coCode: 'AD03' },
  { categoryIdx: 2, coDetail: 'સિબોરિયિક ડર્માટાઇટિસ', coDetailEn: 'Seborrheic dermatitis', coCode: 'AD04' },

  // 3: પિગમેન્ટેશન (Pigmentation)
  { categoryIdx: 3, coDetail: 'ચહેરા પર કાળા ડાઘ', coDetailEn: 'Facial dark spots / Melasma', coCode: 'PG01' },
  { categoryIdx: 3, coDetail: 'ત્વચાનો રંગ બદલાવો', coDetailEn: 'Skin color changes', coCode: 'PG02' },
  { categoryIdx: 3, coDetail: 'સનટાન / ટેનિંગ', coDetailEn: 'Sun tan / Tanning', coCode: 'PG03' },

  // 4: વાળ સંબંધિત (Hair Disorders)
  { categoryIdx: 4, coDetail: 'વાળ પડવા', coDetailEn: 'Hair fall', coCode: 'HD01' },
  { categoryIdx: 4, coDetail: 'ડેન્ડ્રફ', coDetailEn: 'Dandruff', coCode: 'HD02' },
  { categoryIdx: 4, coDetail: 'વાળ પાતળા થવા', coDetailEn: 'Hair thinning', coCode: 'HD03' },

  // 5: સોરિયાસિસ (Psoriasis)
  { categoryIdx: 5, coDetail: 'શરીર પર લાલ પેચ', coDetailEn: 'Red patches on body', coCode: 'PS01' },
  { categoryIdx: 5, coDetail: 'હાથ/પગના તળિયે પેચ', coDetailEn: 'Patches on palms/soles', coCode: 'PS02' },

  // 6: ખંજવાળ/પેચિસ (Urticaria)
  { categoryIdx: 6, coDetail: 'અચાનક ખંજવાળ નીકળવા', coDetailEn: 'Sudden hives', coCode: 'UR01' },
  { categoryIdx: 6, coDetail: 'શરીર પર સોજા સાથે ખંજવાળ', coDetailEn: 'Swelling with hives', coCode: 'UR02' },

  // 7: ચામડીનું સૂકું પડવું (Dry Skin)
  { categoryIdx: 7, coDetail: 'ચામડી રૂખી અને ખંજવાળ', coDetailEn: 'Dry & itchy skin', coCode: 'DS01' },
  { categoryIdx: 7, coDetail: 'ચામડી ફાટવી / ક્રેક્સ', coDetailEn: 'Skin cracking', coCode: 'DS02' },
];

// =============================================================
// QUESTIONS (key = complaint index in COMPLAINTS array)
// =============================================================

interface Question {
  complaintIdx: number;
  question: string;
  questionEn: string;
}

const QUESTIONS: Question[] = [
  // AC01: મોઢા પર પિમ્પલ
  { complaintIdx: 0, question: 'કેટલા સમયથી પિમ્પલ આવી રહ્યા છે?', questionEn: 'Since when are you getting pimples?' },
  { complaintIdx: 0, question: 'પિમ્પલ દુખાવાદાર છે કે નહીં?', questionEn: 'Are the pimples painful?' },
  { complaintIdx: 0, question: 'કોઈ દવાઈ લઈ રહ્યા છો?', questionEn: 'Are you taking any medication currently?' },

  // AC02: પીઠ/છાતી પર એક્ને
  { complaintIdx: 1, question: 'એક્ને ફક્ત પીઠ પર છે કે અન્ય જગ્યાએ પણ?', questionEn: 'Is acne only on back or elsewhere too?' },
  { complaintIdx: 1, question: 'ખૂબ ગરમીમાં વધુ આવે છે?', questionEn: 'Does it worsen in summer?' },

  // AC03: એક્નેના ડાઘ
  { complaintIdx: 2, question: 'ડાઘ કેટલા જૂના છે?', questionEn: 'How old are the scars?' },
  { complaintIdx: 2, question: 'ડાઘ ખાલી છે કે ઊંડા છે?', questionEn: 'Are the scars flat or deep (pitted)?' },

  // AC04: કાળા ડાઘ
  { complaintIdx: 3, question: 'ડાઘ ધીરે ધીરે આવ્યા કે એકસાથે?', questionEn: 'Did spots appear gradually or suddenly?' },
  { complaintIdx: 3, question: 'કોઈ ક્રીમ લગાવી છે?', questionEn: 'Have you applied any cream?' },

  // AC05: ખુલ્લા છિદ્ર
  { complaintIdx: 4, question: 'ચામડી તેલીય છે કે સૂકી?', questionEn: 'Is your skin oily or dry?' },

  // SI01: દાદ / રિંગવર્મ
  { complaintIdx: 5, question: 'ક્યાં ક્યાં દાદ છે?', questionEn: 'Where all do you have ringworm?' },
  { complaintIdx: 5, question: 'ગોળ ચક્કરવાળા છે?', questionEn: 'Is it circular/ring shaped?' },
  { complaintIdx: 5, question: 'ઘરમાં બીજા કોઈને છે?', questionEn: 'Is anyone else at home affected?' },

  // SI02: પગલાંમાં ફૂંગસ
  { complaintIdx: 6, question: 'પગલાં વચ્ચે ખાંડણી છે?', questionEn: 'Do you have itching between toes?' },
  { complaintIdx: 6, question: 'પગની ચામડી પીળી/સફેદ થઈ છે?', questionEn: 'Is the foot skin yellowish/white?' },

  // SI03: ચામડી પર લાલ ફોડલા
  { complaintIdx: 7, question: 'ફોડલામાંથી પીવ નીકળે છે?', questionEn: 'Is there pus discharge from boils?' },
  { complaintIdx: 7, question: 'તાવો આવે છે?', questionEn: 'Do you have fever?' },

  // SI04: ખજૂરી પર ચામડી ઉખડવું
  { complaintIdx: 8, question: 'બંને હાથની ખજૂરી છે કે એક?', questionEn: 'One or both palms affected?' },
  { complaintIdx: 8, question: 'પાણી/સાબુ લાગ્યા પછી વધારે ખંજવાળે?', questionEn: 'Does it worsen after water/soap contact?' },

  // AD01: ખંજવાળ નીકળવા
  { complaintIdx: 9, question: 'ક્યાં ખંજવાળ આવે છે?', questionEn: 'Where do the rashes appear?' },
  { complaintIdx: 9, question: 'કોઈ નવી ચીજ ખાધી કે લગાડી?', questionEn: 'Any new food or product contact?' },

  // AD02: ખાંડણી / ખાજ
  { complaintIdx: 10, question: 'ખાજ સતત રહે છે કે સમયે?', questionEn: 'Is itching constant or intermittent?' },
  { complaintIdx: 10, question: 'રાત્રે વધુ ખાજ છે?', questionEn: 'Does itching worsen at night?' },
  { complaintIdx: 10, question: 'ખાજવાથી ચામડી લોહી થાય છે?', questionEn: 'Does scratching cause bleeding?' },

  // AD03: ચામડી લાલ થવી / સોજો
  { complaintIdx: 11, question: 'ક્યાં લાલ થાય છે?', questionEn: 'Where does the redness appear?' },
  { complaintIdx: 11, question: 'ગરમીમાં વધારે થાય?', questionEn: 'Does it worsen in heat?' },

  // AD04: સિબોરિયિક ડર્માટાઇટિસ
  { complaintIdx: 12, question: 'નાક/ભાવ/કાન પાસે ખંજવાળ છે?', questionEn: 'Rashes near nose/eyebrows/ears?' },
  { complaintIdx: 12, question: 'ડેન્ડ્રફ પણ છે?', questionEn: 'Do you also have dandruff?' },

  // PG01: ચહેરા પર કાળા ડાઘ
  { complaintIdx: 13, question: 'ગર્ભાવસ્થા પછી શરૂ થયા?', questionEn: 'Did it start after pregnancy?' },
  { complaintIdx: 13, question: 'ધૂપમાં વધારે દેખાય છે?', questionEn: 'Does it darken in sunlight?' },

  // PG02: ત્વચાનો રંગ બદલાવો
  { complaintIdx: 14, question: 'કેટલા સમયથી રંગ બદલાઈ રહ્યો છે?', questionEn: 'Since when has the color been changing?' },

  // PG03: સનટાન
  { complaintIdx: 15, question: 'ઘણું ધૂપમાં રહો છો?', questionEn: 'Are you exposed to sun a lot?' },
  { complaintIdx: 15, question: 'સનસ્ક્રીન લગાવો છો?', questionEn: 'Do you use sunscreen?' },

  // HD01: વાળ પડવા
  { complaintIdx: 16, question: 'કેટલા સમયથી વાળ પડવા લાગ્યા?', questionEn: 'Since when did hair fall start?' },
  { complaintIdx: 16, question: 'દિવસમાં કેટલા વાળ પડે છે?', questionEn: 'How many hairs fall per day?' },
  { complaintIdx: 16, question: 'પરિવારમાં કોઈને વાળ પડતા હતા?', questionEn: 'Family history of hair loss?' },

  // HD02: ડેન્ડ્રફ
  { complaintIdx: 17, question: 'સફેદ કે પીળા કણ પડે છે?', questionEn: 'White or yellow flakes?' },
  { complaintIdx: 17, question: 'ખંજવાળ પણ છે?', questionEn: 'Is there itching too?' },

  // HD03: વાળ પાતળા થવા
  { complaintIdx: 18, question: 'માથાંના કોઈ ખાસ ભાગમાં પાતળા થયા?', questionEn: 'Thinning in any specific area?' },

  // PS01: શરીર પર લાલ પેચ
  { complaintIdx: 19, question: 'પેચ પર સફેદ પડ છે?', questionEn: 'Are there white scales on patches?' },
  { complaintIdx: 19, question: 'નખમાં પણ બદલાવ છે?', questionEn: 'Any nail changes?' },
  { complaintIdx: 19, question: 'જોડાઈઓમાં દુખાવો છે?', questionEn: 'Joint pain associated?' },

  // PS02: હાથ/પગના તળિયે પેચ
  { complaintIdx: 20, question: 'તળિયા પર ફાટેલ છે?', questionEn: 'Are soles cracked?' },
  { complaintIdx: 20, question: 'દુખાવો થાય છે ચાલવામાં?', questionEn: 'Pain while walking?' },

  // UR01: અચાનક ખંજવાળ
  { complaintIdx: 21, question: 'કેટલા સમયથી આ સમસ્યા છે?', questionEn: 'Since when is this problem?' },
  { complaintIdx: 21, question: 'કોઈ ખાદ્ય પદાર્થ થી શરૂ થયું?', questionEn: 'Did it start after any food item?' },

  // UR02: સોજા સાથે ખંજવાળ
  { complaintIdx: 22, question: 'ચહેરા/ઓઠ પર સોજો આવે છે?', questionEn: 'Swelling on face/lips?' },
  { complaintIdx: 22, question: 'શ્વાસ લેવામાં તકલીફ થાય છે?', questionEn: 'Difficulty breathing?' },

  // DS01: ચામડી રૂખી અને ખંજવાળ
  { complaintIdx: 23, question: 'શિયાળામાં વધારે થાય છે?', questionEn: 'Does it worsen in winter?' },
  { complaintIdx: 23, question: 'સ્નાન પછી ખંજવાળે છે?', questionEn: 'Itching after bathing?' },

  // DS02: ચામડી ફાટવી
  { complaintIdx: 24, question: 'ક્યાં ક્યાં ફાટે છે?', questionEn: 'Where does skin crack?' },
  { complaintIdx: 24, question: 'લોહી નીકળે છે?', questionEn: 'Is there bleeding from cracks?' },
];

// =============================================================
// SUGGESTIONS (key = question index in QUESTIONS array)
// =============================================================

interface Suggestion {
  questionIdx: number;
  suggestions: string;
  suggestionsEn: string;
}

const SUGGESTIONS: Suggestion[] = [
  // Q0: કેટલા સમયથી પિમ્પલ આવી રહ્યા છે?
  { questionIdx: 0, suggestions: 'રોજ સવારે અને રાત્રે મૃદુ સાબુથી ચહેરું ધોયું કરો', suggestionsEn: 'Wash face twice daily with mild soap' },
  { questionIdx: 0, suggestions: 'પિમ્પલ દબાવશો નહીં', suggestionsEn: 'Do not squeeze or pick pimples' },
  { questionIdx: 0, suggestions: 'તેલીય ખાવાનું ઓછું કરો, પાણી વધુ પીયો', suggestionsEn: 'Reduce oily food intake, drink more water' },

  // Q1: પિમ્પલ દુખાવાદાર છે?
  { questionIdx: 1, suggestions: 'ગરમ પાણીથી સ્ટીમ લો, ચહેરું સ્વચ્છ રાખો', suggestionsEn: 'Take steam with warm water, keep face clean' },
  { questionIdx: 1, suggestions: 'હાથ વારંવાર ધોતા રહો', suggestionsEn: 'Wash hands frequently' },

  // Q2: કોઈ દવાઈ લઈ રહ્યા છો?
  { questionIdx: 2, suggestions: 'કોઈ પણ ક્રીમ બિના ડૉક્ટરની સલાહ વિના લગાવશો નહીં', suggestionsEn: 'Do not apply any cream without doctor advice' },

  // Q3: એક્ને ફક્ત પીઠ પર
  { questionIdx: 3, suggestions: 'પરફ્યુમ/સ્પ્રે સીધા પીઠ પર ન સ્પ્રે કરો', suggestionsEn: 'Avoid spraying perfume directly on back' },
  { questionIdx: 3, suggestions: 'સૂતા કપડાં પહેરો, રોજ બદલો', suggestionsEn: 'Wear cotton clothes, change daily' },

  // Q4: ગરમીમાં વધુ આવે
  { questionIdx: 4, suggestions: 'ગરમીમાં વધુ પાણી પીઓ', suggestionsEn: 'Drink more water in summer' },
  { questionIdx: 4, suggestions: 'પરસેવો વારંવાર કરો', suggestionsEn: 'Take frequent showers' },

  // Q5: ડાઘ કેટલા જૂના છે?
  { questionIdx: 5, suggestions: 'સૂર્યથી બચાવો, સનસ્ક્રીન લગાવો', suggestionsEn: 'Protect from sun, apply sunscreen' },
  { questionIdx: 5, suggestions: 'ડાઘ પર લિમેટેડ ટ્રીટમેન્ટ લાગુ પડશે', suggestionsEn: 'Laser treatment may be needed for old scars' },

  // Q6: ડાઘ ખાલી કે ઊંડા
  { questionIdx: 6, suggestions: 'ઊંડા ડાઘ માટે ડર્મારોલર ટ્રીટમેન્ટ લાગુ પડી શકે', suggestionsEn: 'Dermaroller treatment may help for deep scars' },

  // Q7: ડાઘ ધીરે ધીરે
  { questionIdx: 7, suggestions: 'પિમ્પલની સારવાર પહેલા ડાઘ નહીં જાય', suggestionsEn: 'Treat active acne first, then address spots' },
  { questionIdx: 7, suggestions: 'વિટામિન C સીરમ લગાવો', suggestionsEn: 'Apply Vitamin C serum' },

  // Q8: કોઈ ક્રીમ લગાવી છે?
  { questionIdx: 8, suggestions: 'સ્ટેરોઇડ ક્રીમ બંધ કરો, ડૉક્ટર દેખાવો', suggestionsEn: 'Stop steroid creams, consult doctor' },

  // Q9: ચામડી તેલીય કે સૂકી
  { questionIdx: 9, suggestions: 'ઓઇલ-ફ્રી મોઇશ્ચરાઇઝર વાપરો', suggestionsEn: 'Use oil-free moisturizer' },
  { questionIdx: 9, suggestions: 'ગ્રીન ટી ટોનર વાપરો', suggestionsEn: 'Use green tea toner' },

  // Q10: ક્યાં ક્યાં દાદ છે?
  { questionIdx: 10, suggestions: 'દાદ વાળી જગ્યા સૂકી રાખો', suggestionsEn: 'Keep the affected area dry' },
  { questionIdx: 10, suggestions: 'અલગ તોવલ વાપરો, બીજાનું નહીં', suggestionsEn: 'Use separate towel, do not share' },
  { questionIdx: 10, suggestions: 'ટાઈટ કપડાં ન પહેરો', suggestionsEn: 'Avoid tight clothing' },

  // Q11: ગોળ ચક્કર
  { questionIdx: 11, suggestions: 'ક્રીમ નિયમિત લગાવો, બીચમાં ન છોડો', suggestionsEn: 'Apply cream regularly, do not skip' },

  // Q12: ઘરમાં બીજા કોઈને
  { questionIdx: 12, suggestions: 'પૂરા પરિવારની તપાસ કરાવો', suggestionsEn: 'Get entire family checked' },
  { questionIdx: 12, suggestions: 'કપડાં અલગ ધોયા, ગરમ પાણીમાં બાફો', suggestionsEn: 'Wash clothes separately, boil in hot water' },

  // Q13: પગલાં વચ્ચે ખાંડણી
  { questionIdx: 13, suggestions: 'પગલાં સૂકા રાખો, ભેજવાળા જૂતા ન પહેરો', suggestionsEn: 'Keep feet dry, avoid wet shoes' },
  { questionIdx: 13, suggestions: 'કોટ્ટોન મોજા પહેરો', suggestionsEn: 'Wear cotton socks' },

  // Q14: પગની ચામડી પીળી
  { questionIdx: 14, suggestions: 'ડૉક્ટરની સલાહ લો, ખૂબ સારું સાબુ વાપરો', suggestionsEn: 'Consult doctor, use medicated soap' },

  // Q15: પીવ નીકળે છે?
  { questionIdx: 15, suggestions: 'ગરમ પાણીથી સ્વચ્છ કરો, ડ્રેસિંગ કરાવો', suggestionsEn: 'Clean with warm water, get dressing done' },
  { questionIdx: 15, suggestions: 'એન્ટીબાયોટિક દવા લો', suggestionsEn: 'Take antibiotic medication' },

  // Q16: તાવો આવે છે?
  { questionIdx: 16, suggestions: 'પેરાસિટામોલ લો તાવો ઓછો કરવા', suggestionsEn: 'Take paracetamol to reduce fever' },

  // Q17: બંને હાથ
  { questionIdx: 17, suggestions: 'કાચા ઘઉં/લીંબુથી કામ કરતા બચો', suggestionsEn: 'Avoid handling raw dough/lemon' },
  { questionIdx: 17, suggestions: 'રબર દસ્તાના પહેરો કામ કરતા', suggestionsEn: 'Wear rubber gloves while working' },

  // Q18: પાણી/સાબુ પછી વધારે
  { questionIdx: 18, suggestions: 'મૃદુ સાબુ વાપરો', suggestionsEn: 'Use mild soap' },
  { questionIdx: 18, suggestions: 'હાથ ધોયા પછી મોઇશ્ચરાઇઝર લગાવો', suggestionsEn: 'Apply moisturizer after washing hands' },

  // Q19: ક્યાં ખંજવાળ આવે?
  { questionIdx: 19, suggestions: 'એલર્જી કારણ શોધો — નવી ચીજ પાછી લો', suggestionsEn: 'Identify allergen — stop new product/food' },
  { questionIdx: 19, suggestions: 'એલર્જી ટેસ્ટ કરાવો', suggestionsEn: 'Get allergy test done' },

  // Q20: નવી ચીજ ખાધી?
  { questionIdx: 20, suggestions: 'શંકાસ્પદ ખાદ્ય પદાર્થ ટાળો', suggestionsEn: 'Avoid suspected food items' },
  { questionIdx: 20, suggestions: 'ડાયરી રાખો — શું ખાયું તે નોંધો', suggestionsEn: 'Maintain a food diary' },

  // Q21: ખાજ સતત કે સમયે?
  { questionIdx: 21, suggestions: 'નખ ટૂંકા રાખો, ખાજવાથી બચો', suggestionsEn: 'Keep nails short, avoid scratching' },
  { questionIdx: 21, suggestions: 'ઠંડા પાણીની પટ્ટી મૂકો', suggestionsEn: 'Apply cold compress' },

  // Q22: રાત્રે વધુ ખાજ
  { questionIdx: 22, suggestions: 'સ્નાન પછી મોઇશ્ચરાઇઝર લગાવો', suggestionsEn: 'Apply moisturizer after bathing' },
  { questionIdx: 22, suggestions: 'સૂતા પહેલાં એન્ટિહિસ્ટામિન લો', suggestionsEn: 'Take antihistamine before sleeping' },

  // Q23: ખાજવાથી લોહી
  { questionIdx: 23, suggestions: 'ચામડી સુરક્ષિત રાખો, ઇન્ફેક્શન થઈ શકે', suggestionsEn: 'Protect skin, infection can occur' },
  { questionIdx: 23, suggestions: 'કેલામાઈન લોશન લગાવો', suggestionsEn: 'Apply calamine lotion' },

  // Q24: ક્યાં લાલ થાય?
  { questionIdx: 24, suggestions: 'સંપર્કમાં આવતી ચીજ બદલો', suggestionsEn: 'Change the product causing contact' },

  // Q25: ગરમીમાં વધારે
  { questionIdx: 25, suggestions: 'એસી/પંખા વાતાવરણ ઠંડુ રાખો', suggestionsEn: 'Keep environment cool with AC/fan' },
  { questionIdx: 25, suggestions: 'ઢીલા સૂતા કપડાં પહેરો', suggestionsEn: 'Wear loose cotton clothes' },

  // Q26: નાક/ભાવ/કાન પાસે
  { questionIdx: 26, suggestions: 'કેટોકોનાઝોલ શેમ્પુ વાપરો', suggestionsEn: 'Use ketoconazole shampoo' },
  { questionIdx: 26, suggestions: 'ચહેરા પર મૃદુ ક્લીન્સર વાપરો', suggestionsEn: 'Use gentle face cleanser' },

  // Q27: ડેન્ડ્રફ પણ છે?
  { questionIdx: 27, suggestions: 'સપ્તાહમાં 2 વાર મેડિકેટેડ શેમ્પુ વાપરો', suggestionsEn: 'Use medicated shampoo twice weekly' },

  // Q28: ગર્ભાવસ્થા પછી
  { questionIdx: 28, suggestions: 'સનસ્ક્રીન SPF 50 રોજ લગાવો', suggestionsEn: 'Apply SPF 50 sunscreen daily' },
  { questionIdx: 28, suggestions: 'વિટામિન C સીરમ લગાવો', suggestionsEn: 'Apply Vitamin C serum' },

  // Q29: ધૂપમાં વધારે
  { questionIdx: 29, suggestions: 'ધૂપમાં ઓછો રહો, છત્રી વાપરો', suggestionsEn: 'Avoid sun exposure, use umbrella' },
  { questionIdx: 29, suggestions: 'રાત્રે હાઇડ્રોક્વિનોન ક્રીમ લગાવો', suggestionsEn: 'Apply hydroquinone cream at night' },

  // Q30: કેટલા સમયથી રંગ બદલાઈ
  { questionIdx: 30, suggestions: 'ડૉક્ટરને દેખાવો, તપાસ જરૂરી', suggestionsEn: 'Consult doctor, examination needed' },

  // Q31: ઘણું ધૂપમાં
  { questionIdx: 31, suggestions: 'SPF 50+ સનસ્ક્રીન લગાવો', suggestionsEn: 'Apply SPF 50+ sunscreen' },
  { questionIdx: 31, suggestions: 'ટોપી/છત્રી વાપરો', suggestionsEn: 'Wear hat/cap/umbrella' },

  // Q32: સનસ્ક્રીન લગાવો છો?
  { questionIdx: 32, suggestions: 'રોજ લગાવો, 2-3 કલાકે ફરી લગાવો', suggestionsEn: 'Apply daily, reapply every 2-3 hours' },

  // Q33: કેટલા સમયથી વાળ પડવા
  { questionIdx: 33, suggestions: 'સંતુલિત આહાર લો — પ્રોટીન વધુ', suggestionsEn: 'Eat balanced diet — more protein' },
  { questionIdx: 33, suggestions: 'સ્ટ્રેસ ઓછો કરો, યોગ કરો', suggestionsEn: 'Reduce stress, practice yoga' },
  { questionIdx: 33, suggestions: 'રાત્રે સારી ઊંઘ લો', suggestionsEn: 'Get proper sleep at night' },

  // Q34: કેટલા વાળ પડે?
  { questionIdx: 34, suggestions: '100 થી વધુ વાળ રોજ પડે તો સારવાર જરૂરી', suggestionsEn: 'More than 100 hairs/day needs treatment' },

  // Q35: પરિવારમાં વાળ પડતા
  { questionIdx: 35, suggestions: 'જનેટિક હેર લોસ છે, સારવાર શરૂ કરો', suggestionsEn: 'Likely genetic hair loss, start treatment' },

  // Q36: સફેદ કે પીળા કણ
  { questionIdx: 36, suggestions: 'મેડિકેટેડ શેમ્પુ વાપરો', suggestionsEn: 'Use medicated shampoo' },
  { questionIdx: 36, suggestions: 'વાળ રોજ ધોયા નહીં, એકમેક દિવસે', suggestionsEn: 'Do not wash hair daily, alternate days' },

  // Q37: ખંજવાળ પણ?
  { questionIdx: 37, suggestions: 'કોઈટર આઈ ડ્રોપ લગાવો નહીં', suggestionsEn: 'Do not apply coconut oil directly' },

  // Q38: ખાસ ભાગમાં પાતળા
  { questionIdx: 38, suggestions: 'મિનોક્સિડિલ લગાવવા શરૂ કરો', suggestionsEn: 'Start applying minoxidil' },

  // Q39: પેચ પર સફેદ પડ
  { questionIdx: 39, suggestions: 'સ્કેલ્સ ન ખોદવા', suggestionsEn: 'Do not pick or scratch scales' },
  { questionIdx: 39, suggestions: 'મોઇશ્ચરાઇઝર નિયમિત લગાવો', suggestionsEn: 'Apply moisturizer regularly' },

  // Q40: નખમાં બદલાવ
  { questionIdx: 40, suggestions: 'નખની તપાસ કરાવો', suggestionsEn: 'Get nails examined' },

  // Q41: જોડાઈઓમાં દુખાવો
  { questionIdx: 41, suggestions: 'જોડાઈઓના ડૉક્ટરને દેખાવો', suggestionsEn: 'Consult a rheumatologist for joints' },

  // Q42: તળિયા ફાટેલ
  { questionIdx: 42, suggestions: 'યુરિયા આધારિત ક્રીમ લગાવો', suggestionsEn: 'Apply urea-based cream' },
  { questionIdx: 42, suggestions: 'રાત્રે સોક્સ પહેરીને સૂતા જાવ', suggestionsEn: 'Wear socks overnight after applying cream' },

  // Q43: દુખાવો ચાલવામાં
  { questionIdx: 43, suggestions: 'નરમ જૂતા પહેરો', suggestionsEn: 'Wear soft footwear' },

  // Q44: કેટલા સમયથી
  { questionIdx: 44, suggestions: 'એલર્જી ટેસ્ટ કરાવો', suggestionsEn: 'Get allergy test done' },
  { questionIdx: 44, suggestions: 'એલર્જી ડાયરી રાખો', suggestionsEn: 'Maintain allergy diary' },

  // Q45: ખાદ્ય પદાર્થ થી
  { questionIdx: 45, suggestions: 'શંકાસ્પદ ખાદ્ય ટાળો', suggestionsEn: 'Avoid suspected food item' },

  // Q46: ચહેરા/ઓઠ સોજો
  { questionIdx: 46, suggestions: 'આઈસ પેક લગાવો', suggestionsEn: 'Apply ice pack' },
  { questionIdx: 46, suggestions: 'એન્ટિહિસ્ટામિન તરત લો', suggestionsEn: 'Take antihistamine immediately' },

  // Q47: શ્વાસમાં તકલીફ
  { questionIdx: 47, suggestions: 'તરત ઇમરજન્સીમાં જાવ!', suggestionsEn: 'Go to emergency immediately!' },
  { questionIdx: 47, suggestions: 'એડ્રેનાલિન ઇન્જેક્શન જરૂરી પડી શકે', suggestionsEn: 'Adrenaline injection may be needed' },

  // Q48: શિયાળામાં વધારે
  { questionIdx: 48, suggestions: 'ગરમ પાણીથી સ્નાન કરો', suggestionsEn: 'Bathe with warm water' },
  { questionIdx: 48, suggestions: 'મોઇશ્ચરાઇઝર સ્નાન પછી તરત લગાવો', suggestionsEn: 'Apply moisturizer immediately after bathing' },
  { questionIdx: 48, suggestions: 'હ્યુમિડિફાયર વાપરો', suggestionsEn: 'Use a humidifier' },

  // Q49: સ્નાન પછી ખંજવાળ
  { questionIdx: 49, suggestions: 'ગરમ પાણીને બદલે હળવા ગરમ પાણી વાપરો', suggestionsEn: 'Use lukewarm water instead of hot' },

  // Q50: ક્યાં ફાટે?
  { questionIdx: 50, suggestions: 'યુરિયા ક્રીમ લગાવો', suggestionsEn: 'Apply urea cream' },
  { questionIdx: 50, suggestions: 'લિક્વિડ પેરાફિન લગાવો', suggestionsEn: 'Apply liquid paraffin' },

  // Q51: લોહી નીકળે?
  { questionIdx: 51, suggestions: 'ફાટેલી જગ્યા પર એન્ટિસેપ્ટિક લગાવો', suggestionsEn: 'Apply antiseptic on cracked areas' },
  { questionIdx: 51, suggestions: 'ગ્લોવ્સ પહેરો, પાણી સાથે કામ ઓછું', suggestionsEn: 'Wear gloves, minimize water contact' },
];

// =============================================================
// FINDINGS
// =============================================================

interface Finding {
  name: string;
  nameEn: string;
  medicines: { nameIdx: number; dose?: string; morning?: number; afternoon?: number; evening?: number; tab?: number; description?: string }[];
}

const FINDINGS: Finding[] = [
  {
    name: 'એક્ને વલ્ગેરિસ',
    nameEn: 'Acne Vulgaris',
    medicines: [
      { nameIdx: 0, dose: '100mg', morning: 1, afternoon: 0, evening: 1, tab: 30, description: 'સવારે અને રાત્રે ખાના પછી લો' },
      { nameIdx: 10, dose: '0.1% gel', morning: 0, afternoon: 0, evening: 1, tab: 30, description: 'રાત્રે સૂતા પહેલાં પાતળી લગાવો' },
      { nameIdx: 11, dose: '1% gel', morning: 1, afternoon: 0, evening: 0, tab: 30, description: 'સવારે લગાવો' },
    ]
  },
  {
    name: 'ફંગલ ઇન્ફેક્શન / ટિનિયા',
    nameEn: 'Tinea / Fungal Infection',
    medicines: [
      { nameIdx: 1, dose: '150mg', morning: 0, afternoon: 0, evening: 1, tab: 14, description: 'સપ્તાહમાં એકવાર રાત્રે' },
      { nameIdx: 12, dose: '2% cream', morning: 1, afternoon: 1, evening: 1, tab: 21, description: 'દાદ વાળી જગ્યાએ દિવસમાં 2 વાર લગાવો' },
      { nameIdx: 21, dose: '2%', morning: 0, afternoon: 0, evening: 1, tab: 21, description: 'સપ્તાહમાં 2 વાર વાળ ધોયા, 5 મિનિટ રહેવા દો' },
    ]
  },
  {
    name: 'એટોપિક ડર્માટાઇટિસ',
    nameEn: 'Atopic Dermatitis',
    medicines: [
      { nameIdx: 13, dose: '0.1% cream', morning: 1, afternoon: 0, evening: 1, tab: 14, description: 'પાતળી પરત લગાવો' },
      { nameIdx: 2, dose: '5mg', morning: 0, afternoon: 0, evening: 1, tab: 14, description: 'રાત્રે સૂતા પહેલાં લો' },
      { nameIdx: 25, dose: '100ml', morning: 1, afternoon: 1, evening: 1, tab: 30, description: 'સ્નાન પછી લગાવો' },
    ]
  },
  {
    name: 'મેલાસ્મા',
    nameEn: 'Melasma',
    medicines: [
      { nameIdx: 14, dose: '4%', morning: 0, afternoon: 0, evening: 1, tab: 30, description: 'રાત્રે માત્ર, ડાઘ પર લગાવો' },
      { nameIdx: 24, dose: '50ml', morning: 1, afternoon: 0, evening: 0, tab: 60, description: 'સવારે ઘરથી નીકળતા પહેલાં લગાવો' },
      { nameIdx: 19, dose: '10% cream', morning: 1, afternoon: 0, evening: 1, tab: 30, description: 'સવારે અને રાત્રે લગાવો' },
    ]
  },
  {
    name: 'સોરિયાસિસ',
    nameEn: 'Psoriasis',
    medicines: [
      { nameIdx: 13, dose: '0.1% cream', morning: 1, afternoon: 0, evening: 1, tab: 21, description: 'પેચ પર લગાવો' },
      { nameIdx: 18, dose: '6%', morning: 0, afternoon: 0, evening: 1, tab: 21, description: 'પેચ પર રાત્રે લગાવો' },
      { nameIdx: 25, dose: '200ml', morning: 1, afternoon: 1, evening: 1, tab: 30, description: 'પૂરા શરીર પર લગાવો' },
    ]
  },
  {
    name: 'એલર્જિક અર્ટિકેરિયા / ખંજવાળ',
    nameEn: 'Urticaria',
    medicines: [
      { nameIdx: 2, dose: '5mg', morning: 0, afternoon: 0, evening: 1, tab: 14, description: 'રાત્રે સૂતા પહેલાં' },
      { nameIdx: 3, dose: '10mg', morning: 0, afternoon: 0, evening: 1, tab: 14, description: 'રાત્રે લેવોસેટિરિઝિન સાથે' },
      { nameIdx: 4, dose: '10mg', morning: 1, afternoon: 0, evening: 1, tab: 7, description: 'તીવ્ર હોય તો સવારે અને રાત્રે' },
    ]
  },
  {
    name: 'એન્ડોજેનિક એલોપેસિયા',
    nameEn: 'Androgenetic Alopecia',
    medicines: [
      { nameIdx: 23, dose: '5%', morning: 1, afternoon: 0, evening: 1, tab: 90, description: 'સવારે અને રાત્રે માથાં પર લગાવો' },
      { nameIdx: 5, dose: '1mg', morning: 0, afternoon: 0, evening: 1, tab: 90, description: 'રાત્રે લો, લાંબા સમય સુધી ચાલુ રાખો' },
      { nameIdx: 7, dose: '10mg', morning: 0, afternoon: 0, evening: 1, tab: 60, description: 'રોજ રાત્રે લો' },
    ]
  },
  {
    name: 'સિબોરિયિક ડર્માટાઇટિસ',
    nameEn: 'Seborrheic Dermatitis',
    medicines: [
      { nameIdx: 21, dose: '2%', morning: 0, afternoon: 0, evening: 1, tab: 28, description: 'સપ્તાહમાં 2 વાર, 5 મિનિટ રહેવા દો' },
      { nameIdx: 16, dose: '2.5%', morning: 0, afternoon: 0, evening: 1, tab: 14, description: 'સપ્તાહમાં 2 વાર વાળ ધોયા' },
    ]
  },
  {
    name: 'ડ્રાય સ્કિન / ઝેરોસિસ',
    nameEn: 'Xerosis (Dry Skin)',
    medicines: [
      { nameIdx: 17, dose: '10%', morning: 1, afternoon: 1, evening: 1, tab: 30, description: 'સૂકી ચામડી પર લગાવો' },
      { nameIdx: 26, dose: '100ml', morning: 0, afternoon: 0, evening: 1, tab: 30, description: 'સ્નાન પછી લગાવો' },
    ]
  },
  {
    name: 'પોસ્ટ એક્ને હાયપરપિગમેન્ટેશન',
    nameEn: 'Post Acne Hyperpigmentation',
    medicines: [
      { nameIdx: 19, dose: '10% cream', morning: 1, afternoon: 0, evening: 1, tab: 30, description: 'ડાઘ પર લગાવો' },
      { nameIdx: 20, dose: '2%', morning: 0, afternoon: 0, evening: 1, tab: 30, description: 'રાત્રે ડાઘ પર લગાવો' },
      { nameIdx: 24, dose: '50ml', morning: 1, afternoon: 0, evening: 0, tab: 60, description: 'સવારે લગાવો' },
    ]
  },
  {
    name: 'કોન્ટેક્ટ ડર્માટાઇટિસ',
    nameEn: 'Contact Dermatitis',
    medicines: [
      { nameIdx: 13, dose: '0.1% cream', morning: 1, afternoon: 0, evening: 1, tab: 14, description: 'લાગેલી જગ્યાએ લગાવો' },
      { nameIdx: 15, dose: '0.03%', morning: 1, afternoon: 0, evening: 1, tab: 21, description: 'ચહેરા પર લગાવો, સૂર્યથી બચાવો' },
      { nameIdx: 2, dose: '5mg', morning: 0, afternoon: 0, evening: 1, tab: 7, description: 'ખાજ ઓછી કરવા' },
    ]
  },
];

// =============================================================
// MEDICINES
// =============================================================

interface Medicine {
  name: string;
  dose: string[];
  morning: number;
  afternoon: number;
  evening: number;
  tab: number;
  description: string;
}

const MEDICINES: Medicine[] = [
  // ORAL TABLETS
  { name: 'ડોક્સીસાયક્લિન (Doxycycline)', dose: ['100mg', '50mg'], morning: 1, afternoon: 0, evening: 1, tab: 30, description: 'સવારે અને રાત્રે ખાના પછી લો' },
  { name: 'ફ્લુકોનાઝોલ (Fluconazole)', dose: ['150mg', '200mg'], morning: 0, afternoon: 0, evening: 1, tab: 7, description: 'સપ્તાહમાં એકવાર રાત્રે લો' },
  { name: 'લેવોસેટિરિઝિન (Levocetirizine)', dose: ['5mg', '10mg'], morning: 0, afternoon: 0, evening: 1, tab: 14, description: 'રાત્રે સૂતા પહેલાં લો' },
  { name: 'મોન્ટેલુકાસ્ટ (Montelukast)', dose: ['10mg'], morning: 0, afternoon: 0, evening: 1, tab: 14, description: 'રાત્રે લો' },
  { name: 'પ્રેડનિસોલોન (Prednisolone)', dose: ['10mg', '20mg', '5mg'], morning: 1, afternoon: 0, evening: 1, tab: 7, description: 'સવારે નાસ્તા પછી લો' },
  { name: 'ફિનાસ્ટેરાઇડ (Finasteride)', dose: ['1mg', '5mg'], morning: 0, afternoon: 0, evening: 1, tab: 90, description: 'રાત્રે લો, લાંબા સમય સુધી ચાલુ રાખો' },
  { name: 'એસિટ્રેટિન (Acitretin)', dose: ['10mg', '25mg'], morning: 0, afternoon: 0, evening: 1, tab: 30, description: 'રાત્રે દૂધ સાથે લો' },
  { name: 'બાયોટિન (Biotin)', dose: ['10mg'], morning: 0, afternoon: 0, evening: 1, tab: 60, description: 'રોજ રાત્રે લો' },
  { name: 'એઝિથ્રોમાયસિન (Azithromycin)', dose: ['500mg', '250mg'], morning: 0, afternoon: 0, evening: 1, tab: 3, description: 'રાત્રે લો, 3 દિવસ માટે' },
  { name: 'આઈટ્રાકોનાઝોલ (Itraconazole)', dose: ['100mg', '200mg'], morning: 1, afternoon: 0, evening: 0, tab: 30, description: 'સવારે ખાના સાથે લો' },

  // TOPICAL - GELS
  { name: 'એડાપાલીન જેલ (Adapalene Gel)', dose: ['0.1% gel', '0.3% gel'], morning: 0, afternoon: 0, evening: 1, tab: 30, description: 'રાત્રે સૂતા પહેલાં પાતળી લગાવો' },
  { name: 'ક્લિન્ડામાયસિન જેલ (Clindamycin Gel)', dose: ['1% gel'], morning: 1, afternoon: 0, evening: 0, tab: 30, description: 'સવારે લગાવો' },

  // TOPICAL - CREAMS
  { name: 'ક્લોટ્રિમાઝોલ ક્રીમ (Clotrimazole Cream)', dose: ['1% cream', '2% cream'], morning: 1, afternoon: 0, evening: 1, tab: 21, description: 'દાદ વાળી જગ્યાએ લગાવો' },
  { name: 'મોમેટાસોન ક્રીમ (Mometasone Cream)', dose: ['0.1% cream'], morning: 1, afternoon: 0, evening: 1, tab: 14, description: 'પાતળી પરત લગાવો, 2 વાખત પછી બંધ' },
  { name: 'હાઇડ્રોક્વિનોન ક્રીમ (Hydroquinone Cream)', dose: ['2%', '4%'], morning: 0, afternoon: 0, evening: 1, tab: 30, description: 'રાત્રે માત્ર ડાઘ પર લગાવો' },
  { name: 'ટેક્રોલિમસ (Tacrolimus Ointment)', dose: ['0.03%', '0.1%'], morning: 1, afternoon: 0, evening: 1, tab: 21, description: 'ચહેરા પર લગાવો, સૂર્યથી બચાવો' },
  { name: 'સેલેનિયમ સલ્ફાઇડ શેમ્પુ (Selenium Sulfide Shampoo)', dose: ['2.5%'], morning: 0, afternoon: 0, evening: 1, tab: 14, description: 'સપ્તાહમાં 2 વાર વાળ ધોયા' },
  { name: 'યુરિયા ક્રીમ (Urea Cream)', dose: ['10%', '20%'], morning: 1, afternoon: 1, evening: 1, tab: 30, description: 'સૂકી ચામડી પર લગાવો' },
  { name: 'સેલિસિલિક એસિડ (Salicylic Acid)', dose: ['2%', '6%'], morning: 0, afternoon: 0, evening: 1, tab: 30, description: 'ડાઘ પર રાત્રે લગાવો' },
  { name: 'અઝેલેઇક એસિડ ક્રીમ (Azelaic Acid Cream)', dose: ['10%', '20%'], morning: 1, afternoon: 0, evening: 1, tab: 30, description: 'સવારે અને રાત્રે લગાવો' },
  { name: 'કોજિક એસિડ ક્રીમ (Kojic Acid Cream)', dose: ['2%'], morning: 0, afternoon: 0, evening: 1, tab: 30, description: 'રાત્રે ડાઘ પર લગાવો' },

  // SHAMPOO / WASH
  { name: 'કેટોકોનાઝોલ શેમ્પુ (Ketoconazole Shampoo)', dose: ['2%'], morning: 0, afternoon: 0, evening: 1, tab: 28, description: 'સપ્તાહમાં 2 વાર, 5 મિનિટ રહેવા દો' },
  { name: 'પર્થિયોન લોશન (Permethrin Lotion)', dose: ['5%'], morning: 0, afternoon: 0, evening: 1, tab: 1, description: 'એકવાર લગાવો, 8 કલાક પછી ધોયો' },

  // LOTION / SERUM
  { name: 'મિનોક્સિડિલ (Minoxidil Solution)', dose: ['2%', '5%'], morning: 1, afternoon: 0, evening: 1, tab: 90, description: 'સવારે અને રાત્રે માથાં પર લગાવો' },
  { name: 'સનસ્ક્રીન SPF 50 (Sunscreen)', dose: ['50ml', '100ml'], morning: 1, afternoon: 0, evening: 0, tab: 60, description: 'સવારે ઘરથી નીકળતા પહેલાં લગાવો' },
  { name: 'મોઇશ્ચરાઇઝર (Moisturizer Lotion)', dose: ['100ml', '200ml'], morning: 1, afternoon: 1, evening: 1, tab: 30, description: 'સ્નાન પછી લગાવો' },
  { name: 'લિક્વિડ પેરાફિન (Liquid Paraffin)', dose: ['100ml'], morning: 0, afternoon: 0, evening: 1, tab: 30, description: 'સ્નાન પછી ભેજવાળી ચામડી પર લગાવો' },
];

// =============================================================
// LABELS (Vitals)
// =============================================================

interface Label {
  label: string;
  labelEn: string;
  unit: string;
  showUnit: boolean;
}

const LABELS: Label[] = [
  { label: 'વજન', labelEn: 'Weight', unit: 'kg', showUnit: true },
  { label: 'ઉંમર', labelEn: 'Age', unit: 'years', showUnit: false },
  { label: 'લોહીનું ગ્રૂપ', labelEn: 'Blood Group', unit: '', showUnit: false },
  { label: 'બીપી', labelEn: 'BP', unit: 'mmHg', showUnit: true },
  { label: 'તાપમાન', labelEn: 'Temperature', unit: '°F', showUnit: true },
  { label: 'પલ્સ રેટ', labelEn: 'Pulse Rate', unit: 'bpm', showUnit: true },
  { label: 'સ્પૂર્ધી', labelEn: 'SpO2', unit: '%', showUnit: true },
  { label: 'શુગર', labelEn: 'Blood Sugar', unit: 'mg/dL', showUnit: true },
];

// =============================================================
// TABLE TEMPLATES
// =============================================================

interface TableTemplate {
  name: string;
  rows: number;
  cols: number;
  headerLabel: string[];
  colsLabel: string[];
  footerLabel: string[];
  extraLabel: string;
}

const TABLE_TEMPLATES: TableTemplate[] = [
  {
    name: 'સ્કિન બાયોપ્સી રિપોર્ટ',
    rows: 5,
    cols: 2,
    headerLabel: ['Investigation', 'Result'],
    colsLabel: ['Histopathology', 'Impression', 'Site', 'Size', 'Margins'],
    footerLabel: [],
    extraLabel: '',
  },
  {
    name: 'એલર્જી ટેસ્ટ રિપોર્ટ',
    rows: 8,
    cols: 2,
    headerLabel: ['Allergen', 'Grade'],
    colsLabel: ['Dust Mite', 'Pollen', 'Mold', 'Milk', 'Egg', 'Wheat', 'Soy', 'Fish'],
    footerLabel: [],
    extraLabel: 'Grade: 0=Negative, 1+=Mild, 2+=Moderate, 3+=Severe',
  },
];

// =============================================================
// MAIN SEED FUNCTION
// =============================================================

async function main() {
  console.log('🚀 Starting Dermatology Seed Script...\n');

  // 1. Create Doctor Rajesh
  console.log('--- Creating Doctor Rajesh ---');
  const doctorUser = await createDoctorRajesh();
  const doctorId = doctorUser.doctor!.id;
  const userId = doctorUser.id;

  // 2. Create Assistant Meena
  console.log('\n--- Creating Assistant Meena ---');
  await createAssistant(doctorId);

  // 3. Create Categories
  console.log('\n--- Creating Categories ---');
  const categoryRecords: any[] = [];
  for (const cat of CATEGORIES) {
    const record = await db.categoryMaster.create({
      data: {
        name: cat.name,
        nameEn: cat.nameEn,
        doctorId,
        createdById: userId,
        status: 'Active',
      }
    });
    categoryRecords.push(record);
    console.log(`  ✅ Category: ${cat.name} (${cat.nameEn})`);
  }

  // 4. Create Complaints
  console.log('\n--- Creating Complaints ---');
  const complaintRecords: any[] = [];
  for (const comp of COMPLAINTS) {
    const record = await db.coMaster.create({
      data: {
        coDetail: comp.coDetail,
        coDetailEn: comp.coDetailEn,
        coCode: comp.coCode || '',
        categoryId: categoryRecords[comp.categoryIdx].id,
        doctorId,
        createdById: userId,
        status: 'Active',
      }
    });
    complaintRecords.push(record);
    console.log(`  ✅ Complaint: ${comp.coDetail} (${comp.coDetailEn})`);
  }

  // 5. Create Questions
  console.log('\n--- Creating Questions ---');
  const questionRecords: any[] = [];
  for (const q of QUESTIONS) {
    const record = await db.questionsMaster.create({
      data: {
        question: q.question,
        questionEn: q.questionEn,
        coId: complaintRecords[q.complaintIdx].id,
        doctorId,
        createdById: userId,
        status: 'Active',
      }
    });
    questionRecords.push(record);
  }
  console.log(`  ✅ ${QUESTIONS.length} questions created`);

  // 6. Create Suggestions
  console.log('\n--- Creating Suggestions ---');
  let suggCount = 0;
  for (const s of SUGGESTIONS) {
    await db.suggestionsMaster.create({
      data: {
        suggestions: s.suggestions,
        suggestionsEn: s.suggestionsEn,
        questionId: questionRecords[s.questionIdx].id,
        doctorId,
        createdById: userId,
        status: 'Active',
      }
    });
    suggCount++;
  }
  console.log(`  ✅ ${suggCount} suggestions created`);

  // 7. Create Medicines
  console.log('\n--- Creating Medicines ---');
  const medicineRecords: any[] = [];
  for (const med of MEDICINES) {
    const record = await db.doctorMedicine.create({
      data: {
        name: med.name,
        dose: JSON.stringify(med.dose),
        morning: med.morning,
        afternoon: med.afternoon,
        evening: med.evening,
        tab: med.tab,
        description: med.description,
        userId: doctorId,
        status: 'Active',
      }
    });
    medicineRecords.push(record);
    console.log(`  ✅ Medicine: ${med.name}`);
  }

  // 8. Create Findings + Link Medicines
  console.log('\n--- Creating Findings + Medicine Links ---');
  let linkCount = 0;
  for (const f of FINDINGS) {
    const findingRecord = await db.findingsMaster.create({
      data: {
        name: f.name,
        nameEn: f.nameEn,
        doctorId,
        createdById: userId,
        status: 'Active',
      }
    });
    console.log(`  ✅ Finding: ${f.name} (${f.nameEn})`);

    for (const fm of f.medicines) {
      await db.findingsMedicine.create({
        data: {
          findingId: findingRecord.id,
          medicineId: medicineRecords[fm.nameIdx].id,
          dose: fm.dose || '',
          morning: fm.morning ?? 0,
          afternoon: fm.afternoon ?? 0,
          evening: fm.evening ?? 0,
          tab: fm.tab ?? 0,
          description: fm.description || '',
        }
      });
      linkCount++;
    }
  }
  console.log(`  ✅ ${linkCount} finding-medicine links created`);

  // 9. Create Labels
  console.log('\n--- Creating Labels (Vitals) ---');
  for (const l of LABELS) {
    await db.labelMaster.create({
      data: {
        label: l.label,
        labelEn: l.labelEn,
        unit: l.unit,
        showUnit: l.showUnit,
        doctorId,
        createdById: userId,
        status: 'Active',
      }
    });
    console.log(`  ✅ Label: ${l.label} (${l.labelEn}) ${l.showUnit ? `[${l.unit}]` : ''}`);
  }

  // 10. Create Table Templates
  console.log('\n--- Creating Table Templates ---');
  for (const t of TABLE_TEMPLATES) {
    await db.tableTemplateMaster.create({
      data: {
        name: t.name,
        rows: t.rows,
        cols: t.cols,
        headerLabel: JSON.stringify(t.headerLabel),
        colsLabel: JSON.stringify(t.colsLabel),
        footerLabel: JSON.stringify(t.footerLabel),
        extraLabel: t.extraLabel,
        doctorId,
        createdById: userId,
        status: 'Active',
      }
    });
    console.log(`  ✅ Table Template: ${t.name}`);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('🎉 SEED COMPLETE! Summary:');
  console.log(`   Doctor: Dr. Rajesh Patel (rajesh@skinclinic.com)`);
  console.log(`   Password: Rajesh@123`);
  console.log(`   Assistant: Meena Shah (meena@skinclinic.com)`);
  console.log(`   Password: Meena@123`);
  console.log(`   Categories: ${CATEGORIES.length}`);
  console.log(`   Complaints: ${COMPLAINTS.length}`);
  console.log(`   Questions: ${QUESTIONS.length}`);
  console.log(`   Suggestions: ${SUGGESTIONS.length}`);
  console.log(`   Findings: ${FINDINGS.length}`);
  console.log(`   Medicines: ${MEDICINES.length}`);
  console.log(`   Finding↔Medicine Links: ${linkCount}`);
  console.log(`   Labels: ${LABELS.length}`);
  console.log(`   Table Templates: ${TABLE_TEMPLATES.length}`);
  console.log(`   TOTAL RECORDS: ${
    2 + CATEGORIES.length + COMPLAINTS.length + QUESTIONS.length + 
    SUGGESTIONS.length + FINDINGS.length + MEDICINES.length + linkCount + 
    LABELS.length + TABLE_TEMPLATES.length
  }`);
  console.log('='.repeat(60));

  await db.$disconnect();
}

main().catch((e) => {
  console.error('❌ Seed failed:', e.message);
  process.exit(1);
});
