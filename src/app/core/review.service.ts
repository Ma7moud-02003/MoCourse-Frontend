import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_URL } from './config';

// One review under a course. The backend spells "rating" as "rateing".
export interface Review {
  id: number;
  comment: string;
  rateing: number; // 0 to 5, whole numbers only
  createdAt: string;
  user: { fullName: string; avatar: string | null };
}

// What students wrote about a course.
@Injectable({ providedIn: 'root' })
export class ReviewService {
  private http = inject(HttpClient);

  // GET /api/review/course/:courseId (open to everyone, newest first)
  forCourse(courseId: number) {
    return this.http.get<Review[]>(`${API_URL}/review/course/${courseId}`);
  }

  // GET /api/review/isStudentHasComment/:courseId (students only)
  hasReviewed(courseId: number) {
    return this.http.get<boolean>(`${API_URL}/review/isStudentHasComment/${courseId}`);
  }

  // POST /api/review/add/:courseId — the comment must be 5 to 200 characters
  add(courseId: number, comment: string, rateing: number) {
    return this.http.post<{ id: number; comment: string; rateing: number; createdAt: string }>(
      `${API_URL}/review/add/${courseId}`,
      { comment, rateing },
    );
  }
}
