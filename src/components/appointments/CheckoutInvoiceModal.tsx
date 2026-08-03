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
  const [discount, setDiscount] = useState(0);

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
      // We process checkout by ending the workflow explicitly with payment details
      await api.put(`/workflow/${queueItem.id}/checkout`, {
        paymentMethod,
        discount
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

  const netTotalAfterDiscount = settlement ? (settlement.subTotal - settlement.deposit - discount) : 0;
  const finalTotal = netTotalAfterDiscount < 0 ? 0 : netTotalAfterDiscount;

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
                      <td className="py-3 px-4 text-center font-bold">{s.price} ر.س</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="bg-surface-50 p-4 rounded-xl space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-surface-600">الإجمالي (قبل الخصم والدفعة المقدمة):</span>
              <span className="font-medium">{settlement?.subTotal} ر.س</span>
            </div>
            
            {settlement?.deposit > 0 && (
              <div className="flex justify-between text-sm text-emerald-600">
                <span>دفعة مقدمة (مخصومة):</span>
                <span>- {settlement?.deposit} ر.س</span>
              </div>
            )}

            <div className="flex items-center justify-between text-sm py-2 border-y border-surface-200 my-2">
              <span className="text-surface-600">الخصم الإضافي (إن وجد):</span>
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  min="0"
                  max={settlement?.subTotal}
                  className="input-field py-1 text-left w-24" 
                  value={discount} 
                  onChange={e => setDiscount(Number(e.target.value))} 
                />
                <span>ر.س</span>
              </div>
            </div>

            <div className="flex justify-between text-lg font-bold text-primary-700 pt-2">
              <span>المطلوب سداده:</span>
              <span>{finalTotal} ر.س</span>
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-surface-900">طريقة الدفع</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('CASH')}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                  paymentMethod === 'CASH'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-surface-200 bg-white text-surface-600 hover:border-primary-200'
                }`}
              >
                <Banknote className="w-6 h-6" />
                <span className="font-medium">نقداً</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('CARD')}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                  paymentMethod === 'CARD'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-surface-200 bg-white text-surface-600 hover:border-primary-200'
                }`}
              >
                <CreditCard className="w-6 h-6" />
                <span className="font-medium">بطاقة دفع (شبكة)</span>
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-surface-200">
            <button className="btn-ghost" onClick={onClose} disabled={isSubmitting}>
              إلغاء
            </button>
            <button 
              className="btn-primary" 
              onClick={handleCheckout} 
              disabled={isSubmitting}
            >
              <CheckCircle className="w-4 h-4 ml-2" />
              تأكيد الدفع وإنهاء
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
