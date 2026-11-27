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

// What a teacher fills in to open a new course. The thumbnail travels as a file,
// so it is kept apart from these fields.
export interface NewCourse {
  title: string;
  describtion: string;
  price: number;
  discountPrice: number | null;
  duration: number;
  level: CourseLevel;
  categoryId: number;
  covers: string[];
  requirements: string[];
}

// A category the course can belong to.
export interface Category {
  id: number;
  name: string;
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

  // GET /api/category/all — the list a teacher picks from when he opens a course
  categories() {
    return this.http.get<Category[]>(`${API_URL}/category/all`);
  }

  // POST /api/course — a new course with its picture. Every field goes as text,
  // except the thumbnail which is the file itself.
  create(course: NewCourse, thumbnail: File) {
    const form = new FormData();
    form.append('title', course.title);
    form.append('describtion', course.describtion);
    form.append('price', String(course.price));
    form.append('duration', String(course.duration));
    form.append('level', course.level);
    form.append('categoryId', String(course.categoryId));
    // the backend only ever publishes here: it reads "false" as true, so a draft
    // cannot be created from the site yet (that needs a backend fix)
    form.append('isPublished', 'true');
    if (course.discountPrice) form.append('discountPrice', String(course.discountPrice));
    // these two are lists on the backend, so each line is sent as its own field
    for (const cover of course.covers) form.append('covers', cover);
    for (const requirement of course.requirements) form.append('requirements', requirement);
    form.append('thumbnail', thumbnail);

    return this.http.post<CourseDetails>(`${API_URL}/course`, form);
  }

  // GET /api/course/details/:id — everything one course page needs in one answer.
  // A draft course answers 404 unless we own it or already joined it.
  details(id: number) {
    return this.http.get<CourseDetails>(`${API_URL}/course/details/${id}`);
  }
}
