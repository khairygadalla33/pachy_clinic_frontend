import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { formatCurrency } from '../lib/utils';
import { ShoppingCart } from 'lucide-react';

const fetchPackages = async () => {
  const { data } = await api.get('/packages');
  return data;
};

const fetchClientPackages = async () => {
  const { data } = await api.get('/packages/client');
  return data;
};

const Packages = () => {
  const [tab, setTab] = useState<'templates' | 'client'>('templates');
  const { data: packages, isLoading: pkgLoading } = useQuery({ queryKey: ['packages'], queryFn: fetchPackages });
  const { data: clientPkgs, isLoading: cpkgLoading } = useQuery({ queryKey: ['client-packages'], queryFn: fetchClientPackages });

  if (pkgLoading || cpkgLoading) return <div>جاري التحميل...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-start items-center">
        <h1 className="text-3xl font-bold tracking-tight">إدارة الباقات</h1>
        <div className="flex gap-2">
          <Button variant={tab === 'templates' ? 'default' : 'outline'} onClick={() => setTab('templates')}>
            قوالب الباقات
          </Button>
          <Button variant={tab === 'client' ? 'default' : 'outline'} onClick={() => setTab('client')}>
            باقات العملاء
          </Button>
        </div>
      </div>

      {tab === 'templates' && (
        <Card>
          <CardHeader>
            <CardTitle>الباقات المتاحة</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>اسم الباقة</TableHead>
                  <TableHead>السعر</TableHead>
                  <TableHead>المدة (أيام)</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packages?.data?.map((pkg: any) => (
                  <TableRow key={pkg.id}>
                    <TableCell className="font-medium">{pkg.name}</TableCell>
                    <TableCell>{formatCurrency(pkg.totalPrice)}</TableCell>
                    <TableCell>{pkg.validityDays || 'مفتوحة'}</TableCell>
                    <TableCell>
                      <Badge variant={pkg.isActive ? 'success' : 'secondary'}>
                        {pkg.isActive ? 'نشط' : 'غير نشط'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        <ShoppingCart className="w-4 h-4 ml-1" /> بيع لعميل
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {packages?.data?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">لا توجد باقات</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {tab === 'client' && (
        <Card>
          <CardHeader>
            <CardTitle>اشتراكات العملاء</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>العميل</TableHead>
                  <TableHead>الباقة</TableHead>
                  <TableHead>الجلسات المستخدمة</TableHead>
                  <TableHead>الجلسات المتبقية</TableHead>
                  <TableHead>تاريخ الانتهاء</TableHead>
                  <TableHead>الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientPkgs?.data?.map((cp: any) => (
                  <TableRow key={cp.id}>
                    <TableCell className="font-medium">{cp.client?.fullName}</TableCell>
                    <TableCell>{cp.package?.name}</TableCell>
                    <TableCell>{cp.usedSessions} / {cp.totalSessions}</TableCell>
                    <TableCell className="font-bold text-blue-600">{cp.remainingSessions}</TableCell>
                    <TableCell>
                      {cp.expiryDate ? new Date(cp.expiryDate).toLocaleDateString('ar-EG') : 'مفتوح'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        cp.status === 'ACTIVE' ? 'success' : 
                        cp.status === 'COMPLETED' ? 'default' : 'destructive'
                      }>
                        {cp.status === 'ACTIVE' ? 'نشط' : 
                         cp.status === 'COMPLETED' ? 'مكتمل' : 'منتهي'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {clientPkgs?.data?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">لا توجد اشتراكات</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Packages;
