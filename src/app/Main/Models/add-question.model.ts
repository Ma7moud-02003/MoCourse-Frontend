// NEEDS TO BE CHANGED: مسار الـ enum عندك

import { QuestionType } from "../utils/enums/question-type.enum";

export interface CreateChoicePayload {
  text: string;
  order: number;
  isCorrect: boolean;
}

export interface CreateQuestionPayload {
  question: string;
  type: QuestionType;
  mark: number;
  order: number;
  choices: CreateChoicePayload[];
}

export interface CreateQuestionsPayload {
  quizId: number;
  questions: CreateQuestionPayload[];
}

export interface QuizQuestionResponse {
  id: number;
  question: string;
  order: number;
}

export interface QuestionTypeOption {
  label: string;
  value: QuestionType;
}

