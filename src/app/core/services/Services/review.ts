import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Review, ReviewInput } from '../../../Main/Models/review.model';

/**
 * Turns a backend error into a short Arabic message for the student.
 * The backend answers in English, so we look at the status code first,
 * then at the validation text (class-validator sends an array of messages).
 */
export function reviewErrorMessage(err: unknown): string {
  if (!(err instanceof HttpErrorResponse)) {
    return 'حدث خطأ غير متوقع، حاول مرة أخرى.';
  }
  if (err.status === 0) {
    return 'تعذر الاتصال بالخادم، تأكد من الإنترنت وحاول مرة أخرى.';
  }

  const raw: unknown = err.error?.message;
  const text = (Array.isArray(raw) ? raw.join(' ') : String(raw ?? '')).toLowerCase();

  switch (err.status) {
    case 400:
      if (text.includes('comment') && text.includes('200')) {
        return 'التعليق لا يجب أن يزيد عن 200 حرف.';
      }
      if (text.includes('comment') && text.includes('5 characters')) {
        return 'التعليق يجب ألا يقل عن 5 حروف.';
      }
      if (text.includes('comment')) {
        return 'اكتب تعليقًا صحيحًا (من 5 إلى 200 حرف).';
      }
      if (text.includes('rateing')) {
        return 'التقييم يجب أن يكون رقمًا صحيحًا من 1 إلى 5.';
      }
      return 'البيانات غير صحيحة، راجع التقييم والتعليق.';
    case 401:
      if (text.includes('purshace') || text.includes('purchase')) {
        return 'يجب الاشتراك في الكورس أولًا لتتمكن من تقييمه.';
      }
      return 'ليس لديك صلاحية لهذا الإجراء، أو يجب تسجيل الدخول من جديد.';
    case 403:
      return 'ليس لديك صلاحية لهذا الإجراء.';
    case 404:
      return 'التقييم أو الكورس غير موجود.';
    case 409:
      return 'لقد قمت بتقييم هذا الكورس من قبل. يمكنك تعديل تقييمك الحالي.';
    default:
      return 'حدث خطأ في الخادم، حاول مرة أخرى لاحقًا.';
  }
}

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}review/`;

  /** Public list of one course's reviews, newest first (the backend caps the page size at 50). */
  getCourseReviews(courseId: number, page = 1, limit = 20): Observable<Review[]> {
    const params = new HttpParams().set('page', page).set('limit', limit);
    return this.http.get<Review[]>(`${this.api}course/${courseId}`, { params });
  }

  /**
   * The ids of every review the logged-in student wrote.
   * The public list hides who wrote what, so this is how we know which reviews are "mine".
   */
  getMyReviewIds(): Observable<number[]> {
    return this.http
      .get<{ id: number }[]>(`${this.api}myReviews`)
      .pipe(map((reviews) => reviews.map((r) => r.id)));
  }

  addReview(courseId: number, input: ReviewInput) {
    return this.http.post<{ id: number }>(`${this.api}add/${courseId}`, input);
  }

  updateReview(courseId: number, reviewId: number, input: ReviewInput) {
    return this.http.patch<{ message: string }>(`${this.api}update/${courseId}/${reviewId}`, input);
  }

  deleteReview(courseId: number, reviewId: number) {
    return this.http.delete<{ message: string }>(`${this.api}delete/${courseId}/${reviewId}`);
  }
}
