
import React from 'react';

interface OptionButtonProps {
  isSelected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}

export const OptionButton: React.FC<OptionButtonProps> = ({ isSelected, onClick, children, disabled = false }) => {
  const baseClasses = "w-full text-sm text-center font-medium p-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 border-2";
  const selectedClasses = "bg-indigo-600 border-indigo-500 text-white shadow-lg";
  const unselectedClasses = "bg-gray-700/50 border-gray-600 hover:bg-gray-700 hover:border-gray-500";
  const disabledClasses = "opacity-50 cursor-not-allowed bg-gray-800 border-gray-700";

  const classes = `${baseClasses} ${disabled ? disabledClasses : (isSelected ? selectedClasses : unselectedClasses)}`;

  return (
    <button onClick={onClick} className={classes} disabled={disabled}>
      {children}
    </button>
  );
};
