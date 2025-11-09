import React from 'react';
import { SparklesIcon } from './icons';

interface LoaderProps {
  message?: string;
}

export const Loader: React.FC<LoaderProps> = ({ message }) => {
  return (
    <div className="fixed inset-0 bg-brand-bg bg-opacity-80 backdrop-blur-sm flex flex-col items-center justify-center z-50 animate-fade-in">
      <div className="relative flex items-center justify-center">
        <div className="absolute h-24 w-24 rounded-full border-t-4 border-b-4 border-brand-pink animate-spin"></div>
        <SparklesIcon className="h-12 w-12 text-brand-pink" />
      </div>
      {message && <p className="mt-6 text-lg text-brand-text-primary animate-pulse">{message}</p>}
    </div>
  );
};