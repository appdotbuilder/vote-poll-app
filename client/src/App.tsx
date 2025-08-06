import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import PollsView from './components/PollsView';
import AdminLoginPage from './components/AdminLoginPage';
import AdminDashboardPage from './components/AdminDashboardPage';

type ViewType = 'publicPolls' | 'adminLogin' | 'adminDashboard';

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('publicPolls');
  const [userIP, setUserIP] = useState<string>('');

  // Get user IP address
  useEffect(() => {
    const fetchUserIP = async () => {
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        setUserIP(data.ip);
      } catch (err) {
        console.error('Failed to get IP address:', err);
        // Fallback to a default IP if the service is unavailable
        setUserIP('127.0.0.1');
      }
    };
    
    fetchUserIP();
  }, []);

  const handleLoginSuccess = () => {
    setCurrentView('adminDashboard');
  };

  const handleLogout = () => {
    setCurrentView('publicPolls');
  };

  const handleCancelLogin = () => {
    setCurrentView('publicPolls');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header 
        currentView={currentView}
        onLoginClick={() => setCurrentView('adminLogin')}
        onLogout={handleLogout}
      />

      {/* Content */}
      {currentView === 'publicPolls' && (
        <PollsView userIP={userIP} />
      )}

      {currentView === 'adminLogin' && (
        <AdminLoginPage 
          onLoginSuccess={handleLoginSuccess}
          onCancel={handleCancelLogin}
        />
      )}

      {currentView === 'adminDashboard' && (
        <AdminDashboardPage onLogout={handleLogout} />
      )}
    </div>
  );
}

interface HeaderProps {
  currentView: ViewType;
  onLoginClick: () => void;
  onLogout: () => void;
}

function Header({ currentView, onLoginClick, onLogout }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">📊 Community Polls</h1>
            <p className="text-gray-600 mt-2">Share your opinion and see what others think</p>
          </div>
          
          <div className="flex items-center gap-4">
            {currentView === 'publicPolls' && (
              <Button 
                onClick={onLoginClick}
                variant="outline"
                className="text-gray-700 border-gray-300 hover:bg-gray-50"
              >
                Admin Login
              </Button>
            )}
            
            {currentView === 'adminDashboard' && (
              <Button 
                onClick={onLogout}
                variant="outline"
                className="text-gray-700 border-gray-300 hover:bg-gray-50"
              >
                Logout
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default App;