import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { Exam } from '../../../core/services/Services/exam';
import { InstructorQuiz } from '../../../Main/Models/quiz.mpdel';



// ===== Routes: عدّلها من هنا فقط =====
// NEEDS TO BE CHANGED
const DETAILS_ROUTE = (quizId: number): (string | number)[] => ['/instractor/insQuizzes', quizId];
const QUESTIONS_ROUTE = (quizId: number): (string | number)[] => [
  '/instractor/quizzes',
  quizId,
  'questions',
];
const EDIT_ROUTE = (quizId: number): (string | number)[] => [
  '/instractor/quizzes',
  quizId,
  'edit',
];

const TARGET_LABELS: Readonly<Record<string, string>> = {
  course: 'اختبار الكورس',
  section: 'اختبار القسم',
  lesson: 'اختبار الدرس',
};

const dateFormatter = new Intl.DateTimeFormat('ar-EG-u-nu-latn', { dateStyle: 'medium' });

@Component({
  selector: 'app-my-quizzes',
  imports: [RouterLink],
  templateUrl: './quizes.html',
  host: { '(document:keydown.escape)': 'closeDelete()' },
})
export class MyQuizzes {
  private readonly examService = inject(Exam);
  private readonly destroyRef = inject(DestroyRef);

  readonly quizzes = signal<InstructorQuiz[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);

  // delete flow
  readonly deleteTarget = signal<InstructorQuiz | null>(null);
  readonly deleting = signal(false);
  readonly deleteError = signal<string | null>(null);

  readonly skeletonRows = [1, 2, 3, 4];
  readonly count = computed(() => this.quizzes().length);

  constructor() {
    this.loadQuizzes();
  }

  loadQuizzes(): void {
    this.loading.set(true);
    this.error.set(false);

    this.examService
      .getInsExams()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (list) => this.quizzes.set(list),
        error: () => this.error.set(true),
      });
  }

  // ---------- Delete ----------

  askDelete(quiz: InstructorQuiz): void {
    this.deleteError.set(null);
    this.deleteTarget.set(quiz);
  }

  closeDelete(): void {
    if (this.deleting()) return;
    this.deleteTarget.set(null);
    this.deleteError.set(null);
  }

  confirmDelete(): void {
    const target = this.deleteTarget();
    if (!target || this.deleting()) return;

    this.deleting.set(true);
    this.deleteError.set(null);

    this.examService
      .deleteQuiz(target.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.deleting.set(false)),
      )
      .subscribe({
        next: () => {
          this.quizzes.update((list) => list.filter((q) => q.id !== target.id));
          this.deleteTarget.set(null);
        },
        error: () => this.deleteError.set('تعذر حذف الاختبار، حاول مرة أخرى.'),
      });
  }

  // ---------- Navigation ----------

  detailsLink(quizId: number): (string | number)[] {
    return DETAILS_ROUTE(quizId);
  }

  questionsLink(quizId: number): (string | number)[] {
    return QUESTIONS_ROUTE(quizId);
  }

  editLink(quizId: number): (string | number)[] {
    return EDIT_ROUTE(quizId);
  }

  // ---------- Formatting ----------

  targetLabel(target: string): string {
    return TARGET_LABELS[target.toLowerCase()] ?? 'اختبار';
  }

  formatDate(value: string | null | undefined): string | null {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : dateFormatter.format(date);
  }

  trimmed(value: string | null | undefined): string | null {
    const text = value?.trim();
    return text ? text : null;
  }
 
}