import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_URL } from './config';

// The three levels the backend knows. We write them exactly as it does.
export type CourseLevel = 'beginner' | 'intermediate' | 'advanced';

// One course as GET /api/course/all sends it.
// Note the name "Instractor" with that spelling: the backend sends it like this,
// so we keep the same spelling here or the data will not arrive.
export interface CourseCard {
  id: number;
  title: string;
  price: number;
  discountPrice: number | null;
  thumbnail: string;
  createdAt: string;
  category: { name: string } | null;
  Instractor: { id: number; fullName: string; avatar: string | null } | null;
}

// Every list in the backend answers with this same shape
// (see pageResult in the backend file src/utils/pagination.ts).
export interface Page<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// What GET /api/course/details/:id sends back: the whole course page needs this one,
// plus two flags that tell us what this student is allowed to see.
export interface CourseDetails extends CourseCard {
  describtion: string;
  duration: number;
  level: CourseLevel;
  covers: string[];
  requirements: string[];
  isPublished: boolean;
  quizzes: { id: number; title: string; isPublished: boolean }[];
  isEnrolled: boolean; // a student who already joined the course
  canAccess: boolean; // the teacher who owns it (or an admin)
}

// What the page can filter by. Everything is optional: what we do not send, the backend ignores.
export interface CourseFilters {
  title?: string;
  level?: CourseLevel | '';
  page?: number;
  limit?: number;
}

// One place that knows how to talk to the courses part of the backend.
@Injectable({ providedIn: 'root' })
export class CourseService {
  private http = inject(HttpClient);

  // GET /api/course/all — needs a logged-in user; the interceptor adds the token for us.
  list(filters: CourseFilters = {}) {
    let params = new HttpParams();

    // Only send the filters the user really chose, so the URL stays clean
    // (and an empty search box does not turn into title=).
    const title = filters.title?.trim();
    if (title) params = params.set('title', title);
    if (filters.level) params = params.set('level', filters.level);

    params = params.set('page', filters.page ?? 1).set('limit', filters.limit ?? 9);

    return this.http.get<Page<CourseCard>>(`${API_URL}/course/all`, { params });
  }

  // GET /api/course/details/:id — everything one course page needs in one answer.
  // A draft course answers 404 unless we own it or already joined it.
  details(id: number) {
    return this.http.get<CourseDetails>(`${API_URL}/course/details/${id}`);
  }
}
