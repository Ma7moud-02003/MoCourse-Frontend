import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_URL } from './config';

// One course the student joined, with how far he got.
export interface MyCourse {
  id: number; // the enrollment id, not the course id
  enrolledAt: string;
  status: 'in_progress' | 'completed';
  completedAt: string | null;
  progressPercent: number; // 0 to 100
  course: {
    id: number;
    title: string;
    thumbnail: string | null;
  };
}

// A course the backend suggests. It is a shorter card than the course list gives.
export interface SuggestedCourse {
  id: number;
  title: string;
  price: number;
  discountPrice: number | null;
  thumbnail: string;
}

// The courses a student joined (after the teacher accepted his payment).
@Injectable({ providedIn: 'root' })
export class EnrollmentService {
  private http = inject(HttpClient);

  // GET /api/enrollment/my_enrollments
  mine() {
    return this.http.get<MyCourse[]>(`${API_URL}/enrollment/my_enrollments`);
  }

  // GET /api/enrollment/suggestedCourses (courses he has not joined yet)
  suggested() {
    return this.http.get<SuggestedCourse[]>(`${API_URL}/enrollment/suggestedCourses`);
  }
}
