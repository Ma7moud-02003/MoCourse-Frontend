import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs/internal/Observable';

@Service()
export class CurrentUser {
 
    private readonly http = inject(HttpClient);
    private readonly api = environment.apiUrl;

    getCurrentUser():Observable<any> {
    return this.http.get<any>(`${this.api}user/currentUser`);
}
}