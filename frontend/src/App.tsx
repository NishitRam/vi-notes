import React, { useState, useEffect } from 'react';
import Auth from './components/Auth';
import Editor from './components/Editor';
import { LogOut, User as UserIcon } from 'lucide-react';

const App: React.FC = () => {
  return (
    <div className="app-main">
      <div className="main-layout">
        <nav className="side-nav">
          <div className="brand">
            <div className="logo-icon">Vi</div>
            <span>Vi-Notes</span>
          </div>
          <div className="nav-links">
            <button className="active">Writing Assistant</button>
            <button>Session Analysis</button>
            <button>Settings</button>
          </div>
        </nav>
        {/* Editor now contains its own sub-layout for Analysis */}
        <Editor />
      </div>
    </div>
  );
};

export default App;
