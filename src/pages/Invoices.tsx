
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { Card, CardContent } from '../components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { formatCurrency } from '../lib/utils';
import { Eye, CreditCard } from 'lucide-react';

const fetchInvoices = async () => {
  const { data } = await api.get('/invoices');
  return data;
};

const Invoices = () => {
  const { data, isLoading } = useQuery({ queryKey: ['invoices'], queryFn: fetchInvoices });

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
                      invoice.status === 'PARTIALLY_PAID' ? 'warning' : 'secondary'
                    }>
                      {invoice.status === 'PAID' ? 'مدفوعة' :
                       invoice.status === 'PARTIALLY_PAID' ? 'مدفوعة جزئياً' : 'مُصدرة'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 ml-1" /> التفاصيل
                      </Button>
                      {invoice.status !== 'PAID' && (
                        <Button variant="default" size="sm">
                          <CreditCard className="w-4 h-4 ml-1" /> دفع
                        </Button>
                      )}
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
    </div>
  );
};

export default Invoices;
