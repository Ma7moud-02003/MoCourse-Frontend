import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, input, signal } from '@angular/core';
import { errorMessage } from '../../../core/error-message';
import { Review, ReviewService } from '../../../core/review.service';

const MIN_LENGTH = 5;
const MAX_LENGTH = 200;

// The reviews under a course page: what students wrote, and a form for a student who joined.
@Component({
  selector: 'app-course-reviews',
  templateUrl: './course-reviews.html',
})
export class CourseReviews implements OnInit {
  private reviews = inject(ReviewService);

  courseId = input.required<number>();
  // Only a student who joined the course may write a review.
  canWrite = input(false);

  readonly stars = [1, 2, 3, 4, 5];
  readonly maxLength = MAX_LENGTH;

  items = signal<Review[]>([]);
  loading = signal(true);
  loadError = signal(false);

  // The form
  alreadyReviewed = signal(false);
  rating = signal(0);
  comment = signal('');
  sending = signal(false);
  formError = signal('');

  ngOnInit() {
    this.loadReviews();
    if (this.canWrite()) {
      this.reviews.hasReviewed(this.courseId()).subscribe({
        next: (has) => this.alreadyReviewed.set(has),
        error: () => undefined,
      });
    }
  }

  private loadReviews() {
    this.reviews.forCourse(this.courseId()).subscribe({
      next: (list) => {
        this.items.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set(true);
        this.loading.set(false);
      },
    });
  }

  // The average of all the ratings, with one decimal ("4.5"). Empty when nobody reviewed yet.
  average(): string {
    const list = this.items();
    if (list.length === 0) return '';
    const sum = list.reduce((total, review) => total + review.rateing, 0);
    return (sum / list.length).toFixed(1);
  }

  onComment(event: Event) {
    this.comment.set((event.target as HTMLTextAreaElement).value);
  }

  send() {
    const text = this.comment().trim();
    if (this.rating() < 1) {
      this.formError.set('اختار عدد النجوم الأول.');
      return;
    }
    if (text.length < MIN_LENGTH) {
      this.formError.set(`اكتب رأيك في ${MIN_LENGTH} حروف على الأقل.`);
      return;
    }
    if (text.length > MAX_LENGTH) {
      this.formError.set(`الرأي أطول من ${MAX_LENGTH} حرف.`);
      return;
    }

    this.sending.set(true);
    this.formError.set('');
    this.reviews.add(this.courseId(), text, this.rating()).subscribe({
      next: () => {
        this.sending.set(false);
        this.alreadyReviewed.set(true);
        this.loadReviews(); // show his review in the list
      },
      error: (err: HttpErrorResponse) => {
        this.sending.set(false);
        if (err.status === 409) {
          this.alreadyReviewed.set(true); // he reviewed before
        } else if (err.status === 401) {
          this.formError.set('لازم تكون مشترك في الكورس عشان تكتب تقييم.');
        } else {
          this.formError.set(errorMessage(err));
        }
      },
    });
  }
}
