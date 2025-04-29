import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import EmailGeneration from "./pages/EmailGeneration"; 
import AdminDashboard from "./pages/AdminDashboard";
import EmailHistory from "./pages/EmailHistory";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/email-generation" element={<EmailGeneration />} /> 
        <Route path="/email-history" element={<EmailHistory />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;