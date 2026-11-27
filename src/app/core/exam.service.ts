import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map } from 'rxjs';
import { API_URL } from './config';

// One exam as the teacher sees it. The times are UTC strings; the browser shows them in local time.
export interface TeacherExam {
  id: number;
  title: string;
  description: string | null;
  passMark: number;
  totalMarks: number;
  opensAt: string;
  closesAt: string;
  isPublished: boolean;
  course: { id: number; title: string };
}

export interface NewExam {
  title: string;
  description: string;
  passMark: number;
  opensAt: string; // full date-time with a zone, like 2026-12-01T09:00:00.000Z
  closesAt: string;
  courseId: number;
}

export type QuestionKind = 'mcq' | 'true_false';

export interface ExamChoice {
  id: number;
  text: string;
  isCorrect: boolean;
  order: number;
}

export interface ExamQuestion {
  id: number;
  type: QuestionKind;
  question: string;
  mark: number;
  order: number;
  choices: ExamChoice[];
}

export interface NewQuestion {
  question: string;
  type: QuestionKind;
  mark: number;
  order: number;
  choices: { text: string; isCorrect: boolean; order: number }[];
}

// What the teacher does with exams: create one, fill it with questions, then publish it.
@Injectable({ providedIn: 'root' })
export class ExamService {
  private http = inject(HttpClient);

  // GET /api/quiz/insQuizes returns the exams of ALL his courses, so we keep this course's only.
  forCourse(courseId: number) {
    return this.http
      .get<TeacherExam[]>(`${API_URL}/quiz/insQuizes`)
      .pipe(map((all) => all.filter((exam) => exam.course.id === courseId)));
  }

  // POST /api/quiz — a new exam always starts as a draft (the backend decides)
  create(exam: NewExam) {
    return this.http.post<TeacherExam>(`${API_URL}/quiz`, { ...exam, quizTarget: 'course' });
  }

  // PATCH /api/quiz/:id — students see the exam only after this
  publish(examId: number) {
    return this.http.patch<TeacherExam>(`${API_URL}/quiz/${examId}`, { isPublished: true });
  }

  // GET /api/question/quiz-questions/:examId
  questions(examId: number) {
    return this.http.get<ExamQuestion[]>(`${API_URL}/question/quiz-questions/${examId}`);
  }

  // POST /api/question — the backend takes a list, we send one question at a time
  addQuestion(examId: number, question: NewQuestion) {
    return this.http.post(`${API_URL}/question`, { quizId: examId, questions: [question] });
  }
}
