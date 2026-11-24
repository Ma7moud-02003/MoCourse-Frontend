import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, map, startWith } from 'rxjs';
import { QuestionType } from '../../../Main/utils/enums/question-type.enum';
import { Exam } from '../../../core/services/Services/exam';
import { Questions, UpdateChoicePayload, UpdateQuestionPayload } from '../../../core/services/Services/question';
import { CreateQuestionPayload, CreateQuestionsPayload, QuestionTypeOption } from '../../../Main/Models/add-question.model';
import { QuizDetailsResponse, QuizQuestionDetails } from '../../../Main/Models/quiz.mpdel';

// NEEDS TO BE CHANGED: import paths

type ChoiceGroup = FormGroup<{
  id: FormControl<number | null>;
  text: FormControl<string>;
  isCorrect: FormControl<boolean>;
}>;

type QuestionGroup = FormGroup<{
  question: FormControl<string>;
  type: FormControl<QuestionType>;
  mark: FormControl<number>;
  choices: FormArray<ChoiceGroup>;
}>;

const MIN_CHOICES = 2;
const CHOICE_LETTERS = ['أ', 'ب', 'ج', 'د', 'هـ', 'و', 'ز', 'ح'];

function toId(value: string | null): number | null {
  if (value === null || value.trim() === '') return null;
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

@Component({
  selector: 'app-quiz-questions-management',
  imports: [ReactiveFormsModule],
  templateUrl: './add-questions.html',
})
export class QuizQuestionsManagement {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly questionsService = inject(Questions);
  private readonly examService = inject(Exam);
  private readonly destroyRef = inject(DestroyRef);

  readonly quizId = signal<number | null>(toId(this.route.snapshot.paramMap.get('quizId')));
  readonly questionId = signal<number | null>(toId(this.route.snapshot.paramMap.get('questionId')));

  /** true when the route has :questionId */
  readonly isEdit = computed(() => this.questionId() !== null);
  /** the existing order of the question being edited (kept as is) */
  readonly editOrder = signal(1);

  readonly loadingQuestion = signal(false);
  readonly loadError = signal<string | null>(null);

  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal(false);
  readonly submitted = signal(false);

  /** true = single correct answer (radio). false = multiple correct answers. */
  readonly singleCorrectOnly = true;
  readonly minChoices = MIN_CHOICES;

  readonly typeOptions: QuestionTypeOption[] = [{ label: 'اختيار من متعدد', value: QuestionType.MCQ }];

  readonly form = new FormGroup({
    questions: new FormArray<QuestionGroup>([]),
  });

  private readonly raw = toSignal(
    this.form.valueChanges.pipe(
      map(() => this.form.getRawValue()),
      startWith(this.form.getRawValue()),
    ),
    { requireSync: true },
  );

  readonly questionCount = computed(() => this.raw().questions.length);
  readonly totalMark = computed(() =>
    this.raw().questions.reduce((sum, q) => sum + (Number(q.mark) || 0), 0),
  );

  readonly pageTitle = computed(() => (this.isEdit() ? 'تعديل السؤال' : 'أسئلة الكويز'));
  readonly pageHint = computed(() =>
    this.isEdit()
      ? 'عدّل نص السؤال والاختيارات والإجابة الصحيحة ثم احفظ.'
      : 'أضف الأسئلة والاختيارات، وحدد الإجابة الصحيحة لكل سؤال، ثم احفظ.',
  );
  readonly submitLabel = computed(() => (this.isEdit() ? 'حفظ التعديلات' : 'حفظ الأسئلة'));
  readonly savingLabel = computed(() => (this.isEdit() ? 'جاري حفظ التعديلات...' : 'جاري حفظ الأسئلة...'));
  readonly successTitle = computed(() =>
    this.isEdit() ? 'تم تحديث السؤال بنجاح' : 'تمت إضافة الأسئلة بنجاح',
  );
  readonly successText = computed(() =>
    this.isEdit() ? null : `تم حفظ ${this.questionCount()} سؤال بإجمالي ${this.totalMark()} درجة.`,
  );

  constructor() {
    const quizId = this.quizId();
    const questionId = this.questionId();

    if (questionId !== null && quizId !== null) {
      this.loadQuestionForEdit(quizId, questionId);
    } else {
      this.addQuestion();
    }
  }

  get questions(): FormArray<QuestionGroup> {
    return this.form.controls.questions;
  }

  // ---------- Edit: load + prefill ----------

  private loadQuestionForEdit(quizId: number, questionId: number): void {
    this.loadingQuestion.set(true);
    this.loadError.set(null);

    this.examService
      .getQuizDetails(quizId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loadingQuestion.set(false)),
      )
      .subscribe({
        next: (quiz: QuizDetailsResponse) => {
          const question = quiz.questions.find((q) => q.id === questionId);
          if (!question) {
            this.loadError.set('لم يتم العثور على السؤال المطلوب.');
            return;
          }
          this.fillForm(question);
        },
        error: () => this.loadError.set('حصل خطأ أثناء تحميل بيانات السؤال'),
      });
  }

  retryLoad(): void {
    const quizId = this.quizId();
    const questionId = this.questionId();
    if (quizId !== null && questionId !== null) this.loadQuestionForEdit(quizId, questionId);
  }

  private fillForm(source: QuizQuestionDetails): void {
    const group = this.createQuestion();
    group.controls.question.setValue(source.question);
    group.controls.type.setValue(this.resolveType(source.type));
    group.controls.mark.setValue(source.mark);

    group.controls.choices.clear();
    [...source.choices]
      .sort((a, b) => a.order - b.order)
      .forEach((c) => {
        const choice = this.createChoice();
        choice.controls.text.setValue(c.text);
        choice.controls.isCorrect.setValue(c.isCorrect);
        group.controls.choices.push(choice);
        choice.controls.id.setValue(c.id);

      });

    this.questions.clear();
    this.questions.push(group);
    this.editOrder.set(source.order);
  }

  private resolveType(type: string): QuestionType {
    return this.typeOptions.find((o) => o.value === type)?.value ?? QuestionType.MCQ;
  }

  
  // ---------- Builders ----------

 private createChoice(): ChoiceGroup {
  return new FormGroup({
    id: new FormControl<number | null>(null),
    text: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/\S/)],
    }),
    isCorrect: new FormControl(false, { nonNullable: true }),
  });
}
  private createQuestion(): QuestionGroup {
    return new FormGroup({
      question: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.pattern(/\S/)],
      }),
      type: new FormControl<QuestionType>(QuestionType.MCQ, { nonNullable: true }),
      mark: new FormControl(1, {
        nonNullable: true,
        validators: [Validators.required, Validators.min(1)],
      }),
      choices: new FormArray<ChoiceGroup>(
        Array.from({ length: MIN_CHOICES }, () => this.createChoice()),
      ),
    });
  }

  // ---------- Actions ----------

  addQuestion(): void {
    if (this.isEdit()) return;
    this.questions.push(this.createQuestion());
  }

  removeQuestion(index: number): void {
    if (this.isEdit()) return;
    this.questions.removeAt(index);
  }

  addChoice(question: QuestionGroup): void {
    question.controls.choices.push(this.createChoice());
  }

  removeChoice(question: QuestionGroup, index: number): void {
    const choices = question.controls.choices;
    if (choices.length <= MIN_CHOICES) return;
    choices.removeAt(index);
  }

  setCorrect(question: QuestionGroup, index: number): void {
    const choices = question.controls.choices.controls;

    if (this.singleCorrectOnly) {
      choices.forEach((c, i) => c.controls.isCorrect.setValue(i === index));
      return;
    }

    const target = choices[index].controls.isCorrect;
    target.setValue(!target.value);
  }

  // ---------- Helpers for the template ----------

  choiceLabel(index: number): string {
    return CHOICE_LETTERS[index] ?? String(index + 1);
  }

  controlError(control: AbstractControl): string | null {
    if (!control.touched && !this.submitted()) return null;
    if (control.hasError('required') || control.hasError('pattern')) return 'هذا الحقل مطلوب';
    if (control.hasError('min')) return 'الدرجة يجب ألا تقل عن 1';
    return null;
  }

  choicesError(question: QuestionGroup): string | null {
    if (!this.submitted()) return null;

    const choices = question.controls.choices.controls;
    if (choices.length < MIN_CHOICES) return 'يجب إضافة اختيارين على الأقل';
    if (!choices.some((c) => c.controls.isCorrect.value)) return 'حدد الإجابة الصحيحة';
    return null;
  }

  private hasChoicesIssue(): boolean {
    return this.questions.controls.some((q) => {
      const choices = q.controls.choices.controls;
      return choices.length < MIN_CHOICES || !choices.some((c) => c.controls.isCorrect.value);
    });
  }

  // ---------- Save (create or update) ----------

  saveQuestions(): void {
    if (this.saving()) return;

    this.submitted.set(true);
    this.form.markAllAsTouched();
    this.error.set(null);

    const quizId = this.quizId();
    if (quizId === null) {
      this.error.set('لم يتم تحديد الكويز.');
      return;
    }

    if (this.questions.length === 0) {
      this.error.set('أضف سؤالًا واحدًا على الأقل قبل الحفظ.');
      return;
    }

    if (this.form.invalid || this.hasChoicesIssue()) {
      this.error.set('راجع الحقول المطلوبة في الأسئلة.');
      return;
    }

    const built = this.buildQuestions();

    const questionId = this.questionId();
    if (questionId !== null) {
      const [first] = built;
      if (!first) return;
      this.submitUpdate(questionId, first);
      return;
    }

    this.submitCreate({ quizId, questions: built });
  }

