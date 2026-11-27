import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { EnrollmentService } from '../core/enrollment.service';
import { errorMessage } from '../core/error-message';
import { ReviewService } from '../core/review.service';
import { AppFooter } from '../layout/app-footer/app-footer';
import { AppHeader } from '../layout/app-header/app-header';

const MIN_LENGTH = 5;
const MAX_LENGTH = 200;

// One review of the student, with the course it belongs to.
interface MyReview {
  id: number;
  courseId: number;
  courseTitle: string;
  comment: string;
  rateing: number;
  createdAt: string;
}

// A course he joined (used in the "new review" form).
interface JoinedCourse {
  id: number;
  title: string;
}

// "تقييماتي": the reviews the student wrote, with edit and delete, and a form for a new one.
@Component({
  selector: 'app-my-reviews',
  imports: [AppHeader, AppFooter, RouterLink],
  templateUrl: './my-reviews.html',
})
export class MyReviews implements OnInit {
  private reviewService = inject(ReviewService);
  private enrollments = inject(EnrollmentService);

  readonly stars = [1, 2, 3, 4, 5];
  readonly maxLength = MAX_LENGTH;

  reviews = signal<MyReview[]>([]);
  courses = signal<JoinedCourse[]>([]); // the courses he joined and did not review yet
  loading = signal(true);
  error = signal('');

  // the form (for a new review, or for the one being edited)
  editingId = signal<number | null>(null);
  courseId = signal(0);
  rating = signal(0);
  comment = signal('');
  sending = signal(false);
  formError = signal('');

  ngOnInit() {
    this.load();
  }

  private load() {
    this.enrollments.mine().subscribe({
      next: (joined) => {
        // The backend does not say which course a review belongs to,
        // so we look inside each joined course for the reviews that are his.
        forkJoin({
          mine: this.reviewService.mine(),
          perCourse: forkJoin(
            joined.map((item) =>
              this.reviewService.forCourse(item.course.id).pipe(catchError(() => of([]))),
            ),
          ),
        }).subscribe({
          next: ({ mine, perCourse }) => {
            const list: MyReview[] = [];
            for (const review of mine) {
              const index = perCourse.findIndex((items) => items.some((r) => r.id === review.id));
              if (index === -1) continue;
              list.push({
                id: review.id,
                courseId: joined[index].course.id,
                courseTitle: joined[index].course.title,
                comment: review.comment,
                rateing: review.rateing,
                createdAt: review.createdAt,
              });
            }
            this.reviews.set(list);
            const reviewed = new Set(list.map((r) => r.courseId));
            this.courses.set(
              joined
                .filter((item) => !reviewed.has(item.course.id))
                .map((item) => ({ id: item.course.id, title: item.course.title })),
            );
            this.loading.set(false);
          },
          error: (err: HttpErrorResponse) => this.fail(err),
        });
      },
      error: (err: HttpErrorResponse) => this.fail(err),
    });
  }

  // "12 نوفمبر 2026"
  day(iso: string): string {
    return new Date(iso).toLocaleDateString('ar-EG', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  private fail(err: HttpErrorResponse) {
    this.error.set(errorMessage(err));
    this.loading.set(false);
  }

  onCourse(event: Event) {
    this.courseId.set(Number((event.target as HTMLSelectElement).value));
  }

  onComment(event: Event) {
    this.comment.set((event.target as HTMLTextAreaElement).value);
  }

  // Fill the form with an old review so he can change it.
  edit(review: MyReview) {
    this.editingId.set(review.id);
    this.courseId.set(review.courseId);
    this.rating.set(review.rateing);
    this.comment.set(review.comment);
    this.formError.set('');
  }

  cancelEdit() {
    this.editingId.set(null);
    this.courseId.set(0);
    this.rating.set(0);
    this.comment.set('');
    this.formError.set('');
  }

  remove(review: MyReview) {
    if (!confirm('تمسح التقييم ده؟')) return;
    this.reviewService.remove(review.courseId, review.id).subscribe({
      next: () => {
        this.cancelEdit();
        this.load();
      },
      error: (err: HttpErrorResponse) => this.formError.set(errorMessage(err)),
    });
  }

  send() {
    const text = this.comment().trim();
    if (this.courseId() === 0) {
      this.formError.set('اختار الكورس الأول.');
      return;
    }
    if (this.rating() < 1) {
      this.formError.set('اختار عدد النجوم الأول.');
      return;
    }
    if (text.length < MIN_LENGTH || text.length > MAX_LENGTH) {
      this.formError.set(`الرأي لازم يكون من ${MIN_LENGTH} لـ ${MAX_LENGTH} حرف.`);
      return;
    }

    this.sending.set(true);
    this.formError.set('');
    const editing = this.editingId();
    const request =
      editing === null
        ? this.reviewService.add(this.courseId(), text, this.rating())
        : this.reviewService.update(this.courseId(), editing, text, this.rating());
    request.subscribe({
      next: () => {
        this.sending.set(false);
        this.cancelEdit();
        this.load();
      },
      error: (err: HttpErrorResponse) => {
        this.sending.set(false);
        this.formError.set(err.status === 409 ? 'انت قيّمت الكورس ده قبل كده.' : errorMessage(err));
      },
    });
  }
}
