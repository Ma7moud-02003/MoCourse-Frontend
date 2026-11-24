import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { Exam } from '../../../core/services/Services/exam';
import { CreateQuizPayload, QuizResponse, QuizTargetOption, UpdateQuiz } from '../../../Main/Models/creat-exam.model';
import { QuizTargetType } from '../../../Main/utils/enums/quizTarget.enum';

// NEEDS TO BE CHANGED: مسارات الـ imports


type ExamFormField =
  | 'title'
  | 'passMark'
  | 'timeLimit'
  | 'maxAttempts'
  | 'totalMarks'
  | 'quizTarget';

const TARGET_LABELS: Readonly<Record<string, string>> = {
  course: 'اختبار الكورس',
  section: 'اختبار القسم',
  lesson: 'اختبار الدرس',
};

function toId(value: string | null): number | null {
  if (value === null || value.trim() === '') return null;
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

@Component({
  selector: 'app-creat-examenation',
  imports: [ReactiveFormsModule],
  templateUrl: './creat-exam.html',
})
export class CreatExamenation {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly examService = inject(Exam);
  private readonly destroyRef = inject(DestroyRef);

  // create mode
  readonly courseId = signal<number | null>(toId(this.route.snapshot.paramMap.get('courseId')));
  readonly sectionId = signal<number | null>(toId(this.route.snapshot.paramMap.get('sectionId')));
  readonly lessonId = signal<number | null>(toId(this.route.snapshot.paramMap.get('lessonId')));

  // edit mode (NEEDS TO BE CHANGED: اسم الـ param لو مش quizId)
  readonly quizId = signal<number | null>(toId(this.route.snapshot.paramMap.get('quizId')));
  readonly isEdit = computed(() => this.quizId() !== null);
  readonly editTarget = signal<string | null>(null);
  readonly loadingQuiz = signal(false);
  readonly loadError = signal(false);

  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly createdQuiz = signal<QuizResponse | null>(null);
  readonly updated = signal(false);

  readonly pageTitle = computed(() => (this.isEdit() ? 'تعديل الاختبار' : 'إضافة كويز جديد'));
  readonly pageHint = computed(() =>
    this.isEdit()
      ? 'عدّل بيانات الاختبار وإعداداته ثم احفظ.'
      : 'أدخل بيانات الكويز وإعداداته، وبعد الإنشاء تقدر تضيف الأسئلة.',
  );
  readonly submitLabel = computed(() => (this.isEdit() ? 'حفظ التعديلات' : 'إنشاء الكويز'));
  readonly savingLabel = computed(() => (this.isEdit() ? 'جاري الحفظ...' : 'جاري الإنشاء...'));
  readonly editTargetLabel = computed(() => {
    const target = this.editTarget();
    return target ? (TARGET_LABELS[target.toLowerCase()] ?? 'اختبار') : '';
  });

  readonly examForm = new FormGroup({
    title: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(150)],
    }),
    description: new FormControl('', { nonNullable: true }),
    instructions: new FormControl('', { nonNullable: true }),
    passMark: new FormControl<number | null>(null, [Validators.required, Validators.min(0)]),
    timeLimit: new FormControl<number | null>(null, [Validators.required, Validators.min(1)]),
    maxAttempts: new FormControl<number | null>(null, [Validators.required, Validators.min(1)]),
    totalMarks: new FormControl<number | null>(null, [Validators.required, Validators.min(1)]),
    quizTarget: new FormControl<QuizTargetType>(QuizTargetType.COURSE, {
      nonNullable: true,
      validators: [Validators.required],
    }),
    shuffleQuestions: new FormControl(false, { nonNullable: true }),
    shuffleChoices: new FormControl(false, { nonNullable: true }),
    showResultImmediately: new FormControl(false, { nonNullable: true }),
    isPublished: new FormControl(false, { nonNullable: true }),
  });

  readonly selectedTarget = toSignal(this.examForm.controls.quizTarget.valueChanges, {
    initialValue: this.examForm.controls.quizTarget.value,
  });

  private readonly allTargets: QuizTargetOption[] = [
    { name: 'على الكورس', value: QuizTargetType.COURSE },
    { name: 'على القسم', value: QuizTargetType.SECTION },
    { name: 'على الدرس', value: QuizTargetType.LESSON },
  ];

  readonly targets = computed(() =>
    this.allTargets.filter((t) => {
      if (t.value === QuizTargetType.SECTION) return this.sectionId() !== null;
      if (t.value === QuizTargetType.LESSON) return this.lessonId() !== null;
      return true;
    }),
  );

  readonly targetHint = computed(() => {
    switch (this.selectedTarget()) {
      case QuizTargetType.SECTION:
        return 'سيتم ربط الكويز بالقسم الحالي.';
      case QuizTargetType.LESSON:
        return 'سيتم ربط الكويز بالدرس الحالي.';
      default:
        return 'سيتم ربط الكويز بالكورس كاملًا.';
    }
  });

  constructor() {
    const quizId = this.quizId();
    if (quizId !== null) {
      // الارتباط بالكورس/القسم/الدرس لا يتغير في التعديل
      this.examForm.controls.quizTarget.disable();
      this.loadQuizForEdit(quizId);
    }
  }

  // ---------- Edit: prefill ----------

  private loadQuizForEdit(quizId: number): void {
    this.loadingQuiz.set(true);
    this.loadError.set(false);

    this.examService
      .getQuizDetails(quizId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loadingQuiz.set(false)),
      )
      .subscribe({
        next: (quiz) => {
          this.examForm.patchValue({
            title: quiz.title,
            description: quiz.description ?? '',
            instructions: quiz.instructions ?? '',
            passMark: quiz.passMark,
            timeLimit: quiz.timeLimit,
            maxAttempts: quiz.maxAttempts,
            totalMarks: quiz.totalMarks,
            shuffleQuestions: quiz.shuffleQuestions,
            shuffleChoices: quiz.shuffleChoices,
            showResultImmediately: quiz.showResultImmediately,
            isPublished: quiz.isPublished,
          });
          this.editTarget.set(quiz.quizTarget);
        },
        error: () => this.loadError.set(true),
      });
  }

  retryLoad(): void {
    const quizId = this.quizId();
    if (quizId !== null) this.loadQuizForEdit(quizId);
  }

  // ---------- Validation message ----------

  errorOf(field: ExamFormField): string | null {
    const control = this.examForm.controls[field];
    if (!control.touched || !control.errors) return null;

    if (control.errors['required']) return 'هذا الحقل مطلوب';
    if (control.errors['maxLength'] || control.errors['maxlength']) return 'الحد الأقصى 150 حرف';
    if (control.errors['min']) {
      const min = (control.errors['min'] as { min: number }).min;
      return `القيمة يجب ألا تقل عن ${min}`;
    }
    return 'قيمة غير صحيحة';
  }

  // ---------- Submit ----------

  creatExam(): void {
    if (this.saving()) return;

    this.examForm.markAllAsTouched();
    this.error.set(null);

    const v = this.examForm.getRawValue();

    if (
      this.examForm.invalid ||
      v.passMark === null ||
      v.timeLimit === null ||
      v.maxAttempts === null ||
      v.totalMarks === null
    ) {
      return;
    }

    const common: UpdateQuiz = {
      title: v.title.trim(),
      description: v.description.trim() || undefined,
      instructions: v.instructions.trim() || undefined,
      passMark: v.passMark,
      timeLimit: v.timeLimit,
      maxAttempts: v.maxAttempts,
      totalMarks: v.totalMarks,
      shuffleQuestions: v.shuffleQuestions,
      shuffleChoices: v.shuffleChoices,
      showResultImmediately: v.showResultImmediately,
      isPublished: v.isPublished,
    };

    const quizId = this.quizId();
    if (quizId !== null) {
      this.submitUpdate(common, quizId);
      return;
    }

    const courseId = this.courseId();
    if (courseId === null) {
      this.error.set('لم يتم تحديد الكورس.');
      return;
    }

    const payload: CreateQuizPayload = { ...common, quizTarget: v.quizTarget, courseId };

    // الـ backend بيرفض أي id زيادة عن الـ target
    if (v.quizTarget === QuizTargetType.SECTION) {
      const sectionId = this.sectionId();
      if (sectionId === null) return;
      payload.sectionId = sectionId;
    }

    if (v.quizTarget === QuizTargetType.LESSON) {
      const lessonId = this.lessonId();
      if (lessonId === null) return;
      payload.lessonId = lessonId;
    }

    this.saving.set(true);

    this.examService.addExam(payload).subscribe({
      next: (quiz) => {
        this.createdQuiz.set(quiz);
        this.saving.set(false);
      },
      error: () => {
        this.error.set('حدث خطأ أثناء إنشاء الكويز، حاول مرة أخرى.');
        this.saving.set(false);
      },
    });
  }

  private submitUpdate(payload: UpdateQuiz, quizId: number): void {
    this.saving.set(true);

    this.examService.updateQuiz(payload, quizId).subscribe({
      next: () => {
        this.updated.set(true);
        this.saving.set(false);
      },
      error: () => {
        this.error.set('حدث خطأ أثناء حفظ التعديلات، حاول مرة أخرى.');
        this.saving.set(false);
      },
    });
  }

  // ---------- Navigation ----------

  addQuestions(): void {
    const quiz = this.createdQuiz();
    if (!quiz) return;
    // NEEDS TO BE CHANGED
    void this.router.navigate(['/instractor/quizzes', quiz.id, 'questions']);
  }

  backToQuizzes(): void {
    // NEEDS TO BE CHANGED
    void this.router.navigate(['/instractor/insQuizzes']);
  }
}