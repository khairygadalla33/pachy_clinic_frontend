const fs = require('fs');

let prescription = fs.readFileSync('src/components/PrescriptionForm.tsx', 'utf8');

const pReplacements = {
  '>Medications<': '>الأدوية<',
  '> Add Medicine<': '> إضافة دواء<',
  '>Medicine Name<': '>اسم الدواء<',
  '>Dose<': '>الجرعة<',
  '>Frequency<': '>التكرار<',
  '>Duration<': '>المدة<',
  '"e.g. Twice daily"': '"مثال: مرتين يومياً"',
  '"e.g. 5 days"': '"مثال: 5 أيام"',
  '>Instructions<': '>التعليمات<',
  '>Load Template...<': '>تحميل نموذج...<',
  '"Write instructions or load from a template..."': '"اكتب التعليمات أو قم بتحميل نموذج..."',
  '>Next Session Date<': '>تاريخ الجلسة القادمة<',
  '>Next Session Notes<': '>ملاحظات الجلسة القادمة<',
  '>Cancel<': '>إلغاء<',
  '>Save Only<': '>حفظ فقط<',
  '> Save & WhatsApp<': '> حفظ وإرسال واتساب<'
};

for (const [key, value] of Object.entries(pReplacements)) {
  prescription = prescription.replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
}
fs.writeFileSync('src/components/PrescriptionForm.tsx', prescription);


let session = fs.readFileSync('src/components/SessionForm.tsx', 'utf8');

const sReplacements = {
  '>Pricing Model / Area<': '>نموذج التسعير / المنطقة<',
  '>Select Area/Pricing...<': '>اختر المنطقة/التسعير...<',
  '>Number of Pulses<': '>عدد النبضات<',
  '>Session Number<': '>رقم الجلسة<',
  '>Calculated Cost:<': '>التكلفة المحسوبة:<',
  '>Product Used<': '>المنتج المستخدم<',
  '>Area Injected<': '>منطقة الحقن<',
  '>Quantity Used<': '>الكمية المستخدمة<',
  '>Quantity Unit (ml/units)<': '>وحدة الكمية (ml/units)<',
  '>Procedure Name<': '>اسم الإجراء<',
  '>Photo Before<': '>صورة قبل<',
  '>Photo After<': '>صورة بعد<',
  '>Notes<': '>ملاحظات<',
  '>Cancel<': '>إلغاء<',
  "'Saving...'": "'جاري الحفظ...'",
  "'Save Session'": "'حفظ الجلسة'"
};
// Keeping 'Energy (J/cm²)', 'Pulse Width (ms)', 'Spot Size (mm)', 'Skin Reaction', 'None', 'Mild Redness', etc. as medical words.

for (const [key, value] of Object.entries(sReplacements)) {
  session = session.replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
}
fs.writeFileSync('src/components/SessionForm.tsx', session);

console.log('Translated Forms');
