import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_URL } from './config';

// A certificate in the list: given to a student when he finishes a course.
export interface CertificateSummary {
  id: number;
  certificateNumber: string;
  issuedAt: string;
  completedAt: string | null;
  courseTitle: string;
}

// One certificate with the names that are printed on it.
export interface CertificateDetails extends CertificateSummary {
  student: { id: number; fullName: string };
  course: {
    id: number;
    title: string;
    duration: number | null;
    Instractor: { id: number; fullName: string } | null;
  };
}

// The answer of the check: a real certificate has its number, or else a "message" saying there is none.
export interface CertificateCheck {
  message?: string;
  certificateNumber?: string;
  issuedAt?: string;
  courseTitle?: string;
  student?: { fullName: string };
}

@Injectable({ providedIn: 'root' })
export class CertificateService {
  private http = inject(HttpClient);

  // GET /api/certificate/myCrrtificates (the backend spells it this way)
  mine() {
    return this.http.get<CertificateSummary[]>(`${API_URL}/certificate/myCrrtificates`);
  }

  // GET /api/certificate/:id (only the owner can read it)
  one(id: number) {
    return this.http.get<CertificateDetails>(`${API_URL}/certificate/${id}`);
  }

  // GET /api/certificate/verify/:number (any logged-in user can check a number)
  verify(number: string) {
    return this.http.get<CertificateCheck>(
      `${API_URL}/certificate/verify/${encodeURIComponent(number)}`,
    );
  }
}
