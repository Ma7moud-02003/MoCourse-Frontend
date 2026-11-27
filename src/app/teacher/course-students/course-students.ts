import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CourseService } from '../../core/course.service';
import { CourseStudent, TeacherService } from '../../core/teacher.service';
import { AppFooter } from '../../layout/app-footer/app-footer';
import { AppHeader } from '../../layout/app-header/app-header';

// The students who joined one course of the teacher.
@Component({
  selector: 'app-course-students',
  imports: [RouterLink, AppHeader, AppFooter],
  templateUrl: './course-students.html',
})
export class CourseStudents implements OnInit {
  private route = inject(ActivatedRoute);
  private teacher = inject(TeacherService);
  private courses = inject(CourseService);

  courseTitle = signal('');
  students = signal<CourseStudent[]>([]);
  loading = signal(true);
  failed = signal(false);

  ngOnInit() {
    const courseId = Number(this.route.snapshot.paramMap.get('id'));
    this.courses.details(courseId).subscribe({
      next: (course) => this.courseTitle.set(course.title),
      error: () => this.courseTitle.set(''),
    });
    this.teacher.students(courseId).subscribe({
      next: (list) => {
        this.students.set(list);
        this.loading.set(false);
      },
      // the backend answers 404 for a course that is not his
      error: () => {
        this.loading.set(false);
        this.failed.set(true);
      },
    });
  }

  joined(iso: string): string {
    return new Date(iso).toLocaleDateString('ar-EG', { dateStyle: 'medium' });
  }
}
