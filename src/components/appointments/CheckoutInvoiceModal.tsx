import { useState, useEffect } from 'react';
import { CheckCircle, CreditCard, Banknote } from 'lucide-react';
import Modal from '../Modal';
import api from '../../lib/api';
import toast from 'react-hot-toast';

interface CheckoutInvoiceModalProps {
  queueItem: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CheckoutInvoiceModal({ queueItem, onClose, onSuccess }: CheckoutInvoiceModalProps) {
  const [settlement, setSettlement] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [discountType, setDiscountType] = useState<'value' | 'percentage'>('value');
  const [discountValue, setDiscountValue] = useState<number | string>('');
  const [collectedAmount, setCollectedAmount] = useState<number | string>('');

  useEffect(() => {
    if (queueItem?.appointmentId) {
      api.get(`/appointments/${queueItem.appointmentId}/settlement`)
        .then(res => {
          setSettlement(res.data);
          setLoading(false);
        })
        .catch(() => {
          toast.error('حدث خطأ أثناء جلب بيانات التسوية');
          setLoading(false);
        });
    }
  }, [queueItem]);

  if (!queueItem) return null;

  const handleCheckout = async () => {
    try {
      setIsSubmitting(true);
      const parsedDiscount = Number(discountValue) || 0;
      const finalDiscount = discountType === 'percentage'
        ? (settlement.subTotal * (parsedDiscount / 100))
        : parsedDiscount;

      const parsedCollected = Number(collectedAmount) || 0;

      // We process checkout by ending the workflow explicitly with payment details
      await api.put(`/workflow/${queueItem.id}/checkout`, {
        paymentMethod,
        discount: finalDiscount,
        collectedAmount: parsedCollected
      });
      toast.success('تم تسوية الفاتورة بنجاح');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error('فشلت عملية الدفع');
    } finally {
      setIsSubmitting(false);
    }
  };

  const subTotal = settlement?.subTotal || 0;
  const deposit = settlement?.deposit || 0;

  const parsedDiscountVal = Number(discountValue) || 0;
  const calculatedDiscount = discountType === 'percentage' 
    ? (subTotal * (parsedDiscountVal / 100)) 
    : parsedDiscountVal;

  const netAccountCalc = subTotal - deposit - calculatedDiscount;
  const netAccount = netAccountCalc < 0 ? 0 : netAccountCalc;

  const parsedCollected = Number(collectedAmount) || 0;
  const remainingCalc = netAccount - parsedCollected;
  const remaining = remainingCalc < 0 ? 0 : remainingCalc;

  return (
    <Modal isOpen={!!queueItem} onClose={onClose} title="تسوية فاتورة العميل" maxWidth="max-w-3xl">
      {loading ? (
        <div className="flex justify-center p-8">جاري التحميل...</div>
      ) : (
        <div className="space-y-6">
          {/* Header Info */}
          <div className="flex justify-between bg-surface-50 p-4 rounded-xl border border-surface-200">
            <div>
              <p className="text-sm text-surface-500">العميل</p>
              <p className="font-bold text-surface-900 text-lg">{queueItem.client?.fullName || 'عميل غير محدد'}</p>
            </div>
            <div className="text-left">
              <p className="text-sm text-surface-500">الطبيب</p>
              <p className="font-bold text-surface-900 text-lg">د. {queueItem.staff?.fullName || queueItem.appointment?.staff?.fullName || 'طبيب غير محدد'}</p>
            </div>
          </div>

          {/* Line Items */}
          <div>
            <h3 className="text-base font-bold text-surface-900 mb-3">تفاصيل الخدمات</h3>
            <div className="border border-surface-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-surface-50 text-surface-600">
                  <tr>
                    <th className="py-2 px-4 text-right">الخدمة</th>
                    <th className="py-2 px-4 text-center">السعر</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {settlement?.services?.map((s: any, idx: number) => (
                    <tr key={idx}>
                      <td className="py-3 px-4 font-medium text-surface-900">{s.name}</td>
                      <td className="py-3 px-4 text-center font-bold">{s.price} ج.م</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals & Submit */}
          <div className="p-4 border-t border-surface-200 bg-white shrink-0">
            <div className="space-y-2 mb-4 text-sm font-medium text-surface-600">
              {/* 1. Subtotal */}
              <div className="flex justify-between items-center text-surface-600">
                <span>الإجمالي:</span>
                <span className="font-bold">{subTotal.toLocaleString()} ج.م</span>
              </div>

              {/* 2. Previous Payments */}
              <div className="flex justify-between items-center text-emerald-600">
                <span>الدفعات السابقة:</span>
                <span>{deposit.toLocaleString()} ج.م</span>
              </div>

              {/* 3. Discount */}
              <div className="flex items-center justify-between text-surface-600">
                <span>الخصم:</span>
                <div className="flex items-center gap-1">
                  <select 
                    className="input-field py-1 pl-6 pr-2 w-28 h-8 text-sm"
                    value={discountType}
                    onChange={(e: any) => setDiscountType(e.target.value)}
                  >
                    <option value="value">قيمة</option>
                    <option value="percentage">% نسبة</option>
                  </select>
                  <input 
                    type="number" 
                    min="0"
                    placeholder="0"
                    className="input-field py-1 px-2 w-20 text-center h-8 text-sm"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                  />
                </div>
              </div>
              
              {/* 4. Net Total (After Discount & Previous Payments) */}
              <div className="flex justify-between items-center text-[#c0389f] font-bold">
                <span>الصافي بعد الخصم والدفعات السابقة:</span>
                <span>{netAccount.toLocaleString()} ج.م</span>
              </div>

              {/* 5. Collected Amount (Input) */}
              <div className="flex items-center justify-between text-emerald-600 pt-2 border-t border-surface-100">
                <span className="font-bold">المبلغ المُحصّل:</span>
                <div className="flex items-center gap-1">
                  <input 
                    type="number" 
                    min="0"
                    max={netAccount}
                    placeholder="0"
                    className="input-field py-1 px-2 w-28 text-center h-8 text-sm font-bold text-emerald-700"
                    value={collectedAmount}
                    onChange={(e) => setCollectedAmount(e.target.value)}
                  />
                  <span>ج.م</span>
                </div>
              </div>

              {/* 6. Remaining (Debt) */}
              <div className="flex justify-center items-center gap-2 text-red-500 bg-red-50 p-2 rounded-lg mt-2">
                <span className="font-bold text-base">المتبقي (رصيد مدين يُضاف للعميل):</span>
                <span className="font-black text-xl">{remaining.toLocaleString()} ج.م</span>
              </div>

              {/* 7. Payment Method for Collected */}
              {parsedCollected > 0 && (
                <div className="flex items-center justify-between text-surface-600 pt-2 border-t border-surface-100">
                  <span>طريقة الدفع للمبلغ المُحصّل:</span>
                  <select 
                    className="input-field py-1 pl-6 pr-2 w-40 h-8 text-sm font-bold"
                    value={paymentMethod}
                    onChange={(e: any) => setPaymentMethod(e.target.value)}
                  >
                    <option value="CASH">نقدي</option>
                    <option value="CARD">بطاقة (شبكة)</option>
                    <option value="INSTAPAY">إنستاباي</option>
                    <option value="E_WALLET">محفظة إلكترونية</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-2">
              <button 
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-5 py-2 bg-surface-100 hover:bg-surface-200 text-surface-700 rounded-xl font-bold transition-colors shrink-0"
              >
                إلغاء
              </button>
              <button 
                onClick={handleCheckout} 
                disabled={isSubmitting}
                className="flex-1 bg-[#c0389f] hover:bg-[#a62c88] text-white py-2 text-base font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors"
              >
                {isSubmitting ? 'جاري التنفيذ...' : 'تأكيد الدفع وإنهاء'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
