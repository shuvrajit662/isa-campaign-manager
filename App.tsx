import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Inbox } from './pages/Inbox/Inbox';
import { PromptLibrary } from './pages/PromptLibrary/PromptLibrary';
import { AdminConsole } from './pages/Admin/AdminConsole';
import { Debugger } from './pages/Debugger/Debugger';

function App() {
  return (
    <Router>
      <div className="flex h-screen bg-slate-50 text-slate-900 font-sans">
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Routes>
            <Route path="/" element={<Navigate to="/inbox" replace />} />
            <Route path="/inbox" element={<Inbox />} />
            <Route path="/prompts" element={<PromptLibrary />} />
            <Route path="/debugger" element={<Debugger />} />
            <Route path="/admin" element={<AdminConsole />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;