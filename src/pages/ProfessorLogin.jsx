import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Lock, Loader2, User, ShieldCheck } from 'lucide-react';

export default function ProfessorLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const savedUser = localStorage.getItem('prof_username');
    if (savedUser) {
      setEmail(savedUser);
      setRememberMe(true);
    }
  }, []);

  const handleProfessorLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      const { data: isProf } = await supabase
        .from('professors')
        .select('id')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (!isProf) {
        await supabase.auth.signOut();
        throw new Error("Accès refusé : Compte professeur requis.");
      }

      if (rememberMe) {
        localStorage.setItem('prof_username', email);
      } else {
        localStorage.removeItem('prof_username');
      }

      navigate('/professor');
    } catch (error) {
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-900 font-sans flex flex-col items-center justify-center p-6">
      
      <div className="w-full max-w-[400px]">
        
        {/* MAIN LOGIN CARD */}
        <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-slate-100 p-8 md:p-10">
          
          {/* LOGOS INTEGRATION */}
          <div className="flex items-center justify-center gap-5 mb-8">
            <img src="https://ramadane-abdelhay.github.io/Salery_predection_app/2APD-logo.png" alt="2APD" className="h-8 object-contain" />
            <div className="w-px h-6 bg-slate-200"></div>
            <img src="https://ramadane-abdelhay.github.io/Salery_predection_app/lafac-logo.png" alt="Faculté" className="h-8 object-contain opacity-70" />
          </div>

          <div className="text-center mb-10">
            <h2 className="text-[22px] font-black text-slate-800 tracking-tight uppercase">Plateforme des Notes</h2>
            <p className="text-teal-600 text-[11px] font-bold uppercase tracking-[0.2em] mt-1.5">Espace Professeur</p>
          </div>

          {errorMsg && (
            <div className="mb-6 bg-red-50 text-red-600 px-4 py-3 rounded-2xl text-xs font-medium flex items-center gap-3 border border-red-100/50">
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleProfessorLogin} className="space-y-4">
            <div className="space-y-4">
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-500 transition-colors" size={18} />
                <input 
                  type="text" 
                  required 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="Nom d'utilisateur" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-[14px] font-medium outline-none transition-all focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/5 text-slate-700" 
                />
              </div>

              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-500 transition-colors" size={18} />
                <input 
                  type="password" 
                  required 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="Mot de passe" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-[14px] font-medium outline-none transition-all focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/5 text-slate-700" 
                />
              </div>
            </div>

            {/* REMEMBER ME TOGGLE */}
            <div className="flex items-center px-1 py-2">
              <label className="flex items-center cursor-pointer group">
                <div className="relative">
                  <input 
                    type="checkbox" 
                    checked={rememberMe} 
                    onChange={(e) => setRememberMe(e.target.checked)} 
                    className="sr-only" 
                  />
                  <div className={`w-5 h-5 border-2 rounded-lg transition-all flex items-center justify-center ${rememberMe ? 'bg-teal-600 border-teal-600' : 'border-slate-300 bg-white group-hover:border-teal-400'}`}>
                    {rememberMe && <div className="w-2 h-1 border-b-2 border-l-2 border-white -rotate-45 mb-0.5"></div>}
                  </div>
                </div>
                <span className="ml-3 text-[12px] font-bold text-slate-500 select-none group-hover:text-slate-700 transition-colors">Se souvenir de moi</span>
              </label>
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-[14px] mt-2 shadow-[0_10px_20px_-5px_rgba(0,0,0,0.1)] hover:bg-teal-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}