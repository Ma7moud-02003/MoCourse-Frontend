import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { errorMessage } from '../../core/error-message';
import { isFinishedResult, Quiz, QuizQuestion, QuizResult, QuizService } from '../../core/quiz.service';
import { AppFooter } from '../../layout/app-footer/app-footer';
import { AppHeader } from '../../layout/app-header/app-header';

// Taking one exam: one question at a time, an answer saved as soon as it is picked,
// then the score at the end.
@Component({
  selector: 'app-quiz-page',
  imports: [RouterLink, AppHeader, AppFooter],
  templateUrl: './quiz-page.html',
})
export class QuizPage implements OnInit {
  private route = inject(ActivatedRoute);
  private quizzes = inject(QuizService);

  // where we came from, for the "back to the course" link
  courseId = 0;

  loading = signal(true);
  errorText = signal('');

  // The exam itself (title, marks, time limit). It comes from the course's exam list,
  // so the page can show what he is answering. Missing only if that list cannot be read.
  quiz = signal<Quiz | null>(null);

  attemptId = signal<number | null>(null);
  questions = signal<QuizQuestion[]>([]);
  // the choice the student picked for each question: questionId -> choiceId
  picked = signal<Record<number, number>>({});
  current = signal(0); // which question is on screen
  saving = signal(false);
  submitting = signal(false);
  result = signal<QuizResult | null>(null);

  ngOnInit() {
    this.courseId = Number(this.route.snapshot.paramMap.get('courseId'));
    const quizId = Number(this.route.snapshot.paramMap.get('quizId'));

    if (!quizId) {
      this.loading.set(false);
      this.errorText.set('الامتحان مش موجود.');
      return;
    }

    // The exam details for the top of the page (the start call does not send them).
    this.loadQuizInfo(this.courseId, quizId);

    // Starting also tells us whether he already has an attempt: open (continue it)
    // or finished (show the score straight away).
    this.quizzes.start(quizId).subscribe({
      next: (answer) => {
        // He already finished this exam: the backend sends the score itself.
        if (isFinishedResult(answer)) {
          this.result.set(answer);
          this.loading.set(false);
          return;
        }
        this.attemptId.set(answer.attemptId);
        this.loadAnswers(answer.answers ?? []);
        this.loadQuestions(answer.attemptId);
      },
      error: (err: HttpErrorResponse) => this.showStartError(err),
    });
  }

  // The title, marks and time limit of this exam, from the course's exam list.
  // If it cannot be read we still show the exam, just without that header.
  private loadQuizInfo(courseId: number, quizId: number) {
    this.quizzes.courseQuizzes(courseId).subscribe({
      next: (list) => this.quiz.set(list.find((item) => item.id === quizId) ?? null),
      error: () => this.quiz.set(null),
    });
  }

  private loadQuestions(attemptId: number) {
    this.quizzes.questions(attemptId).subscribe({
      next: (data) => {
        this.questions.set(data.questions);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.errorText.set(errorMessage(err));
      },
    });
  }

  // Answers he saved before (when an attempt was resumed) are already chosen.
  private loadAnswers(answers: { questionId: number; choiceId: number }[]) {
    const map: Record<number, number> = {};
    for (const answer of answers) map[answer.questionId] = answer.choiceId;
    this.picked.set(map);
  }

  private showStartError(err: HttpErrorResponse) {
    this.loading.set(false);

    // An exam he already finished answers 409, but the answer still carries the score.
    const body = err.error as { result?: QuizResult } | null;
    if (err.status === 409 && body?.result) {
      this.result.set(body.result);
      return;
    }

    if (err.status === 403) {
      this.errorText.set('الامتحان ده للطلبة المشتركين في الكورس. اشترك الأول وبعدها تقدر تدخله.');
    } else if (err.status === 409) {
      this.errorText.set('الامتحان مش مفتوح دلوقتي. اسأل المدرّس عن ميعاده.');
    } else {
      this.errorText.set(errorMessage(err));
    }
  }

  // Picking a choice saves it right away, so a refresh does not lose the answer.
  choose(question: QuizQuestion, choiceId: number) {
    const attemptId = this.attemptId();
    if (!attemptId) return;

    this.picked.update((all) => ({ ...all, [question.id]: choiceId }));
    this.saving.set(true);
    this.quizzes.saveAnswer(attemptId, question.id, choiceId).subscribe({
      next: () => this.saving.set(false),
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        // The exam window closed while he was answering: the backend closes the attempt
        // and grades what he saved, so we show that score instead of losing it.
        const body = err.error as { result?: QuizResult } | null;
        if (err.status === 409 && body?.result) {
          this.result.set(body.result);
          return;
        }
        this.errorText.set(errorMessage(err));
      },
    });
  }

  pickedChoice(questionId: number): number | null {
    return this.picked()[questionId] ?? null;
  }

  answeredCount(): number {
    return Object.keys(this.picked()).length;
  }

  next() {
    if (this.current() < this.questions().length - 1) this.current.update((i) => i + 1);
  }

  previous() {
    if (this.current() > 0) this.current.update((i) => i - 1);
  }

  // Hand the exam in. The backend grades it and sends the score back.
  submit() {
    const attemptId = this.attemptId();
    if (!attemptId) return;

    this.submitting.set(true);
    this.quizzes.submit(attemptId).subscribe({
      next: (result) => {
        this.result.set(result);
        this.submitting.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        this.errorText.set(errorMessage(err));
      },
    });
  }

  // A friendly line for the score card: "نجحت" or "لسه محتاج درجة أعلى".
  passedText(result: QuizResult): string {
    return result.passed ? 'مبروك، نجحت في الامتحان.' : 'لسه محتاج درجة أعلى، جرّب تراجع الدرس وتاني مرة.';
  }
}
