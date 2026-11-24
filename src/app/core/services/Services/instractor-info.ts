import { inject, Service, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';

@Service()
export class UserInfo {
      private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;
  instructorId = signal<number | null>(null);
  getInstractorInfo() {
    return this.http.get(`${this.api}user/currentUser`);
  }

}
