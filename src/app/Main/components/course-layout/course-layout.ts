import { Component, inject, input, signal } from '@angular/core';
import { CourseHeader } from '../course-content/course-content';
import { LessonViewer } from '../lesson-displaying/lesson-displaying';
import { RouterOutlet } from '@angular/router';
import { CourseSSidebar } from '../course-sidebar/course-sidebar';
import { UserInfo } from '../../../core/services/Services/instractor-info';

@Component({
  imports: [CourseSSidebar, CourseHeader,LessonViewer,RouterOutlet],
  selector: 'app-course-layout',
  styles: ``,
  templateUrl: './course-layout.html',
})
export class CourseLayout {
  private userInfo = inject(UserInfo);
id = input.required<number>();
instructorId = signal<number>(0);
ngOnInit(): void {
 this.instructorId.set(this.userInfo.instructorId()||0);

}}
