
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { formatCurrency } from '../lib/utils';
import { AlertTriangle, ArrowRightLeft } from 'lucide-react';

const fetchInventory = async () => {
  const { data } = await api.get('/inventory/products');
  return data;
};

const fetchLowStock = async () => {
  const { data } = await api.get('/inventory/low-stock');
  return data;
};

const Inventory = () => {
  const { data: inventory, isLoading: invLoading } = useQuery({ queryKey: ['inventory'], queryFn: fetchInventory });
  const { data: lowStock, isLoading: lowLoading } = useQuery({ queryKey: ['low-stock'], queryFn: fetchLowStock });

  if (invLoading || lowLoading) return <div>جاري التحميل...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-start items-center">
        <h1 className="text-3xl font-bold tracking-tight">إدارة المخزون</h1>
      </div>

      {lowStock && lowStock.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" /> نواقص المخزون ({lowStock.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {lowStock.map((prod: any) => (
                <Badge key={prod.id} variant="destructive" className="px-3 py-1 text-sm">
                  {prod.name} (المتبقي: {prod.currentStock})
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>المنتجات</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>المنتج</TableHead>
                <TableHead>التصنيف</TableHead>
                <TableHead>الكمية الحالية</TableHead>
                <TableHead>الحد الأدنى</TableHead>
                <TableHead>سعر البيع</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventory?.data?.map((prod: any) => {
                const isLow = prod.currentStock <= prod.minStock;
                return (
                  <TableRow key={prod.id} className={isLow ? "bg-red-50/50" : ""}>
                    <TableCell className="font-medium">
                      {prod.name}
                      {prod.sku && <div className="text-xs text-muted-foreground">{prod.sku}</div>}
                    </TableCell>
                    <TableCell>{prod.category}</TableCell>
                    <TableCell>
                      <span className={`font-bold ${isLow ? 'text-red-600' : ''}`}>
                        {prod.currentStock}
                      </span>
                    </TableCell>
                    <TableCell>{prod.minStock}</TableCell>
                    <TableCell>{prod.sellingPrice ? formatCurrency(prod.sellingPrice) : '-'}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        <ArrowRightLeft className="w-4 h-4 ml-1" /> حركة مخزون
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {inventory?.data?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">لا توجد منتجات</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Inventory;
