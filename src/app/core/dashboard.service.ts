import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_URL } from './config';

// What the student sees on his dashboard.
export interface StudentDashboard {
  coursesNumDetails: {
    total: number; // courses he joined
    completed: number;
    inProgress: number;
    persentage: number; // share of finished courses, 0 to 100 (the backend spells it this way)
  };
  // The courses he joined most recently
  lastCourses: {
    id: number;
    status: 'in_progress' | 'completed';
    course: { id: number; title: string; thumbnail: string | null };
  }[];
  // The lesson he touched last. Null when he did not start any.
  lastLesson: {
    completed: boolean;
    updatedAt: string;
    lesson: { id: number; title: string; order: number };
  } | null;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);

  // GET /api/dashboared/student/info (the backend spells it "dashboared")
  student() {
    return this.http.get<StudentDashboard>(`${API_URL}/dashboared/student/info`);
  }
}
