import React from 'react';

interface ButtonProps {
  // FIX: Add optional id prop to allow passing an ID to the button.
  id?: string;
  // FIX: Make onClick optional and add type prop to support form submission.
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  type?: 'button' | 'submit' | 'reset';
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'warning';
  className?: string;
  disabled?: boolean;
  title?: string; // Added title prop
}

const Button: React.FC<ButtonProps> = ({ id, onClick, children, variant = 'primary', className = '', disabled = false, title, type = 'button' }) => {
  let baseStyle = "px-6 py-2 rounded-md font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-opacity-75 transition-colors duration-200";
  
  if (disabled) {
    baseStyle += " bg-slate-300 text-slate-500 cursor-not-allowed";
  } else {
    switch (variant) {
      case 'primary':
        baseStyle += " bg-slate-800 hover:bg-slate-700 text-white focus:ring-slate-500";
        break;
      case 'secondary':
        baseStyle += " bg-slate-200 hover:bg-slate-300 text-slate-800 focus:ring-slate-400";
        break;
      case 'danger':
        baseStyle += " bg-red-600 hover:bg-red-700 text-white focus:ring-red-500";
        break;
      case 'warning':
        baseStyle += " bg-slate-200 hover:bg-slate-300 text-slate-800 focus:ring-slate-400";
        break;
    }
  }

  return (
    <button id={id} type={type} onClick={onClick} className={`${baseStyle} ${className}`} disabled={disabled} title={title}>
      {children}
    </button>
  );
};

export default Button;