import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_URL } from './config';

// The three kinds of lesson the backend knows: a video, a PDF file, or written text.
export type LessonType = 'video' | 'pdf' | 'text';

// One lesson with everything inside it. A student only gets this full version
// when the teacher marked the lesson as a preview, or when he is enrolled in the course.
export interface LessonDetails {
  id: number;
  title: string;
  description: string | null;
  type: LessonType;
  videoUrl: string | null;
  pdfUrl: string | null;
  content: string | null; // the written lesson, when the type is "text"
  duration: number | null; // seconds
  order: number;
  isPreview: boolean;
}

// Reading one lesson. The list of lessons lives in CurriculumService; this is the single lesson.
@Injectable({ providedIn: 'root' })
export class LessonService {
  private http = inject(HttpClient);

  // GET /api/lesson/details/:id
  get(id: number) {
    return this.http.get<LessonDetails>(`${API_URL}/lesson/details/${id}`);
  }
}
