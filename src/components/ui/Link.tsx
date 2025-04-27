import React from 'react';

interface LinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Link: React.FC<LinkProps> = ({ 
  href, 
  children, 
  className = '', 
  onClick 
}) => {
  const baseClasses = "text-gray-300 hover:text-white transition-colors duration-200";
  const customClasses = className.includes('btn-primary') 
    ? 'bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-md font-medium transition-all duration-200'
    : baseClasses;
  
  const allClasses = className ? `${customClasses} ${className}` : customClasses;
  
  return (
    <a 
      href={href} 
      className={allClasses}
      onClick={onClick}
    >
      {children}
    </a>
  );
};