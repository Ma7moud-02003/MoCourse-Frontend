import { inject, Service } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Lesson } from '../../../Main/Models/course-content.model';
import { CreateLessonRequest, UpdateLessonRequest } from '../../../Main/Models/lesson.model';
;

@Service()
export class Lessons {
      private readonly http = inject(HttpClient);
    private readonly api = environment.apiUrl; 
     
  
   


  // مؤكد
  private readonly createUrl = `${this.api}lesson`;

  // مؤكد
  private readonly uploadUrl = (id: number): string => `${this.api}lesson/uploadFile/${id}`;

  // NEEDS TO BE CHANGED: PATCH endpoint غير مؤكد
  private readonly updateUrl = (id: number): string => `${this.api}lesson/update/${id}`;

  // NEEDS TO BE CHANGED: DELETE endpoint غير مؤكد
  private readonly deleteUrl = (id: number): string => `${this.api}lesson/delete/${id}`;

  // ===== Methods =====


  createLesson(data: CreateLessonRequest): Observable<Lesson> {
    return this.http.post<Lesson>(this.createUrl, data);
  }

  updateLesson(id: number, data: UpdateLessonRequest): Observable<Lesson> {
    return this.http.patch<Lesson>(this.updateUrl(id), data);
  }

  deleteLesson(id: number): Observable<unknown> {
    return this.http.delete<unknown>(this.deleteUrl(id));
  }

  uploadLessonFile(id: number, file: File): Observable<Lesson> {
    // لا نضيف Content-Type يدويًا: المتصفح يضيف الـ boundary
    const formData = new FormData();
    formData.append('file', file);
    return this.http.patch<Lesson>(this.uploadUrl(id), formData);
  }
}
