import React, { useState } from 'react';
import Dashboard from './pages/Dashboard';
import TestCaseEditor from './pages/TestCaseEditor';
import './index.css';

function App() {
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'editor'>('dashboard');

  return (
    <div className="App">
      {currentPage === 'dashboard' ? (
        <Dashboard onNavigateToEditor={() => setCurrentPage('editor')} />
      ) : (
        <TestCaseEditor onNavigateToHome={() => setCurrentPage('dashboard')} />
      )}
    </div>
  );
}

export default App;