import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CertificateService, CertificateSummary } from '../../core/certificate.service';
import { EnrollmentService, MyCourse } from '../../core/enrollment.service';
import { errorMessage } from '../../core/error-message';
import { CourseProgress, ProgressService } from '../../core/progress.service';
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
  private certificateService = inject(CertificateService);
  private router = inject(Router);

  items = signal<MyCourse[]>([]);
  // the tab he is on: all courses, only the ones he is learning, or only the finished ones
  tab = signal<'all' | 'learning' | 'done'>('all');
  tabs = [
    { id: 'all', label: 'الكل' },
    { id: 'learning', label: 'بتعلّمها' },
    { id: 'done', label: 'خلّصتها' },
  ] as const;
  shown = computed(() =>
    this.items().filter(
      (c) =>
        this.tab() === 'all' ||
        (this.tab() === 'done' ? c.status === 'completed' : c.status !== 'completed'),
    ),
  );
  finished = computed(() => this.items().filter((c) => c.status === 'completed'));
  // "13 of 18 lessons" for each course, by course id
  counts = signal<Record<number, CourseProgress>>({});
  certificates = signal<CertificateSummary[]>([]);
  loading = signal(true);
  error = signal('');

  // The course whose "continue" button was pressed, and a message if it has no lessons yet.
  opening = signal(0);
  emptyCourse = signal(0);

  ngOnInit() {
    // The certificates box is a bonus: if this fails, the box just has no links.
    this.certificateService.mine().subscribe({
      next: (list) => this.certificates.set(list),
      error: () => {},
    });

    this.enrollments.mine().subscribe({
      next: (list) => {
        this.items.set(list);
        this.loading.set(false);
        list.forEach((c) =>
          this.progress.course(c.course.id).subscribe({
            next: (p) => this.counts.update((all) => ({ ...all, [c.course.id]: p })),
            error: () => {},
          }),
        );
      },
      error: (err) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }

  // The certificate of a finished course. The list only has the course title, so we match by it.
  certificateOf(title: string): CertificateSummary | undefined {
    return this.certificates().find((c) => c.courseTitle === title);
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
