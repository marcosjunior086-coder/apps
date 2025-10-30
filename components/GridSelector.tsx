import React from 'react';
import { TextPosition } from '../types';

interface GridSelectorProps {
  selected: TextPosition[];
  onSelect: (position: TextPosition) => void;
  disabled?: boolean;
}

const positions: TextPosition[] = [
    'Superior esquerdo', 'Superior central', 'Superior direito',
    'Centro esquerdo', 'Centro', 'Centro direito',
    'Inferior esquerdo', 'Inferior central', 'Inferior direito'
];

export const GridSelector: React.FC<GridSelectorProps> = ({ selected, onSelect, disabled = false }) => {
  return (
    <div className={`grid grid-cols-3 gap-2 transition-opacity ${disabled ? 'opacity-50' : ''}`}>
      {positions.map(pos => (
        <button
          key={pos}
          onClick={() => onSelect(pos)}
          disabled={disabled}
          className={`h-12 w-full rounded-md transition-colors duration-200 border-2 ${
            selected.includes(pos) 
            ? 'bg-indigo-600 border-indigo-500' 
            : 'bg-gray-700/50 border-gray-600 hover:bg-gray-700 hover:border-gray-500'
          } ${
            disabled ? 'cursor-not-allowed' : ''
          }`}
          aria-label={`Posição: ${pos}`}
        >
        </button>
      ))}
    </div>
  );
};
