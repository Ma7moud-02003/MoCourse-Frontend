import { HttpErrorResponse } from '@angular/common/http';
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
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { CreateLessonRequest, Lesson, LessonType, UpdateLessonRequest } from '../../../Main/Models/lesson.model';
import { Lessons } from '../../../core/services/Services/lessons';
import { Section } from '../../../core/services/Services/section';
type FeedbackKind = 'success' | 'error';

interface Feedback {
  kind: FeedbackKind;
  message: string;
}

const ALLOWED_MIME: Record<LessonType, readonly string[]> = {
  [LessonType.VIDEO]: ['video/mp4', 'video/webm', 'video/quicktime'],
  [LessonType.PDF]: ['application/pdf'],
};

@Component({
  selector: 'app-lesson-management',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './add-lesson.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LessonManagementComponent {
  private readonly fb = inject(FormBuilder);
  private readonly lessonService = inject(Lessons);
  private readonly sectionService = inject(Section);


  readonly sectionId = input.required<number>();

  readonly LessonType = LessonType;

  // State
  readonly lessons = signal<Lesson[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly uploading = signal(false);
  readonly deleting = signal(false);

  readonly editingLesson = signal<Lesson | null>(null);
  readonly selectedFile = signal<File | null>(null);
  readonly fileError = signal<string | null>(null);

  readonly error = signal<string | null>(null);
  readonly feedback = signal<Feedback | null>(null);

  readonly modalOpen = signal(false);
  readonly lessonToDelete = signal<Lesson | null>(null);

  /** درس تم إنشاؤه لكن فشل رفع ملفه: يظل المودال مفتوحًا لإعادة الرفع */
  private readonly pendingUploadLessonId = signal<number | null>(null);

  readonly isEditing = computed(() => this.editingLesson() !== null);
  readonly modalTitle = computed(() => (this.isEditing() ? 'تعديل الدرس' : 'إضافة درس'));
  readonly busy = computed(() => this.saving() || this.uploading());

  readonly sortedLessons = computed(() =>
    [...this.lessons()].sort((a, b) => a.order - b.order),
  );

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(100)]],
    description: ['', [Validators.maxLength(500)]],
    type: [LessonType.VIDEO as LessonType, [Validators.required]],
    order: [1, [Validators.required, Validators.min(1)]],
    isPreview: [false],
    content: [''],
  });

  private feedbackTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => {
      const id = this.sectionId();
      untracked(() => this.loadLessons(id));
    });
  }

  // ===== Loading =====

  loadLessons(sectionId: number = this.sectionId()): void {
    this.loading.set(true);
    this.error.set(null);
    this.sectionService.getSectionLessons(sectionId).subscribe({
      next: (lessons) => {
        this.lessons.set(lessons as Lesson[]);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(this.messageFor(err, 'تعذر تحميل الدروس.'));
      },
    });
  }

  // ===== Modal =====

  openCreate(): void {
    this.editingLesson.set(null);
    this.pendingUploadLessonId.set(null);
    this.resetFile();
    const nextOrder = this.lessons().reduce((max, l) => Math.max(max, l.order), 0) + 1;
    this.form.reset({
      title: '',
      description: '',
      type: LessonType.VIDEO,
      order: nextOrder,
      isPreview: false,
      content: '',
    });
    this.modalOpen.set(true);
  }

  openEdit(lesson: Lesson): void {
    this.editingLesson.set(lesson);
    this.pendingUploadLessonId.set(null);
    this.resetFile();
    this.form.reset({
      title: lesson.title,
      description: lesson.description ?? '',
      type: lesson.type,
      order: lesson.order,
      isPreview: lesson.isPreview,
      content: lesson.content ?? '',
    });
    this.modalOpen.set(true);
  }

  openUploadOnly(lesson: Lesson): void {
    this.openEdit(lesson);
  }

  closeModal(): void {
    if (this.busy()) return;
    this.modalOpen.set(false);
    this.editingLesson.set(null);
    this.pendingUploadLessonId.set(null);
    this.resetFile();
  }

  // ===== File selection =====

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.item(0) ?? null;
    input.value = '';
    if (!file) return;

    const error = this.validateFile(file, this.form.controls.type.value);
    if (error) {
      this.selectedFile.set(null);
      this.fileError.set(error);
      return;
    }
    this.fileError.set(null);
    this.selectedFile.set(file);
  }

  removeFile(): void {
    this.resetFile();
  }

  onTypeChange(): void {
    const file = this.selectedFile();
    if (!file) return;
    const error = this.validateFile(file, this.form.controls.type.value);
    if (error) {
      this.selectedFile.set(null);
      this.fileError.set(error);
    }
  }

  private validateFile(file: File, type: LessonType): string | null {
    if (!ALLOWED_MIME[type].includes(file.type)) {
      return type === LessonType.VIDEO
        ? 'نوع الملف غير مناسب. اختر فيديو بصيغة MP4 أو WebM أو MOV.'
        : 'نوع الملف غير مناسب. اختر ملف PDF.';
    }
    return null;
  }

  private resetFile(): void {
    this.selectedFile.set(null);
    this.fileError.set(null);
  }

  // ===== Save =====

  save(): void {
    if (this.busy()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const file = this.selectedFile();
    if (file) {
      const error = this.validateFile(file, this.form.controls.type.value);
      if (error) {
        this.fileError.set(error);
        return;
      }
    }

    const editing = this.editingLesson();
    const pendingId = this.pendingUploadLessonId();

    if (pendingId !== null && file) {
      // إعادة رفع ملف لدرس تم إنشاؤه سابقًا
      this.upload(pendingId, file, 'تم رفع الملف بنجاح.');
      return;
    }

    if (editing) {
      this.update(editing, file);
    } else {
      this.create(file);
    }
  }

  private buildPayload(): UpdateLessonRequest {
    const v = this.form.getRawValue();
    const description = v.description.trim();
    const content = v.content.trim();
    return {
      title: v.title.trim(),
      description: description || undefined,
      type: v.type,
      order: Number(v.order),
      isPreview: v.isPreview,
      content: content || undefined,
    };
  }

  private create(file: File | null): void {
    const base = this.buildPayload();
    const payload: CreateLessonRequest = {
      title: base.title ?? '',
      description: base.description,
      type: base.type ?? LessonType.VIDEO,
      order: base.order ?? 1,
      isPreview: base.isPreview ?? false,
      content: base.content,
      sectionId: this.sectionId(),
    };

    this.saving.set(true);
    this.lessonService.createLesson(payload).subscribe({
      next: (created) => {
        this.saving.set(false);
        this.lessons.update((list:any) => [...list, created]);

        if (!file) {
          this.showFeedback('success', 'تم إنشاء الدرس بنجاح.');
          this.finishModal();
          return;
        }
        // لا نحذف الدرس لو فشل الرفع
        this.editingLesson.set(created as Lesson);
        this.pendingUploadLessonId.set(created.id);
        this.upload(created.id, file, 'تم إنشاء الدرس ورفع الملف بنجاح.', true);
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.showFeedback('error', this.messageFor(err, 'تعذر إنشاء الدرس.'));
      },
    });
  }

  private update(lesson: Lesson, file: File | null): void {
    this.saving.set(true);
    this.lessonService.updateLesson(lesson.id, this.buildPayload()).subscribe({
      next: (updated) => {
        this.saving.set(false);
        this.replaceInList(updated  as Lesson);

        if (!file) {
          this.showFeedback('success', 'تم تعديل الدرس بنجاح.');
          this.finishModal();
          return;
        }
        this.editingLesson.set(updated as Lesson);
        this.upload(updated.id, file, 'تم تعديل الدرس واستبدال الملف بنجاح.');
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.showFeedback('error', this.messageFor(err, 'تعذر تعديل الدرس.'));
      },
    });
  }

  private upload(id: number, file: File, successMessage: string, afterCreate = false): void {
    this.uploading.set(true);
    this.lessonService.uploadLessonFile(id, file).subscribe({
      next: (updated) => {
        this.uploading.set(false);
        this.replaceInList(updated as Lesson);
        this.showFeedback('success', successMessage);
        this.finishModal();
      },
      error: (err: HttpErrorResponse) => {
        this.uploading.set(false);
        this.pendingUploadLessonId.set(id);
        const base = afterCreate
          ? 'تم إنشاء الدرس، لكن فشل رفع الملف. يمكنك إعادة رفعه.'
          : 'فشل رفع الملف. يمكنك إعادة المحاولة.';
        this.showFeedback('error', `${base} ${this.detailFor(err)}`.trim());
      },
    });
  }

  private finishModal(): void {
    this.modalOpen.set(false);
    this.editingLesson.set(null);
    this.pendingUploadLessonId.set(null);
    this.resetFile();
  }

  private replaceInList(updated: Lesson): void {
    this.lessons.update((list) =>
      list.map((l) => (l.id === updated.id ? { ...l, ...updated } : l)),
    );
  }

  // ===== Delete =====

  askDelete(lesson: Lesson): void {
    this.lessonToDelete.set(lesson);
  }

  cancelDelete(): void {
    if (this.deleting()) return;
    this.lessonToDelete.set(null);
  }

  confirmDelete(): void {
    const lesson = this.lessonToDelete();
    if (!lesson || this.deleting()) return;

    this.deleting.set(true);
    this.lessonService.deleteLesson(lesson.id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.lessons.update((list) => list.filter((l) => l.id !== lesson.id));
        this.lessonToDelete.set(null);
        this.showFeedback('success', 'تم حذف الدرس بنجاح.');
      },
      error: (err: HttpErrorResponse) => {
        this.deleting.set(false);
        this.lessonToDelete.set(null);
        this.showFeedback('error', this.messageFor(err, 'تعذر حذف الدرس.'));
      },
    });
  }

  // ===== Feedback / errors =====

  dismissFeedback(): void {
    this.feedback.set(null);
  }

  private showFeedback(kind: FeedbackKind, message: string): void {
    if (this.feedbackTimer) clearTimeout(this.feedbackTimer);
    this.feedback.set({ kind, message });
    this.feedbackTimer = setTimeout(() => this.feedback.set(null), 5000);
  }

  private messageFor(err: HttpErrorResponse, fallback: string): string {
    switch (err.status) {
      case 400:
        return `بيانات غير صالحة. ${this.detailFor(err)}`.trim();
      case 401:
        return 'انتهت الجلسة. سجّل الدخول مرة أخرى.';
      case 403:
        return 'ليس لديك صلاحية لتنفيذ هذا الإجراء.';
      case 404:
        return 'العنصر المطلوب غير موجود.';
      case 500:
        return 'حدث خطأ في الخادم. حاول مرة أخرى لاحقًا.';
      case 0:
        return 'تعذر الاتصال بالخادم. تحقق من الإنترنت.';
      default:
        return fallback;
    }
  }

  private detailFor(err: HttpErrorResponse): string {
    const body: unknown = err.error;
    if (typeof body === 'object' && body !== null && 'message' in body) {
      const msg = (body as { message: unknown }).message;
      if (typeof msg === 'string') return msg;
      if (Array.isArray(msg)) return msg.filter((m): m is string => typeof m === 'string').join('، ');
    }
    return '';
  }

  // ===== Form helpers =====

  titleError(): string | null {
    const c = this.form.controls.title;
    if (!c.touched && !c.dirty) return null;
    if (c.hasError('required')) return 'عنوان الدرس مطلوب.';
    if (c.hasError('maxlength')) return 'العنوان لا يجب أن يتجاوز 100 حرف.';
    return null;
  }

  descriptionError(): string | null {
    const c = this.form.controls.description;
    if (!c.touched && !c.dirty) return null;
    if (c.hasError('maxlength')) return 'الوصف لا يجب أن يتجاوز 500 حرف.';
    return null;
  }

  typeError(): string | null {
    const c = this.form.controls.type;
    if (!c.touched) return null;
    return c.hasError('required') ? 'نوع الدرس مطلوب.' : null;
  }

  orderError(): string | null {
    const c = this.form.controls.order;
    if (!c.touched && !c.dirty) return null;
    if (c.hasError('required')) return 'ترتيب الدرس مطلوب.';
    if (c.hasError('min')) return 'الترتيب يجب أن يكون 1 على الأقل.';
    return null;
  }

  // ===== Display helpers =====

  formatDuration(seconds: number | null | undefined): string {
    if (seconds === null || seconds === undefined || seconds <= 0) return '';
    const total = Math.floor(seconds);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = String(total % 60).padStart(2, '0');
    return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
  }

  formatFileSize(bytes: number | null | undefined): string {
    if (bytes === null || bytes === undefined || bytes <= 0) return '';
    const units = ['B', 'KB', 'MB', 'GB'];
    let value = bytes;
    let i = 0;
    while (value >= 1024 && i < units.length - 1) {
      value /= 1024;
      i++;
    }
    const text = i === 0 ? String(Math.round(value)) : value.toFixed(1);
    return `${text} ${units[i]}`;
  }

  typeLabel(type: LessonType): string {
    return type === LessonType.VIDEO ? 'فيديو' : 'PDF';
  }

  hasFile(lesson: Lesson): boolean {
    return !!(lesson.videoUrl || lesson.pdfUrl);
  }

  acceptFor(type: LessonType): string {
    return ALLOWED_MIME[type].join(',');
  }

  orderLabel(order: number): string {
    return String(order).padStart(2, '0');
  }
}