
import React from 'react';
import { COLORS } from '../constants';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  loading,
  ...props 
}) => {
  const variants = {
    primary: "bg-[#E6644C] text-white hover:bg-[#d5533d] shadow-lg shadow-[#E6644C]/20",
    secondary: "bg-[#1A1A1A] text-white hover:bg-black",
    ghost: "bg-[#F2F2F2] text-[#1A1A1A] hover:bg-gray-200",
    outline: "border-2 border-[#E6644C] text-[#E6644C] hover:bg-[#FDEEEB]"
  };

  return (
    <button 
      className={`px-6 py-4 rounded-full font-bold transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:pointer-events-none ${variants[variant]} ${className}`}
      disabled={loading}
      {...props}
    >
      {loading ? (
        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : children}
    </button>
  );
};
