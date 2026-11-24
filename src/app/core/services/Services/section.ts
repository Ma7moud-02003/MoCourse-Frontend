import { inject, Service } from '@angular/core';
import { Lesson, SectionModel, SectionsResponse } from '../../../Main/Models/course-content.model';
import { Observable } from 'rxjs/internal/Observable';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
interface CreateSectionContent {
  title: string;
  courseId: number;
  order: number;
}
interface UpdateSectionContent {
  title?: string;
  order?: number;
}
@Service()
export class Section {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

getCouseSections(id: number, page: number = 1): Observable<SectionsResponse> {
   
  return this.http.get<SectionsResponse>(`${this.api}section/sections/${id}?pageNumber=${page}`);
}
 
createSection(sectionContent: CreateSectionContent): Observable<SectionModel> {
  return this.http.post<SectionModel>(`${this.api}section`, sectionContent);
}
 
updateSection(id: number, updatedSection: UpdateSectionContent): Observable<SectionModel> {
  return this.http.patch<SectionModel>(`${this.api}section/update/${id}`, updatedSection);
}
 
deleteSection(id: number): Observable<unknown> {
  return this.http.delete(`${this.api}section/delete/${id}`);
}
 
getSectionLessons(sectionId: number): Observable<Lesson[]> {
  return this.http.get<Lesson[]>(`${this.api}lesson/lessons/${sectionId}`);
}
 
deleteLesson(id: number): Observable<unknown> {
  return this.http.delete(`${this.api}lesson/delete/${id}`);
}

}
