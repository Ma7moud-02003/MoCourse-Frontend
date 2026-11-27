import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_URL } from './config';

// One exam of a course, as it shows in the list on the course page.
export interface Quiz {
  id: number;
  title: string;
  description: string | null;
  passMark: number; // the score you need to pass
  totalMarks: number; // the sum of all question marks
  timeLimit: number; // minutes
  opensAt: string | null;
  closesAt: string | null;
  instructions: string | null;
}

// One question inside an attempt. The backend deliberately sends no sign of
// which choice is the right one, so the page cannot leak the answer.
export interface QuizQuestion {
  id: number;
  question: string;
  mark: number;
  choices: { id: number; text: string }[];
}

export interface AttemptQuestions {
  attemptId: number;
  quizId: number;
  expiresAt: string;
  serverNow: string;
  questions: QuizQuestion[];
}

// What the backend answers when the student starts an exam.
// Usually it sends the open attempt (new or resumed). If he already finished it,
// it sends the result instead, and the page shows the score straight away.
export type StartResponse = AttemptInfo | QuizResult;

export interface AttemptInfo {
  attemptId: number;
  quizId: number;
  startedAt: string;
  expiresAt: string;
  serverNow: string;
  resumed: boolean; // true when he had an attempt already open
  answers: { questionId: number; choiceId: number }[]; // the answers he saved before
}

// Is this answer the finished result, or the attempt we can continue?
export function isFinishedResult(answer: StartResponse): answer is QuizResult {
  return 'submitted' in answer && answer.submitted === true;
}

export interface QuizResult {
  attemptId: number;
  quizId: number;
  score: number;
  totalMarks: number;
  percentage: number;
  passMark: number;
  passed: boolean;
  submittedAt: string;
}

// Everything about exams: the list, and one student's attempt.
@Injectable({ providedIn: 'root' })
export class QuizService {
  private http = inject(HttpClient);

  // GET /api/quiz/courseQuiz/:courseId — the published exams of one course
  courseQuizzes(courseId: number) {
    return this.http.get<Quiz[]>(`${API_URL}/quiz/courseQuiz/${courseId}`);
  }

  // POST /api/quiz-attempt/start/:quizId — start the attempt, or continue the one already open
  start(quizId: number) {
    return this.http.post<StartResponse>(`${API_URL}/quiz-attempt/start/${quizId}`, {});
  }

  // GET /api/quiz-attempt/:attemptId/questions
  questions(attemptId: number) {
    return this.http.get<AttemptQuestions>(`${API_URL}/quiz-attempt/${attemptId}/questions`);
  }

  // PUT /api/quiz-attempt/:attemptId/answer — save one answer
  saveAnswer(attemptId: number, questionId: number, choiceId: number) {
    return this.http.put(`${API_URL}/quiz-attempt/${attemptId}/answer`, { questionId, choiceId });
  }

  // POST /api/quiz-attempt/:attemptId/submit — hand the exam in and get the score
  submit(attemptId: number) {
    return this.http.post<QuizResult>(`${API_URL}/quiz-attempt/${attemptId}/submit`, {});
  }

  // GET /api/quiz-attempt/:attemptId/result
  result(attemptId: number) {
    return this.http.get<QuizResult>(`${API_URL}/quiz-attempt/${attemptId}/result`);
  }
}
