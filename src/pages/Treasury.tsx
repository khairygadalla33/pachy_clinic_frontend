import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import api from '../lib/api';
import Modal from '../components/Modal';

export default function Treasury() {
  const queryClient = useQueryClient();
  const [branchId] = useState('022d4f55-1f8d-4f11-9a70-4f5b2b2b1e1b'); // Default branch

  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false);
  const [isAddTxModalOpen, setIsAddTxModalOpen] = useState(false);
  
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  // New Account State
  const [newAccount, setNewAccount] = useState({ name: '', type: 'CASH' });

  // New Tx State
  const [newTx, setNewTx] = useState({
    accountId: '',
    type: 'DEPOSIT_IN',
    category: '',
    description: '',
    amount: '',
    paymentMethod: 'CASH',
    notes: '',
  });

  const { data: stats } = useQuery({
    queryKey: ['treasury-stats', branchId],
    queryFn: () => api.get(`/treasury/stats/${branchId}`).then(res => res.data),
  });

  const { data: accounts } = useQuery({
    queryKey: ['treasury-accounts', branchId],
    queryFn: () => api.get(`/treasury/accounts/${branchId}`).then(res => res.data),
  });

  const { data: transactions } = useQuery({
    queryKey: ['treasury-transactions', branchId],
    queryFn: () => api.get(`/treasury/transactions/${branchId}`).then(res => res.data),
  });

  const createAccountMutation = useMutation({
    mutationFn: (data: any) => api.post('/treasury/accounts', { ...data, branchId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treasury-accounts'] });
      setIsAddAccountModalOpen(false);
      setNewAccount({ name: '', type: 'CASH' });
    }
  });

  const addTxMutation = useMutation({
    mutationFn: (data: any) => api.post('/treasury/transactions', { ...data, branchId, amount: Number(data.amount) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treasury-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['treasury-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['treasury-stats'] });
      setIsAddTxModalOpen(false);
      setNewTx({ accountId: '', type: 'DEPOSIT_IN', category: '', description: '', amount: '', paymentMethod: 'CASH', notes: '' });
    }
  });

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    createAccountMutation.mutate(newAccount);
  };

  const handleAddTx = (e: React.FormEvent) => {
    e.preventDefault();
    addTxMutation.mutate(newTx);
  };

  const openTxModalForAccount = (accId: string) => {
    setNewTx(prev => ({ ...prev, accountId: accId }));
    setIsAddTxModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">الخزينة والبنوك</h1>
          <p className="text-sm text-surface-500">إدارة الأرصدة والحركات المالية</p>
        </div>
        <button onClick={() => setIsAddTxModalOpen(true)} className="btn-primary">
          <Plus className="w-4 h-4 mr-2" /> إضافة حركة مالية
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Accounts & Stats */}
        <div className="space-y-6">
          
          {/* Stats Cards */}
          <div className="bg-white rounded-xl shadow-sm border border-surface-200 overflow-hidden">
            <div className="p-4 border-b border-surface-200 bg-surface-50">
              <h2 className="font-bold text-surface-900">المركز المالي</h2>
            </div>
            <div className="p-4 space-y-4">
              <div className="bg-primary-600 rounded-lg p-4 text-white">
                <div className="text-primary-100 text-sm mb-1">الرصيد المتاح (السيولة)</div>
                <div className="text-2xl font-bold">{Number(stats?.totalAvailableBalance || 0).toLocaleString()} ج.م</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                  <div className="text-emerald-600 text-xs font-medium mb-1">أرصدة مدينة</div>
                  <div className="text-lg font-bold text-emerald-700">{Number(stats?.totalDebitAccounts || 0).toLocaleString()} ج.م</div>
                </div>
                <div className="bg-red-50 rounded-lg p-3 border border-red-100">
                  <div className="text-red-600 text-xs font-medium mb-1">أرصدة دائنة</div>
                  <div className="text-lg font-bold text-red-700">{Number(stats?.totalCreditAccounts || 0).toLocaleString()} ج.م</div>
                </div>
              </div>
            </div>
          </div>

          {/* Accounts List */}
          <div className="bg-white rounded-xl shadow-sm border border-surface-200 overflow-hidden">
            <div className="p-4 border-b border-surface-200 bg-surface-50 flex justify-between items-center">
              <h2 className="font-bold text-surface-900">حسابات الخزينة</h2>
              <button onClick={() => setIsAddAccountModalOpen(true)} className="text-xs font-medium text-primary-600 hover:text-primary-700 flex items-center">
                <Plus className="w-3 h-3 mr-1" /> حساب جديد
              </button>
            </div>
            <div className="p-2 space-y-2 max-h-[500px] overflow-y-auto">
              {accounts?.map((acc: any) => (
                <div 
                  key={acc.id} 
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedAccountId === acc.id ? 'bg-primary-50 border-primary-200' : 'bg-white border-surface-200 hover:bg-surface-50'}`}
                  onClick={() => setSelectedAccountId(acc.id)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-bold text-sm text-surface-900">{acc.name}</div>
                      <div className="text-xs text-surface-500">{
                        acc.type === 'CASH' ? 'نقدية' : acc.type === 'BANK' ? 'حساب بنكي' : acc.type === 'WALLET' ? 'محفظة إلكترونية' : 'عهدة'
                      }</div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); openTxModalForAccount(acc.id); }} className="p-1.5 bg-primary-100 text-primary-700 rounded hover:bg-primary-200" title="إضافة حركة">
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="text-left">
                    <div className="text-xs text-surface-500">الرصيد الحالي</div>
                    <div className={`font-bold ${Number(acc.currentBalance) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {Number(acc.currentBalance).toLocaleString()} ج.م
                    </div>
                  </div>
                </div>
              ))}
              {accounts?.length === 0 && (
                <div className="text-center py-6 text-surface-500 text-sm">
                  لا توجد حسابات مسجلة.<br/>قم بإضافة خزينة أو بنك للبدء.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Transactions DataGrid */}
        <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-surface-200 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-surface-200 bg-surface-50 flex justify-between items-center">
            <h2 className="font-bold text-surface-900">حركة الخزينة والبنك</h2>
            <div className="flex gap-2">
              {/* Date Filters Placeholder */}
            </div>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-surface-500 bg-surface-50 uppercase sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-right">التاريخ</th>
                  <th className="px-4 py-3 text-right">الحساب</th>
                  <th className="px-4 py-3 text-right">النوع</th>
                  <th className="px-4 py-3 text-right">رقم المرجع</th>
                  <th className="px-4 py-3 text-right">المبلغ</th>
                  <th className="px-4 py-3 text-right">الرصيد</th>
                  <th className="px-4 py-3 text-right">البيان</th>
                  <th className="px-4 py-3 text-right">بواسطة</th>
                </tr>
              </thead>
              <tbody>
                {transactions?.filter((tx: any) => !selectedAccountId || tx.accountId === selectedAccountId).map((tx: any) => (
                  <tr key={tx.id} className="border-b border-surface-100 hover:bg-surface-50">
                    <td className="px-4 py-3 text-right">{new Date(tx.transactionDate).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}</td>
                    <td className="px-4 py-3 text-right font-medium">{tx.account?.name}</td>
                    <td className="px-4 py-3 text-right">
                      {tx.type === 'REVENUE' || tx.type === 'DEPOSIT_IN' ? (
                        <span className="text-emerald-600 font-bold flex items-center"><ArrowDownRight className="w-3 h-3 mr-1"/> إيداع</span>
                      ) : tx.type === 'EXPENSE' || tx.type === 'REFUND' ? (
                        <span className="text-red-600 font-bold flex items-center"><ArrowUpRight className="w-3 h-3 mr-1"/> صرف</span>
                      ) : (
                        <span className="text-orange-500 font-bold">تسوية</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-surface-500">{tx.referenceId || '-'}</td>
                    <td className="px-4 py-3 text-right font-bold">{Number(tx.amount).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-bold text-primary-600">{Number(tx.runningBalance).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right max-w-xs truncate" title={tx.description}>{tx.description}</td>
                    <td className="px-4 py-3 text-right text-surface-500 text-xs">System</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {transactions?.length === 0 && (
              <div className="text-center py-12 text-surface-500">لا توجد حركات مسجلة.</div>
            )}
          </div>
        </div>
      </div>

      {/* Add Account Modal */}
      <Modal isOpen={isAddAccountModalOpen} onClose={() => setIsAddAccountModalOpen(false)} title="إضافة حساب جديد">
        <form onSubmit={handleCreateAccount} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">اسم الحساب</label>
            <input type="text" className="input-field" required value={newAccount.name} onChange={e => setNewAccount({...newAccount, name: e.target.value})} placeholder="مثال: خزينة العيادة الرئيسية" />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">نوع الحساب</label>
            <select className="input-field" required value={newAccount.type} onChange={e => setNewAccount({...newAccount, type: e.target.value})}>
              <option value="CASH">نقدية (خزينة)</option>
              <option value="BANK">حساب بنكي</option>
              <option value="WALLET">محفظة إلكترونية</option>
              <option value="PETTY_CASH">عهدة موظف</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-surface-200">
            <button type="button" onClick={() => setIsAddAccountModalOpen(false)} className="btn-secondary">إلغاء</button>
            <button type="submit" disabled={createAccountMutation.isPending} className="btn-primary">
              {createAccountMutation.isPending ? 'جاري الحفظ...' : 'حفظ'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Transaction Modal */}
      <Modal isOpen={isAddTxModalOpen} onClose={() => setIsAddTxModalOpen(false)} title="إضافة حركة مالية">
        <form onSubmit={handleAddTx} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">الحساب</label>
              <select className="input-field" required value={newTx.accountId} onChange={e => setNewTx({...newTx, accountId: e.target.value})}>
                <option value="">اختر الحساب...</option>
                {accounts?.map((acc: any) => (
                  <option key={acc.id} value={acc.id}>{acc.name} ({Number(acc.currentBalance).toLocaleString()})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">نوع الحركة</label>
              <select className="input-field" required value={newTx.type} onChange={e => setNewTx({...newTx, type: e.target.value})}>
                <option value="DEPOSIT_IN">إيداع / إيراد</option>
                <option value="EXPENSE">صرف / مصروفات</option>
                <option value="ADJUSTMENT">تسوية رصيد</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">المبلغ (ج.م)</label>
              <input type="number" step="0.01" min="0" className="input-field font-bold text-lg" required value={newTx.amount} onChange={e => setNewTx({...newTx, amount: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">طريقة الدفع</label>
              <select className="input-field" value={newTx.paymentMethod} onChange={e => setNewTx({...newTx, paymentMethod: e.target.value})}>
                <option value="CASH">نقدي</option>
                <option value="CARD">بطاقة بنكية</option>
                <option value="BANK_TRANSFER">تحويل بنكي</option>
                <option value="INSTAPAY">انستاباي</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">البيان / الوصف</label>
            <input type="text" className="input-field" required value={newTx.description} onChange={e => setNewTx({...newTx, description: e.target.value})} placeholder="مثال: إيداع مبيعات اليوم" />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-surface-200">
            <button type="button" onClick={() => setIsAddTxModalOpen(false)} className="btn-secondary">إلغاء</button>
            <button type="submit" disabled={addTxMutation.isPending} className="btn-primary">
              {addTxMutation.isPending ? 'جاري التسجيل...' : 'تسجيل الحركة'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
