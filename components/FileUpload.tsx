import React from 'react';
import type { QuizConfig } from '../types';
import { UploadIcon } from './Icons';

interface FileUploadProps {
  onFileChange: (file: File) => void;
  onSubmit: () => void;
  isLoading: boolean;
  selectedFile: File | null;
  quizConfig: QuizConfig;
  onConfigChange: (newConfig: Partial<QuizConfig>) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileChange,
  onSubmit,
  isLoading,
  selectedFile,
  quizConfig,
  onConfigChange,
}) => {
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      onFileChange(event.target.files[0]);
    }
  };

  const handleConfigInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    onConfigChange({ [name]: name.includes('num') || name.includes('Points') || name.includes('Limit') ? parseInt(value, 10) : value });
  };

  return (
    <div className="text-center">
      <div className="mb-6">
        <label
          htmlFor="file-upload"
          className="relative cursor-pointer bg-slate-800 rounded-lg font-medium text-blue-400 hover:text-blue-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-slate-800 focus-within:ring-blue-500"
        >
          <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-600 rounded-xl hover:border-blue-500 transition-colors">
            <UploadIcon className="mx-auto h-12 w-12 text-slate-500" />
            <span className="mt-2 block text-sm font-medium text-slate-100">
              {selectedFile ? 'Change file' : 'Upload a document'}
            </span>
            <input
              id="file-upload"
              name="file-upload"
              type="file"
              className="sr-only"
              onChange={handleFileSelect}
              accept=".pdf,.txt,.md,.png,.jpg,.jpeg"
            />
          </div>
        </label>
      </div>
      
      {selectedFile && (
        <p className="mb-6 text-sm text-slate-400">
          Selected: <span className="font-semibold">{selectedFile.name}</span>
        </p>
      )}

      {/* Quiz Settings */}
      <div className="mb-8 text-left">
          <h3 className="text-lg font-semibold text-slate-100 border-b border-slate-700 pb-2 mb-4">Quiz Settings</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                  <label htmlFor="numQuestions" className="block text-sm font-medium text-slate-300">Number of Questions</label>
                  <input type="number" name="numQuestions" id="numQuestions" value={quizConfig.numQuestions} onChange={handleConfigInputChange} className="mt-1 block w-full rounded-md bg-slate-700 border-slate-600 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" min="1" max="20" />
              </div>
              <div>
                  <label htmlFor="difficulty" className="block text-sm font-medium text-slate-300">Difficulty Level</label>
                  <select id="difficulty" name="difficulty" value={quizConfig.difficulty} onChange={handleConfigInputChange} className="mt-1 block w-full rounded-md bg-slate-700 border-slate-600 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                      <option>Easy</option>
                      <option>Medium</option>
                      <option>Hard</option>
                  </select>
              </div>
              <div>
                  <label htmlFor="timeLimit" className="block text-sm font-medium text-slate-300">Time Limit (minutes)</label>
                  <input type="number" name="timeLimit" id="timeLimit" value={quizConfig.timeLimit} onChange={handleConfigInputChange} className="mt-1 block w-full rounded-md bg-slate-700 border-slate-600 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" min="1" />
              </div>
              <div>
                  <label htmlFor="totalPoints" className="block text-sm font-medium text-slate-300">Total Points</label>
                  <input type="number" name="totalPoints" id="totalPoints" value={quizConfig.totalPoints} onChange={handleConfigInputChange} className="mt-1 block w-full rounded-md bg-slate-700 border-slate-600 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" min="1" />
              </div>
          </div>
      </div>
      
      <div className="bg-blue-900/30 border border-blue-500/40 text-blue-300 text-sm rounded-lg p-4 mb-6">
        <strong>Note:</strong> We support text-based PDFs, images (.png, .jpg), <code>.txt</code>, and <code>.md</code> files. Scanned documents are processed with OCR.
      </div>
      
      <button
        onClick={onSubmit}
        disabled={!selectedFile || isLoading}
        className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-blue-500 transition-all"
      >
        {isLoading ? 'Generating...' : 'Generate Quiz'}
      </button>
    </div>
  );
};

export default FileUpload;