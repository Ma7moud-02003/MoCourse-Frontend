import { HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Component, computed, effect, inject, input, signal } from '@angular/core';

import { ReviewService, reviewErrorMessage } from '../../../core/services/Services/review';
import { REVIEW_RULES, Review } from '../../Models/review.model';

@Component({
  selector: 'app-course-reviews',
  templateUrl: './course-reviews.html',
})
export class CourseReviews {
  private readonly reviewService = inject(ReviewService);

  readonly rules = REVIEW_RULES;
  readonly stars = [1, 2, 3, 4, 5];

  /** the course whose reviews we show */
  courseId = input.required<number>();
  /** true only for an enrolled student (not the instructor, not a visitor) */
  canReview = input(false);

  reviews = signal<Review[]>([]);
  myReviewIds = signal<number[]>([]);
  loading = signal(true);
  loadError = signal(false);

  // form state: editingId is the review being edited, null means "writing a new one"
  rating = signal(0);
  comment = signal('');
  editingId = signal<number | null>(null);
  saving = signal(false);
  formError = signal('');

  /** the student's own review in this course's list, if any */
  myReview = computed(() => this.reviews().find((r) => this.myReviewIds().includes(r.id)) ?? null);
  /** show the form for a new review, or while editing */
  showForm = computed(() => this.canReview() && (this.editingId() !== null || !this.myReview()));
  commentLength = computed(() => this.comment().trim().length);
  average = computed(() => {
    const list = this.reviews();
    if (!list.length) return 0;
    return list.reduce((sum, r) => sum + r.rateing, 0) / list.length;
  });

  constructor() {
    // reload whenever the course or the "can review" flag changes
    effect(() => {
      this.courseId();
      this.canReview();
      this.load();
    });
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.reviewService.getCourseReviews(this.courseId()).subscribe({
      next: (list) => {
        this.reviews.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set(true);
        this.loading.set(false);
      },
    });

    if (this.canReview()) {
      this.reviewService.getMyReviewIds().subscribe({
        next: (ids) => this.myReviewIds.set(ids),
        error: () => this.myReviewIds.set([]),
      });
    } else {
      this.myReviewIds.set([]);
    }
  }

  isMine(review: Review): boolean {
    return this.myReviewIds().includes(review.id);
  }

  formatDate(value: string): string {
    return new Date(value).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  onCommentInput(event: Event): void {
    this.comment.set((event.target as HTMLTextAreaElement).value);
  }

  startEdit(review: Review): void {
    this.editingId.set(review.id);
    this.rating.set(review.rateing);
    this.comment.set(review.comment);
    this.formError.set('');
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.resetForm();
  }

  /** Checks the same rules as the backend, so most mistakes never leave the browser. */
  validate(): string {
    const { ratingMin, ratingMax, commentMin, commentMax } = this.rules;
    if (this.rating() < ratingMin || this.rating() > ratingMax) {
      return 'اختر تقييمًا من 1 إلى 5 نجوم.';
    }
    if (this.commentLength() < commentMin) {
      return `التعليق يجب ألا يقل عن ${commentMin} حروف.`;
    }
    if (this.commentLength() > commentMax) {
      return `التعليق لا يجب أن يزيد عن ${commentMax} حرف.`;
    }
    return '';
  }

  submit(): void {
    const problem = this.validate();
    if (problem) {
      this.formError.set(problem);
      return;
    }

    const input = { comment: this.comment().trim(), rateing: this.rating() };
    const editing = this.editingId();
    const request: Observable<unknown> =
      editing === null
        ? this.reviewService.addReview(this.courseId(), input)
        : this.reviewService.updateReview(this.courseId(), editing, input);

    this.saving.set(true);
    this.formError.set('');
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.editingId.set(null);
        this.resetForm();
        this.load();
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.formError.set(reviewErrorMessage(err));
        // "already reviewed" means our list was out of date: refresh it
        if (err.status === 409) this.load();
      },
    });
  }

  remove(review: Review): void {
    this.formError.set('');
    this.reviewService.deleteReview(this.courseId(), review.id).subscribe({
      next: () => {
        this.cancelEdit();
        this.load();
      },
      error: (err: HttpErrorResponse) => this.formError.set(reviewErrorMessage(err)),
    });
  }

  private resetForm(): void {
    this.rating.set(0);
    this.comment.set('');
    this.formError.set('');
  }
}
