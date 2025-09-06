import React, { useState, useMemo } from 'react';
import type { Quiz, Question } from '../types';
import { QuestionType } from '../types';
import { CheckCircleIcon, XCircleIcon, DownloadIcon, RefreshIcon, ClockIcon, StarIcon, BarChartIcon } from './Icons';

const QuestionCard: React.FC<{
  question: Question;
  index: number;
  userAnswer: string | undefined;
  isSubmitted: boolean;
  onAnswerChange: (answer: string) => void;
}> = ({ question, index, userAnswer, isSubmitted, onAnswerChange }) => {
    const isMultipleChoice = question.type === QuestionType.MultipleChoice;
    const options = isMultipleChoice ? (question.options || []) : ['True', 'False'];

    const getOptionClass = (option: string) => {
        if (!isSubmitted) return 'text-slate-300';
        if (option === question.answer) return 'text-green-400 font-bold';
        if (option === userAnswer && userAnswer !== question.answer) return 'text-red-400 line-through';
        return 'text-slate-500';
    };

    const renderFeedbackIcon = (option: string) => {
        if (!isSubmitted) return null;
        if (option === question.answer) {
            return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
        }
        if (option === userAnswer && userAnswer !== question.answer) {
            return <XCircleIcon className="h-5 w-5 text-red-500" />;
        }
        return <div className="w-5 h-5" />; // Placeholder for alignment
    };

    return (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 mb-6">
            <p className="text-sm font-semibold text-blue-400">Question {index + 1} &bull; {isMultipleChoice ? 'Multiple Choice' : 'True/False'}</p>
            <p className="mt-2 text-lg font-medium text-slate-100">{question.question}</p>
            
            <div className="space-y-3 mt-4">
                {options.map((option, i) => (
                    <div key={i} className="flex items-center">
                         {isSubmitted && <div className="flex-shrink-0 w-6">{renderFeedbackIcon(option)}</div>}
                        <label htmlFor={`q${index}-option${i}`} className="flex items-center cursor-pointer flex-grow">
                             <input
                                id={`q${index}-option${i}`}
                                name={`q${index}`}
                                type="radio"
                                value={option}
                                className="h-4 w-4 text-blue-500 bg-slate-700 border-slate-600 focus:ring-blue-500 focus:ring-offset-slate-800 disabled:opacity-75"
                                checked={option === userAnswer}
                                onChange={(e) => onAnswerChange(e.target.value)}
                                disabled={isSubmitted}
                            />
                            <span className={`ml-3 block text-sm font-medium ${getOptionClass(option)}`}>
                                {option}
                            </span>
                        </label>
                    </div>
                ))}
            </div>

            {isSubmitted && (
                 <div className="mt-6 p-4 bg-blue-900/20 border-l-4 border-blue-500 rounded-r-lg">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            {/* Using a different icon for the explanation box to distinguish it */}
                            <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-bold text-blue-300">Answer & Explanation</p>
                            <p className="mt-1 text-sm font-semibold text-slate-200">The correct answer is: {question.answer}</p>
                            <p className="mt-1 text-sm text-slate-300">{question.explanation}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

interface QuizDisplayProps {
  quiz: Quiz;
  onReset: () => void;
}

const QuizDisplay: React.FC<QuizDisplayProps> = ({ quiz, onReset }) => {
    const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleAnswerChange = (questionIndex: number, answer: string) => {
        if (isSubmitted) return;
        setUserAnswers(prev => ({...prev, [questionIndex]: answer}));
    };

    const handleSubmit = () => {
        setIsSubmitted(true);
    };

    const score = useMemo(() => {
        return quiz.questions.reduce((correctCount, question, index) => {
            if (userAnswers[index] === question.answer) {
                return correctCount + 1;
            }
            return correctCount;
        }, 0);
    }, [quiz.questions, userAnswers]);
    
    const allQuestionsAnswered = Object.keys(userAnswers).length === quiz.questions.length;

    const handleExport = () => {
    const exportData = {
        title: "Generated Quiz Contest",
        ...quiz,
    };
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(exportData, null, 2))}`;
    const link = document.createElement('a');
    link.href = jsonString;
    link.download = 'quiz-contest.json';
    link.click();
  };

  return (
    <div>
        <div className="mb-8 p-4 border border-slate-700 rounded-lg bg-slate-900/50">
            <div className="flex flex-col sm:flex-row justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold text-slate-50">Quiz Contest</h2>
                    {isSubmitted && (
                        <p className={`mt-1 text-xl font-bold ${score / quiz.questions.length >= 0.7 ? 'text-green-400' : 'text-orange-400'}`}>
                            Your Score: {score} / {quiz.questions.length}
                        </p>
                    )}
                </div>
                <div className="flex gap-2 mt-4 sm:mt-0">
                    <button
                        onClick={handleExport}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-blue-500"
                    >
                        <DownloadIcon className="w-5 h-5 mr-2" />
                        Export JSON
                    </button>
                    <button
                        onClick={onReset}
                        className="inline-flex items-center px-4 py-2 border border-slate-600 text-sm font-medium rounded-md shadow-sm text-slate-300 bg-slate-700 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-blue-500"
                    >
                        <RefreshIcon className="w-5 h-5 mr-2" />
                        Start Over
                    </button>
                </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-400">
                <div className="flex items-center gap-2">
                    <ClockIcon className="w-5 h-5 text-slate-500"/> <strong>Time Limit:</strong> {quiz.timeLimit} minutes
                </div>
                 <div className="flex items-center gap-2">
                    <StarIcon className="w-5 h-5 text-slate-500"/> <strong>Total Points:</strong> {quiz.totalPoints}
                </div>
                <div className="flex items-center gap-2">
                    <BarChartIcon className="w-5 h-5 text-slate-500"/> <strong>Difficulty:</strong> {quiz.difficulty}
                </div>
            </div>
        </div>

      <div>
        {quiz.questions.map((q, i) => (
          <QuestionCard 
            key={i} 
            question={q} 
            index={i}
            userAnswer={userAnswers[i]}
            isSubmitted={isSubmitted}
            onAnswerChange={(answer) => handleAnswerChange(i, answer)}
          />
        ))}
      </div>

       {!isSubmitted && (
            <div className="mt-8 text-center">
                <button
                    onClick={handleSubmit}
                    disabled={!allQuestionsAnswered}
                    className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-green-500 transition-all"
                >
                    Check Answers
                </button>
                {!allQuestionsAnswered && <p className="text-sm text-slate-500 mt-2">Please answer all questions to see your results.</p>}
            </div>
        )}
    </div>
  );
};

export default QuizDisplay;