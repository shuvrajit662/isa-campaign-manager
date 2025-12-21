
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Inbox } from './pages/Inbox/Inbox';
import { Debugger } from './pages/Debugger/Debugger';
import { TestExecutions } from './pages/TestExecutions/TestExecutions';

function App() {
  return (
    <Router>
      <div className="flex h-screen bg-slate-50 text-slate-900 font-sans">
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Routes>
            <Route path="/" element={<Navigate to="/inbox" replace />} />
            <Route path="/inbox" element={<Inbox />} />
            <Route path="/test-executions" element={<TestExecutions />} />
            <Route path="/debugger/:id" element={<Debugger />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;