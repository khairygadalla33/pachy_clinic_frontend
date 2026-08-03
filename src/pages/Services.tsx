import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, X, ShieldAlert } from 'lucide-react';
import api from '../lib/api';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { formatCurrency } from '../lib/utils';

export default function Services() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    nameAr: '',
    categoryId: '',
    duration: 30,
    isActive: true,
  });

  const [pricings, setPricings] = useState<any[]>([]);
  const [consumables, setConsumables] = useState<any[]>([]); // { consumableItemId, quantity }

  // Queries
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['serviceCategories'],
    queryFn: async () => {
      const res = await api.get('/service-categories');
      return res.data;
    }
  });

  const { data: services, isLoading: servicesLoading } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const res = await api.get('/services');
      return res.data;
    }
  });

  const { data: availableConsumables } = useQuery({
    queryKey: ['consumables'],
    queryFn: async () => {
      const res = await api.get('/consumables');
      return res.data?.data || []; // Assuming paginated
    }
  });

  // Default active tab to 'all'
  if (categories && categories.length > 0 && !activeTab) {
    setActiveTab('all');
  }

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/services', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      closeModal();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => api.put(`/services/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      closeModal();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/services/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
    }
  });

  const uniqueCategories = useMemo(() => {
    if (!categories || !services) return [];
    const map = new Map();
    categories.forEach((c: any) => {
      const hasServices = services.some((s: any) => s.categoryId === c.id);
      if (hasServices) {
        const name = c.nameAr || c.name;
        if (!map.has(name)) {
          map.set(name, c);
        }
      }
    });
    return Array.from(map.values());
  }, [categories, services]);

  const filteredServices = services?.filter((s: any) => {
    if (activeTab === 'all') return true;
    const cat = categories?.find((c: any) => c.id === s.categoryId);
    const catName = cat?.nameAr || cat?.name;
    return catName === activeTab;
  }) || [];

  const handleEdit = (service: any) => {
    setEditingId(service.id);
    setFormData({
      name: service.name,
      nameAr: service.nameAr || '',
      categoryId: service.categoryId,
      duration: service.duration || 30,
      isActive: service.isActive,
    });
    setPricings(service.pricings?.map((p: any) => ({ ...p })) || []);
    setConsumables(service.consumableLinks?.map((c: any) => ({
      consumableItemId: c.consumableItemId,
      quantity: c.quantity,
    })) || []);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ name: '', nameAr: '', categoryId: activeTab === 'all' ? '' : categories?.find((c: any) => (c.nameAr || c.name) === activeTab)?.id || '', duration: 30, isActive: true });
    setPricings([]);
    setConsumables([]);
  };

  const handleAddPricing = () => {
    setPricings([...pricings, { bodyArea: '', pricingModel: 'PER_AREA', price: 0, pricePerPulse: 0 }]);
  };

  const handleRemovePricing = (index: number) => {
    setPricings(pricings.filter((_, i) => i !== index));
  };

  const handlePricingChange = (index: number, field: string, value: any) => {
    const newPricings = [...pricings];
    newPricings[index][field] = value;
    setPricings(newPricings);
  };

  const handleConsumableToggle = (id: string) => {
    const exists = consumables.find(c => c.consumableItemId === id);
    if (exists) {
      setConsumables(consumables.filter(c => c.consumableItemId !== id));
    } else {
      setConsumables([...consumables, { consumableItemId: id, quantity: 1 }]);
    }
  };

  const handleConsumableQuantity = (id: string, qty: number) => {
    setConsumables(consumables.map(c => c.consumableItemId === id ? { ...c, quantity: qty } : c));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      pricings: pricings.map(p => ({
        ...p,
        price: Number(p.price),
        pricePerPulse: Number(p.pricePerPulse) || 0
      })),
      consumables,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const getPricingBadge = (model: string) => {
    switch (model) {
      case 'PER_AREA': return <Badge variant="success">بالمنطقة</Badge>;
      case 'PER_PULSE': return <Badge variant="info">بالنبضات</Badge>;
      case 'HYBRID': return <Badge variant="warning">هجين</Badge>;
      case 'PACKAGE': return <Badge variant="default">باقة</Badge>;
      default: return <Badge>{model}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-start items-center">
        
        <button
          onClick={() => {
            setFormData({ ...formData, categoryId: activeTab === 'all' ? '' : categories?.find((c: any) => (c.nameAr || c.name) === activeTab)?.id || '' });
            setShowModal(true);
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
        >
          <Plus className="h-4 w-4 ml-2" />
          إضافة خدمة
        </button>
      </div>

      {categoriesLoading ? (
        <LoadingSkeleton rows={1} />
      ) : (
        <div className="border-b border-surface-200 dark:border-surface-700 overflow-x-auto">
          <nav className="-mb-px flex space-x-8 space-x-reverse whitespace-nowrap px-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`${
                activeTab === 'all'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-surface-500 hover:text-surface-700 hover:border-surface-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              الكل
            </button>
            {uniqueCategories?.map((category: any) => {
              const catName = category.nameAr || category.name;
              return (
              <button
                key={category.id}
                onClick={() => setActiveTab(catName)}
                className={`${
                  activeTab === catName
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-surface-500 hover:text-surface-700 hover:border-surface-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                {catName}
              </button>
            )})}
          </nav>
        </div>
      )}

      {servicesLoading ? (
        <LoadingSkeleton rows={3} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.length === 0 ? (
            <div className="col-span-full py-12 text-center text-surface-500">
              لا توجد خدمات في هذه الفئة
            </div>
          ) : (
            filteredServices.map((service: any) => (
              <Card key={service.id} className="flex flex-col relative overflow-hidden group">
                <div className="flex justify-start items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-1">
                      {service.nameAr || service.name}
                    </h3>
                    <p className="text-sm text-surface-500">{service.duration} دقيقة</p>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEdit(service)}
                      className="p-1.5 text-surface-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('هل أنت متأكد من حذف هذه الخدمة؟')) {
                          deleteMutation.mutate(service.id);
                        }
                      }}
                      className="p-1.5 text-surface-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3 flex-grow">
                  {service.pricings?.length > 0 ? (
                    <div className="space-y-2">
                      {service.pricings.map((p: any, i: number) => (
                        <div key={i} className="flex items-center justify-start text-sm p-2 bg-surface-50 dark:bg-surface-800 rounded-md">
                          <span className="font-medium">{p.bodyArea || 'أساسي'}</span>
                          <div className="flex items-center gap-2">
                            {getPricingBadge(p.pricingModel)}
                            <span className="font-bold">
                              {p.pricingModel === 'PER_PULSE' 
                                ? `${formatCurrency(p.pricePerPulse)}/نبضة` 
                                : formatCurrency(p.price)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-surface-400 text-center py-2">لا يوجد تسعير</div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-surface-100 dark:border-surface-700 flex items-center justify-start text-sm">
                  <div className="flex items-center text-surface-500">
                    <ShieldAlert className="h-4 w-4 ml-1.5" />
                    الأدوات المرتبطة: <span className="font-bold mx-1">{service.consumableLinks?.length || 0}</span>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* CREATE/EDIT MODAL */}
      <Modal isOpen={showModal} onClose={closeModal} title={editingId ? 'تعديل الخدمة' : 'إضافة خدمة جديدة'}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">الاسم (عربي)</label>
              <input
                type="text"
                required
                value={formData.nameAr}
                onChange={e => setFormData({ ...formData, nameAr: e.target.value })}
                className="w-full px-3 py-2 border border-surface-300 rounded-md dark:bg-surface-800 dark:border-surface-600 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">الاسم (إنجليزي)</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-surface-300 rounded-md dark:bg-surface-800 dark:border-surface-600 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">المدة (دقائق)</label>
              <input
                type="number"
                min="1"
                required
                value={formData.duration}
                onChange={e => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-surface-300 rounded-md dark:bg-surface-800 dark:border-surface-600 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">الفئة</label>
              <select
                required
                value={formData.categoryId}
                onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-3 py-2 border border-surface-300 rounded-md dark:bg-surface-800 dark:border-surface-600 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">اختر الفئة...</option>
                {categories?.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.nameAr || c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Pricing Section */}
          <div className="border border-surface-200 dark:border-surface-700 rounded-lg p-4">
            <div className="flex justify-start items-center mb-4">
              <h4 className="font-bold text-surface-900 dark:text-white">التسعير</h4>
              <button
                type="button"
                onClick={handleAddPricing}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                + إضافة سعر
              </button>
            </div>
            <div className="space-y-3">
              {pricings.map((p, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-surface-50 dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700 relative">
                  <button
                    type="button"
                    onClick={() => handleRemovePricing(index)}
                    className="absolute -top-2 -right-2 bg-rose-100 text-rose-600 rounded-full p-1 hover:bg-rose-200"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  <div className="flex-1">
                    <input
                      placeholder="المنطقة (مثال: وجه كامل)"
                      value={p.bodyArea}
                      onChange={e => handlePricingChange(index, 'bodyArea', e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-surface-300 rounded dark:bg-surface-900 dark:border-surface-600 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div className="flex-1">
                    <select
                      value={p.pricingModel}
                      onChange={e => handlePricingChange(index, 'pricingModel', e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-surface-300 rounded dark:bg-surface-900 dark:border-surface-600 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="PER_AREA">بالمنطقة (Area)</option>
                      <option value="PER_PULSE">بالنبضات (Pulse)</option>
                      <option value="HYBRID">هجين (Hybrid)</option>
                      <option value="PACKAGE">باقة (Package)</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <input
                      type="number"
                      placeholder="السعر الأساسي"
                      value={p.price}
                      onChange={e => handlePricingChange(index, 'price', e.target.value)}
                      disabled={p.pricingModel === 'PER_PULSE'}
                      className="w-full px-2 py-1.5 text-sm border border-surface-300 rounded dark:bg-surface-900 dark:border-surface-600 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50"
                    />
                  </div>
                  {(p.pricingModel === 'PER_PULSE' || p.pricingModel === 'HYBRID') && (
                    <div className="flex-1">
                      <input
                        type="number"
                        placeholder="سعر النبضة"
                        value={p.pricePerPulse}
                        onChange={e => handlePricingChange(index, 'pricePerPulse', e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border border-surface-300 rounded dark:bg-surface-900 dark:border-surface-600 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  )}
                </div>
              ))}
              {pricings.length === 0 && <p className="text-sm text-surface-500">لم يتم إضافة أي تسعير بعد.</p>}
            </div>
          </div>

          {/* Consumables Section */}
          <div className="border border-surface-200 dark:border-surface-700 rounded-lg p-4">
            <h4 className="font-bold text-surface-900 dark:text-white mb-4">الأدوات الشخصية (Consumables)</h4>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {availableConsumables?.map((item: any) => {
                const isSelected = consumables.find(c => c.consumableItemId === item.id);
                return (
                  <div key={item.id} className="flex items-center justify-start p-2 hover:bg-surface-50 dark:hover:bg-surface-800 rounded">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!isSelected}
                        onChange={() => handleConsumableToggle(item.id)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-surface-300 rounded"
                      />
                      <span className="text-sm text-surface-700 dark:text-surface-300">
                        {item.nameAr || item.name}
                      </span>
                    </label>
                    {isSelected && (
                      <input
                        type="number"
                        min="1"
                        value={isSelected.quantity}
                        onChange={e => handleConsumableQuantity(item.id, parseInt(e.target.value))}
                        className="w-16 px-2 py-1 text-sm border border-surface-300 rounded dark:bg-surface-900 dark:border-surface-600"
                      />
                    )}
                  </div>
                );
              })}
              {availableConsumables?.length === 0 && (
                <p className="text-sm text-surface-500">لا توجد أدوات شخصية متاحة.</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 border border-surface-300 rounded-md text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 font-medium"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 font-medium disabled:opacity-50"
            >
              {createMutation.isPending || updateMutation.isPending ? 'جاري الحفظ...' : 'حفظ الخدمة'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
