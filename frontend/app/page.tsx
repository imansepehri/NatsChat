"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleEnterChat = () => {
    if (!username.trim()) {
      setError('لطفاً نام کاربری خود را وارد کنید');
      return;
    }
    
    // Store username in localStorage
    localStorage.setItem('chatUsername', username.trim());
    
    // Redirect to chat room
    router.push('/room/general');
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20 max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">چت آنلاین</h1>
          <p className="text-gray-300">برای شروع چت، نام کاربری خود را وارد کنید</p>
        </div>
        
        <div className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
              نام کاربری
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleEnterChat()}
              placeholder="نام خود را وارد کنید"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            />
          </div>
          
          {error && (
            <div className="text-red-400 text-sm text-center">{error}</div>
          )}
          
          <button
            onClick={handleEnterChat}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            ورود به چت
          </button>
        </div>
        
        <div className="mt-8 text-center text-sm text-gray-400">
          <p>اتاق پیش‌فرض: <span className="text-purple-400">General</span></p>
        </div>
      </div>
    </main>
  );
}


