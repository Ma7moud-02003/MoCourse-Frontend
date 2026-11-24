import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
// عدّل المسار حسب مشروعك


import { environment } from '../../environments/environment';
import { InstructorDashboardInsights, InstructorDashboardStats } from '../../Main/Models/instractor.dashoared';

@Injectable({ providedIn: 'root' })
export class InstructorDashboardService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}dashboared/instractor`;

  getStats(): Observable<InstructorDashboardStats> {
    return this.http.get<InstructorDashboardStats>(`${this.base}/numbers`);
  }

  getInsights(): Observable<InstructorDashboardInsights> {
    return this.http.get<InstructorDashboardInsights>(`${this.base}/lastInfo`);
  }
}