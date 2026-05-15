import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { UserCheck, AlertCircle, Camera, Loader2 } from 'lucide-react';

const translations = {
  en: {
    title: "Student Register",
    subtitle: "Master 2APD Official",
    lastName: "Last Name",
    firstName: "First Name",
    email: "Email (Username)",
    password: "Password",
    apogee: "Apogée Code",
    cne: "CNE Number",
    cni: "CNI Number",
    submit: "Create Account",
    loading: "Processing...",
    success: "Account created! Redirecting...",
    authError: "Authentication failed."
  },
  fr: {
    title: "Inscription Étudiant",
    subtitle: "Officiel Master 2APD",
    lastName: "Nom",
    firstName: "Prénom",
    email: "Email (Nom d'utilisateur)",
    password: "Mot de passe",
    apogee: "Code Apogée",
    cne: "Numéro CNE",
    cni: "Numéro CNI",
    submit: "Créer mon compte",
    loading: "Traitement...",
    success: "Compte créé ! Vous allez être redirigé.",
    authError: "Erreur d'authentification."
  }
};

export default function StudentRegister() {
  const [lang, setLang] = useState('fr'); 
  const t = translations[lang];

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formData, setFormData] = useState({ firstName: '', lastName: '', apogee: '', cne: '', cni: '' });
  
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        setErrorMsg(lang === 'fr' ? "Fichier trop lourd (Max 3MB)" : "File too large (Max 3MB)");
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
      if (authError) throw authError;
      if (!authData.user) throw new Error(t.authError);

      let publicAvatarUrl = null;
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${authData.user.id}.${fileExt}`;
        const filePath = `profiles/${fileName}`;

        const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, avatarFile);
        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
        publicAvatarUrl = publicUrlData.publicUrl;
      }

      const { error: dbError } = await supabase.from('students').insert([{
        id: authData.user.id,
        first_name: formData.firstName.toUpperCase(), 
        last_name: formData.lastName.toUpperCase(),
        apogee_code: formData.apogee,
        cne: formData.cne,
        cni: formData.cni,
        username: email.split('@')[0],
        avatar_url: publicAvatarUrl
      }]);

      if (dbError) throw dbError;

      alert(t.success);
      navigate('/'); 
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
          <div className="bg-white rounded-[32px] shadow-[0_2px_40px_rgba(0,0,0,0.03)] border border-gray-100 p-8 md:p-10 relative">
            
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{t.title}</h2>
              <p className="text-blue-600 text-[11px] font-bold uppercase tracking-widest mt-1">{t.subtitle}</p>
            </div>

            {/* INTEGRATED PROFILE PICTURE UPLOADER */}
            <div className="flex justify-center mb-8">
              <label className="relative cursor-pointer group block">
                <div className={`w-24 h-24 rounded-full border-2 flex items-center justify-center overflow-hidden transition-all duration-300 ${avatarPreview ? 'border-transparent shadow-md bg-white' : 'border-dashed border-gray-300 bg-gray-50 group-hover:bg-blue-50/50 group-hover:border-blue-400'}`}>
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Camera size={28} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                  )}
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                <div className="absolute bottom-0 right-0 bg-blue-600 w-8 h-8 rounded-full border-[3px] border-white flex items-center justify-center shadow-sm transform group-hover:scale-105 transition-transform">
                  <span className="text-white text-lg font-bold leading-none mb-0.5">+</span>
                </div>
              </label>
            </div>

            {errorMsg && (
              <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-2xl text-[13px] font-medium flex items-start gap-3 border border-red-100/50">
                <AlertCircle size={18} className="shrink-0 mt-0.5" /> 
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder={t.lastName} required className="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 rounded-2xl px-5 py-4 text-[14px] font-medium outline-none transition-all focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5" onChange={e => setFormData({...formData, lastName: e.target.value})} />
                <input type="text" placeholder={t.firstName} required className="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 rounded-2xl px-5 py-4 text-[14px] font-medium outline-none transition-all focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5" onChange={e => setFormData({...formData, firstName: e.target.value})} />
              </div>

              <input type="email" placeholder={t.email} required className="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 rounded-2xl px-5 py-4 text-[14px] font-medium outline-none transition-all focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5" onChange={e => setEmail(e.target.value)} />
              <input type="password" placeholder={t.password} required className="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 rounded-2xl px-5 py-4 text-[14px] font-medium outline-none transition-all focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5" onChange={e => setPassword(e.target.value)} />
              
              <div className="flex items-center gap-4 py-2">
                <div className="h-px bg-gray-200 flex-1" />
              </div>

              <input type="text" placeholder={t.apogee} required className="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 rounded-2xl px-5 py-4 text-[14px] font-medium outline-none transition-all focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5" onChange={e => setFormData({...formData, apogee: e.target.value})} />
              
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder={t.cne} required className="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 rounded-2xl px-5 py-4 text-[14px] font-medium outline-none transition-all focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5" onChange={e => setFormData({...formData, cne: e.target.value})} />
                <input type="text" placeholder={t.cni} required className="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 rounded-2xl px-5 py-4 text-[14px] font-medium outline-none transition-all focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5" onChange={e => setFormData({...formData, cni: e.target.value})} />
              </div>

              <button disabled={loading} className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold text-[14px] mt-6 shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:bg-black active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                {loading ? <Loader2 className="animate-spin" size={18}/> : <UserCheck size={18}/>}
                {loading ? t.loading : t.submit}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}