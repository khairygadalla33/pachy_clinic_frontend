import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { User, Shield, UserCircle, Stethoscope, ChevronRight } from 'lucide-react';

interface PublicUser {
  id: string;
  fullName: string;
  role: string;
  photoUrl: string | null;
}

type TabRole = 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST';

export default function Login() {
  const { loginById } = useAuth();
  const navigate = useNavigate();
  
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  
  const [selectedRole, setSelectedRole] = useState<TabRole>('ADMIN');
  const [selectedUser, setSelectedUser] = useState<PublicUser | null>(null);
  
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await api.get('/auth/public-users');
        setUsers(data);
      } catch (err) {
        console.error('Failed to fetch public users', err);
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    setLoading(true);
    setError('');
    try {
      await loginById(selectedUser.id, password);
      navigate('/reception');
    } catch (err: any) {
      setError('كلمة المرور غير صحيحة');
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN': return <Shield className="w-4 h-4" />;
      case 'DOCTOR': return <Stethoscope className="w-4 h-4" />;
      case 'RECEPTIONIST': return <User className="w-4 h-4" />;
      default: return <UserCircle className="w-4 h-4" />;
    }
  };

  const filteredUsers = users.filter(u => {
    if (selectedRole === 'ADMIN') return u.role === 'ADMIN';
    if (selectedRole === 'DOCTOR') return u.role === 'DOCTOR';
    if (selectedRole === 'RECEPTIONIST') return u.role === 'RECEPTIONIST';
    return false;
  });

  return (
    <div className="min-h-screen bg-rose-50 flex items-center justify-center p-4 dir-rtl font-cairo relative">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-rose-100 transition-all duration-300 -translate-y-6 sm:-translate-y-8">
        
        {!selectedUser ? (
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-rose-600 mb-2">باتشي كلينك</h1>
              <p className="text-gray-500">مرحباً بك، يرجى اختيار حسابك للدخول</p>
            </div>

            {/* Segmented Control */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center mb-8 w-full shadow-inner">
              <button
                onClick={() => setSelectedRole('ADMIN')}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
                  selectedRole === 'ADMIN' ? 'bg-white text-slate-800 shadow' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                مدير
              </button>
              <button
                onClick={() => setSelectedRole('DOCTOR')}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
                  selectedRole === 'DOCTOR' ? 'bg-white text-slate-800 shadow' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                طبيب
              </button>
              <button
                onClick={() => setSelectedRole('RECEPTIONIST')}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
                  selectedRole === 'RECEPTIONIST' ? 'bg-white text-slate-800 shadow' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                ريسيبشن
              </button>
            </div>

            {/* Users List */}
            <div className="space-y-3">
              {loadingUsers ? (
                <div className="text-center text-gray-400 py-4">جاري التحميل...</div>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map(user => (
                  <button
                    key={user.id}
                    onClick={() => setSelectedUser(user)}
                    className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-rose-50 border border-gray-100 hover:border-rose-200 rounded-xl transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-rose-500 border border-rose-100">
                        {user.photoUrl ? (
                          <img src={user.photoUrl} alt={user.fullName} className="w-full h-full object-cover rounded-full" />
                        ) : (
                          getRoleIcon(user.role)
                        )}
                      </div>
                      <div className="text-right">
                        <h3 className="font-bold text-gray-800">{user.fullName}</h3>
                        <p className="text-xs text-gray-500">{user.role}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-rose-500 transition-colors" />
                  </button>
                ))
              ) : (
                <div className="text-center text-gray-400 py-8 bg-gray-50 rounded-xl border border-gray-100">
                  لا يوجد مستخدمين مسجلين في هذا القسم
                </div>
              )}
            </div>
          </>
        ) : (
          /* Password Input Screen */
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <button 
              onClick={() => {
                setSelectedUser(null);
                setPassword('');
                setError('');
              }}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-rose-600 mb-6 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
              العودة للقائمة
            </button>

            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-white shadow-md">
                {selectedUser.photoUrl ? (
                  <img src={selectedUser.photoUrl} alt={selectedUser.fullName} className="w-full h-full object-cover rounded-full" />
                ) : (
                  <UserCircle className="w-10 h-10 text-rose-400" />
                )}
              </div>
              <h2 className="text-2xl font-bold text-gray-800">{selectedUser.fullName}</h2>
              <p className="text-rose-500 font-medium">{selectedRole === 'ADMIN' ? 'مدير' : selectedRole === 'DOCTOR' ? 'طبيب' : 'ريسيبشن'}</p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 text-center animate-pulse">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">كلمة المرور</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-center text-xl tracking-widest bg-gray-50 focus:bg-white transition-all shadow-inner"
                  required
                  dir="ltr"
                  placeholder="••••"
                  autoFocus
                />
                <p className="text-xs text-gray-400 text-center mt-2">أدخل كلمة المرور</p>
              </div>
              <button
                type="submit"
                disabled={loading || !password}
                className="w-full bg-rose-600 text-white py-3 rounded-xl font-bold hover:bg-rose-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'جاري الدخول...' : 'تسجيل الدخول'}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Developer Attribution & Logo (Centered at bottom) */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-10 w-auto max-w-[92vw]">
        <div className="subtle-badge-entrance flex items-center gap-4 p-3 px-5 rounded-2xl bg-white/90 backdrop-blur-md border border-rose-100/90 shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02] whitespace-nowrap">
          <img
            src="/deboura-logo.png"
            alt="Deboura Cosmetics"
            className="h-12 w-auto object-contain drop-shadow-sm"
          />
          <div className="flex flex-col text-left text-[12px] leading-snug font-sans" dir="ltr">
            <span className="font-bold text-slate-800">Developed by deboura cosmetics</span>
            <a
              href="https://www.deboura.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-rose-600 hover:underline hover:text-rose-700 font-semibold"
            >
              www.deboura.com
            </a>
            <a
              href="mailto:khairy@deboura.com"
              className="text-slate-500 hover:text-slate-800 transition-colors"
            >
              khairy@deboura.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

