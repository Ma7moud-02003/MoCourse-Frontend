import { CreateQuestionPayload } from "./add-question.model";

export interface InstructorQuiz {
  id: number;
  title: string;
  description: string | null;
  passMark: number;
  timeLimit: number;
  maxAttempts: number;
  shuffleQuestions: boolean;
  shuffleChoices: boolean;
  totalMarks: number;
  instructions: string | null;
  showResultImmediately: boolean;
  quizTarget: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  course:QuizCourseSummary
}

export interface QuizCourseSummary {
  id: number;
  title: string;
  thumbnail: string | null;
}
export interface QuizChoiceDetails {
  id: number;
  text: string;
  isCorrect: boolean;
  order: number;
}

export interface QuizQuestionDetails {
  id: number;
  type: string;
  question: string;
  mark: number;
  order: number;
  choices: QuizChoiceDetails[];
}

export interface QuizDetailsResponse {
  id: number;
  title: string;
  description: string | null;
  passMark: number;
  timeLimit: number;
  maxAttempts: number;
  shuffleQuestions: boolean;
  shuffleChoices: boolean;
  totalMarks: number;
  instructions: string | null;
  showResultImmediately: boolean;
  quizTarget: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  questions: QuizQuestionDetails[];
}