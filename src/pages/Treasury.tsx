
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { formatCurrency } from '../lib/utils';
import { Wallet, TrendingUp, TrendingDown } from 'lucide-react';

const fetchTreasury = async () => {
  const { data } = await api.get('/finance/treasury');
  return data;
};

const fetchSummary = async () => {
  const branchId = 'default-branch-id'; // Simplified for now
  const { data } = await api.get(`/api/finance/treasury/summary?branchId=${branchId}`);
  return data;
};

const Treasury = () => {
  const { data: txData, isLoading: txLoading } = useQuery({ queryKey: ['treasury'], queryFn: fetchTreasury });
  const { data: summaryData, isLoading: summaryLoading } = useQuery({ queryKey: ['treasury-summary'], queryFn: fetchSummary });

  if (txLoading || summaryLoading) return <div>جاري التحميل...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">الخزينة والمالية</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الإيرادات</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(summaryData?.revenue || 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المصروفات</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(summaryData?.expense || 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الصافي</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summaryData?.net || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>سجل الحركات</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>التاريخ</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>البيان</TableHead>
                <TableHead>المبلغ</TableHead>
                <TableHead>الرصيد بعد الحركة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {txData?.data?.map((tx: any) => {
                const isCredit = ['REVENUE', 'DEPOSIT_IN'].includes(tx.type);
                return (
                  <TableRow key={tx.id}>
                    <TableCell>{new Date(tx.transactionDate).toLocaleString('ar-EG')}</TableCell>
                    <TableCell>
                      <Badge variant={isCredit ? 'success' : 'destructive'}>
                        {tx.type === 'REVENUE' ? 'إيراد' : 
                         tx.type === 'EXPENSE' ? 'مصروف' : 
                         tx.type === 'DEPOSIT_IN' ? 'ديبوزيت' : 'تسوية'}
                      </Badge>
                    </TableCell>
                    <TableCell>{tx.description}</TableCell>
                    <TableCell className={`font-bold ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
                      {isCredit ? '+' : '-'}{formatCurrency(tx.amount)}
                    </TableCell>
                    <TableCell className="font-medium">{formatCurrency(tx.balanceAfter)}</TableCell>
                  </TableRow>
                );
              })}
              {txData?.data?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">لا توجد حركات مالية</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Treasury;
