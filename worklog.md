---
Task ID: 1
Agent: Main Agent (CTO)
Task: Create Doctor Rajesh account and seed complete dermatology test data

Work Log:
- Verified database connection: SQLite at db/custom.db (NOT Supabase)
- Found database was completely empty — no users exist
- Created comprehensive seed script: scripts/seed-dermatology.ts
- Fixed DoctorMedicine.userId FK (references Doctor.id, not User.id)
- Fixed all Finding↔Medicine index references (27 medicines, 0-26)
- Reset DB, pushed schema, executed seed successfully
- Started dev server, verified no errors

Stage Summary:
- ✅ Doctor Rajesh Patel created (rajesh@skinclinic.com / Rajesh@123)
- ✅ Assistant Meena Shah created (meena@skinclinic.com / Meena@123)
- ✅ 255 total records seeded:
  - 8 Categories (એક્ને, ચામડીનો ઇન્ફેક્શન, એલર્જી, પિગમેન્ટેશન, વાળ, સોરિયાસિસ, ખંજવાળ, સૂકું ચામડી)
  - 25 Complaints (Gujarati + English dual-language)
  - 52 Questions
  - 89 Suggestions
  - 11 Findings (Acne Vulgaris, Tinea, Atopic Dermatitis, Melasma, Psoriasis, Urticaria, Alopecia, Seborrheic Dermatitis, Xerosis, PIH, Contact Dermatitis)
  - 27 Medicines (Oral tablets + Topical gels/creams + Shampoos + Lotions)
  - 31 Finding↔Medicine auto-fill links
  - 8 Vitals Labels (with units)
  - 2 Table Templates (Skin Biopsy, Allergy Test)
- Dev server running clean on port 3000

Unresolved / Next Steps:
- Need to create a test booking + prescription to fully test the 6-step stepper wizard
- Login as Doctor Rajesh to verify Rx Settings pages show the data
- Test the stepper: complaints → vitals → tables → medicines (auto-fill from findings) → suggestions (auto-populate) → print
