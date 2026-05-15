import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login'; 
import ProfessorLogin from './pages/ProfessorLogin';
import StudentDashboard from './pages/StudentDashboard';
import ProfessorDashboard from './pages/ProfessorDashboard';
import StudentRegister from './pages/StudentRegister';
import ProfessorRegister from './pages/ProfessorRegister';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/student" element={<StudentDashboard />} />
      <Route path="/prof-login" element={<ProfessorLogin />} />
      <Route path="/professor" element={<ProfessorDashboard />} />
      <Route path="/register" element={<StudentRegister />} />
<Route path="/prof-register" element={<ProfessorRegister />} />
    </Routes>
  );
}

export default App;