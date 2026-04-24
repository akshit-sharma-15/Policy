import React, { useState } from 'react';
import './App.css';
import UserForm from './components/UserForm';
import Recommendation from './components/Recommendation';
import Chat from './components/Chat';
import AdminPanel from './components/AdminPanel';

function App() {
  const [view, setView] = useState('user'); // 'user' or 'admin'
  const [userProfile, setUserProfile] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleRecommendation = (profile, rec) => {
    setUserProfile(profile);
    setRecommendation(rec);
  };

  const handleReset = () => {
    setUserProfile(null);
    setRecommendation(null);
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>🏥 Health Insurance Recommender</h1>
        <div className="nav-buttons">
          <button 
            className={view === 'user' ? 'active' : ''} 
            onClick={() => setView('user')}
          >
            User Portal
          </button>
          <button 
            className={view === 'admin' ? 'active' : ''} 
            onClick={() => setView('admin')}
          >
            Admin Panel
          </button>
        </div>
      </header>

      <main className="app-main">
        {view === 'user' ? (
          <>
            {!recommendation ? (
              <UserForm 
                onRecommendation={handleRecommendation} 
                loading={loading}
                setLoading={setLoading}
              />
            ) : (
              <>
                <Recommendation 
                  recommendation={recommendation} 
                  userProfile={userProfile}
                  onReset={handleReset}
                />
                <Chat 
                  userProfile={userProfile} 
                  recommendation={recommendation}
                />
              </>
            )}
          </>
        ) : (
          <AdminPanel />
        )}
      </main>
    </div>
  );
}

export default App;
