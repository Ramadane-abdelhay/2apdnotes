import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, UserPlus, Loader2, Check, Globe } from 'lucide-react';

const translations = {
  en: {
    title: "Faculty Register",
    subtitle: "Academic Portal",
    fullName: "Full Name",
    email: "Email (Username)",
    password: "Password",
    moduleLabel: "Assigned Modules",
    submit: "Create Account",
    loading: "Processing...",
    success: "Account created and modules assigned!",
    authError: "Authentication failed.",
    emptySelection: "Please select at least one module."
  },
  fr: {
    title: "Inscription Professeur",
    subtitle: "Portail Académique",
    fullName: "Nom Complet",
    email: "Email (Nom d'utilisateur)",
    password: "Mot de passe",
    moduleLabel: "Modules Assignés",
    submit: "Créer mon compte",
    loading: "Traitement...",
    success: "Compte créé et modules assignés !",
    authError: "Erreur d'authentification.",
    emptySelection: "Veuillez sélectionner au moins un module."
  }
};

export default function ProfessorRegister() {
  const [lang, setLang] = useState('fr');
  const t = translations[lang];
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  
  const [semesters, setSemesters] = useState([]);
  const [allModules, setAllModules] = useState([]);
  const [selectedModules, setSelectedModules] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchData() {
      const { data: semData } = await supabase.from('semesters').select('*');
      const { data: modData } = await supabase.from('modules').select('*');
      if (semData) setSemesters(semData);
      if (modData) setAllModules(modData);
    }
    fetchData();
  }, []);

  const groupedModules = semesters.map(sem => ({
    ...sem,
    modules: allModules.filter(m => m.semester_id === sem.id)
  })).filter(sem => sem.modules.length > 0);

  const toggleModule = (moduleId) => {
    setSelectedModules(prev => 
      prev.includes(moduleId) 
        ? prev.filter(id => id !== moduleId) 
        : [...prev, moduleId]
    );
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (selectedModules.length === 0) {
      setErrorMsg(t.emptySelection);
      return;
    }

    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
      if (authError) throw authError;
      if (!authData.user) throw new Error(t.authError);

      const { error: profError } = await supabase.from('professors').insert([{
        id: authData.user.id,
        full_name: fullName,
        username: email.split('@')[0]
      }]);
      if (profError) throw profError;

      const { error: modError } = await supabase
        .from('modules')
        .update({ professor_id: authData.user.id })
        .in('id', selectedModules);
      if (modError) throw modError;

      alert(t.success);
      navigate('/prof-login'); 
    } catch (error) {
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-gray-900 font-sans selection:bg-blue-100 flex flex-col">
      
      {/* MODERN TOP BAR */}
      <nav className="w-full px-6 py-4 flex justify-between items-center bg-white/50 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <img src="https://ramadane-abdelhay.github.io/Salery_predection_app/2APD-logo.png" alt="2APD" className="h-7 object-contain" />
          <div className="w-px h-4 bg-gray-200"></div>
          <img src="https://ramadane-abdelhay.github.io/Salery_predection_app/lafac-logo.png" alt="Faculté" className="h-7 object-contain opacity-70" />
        </div>

        {/* TOP RIGHT LANGUAGE TOGGLE */}
        <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200 shadow-sm">
          <button 
            type="button" 
            onClick={() => setLang('fr')} 
            className={`px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-200 ${lang === 'fr' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            FR
          </button>
          <button 
            type="button" 
            onClick={() => setLang('en')} 
            className={`px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-200 ${lang === 'en' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            EN
          </button>
        </div>
      </nav>

      {/* CENTERED CONTENT AREA */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 pb-20">
        
        <div className="w-full max-w-[480px]">
          {/* MAIN REGISTRATION CARD */}
          <div className="bg-white rounded-[32px] shadow-[0_2px_40px_rgba(0,0,0,0.03)] border border-gray-100 p-8 md:p-10">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{t.title}</h2>
              <p className="text-blue-600 text-[11px] font-bold uppercase tracking-widest mt-1">{t.subtitle}</p>
            </div>

            {errorMsg && (
              <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-2xl text-[13px] font-medium flex items-start gap-3 border border-red-100/50">
                <AlertCircle size={18} className="shrink-0 mt-0.5" /> 
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-4">
                <input type="text" placeholder={t.fullName} required className="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 rounded-2xl px-5 py-4 text-[14px] font-medium outline-none transition-all focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5" onChange={e => setFullName(e.target.value)} />
                <input type="email" placeholder={t.email} required className="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 rounded-2xl px-5 py-4 text-[14px] font-medium outline-none transition-all focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5" onChange={e => setEmail(e.target.value)} />
                <input type="password" placeholder={t.password} required className="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 rounded-2xl px-5 py-4 text-[14px] font-medium outline-none transition-all focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5" onChange={e => setPassword(e.target.value)} />
              </div>
              
              {/* MULTI-SELECT MODULES SECTION */}
              <div className="bg-gray-50/50 p-6 rounded-[24px] border border-gray-200/60 mt-2">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-4">
                  {t.moduleLabel} ({selectedModules.length})
                </label>
                
                <div className="max-h-[220px] overflow-y-auto pr-2 space-y-6 custom-scrollbar">
                  {groupedModules.length === 0 ? (
                    <p className="text-[13px] text-gray-400 font-medium italic">Chargement des modules...</p>
                  ) : (
                    groupedModules.map(semester => (
                      <div key={semester.id}>
                        <div className="text-[11px] font-bold text-gray-900 border-b border-gray-200 pb-2 mb-3">
                          {semester.semester_name}
                        </div>
                        <div className="space-y-3">
                          {semester.modules.map(mod => {
                            const isSelected = selectedModules.includes(mod.id);
                            return (
                              <div 
                                key={mod.id} 
                                onClick={() => toggleModule(mod.id)}
                                className="flex items-center gap-3 cursor-pointer group"
                              >
                                <div className={`w-5 h-5 rounded-[6px] border flex items-center justify-center shrink-0 transition-all duration-200 ${
                                  isSelected 
                                    ? 'bg-blue-600 border-blue-600 shadow-sm' 
                                    : 'bg-white border-gray-300 group-hover:border-blue-400'
                                }`}>
                                  {isSelected && <Check size={14} className="text-white" strokeWidth={3} />}
                                </div>
                                <span className={`text-[13.5px] font-medium transition-colors select-none ${
                                  isSelected ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-800'
                                }`}>
                                  {mod.module_name}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <button 
                disabled={loading} 
                className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold text-[14px] mt-6 shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:bg-black active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" size={18}/> : <UserPlus size={18}/>}
                {loading ? t.loading : t.submit}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}