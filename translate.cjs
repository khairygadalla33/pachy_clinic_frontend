const fs = require('fs');

let content = fs.readFileSync('src/pages/Appointments.tsx', 'utf8');

const replacements = {
  '>Appointments<': '>المواعيد<',
  '>Manage all clinic appointments<': '>إدارة جميع مواعيد العيادة<',
  '> Walk-in<': '> زيارة مباشرة (Walk-in)<',
  '>Walk-in<': '>زيارة مباشرة (Walk-in)<',
  '> New Appointment<': '> موعد جديد<',
  '>Clear Date Filter<': '>مسح تصفية التاريخ<',
  '>Date & Time<': '>التاريخ والوقت<',
  '>Client<': '>العميل<',
  '>Service<': '>الخدمة<',
  '>Doctor<': '>الطبيب<',
  '>Status<': '>الحالة<',
  "'New Walk-in Patient'": "'عميل جديد - زيارة مباشرة (Walk-in)'",
  "'New Appointment'": "'موعد جديد'",
  '>Select Service...<': '>اختر الخدمة...<',
  '>Select Doctor...<': '>اختر الطبيب...<',
  '>Date<': '>التاريخ<',
  '>Time<': '>الوقت<',
  '>Deposit (Optional)<': '>عربون (اختياري)<',
  '>Amount<': '>المبلغ<',
  '>Method<': '>وسيلة الدفع<',
  '>Cash<': '>نقدي<',
  '>Card<': '>بطاقة ائتمانية<',
  '>InstaPay<': '>إنستاباي<',
  '>E-Wallet<': '>محفظة إلكترونية<',
  '>Notes<': '>ملاحظات<',
  '>Cancel<': '>إلغاء<',
  "'Saving...'": "'جاري الحفظ...'",
  "'Create Walk-in'": "'إضافة زيارة مباشرة (Walk-in)'",
  "'Book Appointment'": "'حجز الموعد'"
};

for (const [key, value] of Object.entries(replacements)) {
  content = content.replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
}

fs.writeFileSync('src/pages/Appointments.tsx', content);

let receptionContent = fs.readFileSync('src/pages/ReceptionDashboard.tsx', 'utf8');
receptionContent = receptionContent.replace(/> Walk-in Patient</g, '> زيارة مباشرة (Walk-in)<');
fs.writeFileSync('src/pages/ReceptionDashboard.tsx', receptionContent);

console.log('Translated Appointments.tsx and ReceptionDashboard.tsx');
