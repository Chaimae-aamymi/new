
import React, { useState } from 'react';
import { User, Language } from '../types';
import { translations } from '../translations';

interface AuthProps {
  onLogin: (user: User) => void;
  lang: Language;
}

const Auth: React.FC<AuthProps> = ({ onLogin, lang }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const t = translations[lang];
  const isRtl = lang === 'ar';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin({ name: name || 'Chef', email });
  };

  return (
    <div className={`min-h-screen bg-[#FDFCFB] dark:bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      
      {/* Background Shapes */}
      <div className="absolute top-[-20%] left-[-10%] w-[50rem] h-[50rem] bg-emerald-500/5 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[40rem] h-[40rem] bg-orange-500/5 rounded-full blur-[100px]"></div>
      
      <div className="w-full max-w-lg relative z-10">
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl p-12 md:p-16 rounded-6xl border border-white dark:border-slate-800 shadow-soft">
          
          <div className="flex flex-col items-center mb-12 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-4xl flex items-center justify-center text-white text-4xl shadow-2xl shadow-emerald-500/20 mb-8 animate-float">
              <i className="fa-solid fa-leaf"></i>
            </div>
            <h1 className="text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-3">FrigoZen</h1>
            <p className="text-slate-400 dark:text-slate-500 font-bold text-xs uppercase tracking-[0.3em]">
              {isLogin ? t.loginTitle : t.signupTitle}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-widest ml-1">{t.authName}</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Ex: Jean"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 focus:border-emerald-500/30 focus:bg-white dark:focus:bg-slate-800 rounded-3xl px-8 py-5 transition-all font-semibold text-slate-800 dark:text-white outline-none"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-widest ml-1">{t.authEmail}</label>
              <input 
                type="email" 
                required 
                placeholder="email@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 focus:border-emerald-500/30 focus:bg-white dark:focus:bg-slate-800 rounded-3xl px-8 py-5 transition-all font-semibold text-slate-800 dark:text-white outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-widest ml-1">{t.authPass}</label>
              <input 
                type="password" 
                required 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 focus:border-emerald-500/30 focus:bg-white dark:focus:bg-slate-800 rounded-3xl px-8 py-5 transition-all font-semibold text-slate-800 dark:text-white outline-none"
              />
            </div>

            <button 
              type="submit"
              className="w-full bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-500 text-white font-extrabold py-6 rounded-3xl shadow-2xl transition-all transform active:scale-[0.97] text-lg mt-8"
            >
              {isLogin ? t.authLoginBtn : t.authSignupBtn}
            </button>
          </form>

          <div className="mt-10 text-center">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 transition-colors"
            >
              {isLogin ? t.authToSignup : t.authToLogin}
            </button>
          </div>
        </div>
        
        <p className="mt-12 text-center text-[9px] font-bold text-slate-400 uppercase tracking-[0.4em]">
          &copy; 2025 FrigoZen • Design for Zero Waste
        </p>
      </div>
    </div>
  );
};

export default Auth;
