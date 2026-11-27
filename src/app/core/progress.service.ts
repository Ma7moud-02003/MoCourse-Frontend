import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_URL } from './config';

// How far a student got in one lesson.
export interface LessonProgress {
  lastPosition: number; // the second he stopped at
  completed: boolean;
}

// How far a student got in the whole course.
export interface CourseProgress {
  totalLesoons: number; // the backend spells it this way
  completedLessons: number;
  persentage: number; // 0 to 100, the backend spells it this way too
}

// Where to continue in a course: the lesson he touched last.
export interface ResumePoint {
  lessonId: number;
  title: string;
  duration: number | null;
  lastPosition: number;
  completed: boolean;
}

// What the student has finished. All of these need him to be enrolled in the course.
@Injectable({ providedIn: 'root' })
export class ProgressService {
  private http = inject(HttpClient);

  // GET /api/progress/lessson_progress/:id (three s in "lessson" is the backend's spelling)
  lesson(lessonId: number) {
    return this.http.get<LessonProgress>(`${API_URL}/progress/lessson_progress/${lessonId}`);
  }

  // GET /api/progress/course_progress/:id
  course(courseId: number) {
    return this.http.get<CourseProgress>(`${API_URL}/progress/course_progress/${courseId}`);
  }

  // GET /api/progress/resume/:courseId (null when the course has no lessons)
  resume(courseId: number) {
    return this.http.get<ResumePoint | null>(`${API_URL}/progress/resume/${courseId}`);
  }

  // PATCH /api/progress/update_lesson
  // A video sends the second it reached, and the backend marks it done at 90%.
  // A PDF or a written lesson sends completed: true when the student says he finished it.
  save(lessonId: number, lastPosition: number, completed?: boolean) {
    return this.http.patch<LessonProgress>(`${API_URL}/progress/update_lesson`, {
      lessonId,
      lastPosition: Math.floor(lastPosition),
      ...(completed ? { completed: true } : {}),
    });
  }
}
