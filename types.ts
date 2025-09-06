export enum QuestionType {
  MultipleChoice = 'multiple-choice',
  TrueFalse = 'true-false',
}

export interface Question {
  type: QuestionType;
  question: string;
  options?: string[]; // Only for multiple-choice
  answer: string;
  explanation: string;
}

export interface Quiz {
  questions: Question[];
  timeLimit: number; // in minutes
  totalPoints: number;
  difficulty: string;
}

export interface QuizConfig {
  numQuestions: number;
  timeLimit: number;
  difficulty: string;
  totalPoints: number;
}
