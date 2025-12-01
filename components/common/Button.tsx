
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  className?: string;
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseClasses = 'px-5 py-2.5 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-calm-blue-600 text-white hover:bg-calm-blue-700 focus:ring-calm-blue-500 dark:hover:bg-calm-blue-500',
    secondary: 'bg-calm-blue-100 text-calm-blue-700 hover:bg-calm-blue-200 focus:ring-calm-blue-500 dark:bg-slate-700 dark:text-calm-blue-300 dark:hover:bg-slate-600'
  };

  return (
    <button className={`${baseClasses} ${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export default Button;
