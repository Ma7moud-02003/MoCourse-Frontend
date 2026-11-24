import { inject, Service } from '@angular/core';
import { EnrollmentStatus, LessonDetails } from '../Models/lesson-playing.model';
import { Observable } from 'rxjs/internal/Observable';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Service()
export class LessonDisplaying {
private readonly http = inject(HttpClient);
private readonly api =environment.apiUrl;
    
getLessonById(lessonId: number): Observable<LessonDetails> {
  return this.http.get<LessonDetails>(`${this.api}lesson/details/${lessonId}`);
}
 
isEnrolled(courseId: number): Observable<EnrollmentStatus> {
  return this.http.get<EnrollmentStatus>(`${this.api}enrollment/isStudentEnroll/${courseId}`);
}
}
