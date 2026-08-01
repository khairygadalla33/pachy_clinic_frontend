import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { Card, CardContent } from '../components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { formatCurrency } from '../lib/utils';
import { Eye, CreditCard, Trash2, AlertCircle } from 'lucide-react';
import Modal from '../components/Modal';

const fetchInvoices = async () => {
  const { data } = await api.get('/invoices');
  return data;
};

const Invoices = () => {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['invoices'], queryFn: fetchInvoices });
  
  const [isSmartDialogOpen, setIsSmartDialogOpen] = useState(false);
  const [smartDialogContext, setSmartDialogContext] = useState<any>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/invoices/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      alert('تم حذف الفاتورة بنجاح');
    },
    onError: (error: any) => {
      const errData = error.response?.data;
      if (errData?.code === 'INVOICE_HAS_PAYMENTS') {
        setSmartDialogContext({
          invoiceId: errData.invoiceId,
          message: errData.message
        });
        setIsSmartDialogOpen(true);
      } else {
        alert(errData?.message || 'حدث خطأ أثناء الحذف');
      }
    }
  });

  const refundMutation = useMutation({
    mutationFn: (id: string) => api.post(`/invoices/${id}/refund`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setIsSmartDialogOpen(false);
      alert('تم إنشاء فاتورة المرتجع بنجاح');
    }
  });

  const handleDelete = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذه الفاتورة؟')) {
      deleteMutation.mutate(id);
    }
  };

  const handleCreateRefund = () => {
    if (smartDialogContext?.invoiceId) {
      refundMutation.mutate(smartDialogContext.invoiceId);
    }
  };

  if (isLoading) return <div>جاري التحميل...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">الفواتير</h1>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>رقم الفاتورة</TableHead>
                <TableHead>العميل</TableHead>
                <TableHead>التاريخ</TableHead>
                <TableHead>الإجمالي</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.data?.map((invoice: any) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                  <TableCell>{invoice.client?.fullName}</TableCell>
                  <TableCell>{new Date(invoice.issueDate).toLocaleDateString('ar-EG')}</TableCell>
                  <TableCell>{formatCurrency(invoice.grandTotal)}</TableCell>
                  <TableCell>
                    <Badge variant={
                      invoice.status === 'PAID' ? 'success' :
                      invoice.status === 'PARTIALLY_PAID' ? 'warning' : 
                      invoice.status === 'CANCELLED' ? 'destructive' :
                      invoice.status === 'DRAFT' ? 'secondary' : 'default'
                    }>
                      {invoice.status === 'PAID' ? 'مدفوعة' :
                       invoice.status === 'PARTIALLY_PAID' ? 'مدفوعة جزئياً' : 
                       invoice.status === 'CANCELLED' ? 'ملغاة' :
                       invoice.status === 'DRAFT' ? 'مسودة/مرتجع' : 'مُصدرة'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 ml-1" /> التفاصيل
                      </Button>
                      {invoice.status !== 'PAID' && invoice.status !== 'CANCELLED' && (
                        <Button variant="default" size="sm">
                          <CreditCard className="w-4 h-4 ml-1" /> دفع
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => handleDelete(invoice.id)} className="text-rose-600 border-rose-200 hover:bg-rose-50">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {data?.data?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">لا توجد فواتير</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Modal isOpen={isSmartDialogOpen} onClose={() => setIsSmartDialogOpen(false)} title="تنبيه: لا يمكن الحذف">
        <div className="p-4 text-center">
          <div className="flex justify-center mb-4 text-amber-500">
            <AlertCircle className="w-16 h-16" />
          </div>
          <h3 className="text-lg font-bold mb-2">الفاتورة تحتوي على دفعات مسجلة</h3>
          <p className="text-surface-600 dark:text-surface-300 mb-6">
            {smartDialogContext?.message || 'لا يمكن حذف فاتورة تم السداد عليها للحفاظ على سلامة الحسابات.'}
          </p>
          <div className="flex flex-col gap-3">
            <Button onClick={handleCreateRefund} disabled={refundMutation.isPending} className="w-full">
              {refundMutation.isPending ? 'جاري الإنشاء...' : 'إنشاء فاتورة مرتجع بدلاً من ذلك'}
            </Button>
            <Button variant="outline" onClick={() => setIsSmartDialogOpen(false)} className="w-full">
              إلغاء
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Invoices;
