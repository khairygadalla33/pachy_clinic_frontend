import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ar-EG', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount) + ' ج.م';
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatTime(time: string): string {
  if (!time) return '';
  const [h, m] = time.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'م' : 'ص';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${m} ${ampm}`;
}

export function calculateAge(dateOfBirth: string | Date | undefined): number {
  if (!dateOfBirth) return 0;
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export function getInitials(name: string, fallback: string = ''): string {
  if (!name) return fallback;
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const statusLabelsAr: Record<string, string> = {
  // Workflow
  BOOKED: 'محجوز',
  ARRIVED: 'حضر',
  WAITING: 'في الانتظار',
  IN_SESSION: 'في الجلسة',
  PENDING_CHECKOUT: 'تسوية مالية',
  COMPLETED: 'مكتمل',
  NO_SHOW: 'لم يحضر',
  CANCELLED: 'ملغي',
  
  // Invoice
  DRAFT: 'مسودة',
  ISSUED: 'صادرة',
  PAID: 'مدفوعة',
  PARTIALLY_PAID: 'مدفوعة جزئياً',
  REFUNDED: 'مستردة',
  
  // Campaigns
  RUNNING: 'قيد التنفيذ',
  PAUSED: 'متوقفة',
  
  // Package
  ACTIVE: 'نشط',
  EXPIRED: 'منتهي',
  
  // Roles
  ADMIN: 'مدير',
  DOCTOR: 'طبيب',
  NURSE: 'ممرض/ة',
  TECHNICIAN: 'فني',
  RECEPTIONIST: 'استقبال',
  
  // Gender
  MALE: 'ذكر',
  FEMALE: 'أنثى',
  
  // Payment
  CASH: 'نقدي',
  CARD: 'بطاقة',
  INSTAPAY: 'إنستاباي',
  BANK_TRANSFER: 'تحويل بنكي',
  
  // Account
  BANK: 'بنك',
  WALLET: 'محفظة إلكترونية',
  PETTY_CASH: 'مصروفات نثرية',
  
  // WhatsApp
  SENT: 'تم الإرسال',
  DELIVERED: 'تم التوصيل',
  FAILED: 'فشل',
  PENDING: 'في الانتظار',
  BROADCAST: 'حملة جماعية',
  PRESCRIPTION: 'روشتة',
  INVOICE: 'فاتورة',
  APPOINTMENT_REMINDER: 'تذكير بموعد',
  STATUS_NOTIFY: 'إشعار حالة',
  MANUAL: 'يدوي',
  
  // Skin reaction
  NONE: 'لا يوجد',
  MILD: 'خفيف',
  MODERATE: 'متوسط',
  SEVERE: 'شديد',
  
  // Treasury
  REVENUE: 'إيراد',
  EXPENSE: 'مصروف',
  DEPOSIT_IN: 'إيداع',
  REFUND: 'استرداد',
  ADJUSTMENT: 'تسوية',
  
  // Maintenance
  SCHEDULED: 'مجدول',
  IN_PROGRESS: 'جاري التنفيذ',
  OVERDUE: 'متأخر',
};

export function translateStatus(status: string): string {
  if (!status) return status;
  return statusLabelsAr[status] || status;
}
