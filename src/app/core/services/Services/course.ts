import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { Category, Course, CoursePayload, UploadedImage } from '../../../Main/Models/wizard.models';
import { environment } from '../../../environments/environment';
@Injectable({ providedIn: 'root' })
export class CoursesService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl; // ASSUMPTION: replace with your actual API base URL
 private readonly createEndpoint = `${this.api}course`;
 private readonly categoryEndpoint = `${this.api}category/all`;
 private readonly updateEndpoint = `${this.api}course/update`; // ASSUMPTION: replace with your actual update endpoint
 private readonly deleteEndpoint = `${this.api}course/delete`; // ASSUMPTION: replace with your actual delete endpoint
 private readonly myCoursesEndpoint = `${this.api}course/ins/myCourses`; // ASSUMPTION: replace with your actual endpoint for fetching instructor's courses
  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.categoryEndpoint}`);
  }

 createCourse(formData: FormData): Observable<Course> {
  return this.http.post<Course>(
    this.createEndpoint,
    formData
  );
}

  updateCourse(id: number, formData: FormData): Observable<Course> {
    return this.http.patch<Course>(`${this.updateEndpoint}/${id}`, formData);
  }


  getInstractorCourses(): Observable<Course[]> {
    return this.http.get<Course[]>(this.myCoursesEndpoint);
  }

  deleteCourse(id: number): Observable<void> {
  return this.http.delete<void>(`${this.deleteEndpoint}/${id}`);
}
 
getCourseById(id: number): Observable<Course> {
  return this.http.get<Course>(`${this.api}course/details/${id}`);
}
getCouseSections(id: number, page: number = 1): Observable<any> {
  return this.http.get<any>(`${this.api}section/sections/${id}?pageNumber=${page}`,);
}
}