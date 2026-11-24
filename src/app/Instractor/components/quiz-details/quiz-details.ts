import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { Exam } from '../../../core/services/Services/exam';
import { QuizDetailsResponse, QuizQuestionDetails } from '../../../Main/Models/quiz.mpdel';
import { Questions } from '../../../core/services/Services/question';



// ===== Routes: عدّلها من هنا فقط =====
// NEEDS TO BE CHANGED
const LIST_ROUTE: readonly string[] = ['/instractor/insQuizzes'];
const QUESTIONS_ROUTE = (quizId: number): (string | number)[] => [
  '/instractor/quizzes',
  quizId,
  'questions',
];

const Update_QUESTIONS_ROUTE = (quizId: number,questionId:number): (string | number)[] => [
  '/instractor/quizzes',
  quizId,
  'update-question',questionId
];

const ADD_QUESTIONS_ROUTE = (quizId: number): (string | number)[] => [
  '/instractor/quizzes',
  quizId,
  'questions'
];


const TARGET_LABELS: Readonly<Record<string, string>> = {
  course: 'اختبار الكورس',
  section: 'اختبار القسم',
  lesson: 'اختبار الدرس',
};

const TYPE_LABELS: Readonly<Record<string, string>> = {
  mcq: 'اختيار من متعدد',
};

const CHOICE_LETTERS = ['أ', 'ب', 'ج', 'د', 'هـ', 'و', 'ز', 'ح'];

const dateFormatter = new Intl.DateTimeFormat('ar-EG-u-nu-latn', { dateStyle: 'medium' });

function toId(value: string | null): number | null {
  if (value === null || value.trim() === '') return null;
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

@Component({
  selector: 'app-quiz-details',
  imports: [RouterLink],
  templateUrl: './quiz-details.html',
 
})
export class QuizDetails {
  private readonly route = inject(ActivatedRoute);
  private readonly examService = inject(Exam);
  private readonly questionService = inject(Questions);

  private readonly destroyRef = inject(DestroyRef);

  // NEEDS TO BE CHANGED: اسم الـ route param لو مش quizId
  private readonly quizId = toId(this.route.snapshot.paramMap.get('quizId'));

  readonly quiz = signal<QuizDetailsResponse | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
   openDeleting=signal<boolean>(false);
   questionId=signal<number|null>(null);

  readonly listLink = LIST_ROUTE;
  readonly skeletonRows = [1, 2];

  /** الأسئلة والاختيارات مرتبة حسب order */
  readonly questions = computed<QuizQuestionDetails[]>(() => {
    const quiz = this.quiz();
    if (!quiz) return [];
    return [...quiz.questions]
      .sort((a, b) => a.order - b.order)
      .map((q) => ({ ...q, choices: [...q.choices].sort((a, b) => a.order - b.order) }));
  });

  readonly questionsMarkSum = computed(() =>
    this.questions().reduce((sum, q) => sum + q.mark, 0),
  );

  readonly marksMismatch = computed(() => {
    const quiz = this.quiz();
    return !!quiz && this.questions().length > 0 && this.questionsMarkSum() !== quiz.totalMarks;
  });

  constructor() {
    this.loadQuiz();
  }
qi=signal<number|null>(null)
toggleDeletingCard(questionId:number,index:number){
this.questionId.set(questionId);
this.qi.set(index)
this.openDeleting.set(!this.openDeleting());
}

deleteQuestion() {
  const id = this.questionId();
  const index = this.qi();
  
  if (!id || index === null) return;

  this.questionService.deleteQuestion(id).subscribe({
    next: () => {
      // إغلاق النافذة
      this.openDeleting.set(false);
      
      // تحديث الـ Signal بطريقة صحيحة وآمنة
    this.questions().splice(index,1);
      
      // تصفير القيم
      this.questionId.set(null);
      this.qi.set(null);
    },
    error: (err) => {
      console.error('Failed to delete question', err);
    }
  });
}

  loadQuiz(): void {
    if (this.quizId === null) {
      this.loading.set(false);
      this.error.set('رقم الاختبار غير صحيح.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.examService
      .getQuizDetails(this.quizId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (quiz) => this.quiz.set(quiz),
        error: () => this.error.set('حصل خطأ أثناء تحميل تفاصيل الاختبار'),
      });
  }

  // ---------- Navigation ----------

  questionsLink(quizId: number): (string | number)[] {
    return QUESTIONS_ROUTE(quizId);
  }

  goToAddQuestion(){
    if(!this.quizId) return;
    return ADD_QUESTIONS_ROUTE(this.quizId);

  }
  // ---------- Formatting ----------

  targetLabel(target: string): string {
    return TARGET_LABELS[target.toLowerCase()] ?? 'اختبار';
  }

  typeLabel(type: string): string {
    return TYPE_LABELS[type.toLowerCase()] ?? type;
  }

  choiceLetter(index: number): string {
    return CHOICE_LETTERS[index] ?? String(index + 1);
  }

  yesNo(value: boolean): string {
    return value ? 'نعم' : 'لا';
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
  private router=inject(Router)
  goToEdite(questionId:number){
    if(this.quiz()?.isPublished){alert('لا يمكن تعديل اسئلة الامتحان بعد نشره يمكنك الغاء النشر والتعديل')}
    this.router.navigate([`/instractor/quizzes/${this.quizId}/update-question/${questionId}`])
   
    
  }
}