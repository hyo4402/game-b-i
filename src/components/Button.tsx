import React from 'react';
import { playSound, vibrate } from '../utils/audio';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost' | 'dark';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, variant = 'primary', fullWidth = false, className = '', onClick, ...props 
}) => {
  const base = "px-4 py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center";
  const variants = {
    primary: "bg-tet-red text-white shadow-lg shadow-red-200/50 hover:shadow-red-300/50 dark:shadow-none",
    secondary: "bg-tet-gold text-yellow-900 shadow-lg shadow-yellow-100/50 dark:shadow-none",
    danger: "bg-red-50 text-red-600 border border-red-100 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
    outline: "border-2 border-gray-200 text-gray-700 bg-white dark:bg-dark-card dark:border-gray-700 dark:text-gray-300",
    ghost: "bg-transparent text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800",
    dark: "bg-gray-800 text-white shadow-lg shadow-gray-400/50 dark:bg-gray-700 dark:shadow-none"
  };

  return (
    <button 
      onClick={(e) => { playSound('click'); vibrate(); onClick && onClick(e); }} 
      className={`${base} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
};