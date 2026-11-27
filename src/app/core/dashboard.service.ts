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

// The teacher's numbers (the first call).
export interface TeacherNumbers {
  coursesCount: number;
  enrolledStudents: number;
  totalPurchase: number; // all purchases
  wateing_aproave: number; // purchases waiting for his approval (the backend spells it this way)
  totalProfite: string; // total earnings, as text
  totalStudents: number;
  completedStudents: number;
  completionPercentage: number; // 0 to 100
}

// What happened lately (the second call). Any part can be empty or null for a new teacher.
export interface TeacherLastInfo {
  lastPurchase: {
    id: number;
    amount: number;
    paymentMethod: string;
    user: { id: number; fullName: string; avatar: string | null };
    course: { title: string };
  }[];
  mostCompletedLesson: { lessonId: number; lessonTitle: string; watchedCount: string } | null;
  mostCoursePurshaced: { courseId: number; courseTitle: string; purchaseCount: string } | null;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);

  // GET /api/dashboared/student/info (the backend spells it "dashboared")
  student() {
    return this.http.get<StudentDashboard>(`${API_URL}/dashboared/student/info`);
  }

  // GET /api/dashboared/instractor/numbers
  teacherNumbers() {
    return this.http.get<TeacherNumbers>(`${API_URL}/dashboared/instractor/numbers`);
  }

  // GET /api/dashboared/instractor/lastInfo
  teacherLastInfo() {
    return this.http.get<TeacherLastInfo>(`${API_URL}/dashboared/instractor/lastInfo`);
  }
}
