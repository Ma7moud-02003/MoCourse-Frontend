import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  HostListener,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CoursesService } from '../../../core/services/Services/course';
import { Course, CourseLevel } from '../../../Main/Models/wizard.models';
import { CourseCard } from '../../../Main/components/cards/course-card/course-card';

// Adjust these import paths to match your project structure.


@Component({
  selector: 'app-instructor-courses',
  standalone: true,
  imports: [RouterLink, DecimalPipe,RouterModule,CourseCard],
  templateUrl: './my-courses.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstructorCourses implements OnInit {
  private readonly coursesService = inject(CoursesService);
  private readonly destroyRef = inject(DestroyRef);

  // Routes: align with your router config.
  readonly addCourseRoute = '/instructor/courses/create';
  readonly editCourseRoute = (id: number): string[] => ['/instractor/update-course', String(id)];

  readonly currency = 'ج.م';
  readonly skeletons = [1, 2, 3, 4, 5, 6];


  // Data state
  readonly courses = signal<Course[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);

  // Delete flow state
  readonly showDeleteModal = signal(false);
  readonly selectedCourse = signal<Course | null>(null);
  readonly deleting = signal(false);
  readonly deleteError = signal(false);

  // Stats
  readonly totalCourses = computed(() => this.courses().length);
  readonly publishedCourses = computed(() => this.courses().filter((c) => c.isPublished).length);
  readonly draftCourses = computed(() => this.courses().filter((c) => !c.isPublished).length);

  ngOnInit(): void {
    this.loadCourses();
  }

  loadCourses(): void {
    this.loading.set(true);
    this.error.set(false);

    this.coursesService
      .getInstractorCourses()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (courses) => {
          this.courses.set(courses);
          console.log(courses);
          
          this.loading.set(false);
        },
        error: () => {
          this.error.set(true);
          this.loading.set(false);
        },
      });
  }

  hasDiscount(course: Course): boolean {
    return !!course.discountPrice && course.discountPrice < course.price;
  }

  formatDuration(minutes: number): string {
    if (minutes < 60) return `${minutes} د`;
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return rest ? `${hours} س ${rest} د` : `${hours} س`;
  }

  openDeleteModal(course: Course): void {
    this.selectedCourse.set(course);
    this.deleteError.set(false);
    this.showDeleteModal.set(true);
  }

  @HostListener('document:keydown.escape')
  closeDeleteModal(): void {
    if (this.deleting()) return;
    this.showDeleteModal.set(false);
    this.selectedCourse.set(null);
  }

  confirmDelete(): void {
    const course = this.selectedCourse();
    if (!course || this.deleting()) return;

    this.deleting.set(true);
    this.deleteError.set(false);

    this.coursesService
      .deleteCourse(course.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.courses.update((list) => list.filter((c) => c.id !== course.id));
          this.deleting.set(false);
          this.closeDeleteModal();
        },
        error: () => {
          this.deleting.set(false);
          this.deleteError.set(true);
        },
      });
  }
}