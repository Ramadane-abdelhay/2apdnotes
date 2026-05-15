import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import {
  Users, Upload, Save, X, Search,
  FileSpreadsheet, LogOut, Calendar, CheckCircle2, Edit3, Lock, BookOpen
} from 'lucide-react';

/* ─── GLOBAL STYLES ─── */
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #ECEEF4; }

    .p-root {
      min-height: 100vh;
      background: #ECEEF4;
      color: #1E293B;
      font-family: 'Sora', sans-serif;
      overflow-x: hidden;
    }

    /* ── Ambient blobs ── */
    .p-ambient { position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }
    .p-blob {
      position: absolute; border-radius: 50%;
      filter: blur(120px); opacity: 0.06;
      animation: pBlobDrift 20s ease-in-out infinite alternate;
    }
    .pb1 { width: 550px; height: 550px; background: #3B82F6; top: -180px; left: -120px; animation-delay: 0s; }
    .pb2 { width: 450px; height: 450px; background: #2563EB; bottom: -120px; right: -80px; animation-delay: -7s; }
    .pb3 { width: 300px; height: 300px; background: #60A5FA; top: 45%; left: 45%; animation-delay: -14s; }
    @keyframes pBlobDrift {
      from { transform: translate(0,0) scale(1); }
      to   { transform: translate(36px,-36px) scale(1.07); }
    }

    /* ── Header ── */
    .p-header { position: sticky; top: 0; z-index: 50; padding: 16px 32px; }
    .p-header-inner {
      max-width: 1336px; /* FIXED: Now perfectly aligns with the main layout content edges */
      margin: 0 auto;
      display: flex; align-items: center; justify-content: space-between;
      height: 60px; padding: 0 24px; border-radius: 16px;
      background: #FFFFFF; border: 1px solid rgba(0,0,0,0.07);
    }
    .p-header-logos { display: flex; align-items: center; gap: 20px; }
    .p-header-div { width: 1px; height: 28px; background: rgba(0,0,0,0.1); }
    .p-header-logo { height: 28px; object-fit: contain; opacity: 0.75; transition: opacity .2s; }
    .p-header-logo:hover { opacity: 1; }
    .p-header-right { display: flex; align-items: center; gap: 16px; }
    .p-prof-name { font-size: 13px; font-weight: 700; color: #0F172A; text-align: right; }
    .p-prof-role {
      font-size: 9px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 2px; color: #2563EB; text-align: right;
    }
    .p-logout-btn {
      width: 40px; height: 40px; border-radius: 10px; border: none;
      background: rgba(0,0,0,0.04); color: #64748B; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: all .2s; border: 1px solid rgba(0,0,0,0.07);
    }
    .p-logout-btn:hover { background: rgba(239,68,68,0.08); color: #EF4444; border-color: rgba(239,68,68,0.15); }

    /* ── Layout ── */
    .p-main {
      position: relative; z-index: 1;
      max-width: 1400px; margin: 0 auto;
      padding: 24px 32px 80px;
    }

    /* ── MODULE SECTION ── */
    .p-module-section {
       margin-bottom: 32px;
       display: flex;
       flex-direction: column;
       gap: 12px;
    }
    .p-module-label {
      font-size: 10px; font-weight: 800; text-transform: uppercase;
      letter-spacing: 1.5px; color: #94A3B8; margin-left: 4px;
    }
    .p-module-tabs { 
      display: flex; flex-wrap: wrap; gap: 10px; 
      padding: 6px; background: rgba(255,255,255,0.4); 
      border-radius: 16px; border: 1px solid rgba(255,255,255,0.6);
      width: fit-content;
    }
    .p-module-btn {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 20px; border-radius: 12px; border: 1px solid transparent;
      font-family: 'Sora', sans-serif; font-size: 13px; font-weight: 600;
      cursor: pointer; transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      background: #FFFFFF; color: #64748B;
      box-shadow: 0 2px 4px rgba(0,0,0,0.02);
    }
    .p-module-btn.active {
      background: #FFFFFF; color: #2563EB; 
      border-color: rgba(37,99,235,0.2);
      box-shadow: 0 10px 20px rgba(37,99,235,0.12);
      transform: translateY(-2px);
    }
    .p-module-btn.active .p-mod-indicator {
        width: 6px; height: 6px; background: #2563EB; border-radius: 50%;
        box-shadow: 0 0 0 3px rgba(37,99,235,0.15);
        animation: pPulse 2s infinite;
    }
    @keyframes pPulse {
        0% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.3); opacity: 0.5; }
        100% { transform: scale(1); opacity: 1; }
    }
    .p-module-btn:not(.active):hover { 
      background: #F8FAFC; color: #1E293B; border-color: rgba(0,0,0,0.05);
    }

    /* ── Page title row ── */
    .p-title-row {
      display: flex; flex-wrap: wrap; align-items: center;
      justify-content: space-between; gap: 20px; margin-bottom: 12px;
    }
    .p-page-title {
      font-size: 28px; font-weight: 800; color: #0F172A;
      letter-spacing: -0.8px;
    }
    .p-schedule-btn {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 20px; border-radius: 12px; border: 1px solid rgba(0,0,0,0.07);
      font-family: 'Sora', sans-serif; font-size: 12px; font-weight: 600;
      background: #FFFFFF; color: #334155; cursor: pointer; transition: all .2s;
      white-space: nowrap;
    }
    .p-schedule-btn:hover { background: #EFF6FF; border-color: rgba(37,99,235,0.2); color: #1D4ED8; }

    /* ── Nav tabs ── */
    .p-nav-row {
      display: flex; align-items: center; justify-content: space-between;
      flex-wrap: wrap; gap: 16px; margin-bottom: 24px;
    }
    .p-nav-tabs {
      display: flex; gap: 4px;
      background: #F1F5F9; border-radius: 12px; padding: 4px;
      border: 1px solid rgba(0,0,0,0.06);
    }
    .p-nav-tab {
      display: flex; align-items: center; gap: 7px;
      padding: 9px 20px; border-radius: 9px; border: none;
      font-family: 'Sora', sans-serif; font-size: 12px; font-weight: 600;
      cursor: pointer; transition: all .2s;
      background: transparent; color: #94A3B8;
    }
    .p-nav-tab.active {
      background: #FFFFFF; color: #1D4ED8;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    .p-nav-tab:not(.active):hover { color: #475569; }

    /* ── Search ── */
    .p-search-wrap { position: relative; }
    .p-search-icon {
      position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
      color: #94A3B8; pointer-events: none;
    }
    .p-search-input {
      background: #FFFFFF; border: 1px solid rgba(0,0,0,0.07);
      border-radius: 12px; padding: 10px 16px 10px 40px;
      font-family: 'Sora', sans-serif; font-size: 12px; color: #1E293B;
      outline: none; width: 240px; transition: all .2s;
    }
    .p-search-input:focus { border-color: rgba(37,99,235,0.3); box-shadow: 0 0 0 3px rgba(37,99,235,0.07); }

    /* ── Directory grid ── */
    .p-dir-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 16px;
    }
    .p-dir-card {
      background: #FFFFFF; border: 1px solid rgba(0,0,0,0.07);
      border-radius: 20px; padding: 24px 16px;
      display: flex; flex-direction: column; align-items: center; text-align: center;
      cursor: pointer; transition: all .22s;
    }
    .p-dir-card:hover {
      border-color: rgba(37,99,235,0.2);
      box-shadow: 0 8px 24px rgba(37,99,235,0.08);
      transform: translateY(-3px);
    }
    .p-dir-avatar {
      width: 64px; height: 64px; border-radius: 16px;
      background: #EFF6FF; border: 2px solid rgba(37,99,235,0.12);
      display: flex; align-items: center; justify-content: center;
      font-size: 22px; font-weight: 800; color: #2563EB;
      margin-bottom: 14px; overflow: hidden;
    }
    .p-dir-name { font-size: 13px; font-weight: 700; color: #1E293B; margin-bottom: 4px; }
    .p-dir-num {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px; font-weight: 600; color: #94A3B8;
    }

    /* ── Grades panel ── */
    .p-grades-panel {
      background: #FFFFFF; border: 1px solid rgba(0,0,0,0.07);
      border-radius: 20px; overflow: hidden;
    }
    .p-grades-toolbar {
      display: flex; align-items: center; justify-content: space-between;
      flex-wrap: wrap; gap: 16px;
      padding: 20px 28px; border-bottom: 1px solid rgba(0,0,0,0.05);
    }

    /* Session switcher */
    .p-session-tabs {
      display: flex; gap: 3px;
      background: #F1F5F9; border-radius: 10px; padding: 4px;
      border: 1px solid rgba(0,0,0,0.06);
    }
    .p-session-tab {
      display: flex; align-items: center; gap: 6px;
      padding: 8px 16px; border-radius: 8px; border: none;
      font-family: 'Sora', sans-serif; font-size: 11px; font-weight: 600;
      cursor: pointer; transition: all .2s;
      background: transparent; color: #94A3B8;
    }
    .p-session-tab.active {
      background: #FFFFFF; color: #1D4ED8;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      border: 1px solid rgba(37,99,235,0.12);
    }
    .p-session-tab.active-ratt {
      background: #FFFFFF; color: #D97706;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      border: 1px solid rgba(217,119,6,0.15);
    }
    .p-session-tab:disabled { opacity: 0.45; cursor: not-allowed; }

    /* Toolbar action buttons */
    .p-toolbar-btns { display: flex; gap: 10px; align-items: center; }
    .p-btn {
      display: flex; align-items: center; gap: 7px;
      padding: 8px 16px; border-radius: 10px; border: none;
      font-family: 'Sora', sans-serif; font-size: 11px; font-weight: 700;
      cursor: pointer; transition: all .2s;
    }
    .p-btn-edit { background: #FEF9C3; color: #A16207; }
    .p-btn-edit:hover { background: #FEF08A; }
    .p-btn-csv  { background: #DBEAFE; color: #1D4ED8; }
    .p-btn-csv:hover  { background: #BFDBFE; }
    .p-btn-cancel { background: #F1F5F9; color: #64748B; }

    /* ── Grades table ── */
    .p-table-wrap { overflow-x: auto; width: 100%; -webkit-overflow-scrolling: touch; }
    .p-table { width: 100%; border-collapse: collapse; }
    .p-table th, .p-table td { white-space: nowrap; }
    .p-table thead tr { border-bottom: 1px solid rgba(0,0,0,0.05); }
    .p-table th {
      padding: 14px 20px;
      font-size: 9px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 2px; color: #94A3B8; text-align: left;
    }
    .p-table tbody tr:hover { background: #F8FAFC; }
    .p-table td { padding: 12px 20px; font-size: 13px; }

    .p-student-name { white-space: normal; min-width: 130px; line-height: 1.4; }

    .p-student-num {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px; font-weight: 700; color: #2563EB;
    }
    .p-student-avatar {
      width: 34px; height: 34px; border-radius: 10px;
      background: #EFF6FF; border: 1px solid rgba(37,99,235,0.1);
      display: flex; align-items: center; justify-content: center;
      font-size: 12px; font-weight: 800; color: #2563EB;
      overflow: hidden; flex-shrink: 0;
    }

    /* Note input */
    .p-note-input {
      width: 80px; display: block; margin: 0 auto;
      padding: 7px 10px; border-radius: 8px; border: none;
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px; font-weight: 700; text-align: center;
      outline: none; transition: all .2s;
    }
    .p-note-input.normal { background: #F1F5F9; color: #1D4ED8; }
    .p-note-input.normal:focus { background: #EFF6FF; box-shadow: 0 0 0 3px rgba(37,99,235,0.12); }
    .p-note-input.ratt { background: #FFFBEB; color: #B45309; }

    /* Comment input */
    .p-comment-input {
      width: 100%; min-width: 150px; padding: 8px 14px; border-radius: 8px; border: none;
      background: #F8FAFC; font-family: 'Sora', sans-serif;
      font-size: 11px; color: #475569; outline: none; transition: all .2s;
    }

    /* Save footer */
    .p-save-footer {
      display: flex; justify-content: flex-end;
      padding: 20px 28px; border-top: 1px solid rgba(0,0,0,0.05);
      background: #F8FAFC;
    }
    .p-save-btn {
      display: flex; align-items: center; gap: 10px;
      padding: 12px 28px; border-radius: 12px; border: none;
      font-family: 'Sora', sans-serif; font-size: 13px; font-weight: 700;
      cursor: pointer; transition: all .2s;
    }
    .p-save-btn.normal { background: #2563EB; color: white; box-shadow: 0 8px 24px rgba(37,99,235,0.25); }
    .p-save-btn.ratt { background: #D97706; color: white; box-shadow: 0 8px 24px rgba(217,119,6,0.2); }
    .p-spin {
      width: 16px; height: 16px; border-radius: 50%;
      border: 2px solid rgba(255,255,255,0.3); border-top-color: white;
      animation: pSpin .6s linear infinite;
    }
    @keyframes pSpin { to { transform: rotate(360deg); } }

    /* ── ENHANCED MODALS ── */
    .p-overlay {
      position: fixed; inset: 0; z-index: 100;
      background: rgba(15,23,42,0.6); backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center; padding: 20px;
      animation: pFade .2s ease;
    }
    .p-modal {
      width: 100%; max-width: 440px; border-radius: 28px; padding: 40px;
      background: #FFFFFF; border: 1px solid rgba(255,255,255,0.8);
      box-shadow: 0 40px 80px rgba(0,0,0,0.15);
      position: relative; animation: pSlide .3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .p-modal-close {
      position: absolute; top: 20px; right: 20px;
      width: 32px; height: 32px; border-radius: 50%;
      background: #F1F5F9; border: none; color: #64748B;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; transition: all .2s;
    }
    .p-modal-close:hover { background: #E2E8F0; color: #1E293B; transform: rotate(90deg); }

    .p-big-avatar {
      width: 140px; height: 140px; border-radius: 40px;
      background: #EFF6FF; border: 4px solid #FFFFFF;
      box-shadow: 0 15px 35px rgba(37,99,235,0.15);
      margin: 0 auto 24px; display: flex; align-items: center; justify-content: center;
      font-size: 48px; font-weight: 800; color: #2563EB;
      overflow: hidden;
    }

    .p-form-field {
      width: 100%; padding: 14px 18px; border-radius: 12px;
      background: #F8FAFC; border: 1px solid #E2E8F0;
      font-family: 'Sora', sans-serif; font-size: 14px; margin-bottom: 12px;
      outline: none; transition: border .2s;
    }
    .p-form-field:focus { border-color: #2563EB; }
    .p-form-submit {
      width: 100%; padding: 16px; border-radius: 14px; border: none;
      background: #2563EB; color: white; font-weight: 700; font-family: 'Sora', sans-serif;
      cursor: pointer; box-shadow: 0 10px 20px rgba(37,99,235,0.2);
    }

    /* Loading */
    .p-loading {
      min-height: 100vh; display: flex; align-items: center; justify-content: center;
      background: #ECEEF4;
    }
    .p-loader {
      width: 34px; height: 34px; border-radius: 50%;
      border: 2px solid rgba(37,99,235,0.15); border-top-color: #2563EB;
      animation: pSpin .8s linear infinite;
    }

    /* Animations */
    @keyframes pIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: none; } }
    @keyframes pSlide { from { opacity: 0; transform: scale(0.9) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
    @keyframes pFade { from { opacity: 0; } to { opacity: 1; } }
    .p-anim1 { animation: pIn .35s ease both; }
    .p-anim2 { animation: pIn .35s .07s ease both; }
    .p-anim3 { animation: pIn .35s .14s ease both; }

    /* ── RESPONSIVE TWEAKS FOR < 480px ── */
    @media (max-width: 480px) {
      .p-main { padding: 16px 16px 80px; }
      
      .p-header { padding: 12px; }
      .p-header-inner { padding: 0 12px; gap: 8px; }
      .p-header-logos { gap: 10px; }
      .p-header-logo { height: 26px; } 
      .p-prof-name { font-size: 11px; }
      .p-prof-role { font-size: 8px; }

      .p-title-row { flex-direction: column; align-items: flex-start; gap: 12px; }
      .p-page-title { font-size: 22px; }
      .p-schedule-btn { width: 100%; justify-content: center; }

      /* Allow modules to swipe left/right smoothly */
      .p-module-tabs { flex-wrap: nowrap; overflow-x: auto; padding-bottom: 8px; width: 100%; -webkit-overflow-scrolling: touch; }
      .p-module-btn { flex-shrink: 0; padding: 8px 12px; font-size: 11px; }

      /* Full width search bar & Nav */
      .p-nav-row { flex-direction: column; align-items: stretch; gap: 12px; }
      .p-nav-tabs { flex-wrap: wrap; }
      .p-nav-tab { flex: 1; justify-content: center; }
      .p-search-input { width: 100%; }

      /* Fix grid sizes for profile cards */
      .p-dir-grid { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px; }
      .p-dir-card { padding: 16px 12px; }

      /* Fix grades action bar */
      .p-grades-toolbar { padding: 16px; flex-direction: column; align-items: stretch; gap: 12px; }
      .p-session-tabs { flex-wrap: wrap; }
      .p-session-tab { flex: 1; justify-content: center; }
      .p-toolbar-btns { flex-wrap: wrap; justify-content: stretch; width: 100%; }
      .p-btn { flex: 1; justify-content: center; }

      /* Fix grades table */
      .p-table th, .p-table td { padding: 10px 8px; }
      .p-table th:first-child, .p-table td:first-child { padding-left: 16px; }
      .p-table th:last-child, .p-table td:last-child { padding-right: 16px; }
      .p-note-input { width: 55px; font-size: 12px; padding: 6px 4px; }
      .p-comment-input { min-width: 100px; }

      /* Fix Save footer */
      .p-save-footer { padding: 16px; }
      .p-save-btn { width: 100%; justify-content: center; }

      /* Modal adjustments */
      .p-modal { padding: 24px; width: 100%; }
      .p-big-avatar { width: 90px; height: 90px; font-size: 32px; margin-bottom: 16px; }
    }
  `}</style>
);

export default function ProfessorDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const [prof, setProf] = useState(null);
  const [modules, setModules] = useState([]);
  const [students, setStudents] = useState([]);

  const [activeModule, setActiveModule] = useState(null);
  const [activeTab, setActiveTab] = useState('directory');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSession, setActiveSession] = useState('normal');

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showExamModal, setShowExamModal] = useState(false);
  const [examForm, setExamForm] = useState({ type: 'normal', date: '', time: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingGrades, setIsEditingGrades] = useState(false);

  const [grades, setGrades] = useState({});
  const fileInputRef = useRef(null);

  useEffect(() => { fetchDashboardData(); }, []);

  useEffect(() => {
    if (activeModule) {
      fetchGradesForModule(activeModule);
      setActiveSession('normal');
      setIsEditingGrades(false);
    }
  }, [activeModule]);

  const isNormalSessionComplete = students.length > 0 && students.every(s => {
    const note = grades[s.id]?.normalNote;
    return note !== undefined && note !== null && note !== '';
  });

  async function fetchDashboardData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/prof-login'); return; }

      const { data: profData } = await supabase.from('professors').select('*').eq('id', user.id).single();
      setProf(profData);

      const { data: modsData } = await supabase.from('modules').select('*').eq('professor_id', user.id);
      setModules(modsData || []);
      if (modsData?.length > 0) setActiveModule(modsData[0].id);

      const { data: studentsData } = await supabase.from('students').select('*').order('number', { ascending: true });
      setStudents(studentsData || []);
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchGradesForModule(modId) {
    try {
      const { data, error } = await supabase.from('grades').select('*').eq('module_id', modId);
      if (error) throw error;
      if (data && data.length > 0) {
        const loadedGrades = {};
        data.forEach(g => {
          loadedGrades[g.student_id] = {
            id: g.id,
            normalNote: g.normal_note !== null ? parseFloat(g.normal_note).toFixed(2) : '',
            ratNote: g.rattrapage_note !== null ? parseFloat(g.rattrapage_note).toFixed(2) : '',
            normalComment: '',
            ratComment: ''
          };
        });
        setGrades(loadedGrades);
      } else {
        setGrades({});
      }
    } catch (error) {
      console.error("Erreur lors du chargement des notes:", error);
    }
  }

  const handleGradeChange = (studentId, field, value) => {
    setGrades(prev => ({ ...prev, [studentId]: { ...prev[studentId], [field]: value } }));
  };

  const handleGradeBlur = (studentId, field, value) => {
    if (!value) return;
    let num = parseFloat(value.replace(',', '.'));
    if (isNaN(num)) { handleGradeChange(studentId, field, ''); return; }
    if (num > 20) num = 20;
    if (num < 0) num = 0;
    handleGradeChange(studentId, field, num.toFixed(2));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const rows = event.target.result.split('\n');
      const newGrades = { ...grades };
      rows.slice(1).forEach(row => {
        const cols = row.split(',').map(item => item?.trim());
        if (cols.length >= 3) {
          const csvNumber = cols[0];
          const fullNameCSV = cols[1].toLowerCase();
          const noteValue = cols[2];
          let student = students.find(s => String(s.number) === String(csvNumber));
          if (!student) {
            student = students.find(s =>
              fullNameCSV.includes(s.first_name.toLowerCase()) && fullNameCSV.includes(s.last_name.toLowerCase())
            );
          }
          if (student && noteValue) {
            let parsedNote = parseFloat(noteValue.replace(',', '.'));
            if (!isNaN(parsedNote)) {
              if (parsedNote > 20) parsedNote = 20;
              if (parsedNote < 0) parsedNote = 0;
              const formatted = parsedNote.toFixed(2);
              if (activeSession === 'normal') {
                newGrades[student.id] = { ...newGrades[student.id], normalNote: formatted };
              } else if (activeSession === 'rattrapage' && parseFloat(newGrades[student.id]?.normalNote) < 10) {
                newGrades[student.id] = { ...newGrades[student.id], ratNote: formatted };
              }
            }
          }
        }
      });
      setGrades(newGrades);
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  const saveGrades = async () => {
    setIsSaving(true);
    try {
      const upsertData = displayStudentsForGrades.map(student => {
        const gData = grades[student.id] || {};
        const payload = {
          student_id: student.id,
          module_id: parseInt(activeModule),
          normal_note: gData.normalNote ? parseFloat(gData.normalNote) : null,
          rattrapage_note: gData.ratNote ? parseFloat(gData.ratNote) : null
        };
        if (gData.id) payload.id = gData.id;
        return payload;
      });
      if (upsertData.length === 0) { setIsSaving(false); return; }
      const { error } = await supabase.from('grades').upsert(upsertData, { onConflict: 'student_id,module_id' });
      if (error) throw error;
      alert(`✅ Notes enregistrées avec succès !`);
      setIsEditingGrades(false);
      fetchGradesForModule(activeModule);
    } catch (error) {
      alert(`Erreur de sauvegarde: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const scheduleExam = async (e) => {
    e.preventDefault();
    if (!activeModule) return;
    try {
      const { error } = await supabase.from('exams').insert([{
        module_id: parseInt(activeModule),
        type: examForm.type,
        date: examForm.date,
        time: examForm.time
      }]);
      if (error) throw error;
      alert("Examen programmé !");
      setShowExamModal(false);
    } catch (error) {
      alert(`Erreur : ${error.message}`);
    }
  };

  const handleTabSwitch = (sessionType) => {
    setActiveSession(sessionType);
    setIsEditingGrades(false);
  };

  const filteredDirectory = students.filter(s =>
    `${s.first_name} ${s.last_name} ${s.number}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayStudentsForGrades = activeSession === 'normal'
    ? students
    : students.filter(s => {
        const n = parseFloat(grades[s.id]?.normalNote);
        return !isNaN(n) && n < 10;
      });

  if (loading) return (
    <div className="p-loading">
      <GlobalStyles />
      <div className="p-loader"></div>
    </div>
  );

  return (
    <div className="p-root">
      <GlobalStyles />

      <div className="p-ambient">
        <div className="p-blob pb1"></div>
        <div className="p-blob pb2"></div>
        <div className="p-blob pb3"></div>
      </div>

      {/* ── HEADER ── */}
      <header className="p-header">
        <div className="p-header-inner">
          <div className="p-header-logos">
            <img src="https://ramadane-abdelhay.github.io/Salery_predection_app/2APD-logo.png" alt="2APD" className="p-header-logo" />
            <div className="p-header-div"></div>
            <img src="https://ramadane-abdelhay.github.io/Salery_predection_app/lafac-logo.png" alt="Fac" className="p-header-logo" />
          </div>
          <div className="p-header-right">
            {prof && (
              <div>
                <div className="p-prof-name">{prof.full_name}</div>
                <div className="p-prof-role">Professeur</div>
              </div>
            )}
            <button className="p-logout-btn" onClick={() => navigate('/')} title="Se déconnecter">
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </header>

      {/* ── MAIN ── */}
      <div className="p-main">

        {/* 1. Page Title & Action */}
        <div className="p-title-row p-anim1">
          <div className="p-page-title">Tableau de Bord</div>
          <button className="p-schedule-btn" onClick={() => setShowExamModal(true)}>
            <Calendar size={14} />
            Programmer un examen
          </button>
        </div>

        {/* 2. MODULE SWITCHER */}
        <div className="p-module-section p-anim1">
          <div className="p-module-label">Sélectionner le Module</div>
          <div className="p-module-tabs">
            {modules.map(mod => (
              <button
                key={mod.id}
                className={`p-module-btn ${activeModule === mod.id ? 'active' : ''}`}
                onClick={() => setActiveModule(mod.id)}
              >
                <BookOpen size={14} opacity={activeModule === mod.id ? 1 : 0.5} />
                {mod.module_name}
                <div className="p-mod-indicator"></div>
              </button>
            ))}
          </div>
        </div>

        {/* 3. Navigation & Search */}
        <div className="p-nav-row p-anim2">
          <div className="p-nav-tabs">
            <button
              className={`p-nav-tab ${activeTab === 'directory' ? 'active' : ''}`}
              onClick={() => setActiveTab('directory')}
            >
              <Users size={14} /> Annuaire
            </button>
            <button
              className={`p-nav-tab ${activeTab === 'grades' ? 'active' : ''}`}
              onClick={() => setActiveTab('grades')}
            >
              <FileSpreadsheet size={14} /> Saisie des notes
            </button>
          </div>

          {activeTab === 'directory' && (
            <div className="p-search-wrap">
              <Search size={14} className="p-search-icon" />
              <input
                type="text"
                className="p-search-input"
                placeholder="Rechercher un étudiant..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* ── CONTENT AREA ── */}
        {activeTab === 'directory' && (
          <div className="p-dir-grid p-anim3">
            {filteredDirectory.map(student => (
              <div key={student.id} className="p-dir-card" onClick={() => setSelectedStudent(student)}>
                <div className="p-dir-avatar">
                  {student.avatar_url
                    ? <img src={student.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                    : student.first_name[0]}
                </div>
                <div className="p-dir-name">{student.first_name} {student.last_name}</div>
                <div className="p-dir-num">N° {student.number}</div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'grades' && (
          <div className="p-grades-panel p-anim3">
            <div className="p-grades-toolbar">
              <div className="p-session-tabs">
                <button
                  className={`p-session-tab ${activeSession === 'normal' ? 'active' : ''}`}
                  onClick={() => handleTabSwitch('normal')}
                >
                  Session Normale
                </button>
                <div className="p-tooltip-wrap">
                  <button
                    className={`p-session-tab ${activeSession === 'rattrapage' ? 'active-ratt' : ''}`}
                    onClick={() => isNormalSessionComplete && handleTabSwitch('rattrapage')}
                    disabled={!isNormalSessionComplete}
                  >
                    {!isNormalSessionComplete && <Lock size={11} />}
                    Rattrapage
                  </button>
                </div>
              </div>

              <div className="p-toolbar-btns">
                {!isEditingGrades ? (
                  <button className="p-btn p-btn-edit" onClick={() => setIsEditingGrades(true)}>
                    <Edit3 size={14} /> Modifier les notes
                  </button>
                ) : (
                  <>
                    <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} />
                    <button className="p-btn p-btn-csv" onClick={() => fileInputRef.current.click()}>
                      <Upload size={14} /> Importer CSV
                    </button>
                    <button className="p-btn p-btn-cancel" onClick={() => setIsEditingGrades(false)}>
                      Annuler
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="p-table-wrap">
              <table className="p-table">
                <thead>
                  <tr>
                    <th style={{ width: 80 }}>N°</th>
                    <th>Étudiant</th>
                    {activeSession === 'rattrapage' && <th style={{ textAlign: 'center', width: 130 }}>Note initiale</th>}
                    <th style={{ textAlign: 'center', width: 150 }}>
                      {activeSession === 'normal' ? 'Note / 20' : 'Note rattrapage / 20'}
                    </th>
                    <th>Commentaire</th>
                  </tr>
                </thead>
                <tbody>
                  {displayStudentsForGrades.length === 0 ? (
                    <tr>
                      <td colSpan={activeSession === 'rattrapage' ? 5 : 4} style={{ padding: 64, textAlign: 'center', color: '#94A3B8' }}>
                        Aucun étudiant trouvé.
                      </td>
                    </tr>
                  ) : displayStudentsForGrades.map(student => (
                    <tr key={student.id}>
                      <td><span className="p-student-num">{student.number}</span></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div className="p-student-avatar">
                            {student.avatar_url
                              ? <img src={student.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                              : student.first_name[0]}
                          </div>
                          <div>
                            <div className="p-student-name">{student.first_name} {student.last_name}</div>
                          </div>
                        </div>
                      </td>
                      {activeSession === 'rattrapage' && (
                        <td style={{ textAlign: 'center' }}>
                          <span style={{ padding: '4px 8px', borderRadius: 6, background: '#FEE2E2', color: '#DC2626', fontSize: 11, fontWeight: 700 }}>
                            {grades[student.id]?.normalNote || '0.00'}
                          </span>
                        </td>
                      )}
                      <td>
                        <input
                          type="text"
                          disabled={!isEditingGrades}
                          value={activeSession === 'normal' ? (grades[student.id]?.normalNote || '') : (grades[student.id]?.ratNote || '')}
                          onChange={e => handleGradeChange(student.id, activeSession === 'normal' ? 'normalNote' : 'ratNote', e.target.value)}
                          onBlur={e => handleGradeBlur(student.id, activeSession === 'normal' ? 'normalNote' : 'ratNote', e.target.value)}
                          className={`p-note-input ${activeSession === 'normal' ? 'normal' : 'ratt'}`}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          disabled={!isEditingGrades}
                          value={activeSession === 'normal' ? (grades[student.id]?.normalComment || '') : (grades[student.id]?.ratComment || '')}
                          onChange={e => handleGradeChange(student.id, activeSession === 'normal' ? 'normalComment' : 'ratComment', e.target.value)}
                          className="p-comment-input"
                          placeholder="Note additionnelle..."
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {isEditingGrades && displayStudentsForGrades.length > 0 && (
              <div className="p-save-footer">
                <button
                  className={`p-save-btn ${activeSession === 'normal' ? 'normal' : 'ratt'}`}
                  onClick={saveGrades}
                  disabled={isSaving}
                >
                  {isSaving ? <div className="p-spin"></div> : <CheckCircle2 size={16} />}
                  Enregistrer les modifications
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── UPDATED MODALS ── */}
      {selectedStudent && (
        <div className="p-overlay" onClick={e => { if (e.target === e.currentTarget) setSelectedStudent(null); }}>
          <div className="p-modal">
            <button className="p-modal-close" onClick={() => setSelectedStudent(null)}><X size={15} /></button>
            <div style={{ textAlign: 'center' }}>
               <div className="p-big-avatar">
                  {selectedStudent.avatar_url
                    ? <img src={selectedStudent.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                    : selectedStudent.first_name[0]}
               </div>
               <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>
                  {selectedStudent.first_name} {selectedStudent.last_name}
               </div>
               <div style={{ fontSize: 13, fontWeight: 700, color: '#2563EB', marginBottom: 32, fontFamily: 'JetBrains Mono' }}>
                  MATRICULE N° {selectedStudent.number}
               </div>
               
               <div style={{ background: '#F8FAFC', padding: 24, borderRadius: 20, textAlign: 'left', border: '1px solid rgba(0,0,0,0.03)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>Code Apogée</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>{selectedStudent.apogee_code}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>CNE / MASSAR</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>{selectedStudent.cne}</span>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {showExamModal && (
        <div className="p-overlay" onClick={e => { if (e.target === e.currentTarget) setShowExamModal(false); }}>
          <div className="p-modal">
            <button className="p-modal-close" onClick={() => setShowExamModal(false)}><X size={15} /></button>
            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 24, color: '#0F172A' }}>Planifier un examen</div>
            <form onSubmit={scheduleExam}>
               <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#94A3B8', marginBottom: 8, textTransform: 'uppercase' }}>Type de session</label>
               <select className="p-form-field" value={examForm.type} onChange={e => setExamForm({...examForm, type: e.target.value})}>
                  <option value="normal">Session Normale</option>
                  <option value="rattrapage">Rattrapage</option>
               </select>

               <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#94A3B8', marginBottom: 8, textTransform: 'uppercase' }}>Date & Heure</label>
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
                 <input type="date" className="p-form-field" value={examForm.date} onChange={e => setExamForm({...examForm, date: e.target.value})} required style={{ marginBottom: 0 }} />
                 <input type="time" className="p-form-field" value={examForm.time} onChange={e => setExamForm({...examForm, time: e.target.value})} required style={{ marginBottom: 0 }} />
               </div>

               <button type="submit" className="p-form-submit">Confirmer l'examen</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
