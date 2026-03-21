import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ModuleList from './pages/ModuleList';
import ModuleDetail from './pages/ModuleDetail';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/modules" element={<ModuleList />} />
          <Route path="/module/:id" element={<ModuleDetail />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
