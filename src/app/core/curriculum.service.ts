import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_URL } from './config';

// One chapter of a course. A course is a list of sections, and each section holds lessons.
export interface Section {
  id: number;
  title: string;
  order: number;
}

// One lesson. A student who is not enrolled yet gets only these few fields
// (the backend hides the video and the file until he is enrolled).
export interface Lesson {
  id: number;
  title: string;
  order: number;
  duration: number | null; // seconds
  isPreview: boolean; // the teacher lets everyone watch this one
  type?: 'video' | 'pdf' | 'text'; // only the course owner gets this field and the next ones
  description?: string | null;
  content?: string | null; // the written lesson (text type)
  videoUrl?: string | null; // empty until the video is uploaded
  pdfUrl?: string | null; // empty until the PDF is uploaded
  fileSize?: number | null;
}

// What the teacher sends to open a new lesson.
export interface NewLesson {
  title: string;
  description: string;
  type: 'video' | 'pdf' | 'text';
  order: number;
  sectionId: number;
  isPreview: boolean;
  content?: string; // the written lesson, for the "text" type
}

export interface SectionPage {
  data: Section[];
  pageNum: number;
  sectionsPerPage: number;
  isEnrolled: boolean;
  canAccess: boolean;
}

// The content of a course: its sections and the lessons inside each section.
@Injectable({ providedIn: 'root' })
export class CurriculumService {
  private http = inject(HttpClient);

  // GET /api/section/sections/:courseId — 10 sections per page (the backend decides the size)
  sections(courseId: number, pageNumber = 1) {
    const params = new HttpParams().set('pageNumber', pageNumber);
    return this.http.get<SectionPage>(`${API_URL}/section/sections/${courseId}`, { params });
  }

  // GET /api/lesson/lessons/:sectionId — the lessons of one section, in order
  lessons(sectionId: number) {
    return this.http.get<Lesson[]>(`${API_URL}/lesson/lessons/${sectionId}`);
  }

  // POST /api/section — the teacher opens a new section in his course
  addSection(courseId: number, title: string, order: number) {
    return this.http.post<Section>(`${API_URL}/section`, { courseId, title, order });
  }

  // POST /api/lesson — creates the lesson itself (the video or PDF file is sent after, see uploadFile)
  addLesson(lesson: NewLesson) {
    return this.http.post<Lesson>(`${API_URL}/lesson`, lesson);
  }

  // PATCH /api/lesson/uploadFile/:id — sends the video or the PDF of a lesson that already exists
  uploadFile(lessonId: number, file: File) {
    const body = new FormData();
    body.append('file', file);
    return this.http.patch<Lesson>(`${API_URL}/lesson/uploadFile/${lessonId}`, body);
  }

  // PATCH /api/lesson/update/:id — changes the name, the text or the free-preview switch of a lesson
  updateLesson(
    lessonId: number,
    changes: { title?: string; description?: string; isPreview?: boolean; content?: string },
  ) {
    return this.http.patch<Lesson>(`${API_URL}/lesson/update/${lessonId}`, changes);
  }

  // DELETE /api/lesson/delete/:id — the backend refuses when a student already took an exam in it
  deleteLesson(lessonId: number) {
    return this.http.delete(`${API_URL}/lesson/delete/${lessonId}`);
  }

  // PATCH /api/section/update/:id — renames a section
  renameSection(sectionId: number, title: string) {
    return this.http.patch<Section>(`${API_URL}/section/update/${sectionId}`, { title });
  }

  // DELETE /api/section/delete/:id — removes the section with all its lessons
  deleteSection(sectionId: number) {
    return this.http.delete(`${API_URL}/section/delete/${sectionId}`);
  }
}
