import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { EnrollmentService, MyCourse } from '../../core/enrollment.service';
import { errorMessage } from '../../core/error-message';
import { ProgressService } from '../../core/progress.service';
import { AppFooter } from '../../layout/app-footer/app-footer';
import { AppHeader } from '../../layout/app-header/app-header';

// "كورساتي": the courses the student joined, how far he got in each, and a button to continue.
@Component({
  selector: 'app-my-courses',
  imports: [AppHeader, AppFooter, RouterLink],
  templateUrl: './my-courses.html',
})
export class MyCourses implements OnInit {
  private enrollments = inject(EnrollmentService);
  private progress = inject(ProgressService);
  private router = inject(Router);

  items = signal<MyCourse[]>([]);
  loading = signal(true);
  error = signal('');

  // The course whose "continue" button was pressed, and a message if it has no lessons yet.
  opening = signal(0);
  emptyCourse = signal(0);

  ngOnInit() {
    this.enrollments.mine().subscribe({
      next: (list) => {
        this.items.set(list);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }

  // Ask the backend where he stopped, then open that lesson.
  continueCourse(courseId: number) {
    this.opening.set(courseId);
    this.emptyCourse.set(0);
    this.progress.resume(courseId).subscribe({
      next: (point) => {
        this.opening.set(0);
        if (!point) {
          this.emptyCourse.set(courseId);
          return;
        }
        this.router.navigate(['/courses', courseId, 'lessons', point.lessonId]);
      },
      // if the question fails, the course page is still a good place to continue from
      error: () => {
        this.opening.set(0);
        this.router.navigate(['/courses', courseId]);
      },
    });
  }
}
