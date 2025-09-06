
import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { Quiz, QuizConfig } from './types';
import { generateQuizFromText } from './services/geminiService';
import FileUpload from './components/FileUpload';
import QuizDisplay from './components/QuizDisplay';
import Loader from './components/Loader';
import { LogoIcon } from './components/Icons';
import * as pdfjsLib from 'pdfjs-dist';
import Tesseract from 'tesseract.js';

// Set the worker source for pdf.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://esm.sh/pdfjs-dist@4.5.136/build/pdf.worker.mjs';

type ProgressUpdater = (message: string) => void;

const runOCR = async (image: Tesseract.ImageLike, updater: ProgressUpdater): Promise<string> => {
    // Tesseract worker is loaded from CDN by default
    const worker = await Tesseract.createWorker('eng', 1, {
      logger: m => {
        if (m.status === 'recognizing text') {
          updater(`Recognizing text... ${Math.round(m.progress * 100)}%`);
        }
      }
    });
    const { data: { text } } = await worker.recognize(image);
    await worker.terminate();
    return text;
};


const extractTextFromFile = (file: File, updater: ProgressUpdater): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    updater('Preparing file...');

    if (file.type.startsWith('image/')) {
      try {
        updater('Starting OCR on image...');
        const text = await runOCR(file, updater);
        resolve(text);
      } catch (error) {
        console.error("OCR Error:", error);
        reject(new Error("Failed to extract text from image using OCR."));
      }
    } else if (file.type === 'application/pdf') {
        const reader = new FileReader();
        reader.onload = async (event) => {
            if (!event.target?.result) {
                return reject(new Error("Failed to read PDF file."));
            }
            try {
                const pdf = await pdfjsLib.getDocument(event.target.result).promise;
                let textContent = '';
                
                updater('Attempting to extract text from PDF...');
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const text = await page.getTextContent();
                    textContent += text.items.map(s => (s as any).str).join(' ');
                }

                // Heuristic: If text is sparse, assume it's a scanned PDF and use OCR
                if (textContent.trim().length < 50 * pdf.numPages) {
                    updater('PDF appears to be scanned, switching to parallel OCR...');
                    
                    let pagesProcessed = 0;

                    const pageProcessingPromises = Array.from({ length: pdf.numPages }, async (_, i) => {
                        const pageNum = i + 1;
                        const page = await pdf.getPage(pageNum);

                        const TARGET_DPI = 300;
                        const DEFAULT_PDF_DPI = 72;
                        const scale = TARGET_DPI / DEFAULT_PDF_DPI;
                        const viewport = page.getViewport({ scale });

                        const canvas = document.createElement('canvas');
                        const context = canvas.getContext('2d');
                        canvas.height = viewport.height;
                        canvas.width = viewport.width;

                        if (!context) {
                            console.error(`Could not get canvas context for page ${pageNum}`);
                            return ""; // Return empty string for this page if canvas fails
                        }

                        // FIX: The `page.render` method now expects a `canvas` property in its parameters, not `canvasContext`.
                        await page.render({ canvas: canvas, viewport: viewport }).promise;

                        // Use Tesseract directly to avoid conflicting progress updates from the shared runOCR function
                        const worker = await Tesseract.createWorker('eng');
                        const { data: { text } } = await worker.recognize(canvas);
                        await worker.terminate();
                        
                        // This is safe in JS's single-threaded event loop model.
                        pagesProcessed++;
                        updater(`Processing page OCR... ${Math.round((pagesProcessed / pdf.numPages) * 100)}%`);

                        return text;
                    });

                    const ocrPageTexts = await Promise.all(pageProcessingPromises);
                    resolve(ocrPageTexts.join('\n'));
                } else {
                    resolve(textContent);
                }
            } catch (error) {
                console.error("Error parsing PDF:", error);
                reject(new Error("Could not parse the PDF file. It might be corrupted or protected."));
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsArrayBuffer(file);
    } else if (file.type.startsWith('text/')) {
        const reader = new FileReader();
        reader.onload = () => {
            resolve(reader.result as string);
        };
        reader.onerror = (error) => reject(error);
        reader.readAsText(file);
    } else {
        reject(new Error("Unsupported file type. Please upload a PDF, image, .txt, or .md file."));
    }
  });
};


const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [quizData, setQuizData] = useState<Quiz | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const timerRef = useRef<number | null>(null);

  const [quizConfig, setQuizConfig] = useState<QuizConfig>({
    numQuestions: 6,
    timeLimit: 10,
    difficulty: 'Medium',
    totalPoints: 100,
  });

  useEffect(() => {
    // Cleanup timer on component unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const handleFileChange = (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    setQuizData(null);
  };
  
  const handleConfigChange = (newConfig: Partial<QuizConfig>) => {
    setQuizConfig(prev => ({ ...prev, ...newConfig }));
  };

  const handleGenerateQuiz = useCallback(async () => {
    if (!file) {
      setError('Please select a file first.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setQuizData(null);
    setElapsedTime(0);

    if (timerRef.current) {
        clearInterval(timerRef.current);
    }

    timerRef.current = window.setInterval(() => {
        setElapsedTime(prev => prev + 1);
    }, 1000);

    try {
      const fileText = await extractTextFromFile(file, setLoadingMessage);
      if (!fileText.trim()) {
        setError('The file appears to be empty or we could not extract any text. Please try another file.');
        setIsLoading(false);
        return;
      }
      setLoadingMessage('Generating questions with AI...');
      const generatedQuiz = await generateQuizFromText(fileText, quizConfig);
      setQuizData(generatedQuiz);
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to generate quiz. ${errorMessage} Please try again with a different file or check the console for details.`);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [file, quizConfig]);

  const handleReset = () => {
    setFile(null);
    setQuizData(null);
    setError(null);
    setIsLoading(false);
    if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return <Loader message={loadingMessage} elapsedTime={elapsedTime} />;
    }
    if (error) {
      return (
        <div className="text-center p-8 bg-red-900/20 border border-red-500/30 rounded-lg">
          <h3 className="text-xl font-semibold text-red-300">An Error Occurred</h3>
          <p className="text-red-400 mt-2">{error}</p>
          <button
            onClick={handleReset}
            className="mt-6 bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }
    if (quizData) {
      return <QuizDisplay quiz={quizData} onReset={handleReset} />;
    }
    return (
      <FileUpload
        onFileChange={handleFileChange}
        onSubmit={handleGenerateQuiz}
        isLoading={isLoading}
        selectedFile={file}
        quizConfig={quizConfig}
        onConfigChange={handleConfigChange}
      />
    );
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="w-full max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <LogoIcon className="h-12 w-12 text-blue-500" />
            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-50 tracking-tight">
              Quiz Contest Creator
            </h1>
          </div>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Upload a document, chapter, or even a picture, and let AI create a quiz contest in seconds.
          </p>
        </header>
        <main className="bg-slate-800 border border-slate-700 rounded-2xl shadow-lg p-6 sm:p-10 transition-all duration-300">
          {renderContent()}
        </main>
        <footer className="text-center mt-8 text-slate-500 text-sm">
          <p>&copy; {new Date().getFullYear()} Quiz Contest Creator. Powered by Google Gemini.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
