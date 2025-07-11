import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './components/AuthProvider';
import { LanguageProvider } from './context/LanguageContext';
import Layout from './components/Layout';
import BoltBadge from './components/BoltBadge';
import Home from './pages/Home';
import ChatBot from './pages/ChatBot';
import ContractValidator from './pages/ContractValidator';
import AdminDashboard from './pages/AdminDashboard';
import About from './pages/About';
import Contact from './pages/Contact';
import MyDocuments from './pages/MyDocuments';

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/chatbot" element={<ChatBot />} />
              <Route path="/validator" element={<ContractValidator />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/about" element={<About />} />
              <Route path="/my-documents" element={<MyDocuments />} />
              <Route path="/contact" element={<Contact />} />
            </Routes>
          </Layout>
          <BoltBadge position="bottom-right" size="medium" />
        </Router>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;