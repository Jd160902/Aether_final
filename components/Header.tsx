import React from 'react';
import type { Tab } from '../types';
import { TABS } from '../constants';
import { LogoutIcon, SunIcon, MoonIcon } from './common/Icons';

interface HeaderProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  onLogout: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

const Header: React.FC<HeaderProps> = ({ activeTab, onTabChange, onLogout, isDarkMode, onToggleDarkMode }) => {
  return (
    <aside className="
      bg-white/95 backdrop-blur-sm dark:bg-slate-800/95
      md:w-64 md:flex-shrink-0 md:flex md:flex-col md:h-screen md:sticky md:top-0 md:border-r md:border-slate-200 dark:md:border-slate-700
    ">
      {/* --- Desktop Sidebar --- */}
      <div className="hidden md:flex flex-col p-4 flex-grow">
        <div className="flex items-center space-x-3 p-4 mb-6">
          <svg className="w-8 h-8 text-calm-blue-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="currentColor"/>
              <path d="M12 6C9.24 6 7 8.24 7 11C7 12.76 7.84 14.33 9.11 15.33L12 18L14.89 15.33C16.16 14.33 17 12.76 17 11C17 8.24 14.76 6 12 6Z" fill="currentColor" fillOpacity="0.5"/>
          </svg>
          <h1 className="text-2xl font-bold text-calm-blue-800 dark:text-calm-blue-300">Aether</h1>
        </div>
        <nav className="flex flex-col space-y-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab)}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium transition-colors duration-200 w-full text-left ${
                activeTab.id === tab.id
                  ? 'bg-calm-blue-600 text-white shadow'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-calm-blue-100 dark:hover:bg-slate-700'
              }`}
              aria-current={activeTab.id === tab.id ? 'page' : undefined}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
        <div className="flex-grow" />
        <div className="p-2 space-y-2">
           <button
              onClick={onToggleDarkMode}
              className="flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium transition-colors duration-200 w-full text-left text-slate-600 dark:text-slate-400 hover:bg-calm-blue-100 dark:hover:bg-slate-700"
              aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
            >
              {isDarkMode ? <SunIcon /> : <MoonIcon />}
              <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
           <button
              onClick={onLogout}
              className="flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium transition-colors duration-200 w-full text-left text-slate-600 dark:text-slate-400 hover:bg-calm-blue-100 dark:hover:bg-slate-700"
            >
              <LogoutIcon />
              <span>Logout</span>
            </button>
        </div>
      </div>
      
      {/* --- Mobile Header --- */}
      <header className="md:hidden flex items-center h-16 px-4 bg-white/95 backdrop-blur-sm border-b border-slate-200 dark:bg-slate-800/95 dark:border-slate-700 sticky top-0 z-10">
         <div className="flex items-center space-x-3">
            <svg className="w-8 h-8 text-calm-blue-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="currentColor"/>
                <path d="M12 6C9.24 6 7 8.24 7 11C7 12.76 7.84 14.33 9.11 15.33L12 18L14.89 15.33C16.16 14.33 17 12.76 17 11C17 8.24 14.76 6 12 6Z" fill="currentColor" fillOpacity="0.5"/>
            </svg>
            <h1 className="text-xl font-bold text-calm-blue-800 dark:text-calm-blue-300">Aether</h1>
        </div>
      </header>
    </aside>
  );
};

export default Header;