import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
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
}
