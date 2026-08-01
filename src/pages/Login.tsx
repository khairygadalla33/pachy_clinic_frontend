import React, { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const { login, loginPin } = useAuth();
  const navigate = useNavigate();
  const [method, setMethod] = useState<'email' | 'pin'>('email');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [error, setError] = useState('');

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError('بيانات الدخول غير صحيحة');
    }
  };

  const handlePinLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await loginPin(pinCode);
      navigate('/dashboard');
    } catch (err: any) {
      setError('رمز PIN غير صحيح');
    }
  };

  return (
    <div className="min-h-screen bg-rose-50 flex items-center justify-center p-4 dir-rtl">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-rose-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-rose-600 mb-2">باتشي كلينك</h1>
          <p className="text-gray-500">نظام إدارة عيادة التجميل والليزر</p>
        </div>

        <div className="flex gap-4 mb-6">
          <button
            className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
              method === 'email' ? 'bg-rose-100 text-rose-700' : 'text-gray-500 hover:bg-gray-50'
            }`}
            onClick={() => setMethod('email')}
          >
            البريد الإلكتروني
          </button>
          <button
            className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
              method === 'pin' ? 'bg-rose-100 text-rose-700' : 'text-gray-500 hover:bg-gray-50'
            }`}
            onClick={() => setMethod('pin')}
          >
            رمز PIN
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 text-center">
            {error}
          </div>
        )}

        {method === 'email' ? (
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                required
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">كلمة المرور</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                required
                dir="ltr"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-rose-600 text-white py-2 rounded-lg font-medium hover:bg-rose-700 transition-colors"
            >
              تسجيل الدخول
            </button>
          </form>
        ) : (
          <form onSubmit={handlePinLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">رمز الدخول السريع (PIN)</label>
              <input
                type="password"
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-center text-xl tracking-widest"
                required
                maxLength={4}
                dir="ltr"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-rose-600 text-white py-2 rounded-lg font-medium hover:bg-rose-700 transition-colors"
            >
              دخول
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
