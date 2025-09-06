import React from 'react';

interface LoaderProps {
  message?: string;
  elapsedTime: number;
}

const Loader: React.FC<LoaderProps> = ({ message, elapsedTime }) => {
  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="w-16 h-16 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin"></div>
      <h3 className="mt-6 text-xl font-semibold text-slate-100">
        Processing Your Document...
      </h3>
      <p className="mt-2 text-slate-400 transition-opacity duration-500 h-6">
        {message || 'Please wait a moment.'}
      </p>
      <div className="mt-4 text-sm font-mono text-slate-500 bg-slate-800/50 px-3 py-1 rounded-md">
        Elapsed Time: {formatTime(elapsedTime)}
      </div>
    </div>
  );
};

export default Loader;