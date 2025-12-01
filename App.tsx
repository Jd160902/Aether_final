import React, { useState, useCallback, Suspense, lazy, useEffect } from 'react';
import Header from './components/Header';
import { Tab, User } from './types';
import { TABS } from './constants';
import Spinner from './components/common/Spinner';
import { getUserOnboardingStatus, setUserOnboardingStatus } from './services/db';

const Reflections = lazy(() => import('./components/Journal'));
const Dreams = lazy(() => import('./components/Dreams'));
const Goals = lazy(() => import('./components/Goals'));
const Wellness = lazy(() => import('./components/Wellness'));
const Advice = lazy(() => import('./components/Advice'));
const Login = lazy(() => import('./components/Login'));
const Register = lazy(() => import('./components/Register'));
const Insights = lazy(() => import('./components/Insights'));
const Onboarding = lazy(() => import('./components/Onboarding'));
const Settings = lazy(() => import('./components/Settings'));
const Home = lazy(() => import('./components/Home'));


const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>(TABS[0]);
  const [view, setView] = useState<'home' | 'auth'>('home');
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (localStorage.theme === 'dark') {
      return true;
    }
    if (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return true;
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
    }
  }, [isDarkMode]);

  const handleTabChange = useCallback((tab: Tab) => {
    setActiveTab(tab);
  }, []);

  const handleNavigateToAuth = useCallback((initialView: 'login' | 'register') => {
    setView('auth');
    setAuthView(initialView);
  }, []);
  
  const handleLoginSuccess = useCallback(async (user: User) => {
    setCurrentUser(user);
    const hasOnboarded = await getUserOnboardingStatus(user.id);
    if (!hasOnboarded) {
      setShowOnboarding(true);
    }
  }, []);

  const handleLogout = useCallback(() => {
    setCurrentUser(null);
    setView('home'); // Go back to home page on logout
    setAuthView('login');
  }, []);
  
  const handleOnboardingComplete = useCallback(async () => {
    if (currentUser) {
      await setUserOnboardingStatus(currentUser.id, true);
      setShowOnboarding(false);
    }
  }, [currentUser]);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => !prev);
  }, []);

  const renderContent = () => {
    if (!currentUser) return null;

    switch (activeTab.id) {
      case 'reflections':
        return <Reflections userId={currentUser.id} />;
      case 'aspirations':
        return <Dreams userId={currentUser.id} />;
      case 'goals':
        return <Goals userId={currentUser.id} />;
      case 'insights':
        return <Insights userId={currentUser.id} isDarkMode={isDarkMode} />;
      case 'wellness':
        return <Wellness userId={currentUser.id} />;
      case 'advice':
        return <Advice userId={currentUser.id} />;
      case 'settings':
        return <Settings userId={currentUser.id} />;
      default:
        return <Reflections userId={currentUser.id} />;
    }
  };

  if (!currentUser) {
    return (
       <Suspense fallback={<div className="flex justify-center items-center h-screen"><Spinner /></div>}>
          {view === 'home' ? (
            <Home onNavigateToAuth={handleNavigateToAuth} />
          ) : authView === 'login' ? (
            <Login onLoginSuccess={handleLoginSuccess} onSwitchToRegister={() => setAuthView('register')} />
          ) : (
            <Register onRegisterSuccess={handleLoginSuccess} onSwitchToLogin={() => setAuthView('login')} />
          )}
       </Suspense>
    );
  }

  return (
    <div className="min-h-screen font-sans text-slate-800 dark:text-slate-300 md:flex">
      <Suspense fallback={null}>
        {showOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}
      </Suspense>

      <Header 
        activeTab={activeTab} 
        onTabChange={handleTabChange} 
        onLogout={handleLogout}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode} 
      />

      <div className="flex-1 flex flex-col pb-20 md:pb-0">
        <main className="flex-grow p-4 md:p-8 container mx-auto max-w-4xl">
           <Suspense fallback={<div className="flex justify-center items-center h-64"><Spinner /></div>}>
              {renderContent()}
          </Suspense>
        </main>
        <footer className="text-center p-4 text-sm text-slate-400 dark:text-slate-500">
          <p>Aether – Your Body, Mind & Soul Companion</p>
        </footer>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 flex items-center justify-around bg-white/95 backdrop-blur-sm border-t border-slate-200 dark:bg-slate-800/95 dark:border-slate-700 z-20">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab)}
            className={`flex flex-col items-center space-y-1 p-3 text-xs font-medium transition-colors duration-200 w-full ${
              activeTab.id === tab.id
                ? 'text-calm-blue-600 bg-calm-blue-100 dark:text-calm-blue-300 dark:bg-slate-700'
                : 'text-slate-500 dark:text-slate-400 hover:bg-calm-blue-50 dark:hover:bg-slate-700/50'
            }`}
            aria-current={activeTab.id === tab.id ? 'page' : undefined}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default App;