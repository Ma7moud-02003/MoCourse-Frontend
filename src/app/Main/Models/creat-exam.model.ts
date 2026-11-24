import { QuizTargetType } from "../utils/enums/quizTarget.enum";



export interface CreateQuizPayload {
  title: string;
  description?: string;
  instructions?: string;
  passMark: number;
  timeLimit: number;
  maxAttempts: number;
  totalMarks: number;
  shuffleQuestions: boolean;
  shuffleChoices: boolean;
  showResultImmediately: boolean;
  isPublished: boolean;
  quizTarget: QuizTargetType;
  courseId: number;
  sectionId?: number;
  lessonId?: number;
}

export interface QuizResponse {
  id: number;
  title: string;
  quizTarget: QuizTargetType;
}

export interface QuizTargetOption {
  name: string;
  value: QuizTargetType;
}
export type UpdateQuiz = Omit<
  CreateQuizPayload,
  'quizTarget' | 'courseId' | 'sectionId' | 'lessonId'
>;