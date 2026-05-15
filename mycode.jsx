import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, LogOut, Calendar, Clock, 
  CheckCircle2, XCircle, AlertCircle, Camera, X, Award, Upload
} from 'lucide-react';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  // Data States
  const [student, setStudent] = useState(null);
  const [gradesData, setGradesData] = useState([]); 
  const [examsData, setExamsData] = useState([]);   

  // UI States
  const [selectedSemester, setSelectedSemester] = useState(1);
  const [selectedTab, setSelectedTab] = useState('normal'); // 'normal', 'rattrapage', 'final'
  
  // Edit Profile States
  const [showEditModal, setShowEditModal] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchStudentData();
  }, []);

  async function fetchStudentData() {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) { 
        navigate('/student-login'); 
        return; 
      }

      // 1. Fetch Student Info
      const { data: studentData } = await supabase
        .from('students')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (studentData) {
        setStudent(studentData);
      }

      // 2. Fetch Modules & Grades
      const { data: allModules } = await supabase.from('modules').select('*');
      const { data: dbGrades } = await supabase
        .from('grades')
        .select('id, normal_note, rattrapage_note, module_id')
        .eq('student_id', user.id);

      const formattedGrades = (allModules || []).map(mod => {
        const studentGrade = (dbGrades || []).find(g => g.module_id === mod.id);
        return {
          id: mod.id,
          module_name: mod.module_name,
          semester: mod.semester_id,
          normalNote: studentGrade?.normal_note ?? null,
          ratNote: studentGrade?.rattrapage_note ?? null,
        };
      });
      setGradesData(formattedGrades);

      // 3. Fetch Exams
      const { data: dbExams } = await supabase
        .from('exams')
        .select('id, date, time, type, modules(module_name)');

      if (dbExams) {
        const now = new Date();
        
        const processedExams = dbExams
          .map(e => {
            // Créer un objet Date valide à partir de la date et l'heure de l'examen
            // Assure-toi que e.time est sous un format compatible (ex: "14:30:00" ou "14:30")
            const examDateTime = new Date(`${e.date}T${e.time}`);
            
            return {
              id: e.id,
              module: e.modules?.module_name || 'Examen',
              date: e.date,
              time: e.time,
              type: e.type,
              fullDateTime: examDateTime 
            };
          })
          .filter(exam => {
            // Filtrer les examens qui sont passés de plus de 4 heures
            const examPlus4Hours = new Date(exam.fullDateTime.getTime() + 4 * 60 * 60 * 1000);
            return now <= examPlus4Hours; 
          })
          .sort((a, b) => a.fullDateTime - b.fullDateTime); // Trier du plus proche au plus éloigné

        setExamsData(processedExams);
      }
      
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleUpdateAvatar = async (e) => {
    e.preventDefault();
    if (!avatarFile) return;
    
    // VERIFICATION DE LA TAILLE DE L'IMAGE (Moins de 1 Mo)
    const MAX_FILE_SIZE = 1024 * 1024; // 1 MB en octets
    if (avatarFile.size > MAX_FILE_SIZE) {
      alert("L'image est trop volumineuse. Veuillez choisir un fichier de moins de 1 MB.");
      return;
    }

    setIsUpdating(true);
    try {
      // 1. Create a unique file name to avoid cache issues
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${student.id}-${Date.now()}.${fileExt}`;

      // 2. Upload to Supabase Storage Bucket 'avatars'
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, avatarFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // 3. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // 4. Update the student record in the database
      const { error: dbError } = await supabase
        .from('students')
        .update({ avatar_url: publicUrl })
        .eq('id', student.id);

      if (dbError) throw dbError;

      // 5. Update local state
      setStudent(prev => ({ ...prev, avatar_url: publicUrl }));
      setShowEditModal(false);
      setAvatarFile(null); // Reset file selection

    } catch (error) {
      console.error("Upload Error:", error);
      alert("Erreur lors de la mise à jour de l'image.");
    } finally {
      setIsUpdating(false);
    }
  };

  // --- LOGIC CALCULATIONS ---
  const currentSemesterGrades = gradesData.filter(g => g.semester === selectedSemester);

  // Filter modules based on the selected Tab
  let displayedGrades = [];
  if (selectedTab === 'normal') {
    displayedGrades = currentSemesterGrades; 
  } else if (selectedTab === 'rattrapage') {
    displayedGrades = currentSemesterGrades.filter(g => g.normalNote === null || parseFloat(g.normalNote) < 10);
  } else if (selectedTab === 'final') {
    displayedGrades = currentSemesterGrades; 
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F7F9FC]"><div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin"></div></div>;

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-slate-800 font-sans selection:bg-indigo-100 pb-32">
      
      {/* FLOATING HEADER */}
      <header className="sticky top-4 z-40 px-6 max-w-7xl mx-auto mb-10">
        <div className="bg-white/70 backdrop-blur-xl h-16 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white flex items-center justify-between px-6">
          <div className="flex items-center gap-6">
            <img src="https://ramadane-abdelhay.github.io/Salery_predection_app/2APD-logo.png" alt="2APD" className="h-7 object-contain opacity-80" />
            <div className="w-px h-6 bg-slate-200"></div>
            <img src="https://ramadane-abdelhay.github.io/Salery_predection_app/lafac-logo.png" alt="Faculté" className="h-7 object-contain opacity-80" />
          </div>
          <button onClick={() => navigate('/')} className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Profile & Grades */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* PROFILE CARD */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-100 flex flex-col sm:flex-row items-center gap-8 relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br from-indigo-100 to-violet-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
            <div className="relative group">
              <div className="w-28 h-28 rounded-[1.5rem] bg-indigo-50 text-indigo-300 overflow-hidden border-4 border-white shadow-lg ring-4 ring-slate-50 flex items-center justify-center text-4xl font-black shrink-0">
                {student?.avatar_url ? <img src={student.avatar_url} className="w-full h-full object-cover" /> : student?.first_name?.[0] || '?'}
              </div>
              <button onClick={() => setShowEditModal(true)} className="absolute -bottom-2 -right-2 w-10 h-10 bg-slate-800 text-white rounded-xl flex items-center justify-center shadow-lg hover:bg-indigo-600 transition-colors border-2 border-white">
                <Camera size={16} />
              </button>
            </div>
            <div className="text-center sm:text-left flex-1">
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">{student?.first_name} {student?.last_name}</h1>
              <p className="text-[13px] font-bold text-indigo-500 uppercase tracking-widest mt-1 mb-4">Master 2APD</p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4">
                <div className="bg-[#F3F5F9] px-4 py-2 rounded-xl border border-white shadow-sm">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Apogée</span>
                  <span className="text-sm font-black text-slate-700">{student?.apogee_code}</span>
                </div>
                <div className="bg-[#F3F5F9] px-4 py-2 rounded-xl border border-white shadow-sm">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">CNE</span>
                  <span className="text-sm font-black text-slate-700">{student?.cne}</span>
                </div>
              </div>
            </div>
          </div>

          {/* GRADES SECTION */}
          <div className="bg-white rounded-[2.5rem] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden">
            <div className="p-6 md:p-8 border-b border-slate-50 bg-white">
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8">
                <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                  <Award className="text-indigo-500" size={28}/> Relevé de notes
                </h2>
                
                <div className="bg-[#F3F5F9] p-1.5 rounded-2xl inline-flex shadow-inner">
                  {[1, 2, 3].map(sem => (
                    <button key={sem} onClick={() => setSelectedSemester(sem)} className={`px-5 py-2.5 text-[13px] font-bold rounded-xl transition-all ${selectedSemester === sem ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                      Semestre {sem}
                    </button>
                  ))}
                </div>
              </div>

              {/* TABS ONLY */}
              <div className="bg-slate-50 rounded-2xl p-2 border border-slate-100">
                <div className="bg-white p-1 rounded-xl flex flex-wrap shadow-sm w-full">
                  <button onClick={() => setSelectedTab('normal')} className={`flex-1 px-4 py-3 text-[12px] font-bold rounded-lg transition-all ${selectedTab === 'normal' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Session Normale</button>
                  <button onClick={() => setSelectedTab('rattrapage')} className={`flex-1 px-4 py-3 text-[12px] font-bold rounded-lg transition-all ${selectedTab === 'rattrapage' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Rattrapage</button>
                  <button onClick={() => setSelectedTab('final')} className={`flex-1 px-4 py-3 text-[12px] font-bold rounded-lg transition-all ${selectedTab === 'final' ? 'bg-emerald-50 text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Note Finale</button>
                </div>
              </div>
            </div>

            {/* GRADES TABLE */}
            <div className="overflow-x-auto px-6 pb-8">
              {displayedGrades.length === 0 ? (
                <div className="py-16 text-center text-slate-400 font-medium bg-slate-50 rounded-3xl mt-4">
                  Aucun module disponible pour cette session.
                </div>
              ) : (
                <table className="w-full text-left border-collapse border-spacing-y-4">
                  <thead>
                    <tr>
                      <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Module</th>
                      
                      {selectedTab === 'normal' && <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Note Normale</th>}
                      
                      {selectedTab === 'rattrapage' && <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Note Rattrapage</th>}
                      
                      {selectedTab === 'final' && (
                        <>
                          <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Normale</th>
                          <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Rattrapage</th>
                          <th className="py-4 px-4 text-[10px] font-black text-indigo-400 uppercase tracking-widest text-center">Meilleure Note</th>
                        </>
                      )}
                      
                      <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Situation</th>
                    </tr>
                  </thead>
                  <tbody className="text-[14px]">
                    {displayedGrades.map((grade) => {
                      const nNote = grade.normalNote !== null ? parseFloat(grade.normalNote) : null;
                      const rNote = grade.ratNote !== null ? parseFloat(grade.ratNote) : null;
                      const bestNote = Math.max(nNote || 0, rNote || 0);
                      const hasAnyGrade = nNote !== null || rNote !== null;

                      let situation = '--';
                      let sitColor = 'bg-slate-100 text-slate-500 border-slate-200';
                      let Icon = null;

                      if (selectedTab === 'normal') {
                        if (nNote !== null) {
                          if (nNote >= 10) { situation = 'V'; sitColor = 'bg-emerald-100 text-emerald-700 border-emerald-200'; Icon = CheckCircle2; } 
                          else { situation = 'Ratt'; sitColor = 'bg-orange-100 text-orange-700 border-orange-200'; Icon = AlertCircle; }
                        }
                      } 
                      else if (selectedTab === 'rattrapage') {
                        if (rNote !== null || nNote !== null) {
                          if (bestNote >= 10) { situation = 'VR'; sitColor = 'bg-emerald-100 text-emerald-700 border-emerald-200'; Icon = CheckCircle2; } 
                          else { situation = 'NV'; sitColor = 'bg-rose-100 text-rose-700 border-rose-200'; Icon = XCircle; }
                        }
                      } 
                      else if (selectedTab === 'final') {
                        if (hasAnyGrade) {
                          if (nNote !== null && nNote >= 10) { situation = 'V'; sitColor = 'bg-emerald-100 text-emerald-700 border-emerald-200'; Icon = CheckCircle2; } 
                          else if (bestNote >= 10) { situation = 'VR'; sitColor = 'bg-emerald-100 text-emerald-700 border-emerald-200'; Icon = CheckCircle2; } 
                          else { situation = 'NV'; sitColor = 'bg-rose-100 text-rose-700 border-rose-200'; Icon = XCircle; }
                        }
                      }

                      return (
                        <tr key={grade.id} className="group hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform"><BookOpen size={18}/></div>
                              <span className="font-bold text-slate-700">{grade.module_name}</span>
                            </div>
                          </td>

                          {selectedTab === 'normal' && (
                            <td className="py-3 px-4 text-center">
                              <span className="text-[14px] font-bold text-slate-600 bg-[#F3F5F9] px-3 py-1.5 rounded-lg inline-block min-w-[3rem]">
                                {nNote !== null ? nNote : '--'}
                              </span>
                            </td>
                          )}

                          {selectedTab === 'rattrapage' && (
                            <td className="py-3 px-4 text-center">
                              <span className="text-[14px] font-bold text-slate-600 bg-[#F3F5F9] px-3 py-1.5 rounded-lg inline-block min-w-[3rem]">
                                {rNote !== null ? rNote : '--'}
                              </span>
                            </td>
                          )}

                          {selectedTab === 'final' && (
                            <>
                              <td className="py-3 px-4 text-center text-slate-500 text-sm">{nNote !== null ? nNote : '--'}</td>
                              <td className="py-3 px-4 text-center text-slate-500 text-sm">{rNote !== null ? rNote : '--'}</td>
                              <td className="py-3 px-4 text-center">
                                <span className="text-[15px] font-black text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl inline-block min-w-[3.5rem] shadow-sm border border-indigo-100">
                                  {hasAnyGrade ? bestNote : '--'}
                                </span>
                              </td>
                            </>
                          )}

                          <td className="py-3 px-4 text-center">
                            <span className={`text-[11px] font-black px-3 py-1.5 rounded-lg border inline-flex items-center gap-1.5 ${sitColor}`}>
                              {Icon && <Icon size={12}/>}
                              {situation}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Exam Schedule */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-100 sticky top-28">
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-3 mb-6">
              <Calendar className="text-violet-500" size={24}/> Examens à venir
            </h2>

            {examsData.length === 0 ? (
              <div className="bg-[#F3F5F9] rounded-2xl p-6 text-center text-[13px] font-medium text-slate-500 border border-slate-100">
                Aucun examen programmé pour le moment.
              </div>
            ) : (
              <div className="space-y-4">
                {examsData.map((exam) => (
                  <div key={exam.id} className="bg-[#F3F5F9] rounded-2xl p-5 border border-transparent hover:border-violet-100 hover:shadow-sm transition-all group">
                    <div className="flex justify-between items-start mb-3">
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md ${exam.type === 'normal' ? 'bg-indigo-100 text-indigo-600' : 'bg-orange-100 text-orange-600'}`}>
                        {exam.type === 'normal' ? 'S. Normale' : 'Rattrapage'}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-800 text-[15px] mb-4 leading-tight">{exam.module}</h3>
                    
                    <div className="flex items-center gap-4 border-t border-slate-200/60 pt-4">
                      <div className="flex items-center gap-1.5 text-[12px] font-bold text-slate-500">
                        <Calendar size={14} className="text-slate-400 group-hover:text-violet-500 transition-colors" /> {exam.date}
                      </div>
                      <div className="flex items-center gap-1.5 text-[12px] font-bold text-slate-500">
                        <Clock size={14} className="text-slate-400 group-hover:text-violet-500 transition-colors" /> {exam.time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* --- MODAL: EDIT PROFILE PICTURE --- */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-8 relative">
            <button onClick={() => { setShowEditModal(false); setAvatarFile(null); }} className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors">
              <X size={16} />
            </button>
            <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center mb-5">
              <Upload size={24} />
            </div>
            <h2 className="text-xl font-black text-slate-800 mb-1">Modifier la photo</h2>
            <p className="text-[13px] font-medium text-slate-500 mb-6 leading-relaxed">Importez une nouvelle photo de profil (Max: 1 MB. PNG, JPG, WEBP).</p>
            
            <form onSubmit={handleUpdateAvatar} className="space-y-5">
              <div>
                <input 
                  type="file" 
                  accept="image/png, image/jpeg, image/webp"
                  onChange={e => setAvatarFile(e.target.files[0])} 
                  required
                  className="w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:text-[13px] file:font-black file:bg-[#F3F5F9] file:text-indigo-600 hover:file:bg-indigo-50 file:cursor-pointer transition-all border-2 border-dashed border-slate-200 rounded-xl p-2 focus:outline-none focus:border-indigo-300"
                />
              </div>
              <button disabled={isUpdating || !avatarFile} type="submit" className="w-full bg-slate-800 text-white rounded-xl py-4 text-[13px] font-black mt-4 hover:bg-slate-900 shadow-[0_8px_20px_-6px_rgba(0,0,0,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {isUpdating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : 'Téléverser et Enregistrer'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}