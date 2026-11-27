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
}
