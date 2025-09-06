import { GoogleGenAI, Type } from "@google/genai";
import type { Quiz, QuizConfig } from '../types';
import { QuestionType } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const quizSchema = {
    type: Type.OBJECT,
    properties: {
        questions: {
            type: Type.ARRAY,
            description: "The list of quiz questions.",
            items: {
                type: Type.OBJECT,
                properties: {
                    type: {
                        type: Type.STRING,
                        enum: [QuestionType.MultipleChoice, QuestionType.TrueFalse],
                        description: "The type of the question."
                    },
                    question: {
                        type: Type.STRING,
                        description: "The question text."
                    },
                    options: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: "A list of possible answers for multiple-choice questions."
                    },
                    answer: {
                        type: Type.STRING,
                        description: "The correct answer."
                    },
                    explanation: {
                        type: Type.STRING,
                        description: "A brief explanation for why the answer is correct."
                    }
                },
                required: ["type", "question", "answer", "explanation"],
            }
        },
        timeLimit: {
            type: Type.NUMBER,
            description: "The total time limit for the quiz in minutes."
        },
        totalPoints: {
            type: Type.NUMBER,
            description: "The total points the quiz is worth."
        },
        difficulty: {
            type: Type.STRING,
            description: "The difficulty level of the quiz."
        }
    },
    required: ["questions", "timeLimit", "totalPoints", "difficulty"],
    propertyOrdering: ["questions", "timeLimit", "totalPoints", "difficulty"],
};

export async function generateQuizFromText(context: string, config: QuizConfig): Promise<Quiz> {
  const { numQuestions, difficulty, timeLimit, totalPoints } = config;
  const prompt = `
    You are an expert educator and quiz creator.
    Based on the following text, please generate a quiz with the following specifications:
    - Number of Questions: ${numQuestions}
    - Difficulty Level: ${difficulty}
    - The quiz should contain a mix of multiple-choice and true/false questions.
    - The total time limit should be ${timeLimit} minutes.
    - The total points for the entire quiz should be ${totalPoints}.

    For each question, provide the question text, the options (for multiple-choice), the correct answer, and a short explanation for the answer.
    The questions should test the key concepts and facts presented in the text. Ensure the answer is one of the provided options for multiple-choice questions.
    The provided text may be from an OCR process and could contain small errors or formatting issues; please interpret it as best as you can.

    Here is the text:
    ---
    ${context}
    ---

    Please provide the output in the specified JSON format, including the questions array, timeLimit, totalPoints, and difficulty.
  `;

  try {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: quizSchema,
        },
      });

    const jsonText = response.text.trim();
    const quizData: Quiz = JSON.parse(jsonText);
    
    // Basic validation
    if (!quizData || !Array.isArray(quizData.questions)) {
      throw new Error("API did not return a valid quiz object.");
    }

    return quizData;

  } catch (error) {
    console.error("Error generating quiz from Gemini API:", error);
    throw new Error("Failed to parse or receive valid data from the AI model.");
  }
}