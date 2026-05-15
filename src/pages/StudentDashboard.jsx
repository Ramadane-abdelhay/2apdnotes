import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { LogOut, X, Upload, Camera } from 'lucide-react';

/* ─── GLOBAL STYLES injected once ─── */
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body { background: #ECEEF4; }

    .dash-root {
      min-height: 100vh;
      background: #ECEEF4;
      color: #1E293B;
      font-family: 'Sora', sans-serif;
      overflow-x: hidden;
    }

    /* ── Ambient Background ── */
    .ambient {
      position: fixed; inset: 0; pointer-events: none; z-index: 0;
      overflow: hidden;
    }
    .ambient-blob {
      position: absolute; border-radius: 50%;
      filter: blur(120px); opacity: 0.06;
      animation: blobDrift 18s ease-in-out infinite alternate;
    }
    .blob1 { width: 600px; height: 600px; background: #3B82F6; top: -200px; left: -150px; animation-delay: 0s; }
    .blob2 { width: 500px; height: 500px; background: #2563EB; bottom: -150px; right: -100px; animation-delay: -6s; }
    .blob3 { width: 350px; height: 350px; background: #60A5FA; top: 40%; left: 40%; animation-delay: -12s; }

    @keyframes blobDrift {
      from { transform: translate(0, 0) scale(1); }
      to   { transform: translate(40px, -40px) scale(1.08); }
    }

    /* ── Glass Card ── */
    .glass {
      background: #FFFFFF;
      border: 1px solid rgba(0,0,0,0.07);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
    }
    .glass-strong {
      background: #FFFFFF;
      border: 1px solid rgba(0,0,0,0.09);
      backdrop-filter: blur(32px);
      -webkit-backdrop-filter: blur(32px);
    }

    /* ── Header ── */
    .header {
      position: sticky; top: 0; z-index: 50;
      padding: 16px 32px;
    }
    .header-inner {
      max-width: 1336px; margin: 0 auto;
      display: flex; align-items: center; justify-content: space-between;
      height: 60px; padding: 0 24px; border-radius: 16px;
    }
    .header-logos { display: flex; align-items: center; gap: 20px; }
    .header-divider { width: 1px; height: 28px; background: rgba(0,0,0,0.1); }
    .header-logo { height: 40px; object-fit: contain; opacity: 0.75; transition: all .2s; }
    .header-logo:hover { opacity: 1; }
    .logout-btn {
      width: 40px; height: 40px; border-radius: 10px; border: none;
      background: rgba(0,0,0,0.04); color: #64748B; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: all .2s; border: 1px solid rgba(0,0,0,0.07);
    }
    .logout-btn:hover { background: rgba(239,68,68,0.08); color: #EF4444; border-color: rgba(239,68,68,0.15); }

    /* ── Layout ── */
    .main-layout {
      position: relative; z-index: 1;
      max-width: 1400px; margin: 0 auto;
      padding: 0 32px 80px;
      display: grid;
      grid-template-columns: 320px 1fr;
      grid-template-rows: auto 1fr;
      gap: 20px;
    }
    @media (max-width: 1024px) {
      .main-layout { grid-template-columns: 1fr; }
      .sidebar { position: static !important; }
    }

    /* CRITICAL FIX: Right Column Wrapper */
    .content-col {
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-width: 0; 
    }

    /* ── Sidebar ── */
    .sidebar {
      grid-row: 1 / 3;
      display: flex; flex-direction: column; gap: 16px;
    }

    /* ── Profile Card ── */
    .profile-card {
      border-radius: 20px; padding: 28px;
      position: relative; overflow: hidden;
    }
    .profile-card-glow {
      position: absolute; top: -60px; right: -60px;
      width: 180px; height: 180px;
      background: radial-gradient(circle, rgba(59,130,246,0.25) 0%, transparent 70%);
      pointer-events: none;
    }
    .avatar-wrap {
      position: relative; width: 80px; height: 80px; margin-bottom: 20px;
    }
    .avatar-img {
      width: 80px; height: 80px; border-radius: 16px;
      object-fit: cover; border: 2px solid rgba(37,99,235,0.25);
      background: #EFF6FF;
      display: flex; align-items: center; justify-content: center;
      font-size: 28px; font-weight: 800; color: #2563EB;
      overflow: hidden;
    }
    .avatar-edit-btn {
      position: absolute; bottom: -6px; right: -6px;
      width: 28px; height: 28px; border-radius: 8px;
      background: #2563EB; color: white; border: 2px solid #ECEEF4;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; transition: all .2s;
    }
    .avatar-edit-btn:hover { background: #1D4ED8; transform: scale(1.1); }
    .profile-name {
      font-size: 20px; font-weight: 800; color: #0F172A;
      line-height: 1.2; margin-bottom: 4px;
    }
    .profile-title {
      font-size: 10px; font-weight: 600; text-transform: uppercase;
      letter-spacing: 2px; color: #2563EB; margin-bottom: 20px;
    }
    .profile-pills { display: flex; flex-direction: column; gap: 8px; }
    .profile-pill {
      border-radius: 10px; padding: 10px 14px;
      background: #F8FAFC;
      border: 1px solid rgba(0,0,0,0.06);
      display: flex; justify-content: space-between; align-items: center;
    }
    .pill-label {
      font-size: 9px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 1.5px; color: #94A3B8;
    }
    .pill-value {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px; font-weight: 600; color: #334155;
    }

    /* ── Exam Card ── */
    .exam-card { border-radius: 20px; padding: 24px; flex: 1; }
    .section-label {
      font-size: 9px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 2.5px; color: #94A3B8; margin-bottom: 16px;
      display: block;
    }
    .exam-empty {
      text-align: center; padding: 32px 16px;
      color: #94A3B8; font-size: 13px; font-weight: 500;
      background: #F8FAFC; border-radius: 12px;
      border: 1px dashed rgba(0,0,0,0.08);
    }
    .exam-item {
      border-radius: 12px; padding: 14px 16px; margin-bottom: 10px;
      background: #F8FAFC;
      border: 1px solid rgba(0,0,0,0.06);
      transition: all .25s; cursor: default;
    }
    .exam-item:last-child { margin-bottom: 0; }
    .exam-item:hover {
      background: #EFF6FF;
      border-color: rgba(37,99,235,0.2);
      transform: translateX(3px);
    }
    .exam-type-badge {
      display: inline-block; font-size: 8px; font-weight: 700;
      text-transform: uppercase; letter-spacing: 1.5px;
      padding: 3px 8px; border-radius: 5px; margin-bottom: 8px;
    }
    .badge-normal { background: #DBEAFE; color: #2563EB; }
    .badge-ratt { background: #FEF3C7; color: #D97706; }
    .exam-module {
      font-size: 13px; font-weight: 600; color: #1E293B;
      margin-bottom: 10px; line-height: 1.4;
    }
    .exam-meta {
      display: flex; gap: 14px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px; color: #94A3B8;
      border-top: 1px solid rgba(0,0,0,0.06);
      padding-top: 10px;
    }

    /* ── Grades Panel Separated ── */
    .grades-controls-card { 
      border-radius: 20px; 
      padding: 28px 32px; 
      margin-bottom: 16px; 
    }
    .grades-table-card { 
      border-radius: 20px; 
      overflow: hidden; 
    }
    .grades-title {
      font-size: 22px; font-weight: 800; color: #0F172A;
      margin-bottom: 24px; letter-spacing: -0.5px;
    }

    /* ── Semester Tabs ── */
    .sem-tabs {
      display: flex; gap: 4px;
      background: #F1F5F9; border-radius: 12px; padding: 4px;
      border: 1px solid rgba(0,0,0,0.06); margin-bottom: 16px;
      width: fit-content;
    }
    .sem-tab {
      padding: 8px 20px; border-radius: 8px; border: none;
      font-family: 'Sora', sans-serif;
      font-size: 12px; font-weight: 600; cursor: pointer;
      transition: all .2s; color: #94A3B8; background: transparent;
    }
    .sem-tab.active {
      background: #2563EB; color: white;
      box-shadow: 0 4px 16px rgba(37,99,235,0.3);
    }
    .sem-tab:not(.active):hover { color: #475569; }
    .sem-text-mobile { display: none; }

    /* ── Session Tabs ── */
    .session-tabs {
      display: flex; gap: 2px;
      background: #F1F5F9; border-radius: 10px; padding: 4px;
      border: 1px solid rgba(0,0,0,0.06); margin-bottom: 0;
    }
    .session-tab {
      flex: 1; padding: 10px 16px; border-radius: 8px; border: none;
      font-family: 'Sora', sans-serif;
      font-size: 11px; font-weight: 600; cursor: pointer;
      transition: all .2s; color: #94A3B8; background: transparent;
    }
    .session-tab.active-normal {
      background: #DBEAFE; color: #1D4ED8;
      border: 1px solid rgba(37,99,235,0.2);
    }
    .session-tab.active-final {
      background: #D1FAE5; color: #059669;
      border: 1px solid rgba(5,150,105,0.2);
    }
    .session-tab:not(.active-normal):not(.active-final):hover { color: #64748B; }

    /* ── Grades Table ── */
    .grades-table-wrap { 
      overflow-x: auto; 
      padding: 24px 32px; 
      -webkit-overflow-scrolling: touch; 
      width: 100%;
    }
    .grades-table {
      width: 100%; border-collapse: collapse;
    }
    .grades-table th {
      font-size: 9px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 2px; color: #94A3B8; padding: 0 16px 16px;
      text-align: left;
      white-space: nowrap; 
    }
    .grades-table th.center { text-align: center; }
    .grades-table tbody tr {
      border-top: 1px solid rgba(0,0,0,0.05);
      transition: all .2s;
    }
    .grades-table tbody tr:hover { background: #F8FAFC; }
    
    .grades-table td {
      padding: 14px 16px; font-size: 13px; color: #64748B;
      /* By default, keep things like numbers on one line */
      white-space: nowrap; 
    }
    
    /* NEW FIX: Target only the first column (Module Name) to allow wrapping! */
    .grades-table td:first-child {
      white-space: normal; /* This allows the long text to break into 2/3 lines */
      min-width: 120px; /* Prevents it from getting squeezed into 1 word per line */
      line-height: 1.5;
    }

    .module-name-cell {
      font-size: 13px; font-weight: 600; color: #1E293B;
    }
    .note-chip {
      display: inline-block;
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px; font-weight: 600;
      padding: 6px 14px; border-radius: 8px; min-width: 52px;
      text-align: center;
      background: #F1F5F9;
      border: 1px solid rgba(0,0,0,0.07);
      color: #475569;
    }
    .note-chip.best {
      background: #DBEAFE; border-color: rgba(37,99,235,0.2);
      color: #1D4ED8; font-weight: 700;
    }

    /* Situation badges */
    .sit-badge {
      display: inline-flex; align-items: center; gap: 5px;
      font-size: 9px; font-weight: 800; text-transform: uppercase;
      letter-spacing: 1px; padding: 5px 10px; border-radius: 7px;
    }
    .sit-v   { background: #D1FAE5; color: #059669; border: 1px solid rgba(5,150,105,0.2); }
    .sit-ratt{ background: #FEF3C7; color: #D97706; border: 1px solid rgba(217,119,6,0.2); }
    .sit-nv  { background: #FEE2E2; color: #DC2626; border: 1px solid rgba(220,38,38,0.15); }
    .sit-none{ background: #F1F5F9; color: #94A3B8; border: 1px solid rgba(0,0,0,0.06); }

    .empty-state {
      padding: 60px 24px; text-align: center;
      color: #94A3B8; font-size: 13px; font-weight: 500;
      background: #F8FAFC; border-radius: 12px;
      border: 1px dashed rgba(0,0,0,0.08);
      margin: 4px 0;
    }

    /* ── Stat chips at top ── */
    .stats-row {
      display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;
      margin-bottom: 20px;
    }
    .stat-chip {
      border-radius: 14px; padding: 16px 18px;
      background: #FFFFFF;
      border: 1px solid rgba(0,0,0,0.07);
      transition: all .2s;
    }
    .stat-chip:hover { border-color: rgba(37,99,235,0.2); box-shadow: 0 4px 16px rgba(37,99,235,0.06); }
    .stat-chip-val {
      font-family: 'JetBrains Mono', monospace;
      font-size: 24px; font-weight: 700; color: #0F172A;
      line-height: 1; margin-bottom: 4px;
    }
    .stat-chip-val.blue { color: #2563EB; }
    .stat-chip-val.green { color: #059669; }
    .stat-chip-val.orange { color: #D97706; }
    .stat-chip-lbl {
      font-size: 9px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 1.5px; color: #94A3B8;
    }

    /* ── Modal ── */
    .modal-overlay {
      position: fixed; inset: 0; z-index: 100;
      background: rgba(15,23,42,0.4); backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center; padding: 20px;
      animation: fadeIn .2s ease;
    }
    .modal-box {
      width: 100%; max-width: 400px; border-radius: 20px; padding: 32px;
      background: #FFFFFF; border: 1px solid rgba(0,0,0,0.08);
      box-shadow: 0 40px 80px rgba(0,0,0,0.15);
      position: relative; animation: slideUp .25s ease;
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: none; opacity: 1; } }
    .modal-close {
      position: absolute; top: 20px; right: 20px;
      width: 32px; height: 32px; border-radius: 8px;
      background: #F1F5F9; border: 1px solid rgba(0,0,0,0.07);
      color: #94A3B8; cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: all .2s;
    }
    .modal-close:hover { background: #FEE2E2; color: #DC2626; border-color: rgba(220,38,38,0.2); }
    .modal-title {
      font-size: 18px; font-weight: 800; color: #0F172A; margin-bottom: 6px;
    }
    .modal-sub {
      font-size: 12px; color: #94A3B8; font-weight: 500; margin-bottom: 24px; line-height: 1.6;
    }
    .file-input-wrap {
      border: 1.5px dashed rgba(37,99,235,0.25); border-radius: 12px; padding: 20px;
      background: #EFF6FF; margin-bottom: 16px; transition: all .2s;
    }
    .file-input-wrap:hover { border-color: rgba(37,99,235,0.45); background: #DBEAFE; }
    .file-input-wrap input[type="file"] {
      width: 100%; font-size: 12px; font-family: 'Sora', sans-serif;
      color: #64748B; cursor: pointer;
    }
    .file-input-wrap input[type="file"]::-webkit-file-upload-button {
      background: #DBEAFE; color: #2563EB; border: none;
      padding: 8px 16px; border-radius: 8px; font-family: 'Sora', sans-serif;
      font-size: 11px; font-weight: 700; cursor: pointer; margin-right: 12px;
      transition: all .2s;
    }
    .modal-submit {
      width: 100%; padding: 14px; border-radius: 12px; border: none;
      background: #2563EB; color: white; font-family: 'Sora', sans-serif;
      font-size: 13px; font-weight: 700; cursor: pointer;
      transition: all .2s; box-shadow: 0 8px 24px rgba(37,99,235,0.3);
      display: flex; align-items: center; justify-content: center; gap: 8px;
    }
    .modal-submit:hover:not(:disabled) { background: #1D4ED8; transform: translateY(-1px); }
    .modal-submit:disabled { opacity: 0.4; cursor: not-allowed; }
    .spin {
      width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.2);
      border-top-color: white; border-radius: 50%;
      animation: spin .6s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Loading */
    .loading-screen {
      min-height: 100vh; display: flex; align-items: center; justify-content: center;
      background: #ECEEF4;
    }
    .loader-ring {
      width: 36px; height: 36px; border-radius: 50%;
      border: 2px solid rgba(59,130,246,0.15); border-top-color: #3B82F6;
      animation: spin .8s linear infinite;
    }

    /* Scrollbar */
    ::-webkit-scrollbar { width: 4px; height: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 4px; }

    /* Slide in animation for cards */
    @keyframes slideInUp {
      from { opacity: 0; transform: translateY(24px); }
      to   { opacity: 1; transform: none; }
    }
    .anim-1 { animation: slideInUp .4s ease both; }
    .anim-2 { animation: slideInUp .4s .08s ease both; }
    .anim-3 { animation: slideInUp .4s .16s ease both; }
    .anim-4 { animation: slideInUp .4s .24s ease both; }

    /* ── RESPONSIVE TWEAKS FOR < 480px ── */
    @media (max-width: 480px) {
      .main-layout { padding: 0 16px 80px; }
      
      .header { padding: 12px 12px; }
      .header-inner { padding: 0 12px; gap: 10px; }
      .header-logos { gap: 10px; }
      .header-logo { height: 30px; } 
      
      .profile-card { padding: 20px; }
      .exam-card { padding: 20px; }
      
      .stats-row { gap: 8px; }
      .stat-chip { padding: 12px 10px; }
      .stat-chip-val { font-size: 18px; }
      .stat-chip-lbl { font-size: 8px; letter-spacing: 1px; }
      
      .grades-controls-card { padding: 20px 16px; }
      
      .sem-text-desktop { display: none; }
      .sem-text-mobile { display: inline; }

      .grades-table-wrap { padding: 16px 0; }
      
      .grades-table th, .grades-table td {
        padding: 10px 8px; 
      }
      .note-chip {
        min-width: 44px;
        padding: 4px 8px;
        font-size: 11px;
      }
      .module-name-cell {
        font-size: 11px;
      }
      
      .grades-table th:first-child, .grades-table td:first-child { padding-left: 16px; }
      .grades-table th:last-child, .grades-table td:last-child { padding-right: 16px; }
      
      .session-tabs { flex-wrap: wrap; }
      .session-tab { padding: 8px 4px; font-size: 10px; }
      
      .modal-box { padding: 24px; }
    }
  `}</style>
);

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const [student, setStudent] = useState(null);
  const [gradesData, setGradesData] = useState([]);
  const [examsData, setExamsData] = useState([]);

  const [selectedSemester, setSelectedSemester] = useState(1);
  const [selectedTab, setSelectedTab] = useState('normal');

  const [showEditModal, setShowEditModal] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => { fetchStudentData(); }, []);

  async function fetchStudentData() {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) { navigate('/student-login'); return; }

      const { data: studentData } = await supabase.from('students').select('*').eq('id', user.id).single();
      if (studentData) setStudent(studentData);

      const { data: allModules } = await supabase.from('modules').select('*');
      const { data: dbGrades } = await supabase.from('grades').select('id, normal_note, rattrapage_note, module_id').eq('student_id', user.id);

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

      const { data: dbExams } = await supabase.from('exams').select('id, date, time, type, modules(module_name)');
      if (dbExams) {
        const now = new Date();
        const processedExams = dbExams
          .map(e => {
            const examDateTime = new Date(`${e.date}T${e.time}`);
            return { id: e.id, module: e.modules?.module_name || 'Examen', date: e.date, time: e.time, type: e.type, fullDateTime: examDateTime };
          })
          .filter(exam => {
            const examPlus4Hours = new Date(exam.fullDateTime.getTime() + 4 * 60 * 60 * 1000);
            return now <= examPlus4Hours;
          })
          .sort((a, b) => a.fullDateTime - b.fullDateTime);
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
    const MAX_FILE_SIZE = 1024 * 1024;
    if (avatarFile.size > MAX_FILE_SIZE) { alert("L'image est trop volumineuse. Veuillez choisir un fichier de moins de 1 MB."); return; }
    setIsUpdating(true);
    try {
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${student.id}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, avatarFile, { cacheControl: '3600', upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const { error: dbError } = await supabase.from('students').update({ avatar_url: publicUrl }).eq('id', student.id);
      if (dbError) throw dbError;
      setStudent(prev => ({ ...prev, avatar_url: publicUrl }));
      setShowEditModal(false);
      setAvatarFile(null);
    } catch (error) {
      console.error("Upload Error:", error);
      alert("Erreur lors de la mise à jour de l'image.");
    } finally {
      setIsUpdating(false);
    }
  };

  /* ── Derived data ── */
  const currentSemesterGrades = gradesData.filter(g => g.semester === selectedSemester);
  let displayedGrades = [];
  if (selectedTab === 'normal') displayedGrades = currentSemesterGrades;
  else if (selectedTab === 'rattrapage') displayedGrades = currentSemesterGrades.filter(g => g.normalNote === null || parseFloat(g.normalNote) < 10);
  else if (selectedTab === 'final') displayedGrades = currentSemesterGrades;

  /* Stats */
  const validated = currentSemesterGrades.filter(g => {
    const n = g.normalNote !== null ? parseFloat(g.normalNote) : null;
    const r = g.ratNote !== null ? parseFloat(g.ratNote) : null;
    return Math.max(n || 0, r || 0) >= 10 && (n !== null || r !== null);
  }).length;
  const failed = currentSemesterGrades.filter(g => {
    const n = g.normalNote !== null ? parseFloat(g.normalNote) : null;
    const r = g.ratNote !== null ? parseFloat(g.ratNote) : null;
    return (n !== null || r !== null) && Math.max(n || 0, r || 0) < 10;
  }).length;

  if (loading) return (
    <div className="loading-screen">
      <GlobalStyles />
      <div className="loader-ring"></div>
    </div>
  );

  return (
    <div className="dash-root">
      <GlobalStyles />

      {/* Ambient blobs */}
      <div className="ambient">
        <div className="ambient-blob blob1"></div>
        <div className="ambient-blob blob2"></div>
        <div className="ambient-blob blob3"></div>
      </div>

      {/* HEADER */}
      <header className="header">
        <div className="header-inner glass">
          <div className="header-logos">
            <img src="https://ramadane-abdelhay.github.io/Salery_predection_app/2APD-logo.png" alt="2APD" className="header-logo" />
            <div className="header-divider"></div>
            <img src="https://ramadane-abdelhay.github.io/Salery_predection_app/lafac-logo.png" alt="Faculté" className="header-logo" />
          </div>
          <button onClick={() => navigate('/')} className="logout-btn" title="Se déconnecter">
            <LogOut size={15} />
          </button>
        </div>
      </header>

      {/* MAIN */}
      <div className="main-layout">

        {/* ── SIDEBAR ── */}
        <aside className="sidebar">

          {/* Profile Card */}
          <div className="profile-card glass anim-1">
            <div className="profile-card-glow"></div>
            <div className="avatar-wrap">
              <div className="avatar-img">
                {student?.avatar_url
                  ? <img src={student.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                  : (student?.first_name?.[0] || '?')}
              </div>
              <button className="avatar-edit-btn" onClick={() => setShowEditModal(true)} title="Modifier la photo">
                <Camera size={12} />
              </button>
            </div>
            <div className="profile-name">{student?.first_name} {student?.last_name}</div>
            <div className="profile-title">Master 2APD</div>
            <div className="profile-pills">
              <div className="profile-pill">
                <span className="pill-label">Apogée</span>
                <span className="pill-value">{student?.apogee_code || '—'}</span>
              </div>
              <div className="profile-pill">
                <span className="pill-label">CNE</span>
                <span className="pill-value">{student?.cne || '—'}</span>
              </div>
            </div>
          </div>

          {/* Exams Card */}
          <div className="exam-card glass anim-2">
            <span className="section-label">Examens à venir</span>
            {examsData.length === 0 ? (
              <div className="exam-empty">Aucun examen programmé.</div>
            ) : (
              examsData.map(exam => (
                <div key={exam.id} className="exam-item">
                  <div>
                    <span className={`exam-type-badge ${exam.type === 'normal' ? 'badge-normal' : 'badge-ratt'}`}>
                      {exam.type === 'normal' ? 'Session Normale' : 'Rattrapage'}
                    </span>
                  </div>
                  <div className="exam-module">{exam.module}</div>
                  <div className="exam-meta">
                    <span>{exam.date}</span>
                    <span style={{ color: '#BFDBFE' }}>·</span>
                    <span>{exam.time?.slice(0, 5)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* ── GRADES PANEL ── */}
        <div className="content-col">

          {/* Stat chips */}
          <div className="stats-row anim-3">
            <div className="stat-chip glass">
              <div className="stat-chip-val blue">{currentSemesterGrades.length}</div>
              <div className="stat-chip-lbl">Modules</div>
            </div>
            <div className="stat-chip glass">
              <div className="stat-chip-val green">{validated}</div>
              <div className="stat-chip-lbl">Validés</div>
            </div>
            <div className="stat-chip glass">
              <div className="stat-chip-val orange">{failed}</div>
              <div className="stat-chip-lbl">En attente</div>
            </div>
          </div>

          {/* Separated Parameters Card */}
          <div className="grades-controls-card glass anim-4">
            <div className="grades-title">Relevé de notes</div>

            {/* Semester selector */}
            <div className="sem-tabs">
              {[1, 2, 3].map(sem => (
                <button key={sem} className={`sem-tab ${selectedSemester === sem ? 'active' : ''}`} onClick={() => setSelectedSemester(sem)}>
                  <span className="sem-text-desktop">Semestre {sem}</span>
                  <span className="sem-text-mobile">S{sem}</span>
                </button>
              ))}
            </div>

            {/* Session tabs */}
            <div className="session-tabs">
              <button
                className={`session-tab ${selectedTab === 'normal' ? 'active-normal' : ''}`}
                onClick={() => setSelectedTab('normal')}
              >Session Normale</button>
              <button
                className={`session-tab ${selectedTab === 'rattrapage' ? 'active-normal' : ''}`}
                onClick={() => setSelectedTab('rattrapage')}
              >Rattrapage</button>
              <button
                className={`session-tab ${selectedTab === 'final' ? 'active-final' : ''}`}
                onClick={() => setSelectedTab('final')}
              >Note Finale</button>
            </div>
          </div>

          {/* Separated Table Card */}
          <div className="grades-table-card glass anim-4">
            <div className="grades-table-wrap">
              {displayedGrades.length === 0 ? (
                <div className="empty-state">Aucun module disponible pour cette session.</div>
              ) : (
                <table className="grades-table">
                  <thead>
                    <tr>
                      <th>Module</th>
                      {selectedTab === 'normal' && <th className="center">Normale</th>}
                      {selectedTab === 'rattrapage' && <th className="center">Rattrapage</th>}
                      {selectedTab === 'final' && <>
                        <th className="center">Normale</th>
                        <th className="center">Rattrapage</th>
                        <th className="center">Meilleure</th>
                      </>}
                      <th className="center">Situation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedGrades.map(grade => {
                      const nNote = grade.normalNote !== null ? parseFloat(grade.normalNote) : null;
                      const rNote = grade.ratNote !== null ? parseFloat(grade.ratNote) : null;
                      const bestNote = Math.max(nNote || 0, rNote || 0);
                      const hasAnyGrade = nNote !== null || rNote !== null;

                      let situation = '--', sitClass = 'sit-none';
                      if (selectedTab === 'normal') {
                        if (nNote !== null) { situation = nNote >= 10 ? 'Validé' : 'Ratt.'; sitClass = nNote >= 10 ? 'sit-v' : 'sit-ratt'; }
                      } else if (selectedTab === 'rattrapage') {
                        if (rNote !== null || nNote !== null) { situation = bestNote >= 10 ? 'Validé' : 'Non Validé'; sitClass = bestNote >= 10 ? 'sit-v' : 'sit-nv'; }
                      } else if (selectedTab === 'final') {
                        if (hasAnyGrade) {
                          if (nNote !== null && nNote >= 10) { situation = 'Validé'; sitClass = 'sit-v'; }
                          else if (bestNote >= 10) { situation = 'Validé R.'; sitClass = 'sit-v'; }
                          else { situation = 'Non Validé'; sitClass = 'sit-nv'; }
                        }
                      }

                      return (
                        <tr key={grade.id}>
                          <td><span className="module-name-cell">{grade.module_name}</span></td>

                          {selectedTab === 'normal' && (
                            <td style={{ textAlign: 'center' }}>
                              <span className="note-chip">{nNote !== null ? nNote : '—'}</span>
                            </td>
                          )}

                          {selectedTab === 'rattrapage' && (
                            <td style={{ textAlign: 'center' }}>
                              <span className="note-chip">{rNote !== null ? rNote : '—'}</span>
                            </td>
                          )}

                          {selectedTab === 'final' && <>
                            <td style={{ textAlign: 'center' }}>
                              <span className="note-chip">{nNote !== null ? nNote : '—'}</span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span className="note-chip">{rNote !== null ? rNote : '—'}</span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span className="note-chip best">{hasAnyGrade ? bestNote : '—'}</span>
                            </td>
                          </>}

                          <td style={{ textAlign: 'center' }}>
                            <span className={`sit-badge ${sitClass}`}>{situation}</span>
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
      </div>

      {/* ── MODAL ── */}
      {showEditModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) { setShowEditModal(false); setAvatarFile(null); } }}>
          <div className="modal-box">
            <button className="modal-close" onClick={() => { setShowEditModal(false); setAvatarFile(null); }}>
              <X size={14} />
            </button>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#EFF6FF', border: '1px solid rgba(37,99,235,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Upload size={20} color="#2563EB" />
            </div>
            <div className="modal-title">Modifier la photo</div>
            <div className="modal-sub">PNG, JPG ou WEBP · Max 1 MB</div>
            <form onSubmit={handleUpdateAvatar}>
              <div className="file-input-wrap">
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={e => setAvatarFile(e.target.files[0])}
                  required
                />
              </div>
              <button type="submit" className="modal-submit" disabled={isUpdating || !avatarFile}>
                {isUpdating ? <div className="spin"></div> : 'Téléverser et enregistrer'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
