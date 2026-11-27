import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map } from 'rxjs';
import { API_URL } from './config';

// A course the teacher owns, as it shows in his list.
export interface TeacherCourse {
  id: number;
  title: string;
  describtion: string | null;
  price: number;
  discountPrice: number | null;
  thumbnail: string | null;
  isPublished: boolean;
}

// The four states a join request can be in. The backend writes them in capitals.
export type PurchaseStatus = 'PENDING' | 'WAITING_APPROVAL' | 'PAID' | 'FAILED';

// One student asking to join one of his courses.
export interface JoinRequest {
  id: number;
  status: PurchaseStatus;
  amount: number;
  transactionId: string | null;
  paymentMethod: string | null;
  thumbnail: string | null; // the screenshot the student sent as proof
  enrolledAt: string;
  user: { fullName: string; email: string };
  course: { id: number; title: string; price: number; discountPrice: number | null; thumbnail: string | null };
}

// The teacher's own numbers, as the backend returns them.
// Note the field name "vodafonCach": that typo is the backend's, so we keep it on the way in.
export interface MyPaymentInfo {
  instapay: string | null;
  vodafonCach: string | null;
  orangeCash: string | null;
  bankAccount: string | null;
  ownerName: string | null;
}

// What we send when he saves his numbers. Here the backend spells it "vodafoneCash".
export interface PaymentInfoBody {
  instapay: string;
  vodafoneCash: string;
  orangeCash: string;
  bankAccount: string;
  ownerName: string;
}

// One student who joined a course.
// One lesson in a student's record.
export interface StudentLesson {
  sectionId: number;
  sectionTitle: string;
  lessonId: number;
  title: string;
  completed: boolean;
  lastPosition: number;
}

export interface StudentLessons {
  totalLessons: number;
  completedLessons: number;
  persentage: number;
  lessons: StudentLesson[];
}

// The results of one exam: the students who took it, and those who did not start it.
export interface ExamResults {
  totalMarks: number;
  passMark: number;
  attempts: {
    student: { id: number };
    status: string; // submitted or in_progress ...
    score: number | null;
    percentage: number | null;
    passed: boolean | null;
  }[];
}

export interface CourseStudent {
  id: number;
  enrolledAt: string;
  status: string; // in_progress or completed
  user: { id: number; fullName: string; avatar: string | null };
}

// Everything the teacher area needs: his courses, the join requests, and his payment numbers.
@Injectable({ providedIn: 'root' })
export class TeacherService {
  private http = inject(HttpClient);

  // GET /api/course/ins/myCourses
  myCourses() {
    return this.http.get<TeacherCourse[]>(`${API_URL}/course/ins/myCourses`);
  }

  // GET /api/buy/myPurchases?status=... — the join requests on his courses
  joinRequests(status?: PurchaseStatus) {
    const params = status ? new HttpParams().set('status', status) : new HttpParams();
    return this.http.get<JoinRequest[]>(`${API_URL}/buy/myPurchases`, { params });
  }

  // PATCH /api/buy/update/:id — the teacher accepts (PAID) or refuses (FAILED) one request.
  // Accepting is what enrolls the student, so this is the step that opens the course for him.
  decide(requestId: number, status: 'PAID' | 'FAILED') {
    return this.http.patch(`${API_URL}/buy/update/${requestId}`, { status });
  }

  // GET /api/paymentinfo/my — 404 until he saves his numbers for the first time
  myPaymentInfo() {
    return this.http.get<MyPaymentInfo>(`${API_URL}/paymentinfo/my`);
  }

  // POST /api/paymentinfo (first time) or PATCH /api/paymentinfo/update (after that)
  savePaymentInfo(info: PaymentInfoBody, alreadySaved: boolean) {
    if (alreadySaved) return this.http.patch(`${API_URL}/paymentinfo/update`, info);
    return this.http.post(`${API_URL}/paymentinfo`, info);
  }

  // GET /api/enrollment/students/:courseId
  // When nobody joined yet, the backend answers with an object (not a list), so we turn that into [].
  students(courseId: number) {
    return this.http
      .get<CourseStudent[] | { messsage: string }>(`${API_URL}/enrollment/students/${courseId}`)
      .pipe(map((answer) => (Array.isArray(answer) ? answer : [])));
  }

  // GET /api/progress/instractor/course_progress/:courseId/:studentId — how far one student got in the course
  studentProgress(courseId: number, studentId: number) {
    return this.http.get<{ totalLesoons: number; completedLessons: number; persentage: number }>(
      `${API_URL}/progress/instractor/course_progress/${courseId}/${studentId}`,
    );
  }

  // GET /api/progress/instractor/lessons_progress/:courseId/:studentId — every lesson with done or not
  studentLessons(courseId: number, studentId: number) {
    return this.http.get<StudentLessons>(
      `${API_URL}/progress/instractor/lessons_progress/${courseId}/${studentId}`,
    );
  }

  // GET /api/quiz-attempt/exam/:examId/results — who took the exam and who did not
  examResults(examId: number) {
    return this.http.get<ExamResults>(`${API_URL}/quiz-attempt/exam/${examId}/results`);
  }
}
