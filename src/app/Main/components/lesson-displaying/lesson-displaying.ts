import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { LessonDisplaying } from '../../services/lesson-displaying';
import { LessonDetails } from '../../Models/lesson-playing.model';

// TODO: عدّل المسارات حسب مشروعك (الموجود بالفعل، لا تنشئ نسخة جديدة)


type ViewState = 'loading' | 'ready' | 'error' | 'forbidden';

@Component({
  selector: 'app-lesson-viewer',
  standalone: true,
  templateUrl: './lesson-displaying.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LessonViewer {
  private readonly lessonDisplayingService = inject(LessonDisplaying);
  private readonly router = inject(Router);

  // Inputs
  readonly lessonId = input<number | null>(null);
  readonly courseId = input<number | null>(null);
  /** لو الـ parent يعرف حالة الاشتراك مرّرها هنا فلا يتم عمل request إضافي */
  readonly isEnrolled = input<boolean | null>(null);

  // State
  readonly state = signal<ViewState>('loading');
  readonly lesson = signal<LessonDetails | null>(null);
  private readonly fetchedEnrollment = signal<boolean | null>(null);
  private readonly reloadTick = signal(0);
  private enrollmentCourseId: number | null = null;

  private readonly enrolled = computed(
    () => this.isEnrolled() ?? this.fetchedEnrollment(),
  );

  /** UI فقط — الحماية الحقيقية في الـ backend */
  readonly isLocked = computed(() => {
    if (this.state() === 'forbidden') return true;
    const lesson = this.lesson();
    return !!lesson && !lesson.isPreview && this.enrolled() === false;
  });

  readonly durationLabel = computed(() => this.formatDuration(this.lesson()?.duration ?? 0));

  readonly typeLabel = computed(() => {
    switch (this.lesson()?.type) {
      case 'video':
        return 'فيديو';
      case 'pdf':
        return 'PDF';
      default:
        return 'درس';
    }
  });

  /** Cloudinary: fl_attachment يجبر المتصفح على التحميل بدل الفتح */
  readonly pdfDownloadUrl = computed(() =>
    this.lesson()?.pdfUrl?.replace('/upload/', '/upload/fl_attachment/') ?? null,
  );

  constructor() {
    // تحميل الدرس عند تغيّر lessonId أو الضغط على "إعادة المحاولة"
    effect((onCleanup) => {
      const id = this.lessonId();
      this.reloadTick();
      if (id === null) return;

      untracked(() => {
        this.state.set('loading');
        this.lesson.set(null);
      });

      const sub = this.lessonDisplayingService.getLessonById(id).subscribe({
        next: (lesson) => {
          console.log('Fetched lesson:', lesson);
          this.lesson.set(lesson);
          this.state.set('ready');
        },
        error: (err: HttpErrorResponse) => {
          this.state.set(err.status === 403 || err.status === 401 ? 'forbidden' : 'error');
        },
      });
      onCleanup(() => sub.unsubscribe());
    });

    // حالة الاشتراك: مرة واحدة لكل كورس، وفقط لو الـ parent لم يمررها
    effect(() => {
      const courseId = this.courseId();
      if (this.isEnrolled() !== null || courseId === null) return;
      if (courseId === this.enrollmentCourseId) return;
      this.enrollmentCourseId = courseId;

      this.lessonDisplayingService.isEnrolled(courseId).subscribe({
        // TODO: عدّل اسم الحقل حسب EnrollmentStatus الفعلي
        next: (status) => this.fetchedEnrollment.set(status.isEnrolled),
        error: () => this.fetchedEnrollment.set(null),
      });
    });
  }

  retry(): void {
    this.reloadTick.update((n) => n + 1);
  }

  goToEnroll(): void {
    // TODO: استبدل بالـ route الموجود فعليًا للاشتراك/تفاصيل الكورس
    this.router.navigate(['/courses', this.courseId()]);
  }

  formatDuration(seconds: number): string {
    const total = Math.max(0, Math.floor(seconds));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const ss = String(s).padStart(2, '0');
    return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
  }
}