private buildQuestions(): UpdateQuestionPayload[] {
  return this.questions.controls.map((q, qi): UpdateQuestionPayload => {
    const v = q.getRawValue();
    return {
      question: v.question.trim(),
      type: v.type,
      mark: v.mark,
      order: this.isEdit() ? this.editOrder() : qi + 1,
      choices: v.choices.map((c, ci) => {
        const choice: UpdateChoicePayload = {
          text: c.text.trim(),
          order: ci + 1,
          isCorrect: c.isCorrect,
        };
        // الـ id بيتبعت في التعديل فقط، والاختيار الجديد من غير id
        if (this.isEdit() && c.id !== null) choice.id = c.id;
        return choice;
      }),
    };
  });
}

  private submitCreate(payload: CreateQuestionsPayload): void {
    this.saving.set(true);

    this.questionsService.addQuestion(payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.success.set(true);
      },
      error: () => {
        this.saving.set(false);
        this.error.set('حدث خطأ أثناء حفظ الأسئلة، حاول مرة أخرى.');
      },
    });
  }

  private submitUpdate(questionId: number, payload: UpdateQuestionPayload): void {
    this.saving.set(true);

    this.questionsService.updateQuestion(questionId, payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.success.set(true);
      },
      error: () => {
        this.saving.set(false);
        this.error.set('حدث خطأ أثناء حفظ التعديلات، حاول مرة أخرى.');
      },
    });
  }

  // ---------- Navigation ----------

  viewQuiz(): void {
    const quizId = this.quizId();
    if (quizId === null) return;
    // NEEDS TO BE CHANGED
    void this.router.navigate(['/instractor/insQuizzes', quizId]);
  }

  backToQuizzes(): void {
    // NEEDS TO BE CHANGED
    void this.router.navigate(['/instractor/insQuizzes']);
  }
}