import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_URL } from './config';

// The four ways the teacher accepts money. These words must match the backend exactly.
export type PaymentMethod = 'instapay' | 'vodafonCach' | 'orangeCash' | 'bankAccount';

// The teacher's numbers: where the student sends the money.
export interface PaymentInfo {
  instapay: string | null;
  vodafonCach: string | null;
  orangeCash: string | null;
  bankAccount: string | null;
  ownerName: string | null;
}

// The backend answers a join request with one of two sentences: "go and pay"
// or "your request is waiting for the teacher". This reads which one it is.
export function isWaitingForTeacher(message: string): boolean {
  return message.includes('مراجعة');
}

// Joining a course. The money moves outside the site (InstaPay, Vodafone Cash, ...),
// so the student sends a screenshot of the transfer and the teacher approves it.
// Only after that approval does the backend enroll him.
@Injectable({ providedIn: 'root' })
export class PurchaseService {
  private http = inject(HttpClient);

  // POST /api/buy/:courseId
  // A join request. If he asked before, the backend answers with where that request
  // stands instead of opening a second one.
  join(courseId: number) {
    return this.http.post<{ message: string }>(`${API_URL}/buy/${courseId}`, {});
  }

  // PATCH /api/buy/confirm/:courseId
  // The proof: how he paid, the transfer number, and the screenshot itself.
  sendProof(courseId: number, method: PaymentMethod, transactionId: string, screenshot: File) {
    const form = new FormData();
    form.append('paymentMethod', method);
    form.append('transactionId', transactionId);
    form.append('thumbnail', screenshot);
    return this.http.patch(`${API_URL}/buy/confirm/${courseId}`, form);
  }

  // GET /api/paymentinfo/course/:courseId
  // Where to send the money. Answers 404 when the teacher has not added his numbers yet.
  paymentInfo(courseId: number) {
    return this.http.get<PaymentInfo>(`${API_URL}/paymentinfo/course/${courseId}`);
  }
}
