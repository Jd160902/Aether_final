import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-md dark:shadow-2xl dark:shadow-slate-900/50 overflow-hidden transition-shadow hover:shadow-lg dark:border dark:border-slate-700 ${className}`}>
      {children}
    </div>
  );
};

export default Card;