import React from 'react';

interface OptionButtonProps {
  isSelected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}

export const OptionButton: React.FC<OptionButtonProps> = ({ isSelected, onClick, children, disabled = false }) => {
  const baseClasses = "w-full text-sm text-center font-medium p-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 border-2";
  const selectedClasses = "bg-brand-pink border-brand-pink text-white font-semibold shadow-lg shadow-brand-pink/20";
  const unselectedClasses = "bg-white/5 backdrop-blur-sm border-brand-blue/70 hover:border-brand-blue text-brand-text-primary hover:shadow-brand-glow";
  const disabledClasses = "opacity-50 cursor-not-allowed bg-brand-card/20 border-brand-card/50";

  const classes = `${baseClasses} ${disabled ? disabledClasses : (isSelected ? selectedClasses : unselectedClasses)}`;

  return (
    <button onClick={onClick} className={classes} disabled={disabled}>
      {children}
    </button>
  );
};