import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CourseService } from '../../core/course.service';
import { errorMessage } from '../../core/error-message';
import { ExamQuestion, ExamService, QuestionKind, TeacherExam } from '../../core/exam.service';
import { AppFooter } from '../../layout/app-footer/app-footer';
import { AppHeader } from '../../layout/app-header/app-header';

// The teacher makes an exam for his course in three steps:
// 1. create the exam (title, pass mark, when it opens and closes)
// 2. add its questions
// 3. publish it, so students can see it
@Component({
  selector: 'app-course-exams',
  imports: [RouterLink, AppHeader, AppFooter],
  templateUrl: './course-exams.html',
})
export class CourseExams implements OnInit {
  private route = inject(ActivatedRoute);
  private exams = inject(ExamService);
  private courses = inject(CourseService);

  courseId = 0;
  courseTitle = signal('');
  list = signal<TeacherExam[]>([]);
  loading = signal(true);
  loadFailed = signal(false);

  // new exam
  title = signal('');
  description = signal('');
  passMark = signal('50');
  timeLimit = signal(''); // minutes for each student; empty = the whole open window
  opensAt = signal(''); // what the date field gives us, like 2026-12-01T09:00
  closesAt = signal('');
  examError = signal('');
  creating = signal(false);

  // the exam whose questions are open on the page
  openExam = signal<TeacherExam | null>(null);
  questions = signal<ExamQuestion[]>([]);
  publishError = signal('');
  publishing = signal(false);

  // new question
  kind = signal<QuestionKind>('mcq');
  questionText = signal('');
  mark = signal('1');
  choiceTexts = signal<string[]>(['', '', '', '']);
  correct = signal(0); // the position of the right answer
  questionError = signal('');
  savingQuestion = signal(false);

  ngOnInit() {
    this.courseId = Number(this.route.snapshot.paramMap.get('id'));
    this.courses.details(this.courseId).subscribe({
      next: (course) => this.courseTitle.set(course.title),
      error: () => this.courseTitle.set(''),
    });
    this.loadExams();
  }

  private loadExams() {
    this.exams.forCourse(this.courseId).subscribe({
      next: (exams) => {
        this.list.set(exams);
        this.loading.set(false);
        // coming from the exams list: open the exam he picked
        const wanted = Number(this.route.snapshot.queryParamMap.get('exam'));
        const exam = exams.find((item) => item.id === wanted);
        if (exam && !this.openExam()) this.showQuestions(exam);
      },
      error: () => {
        this.loading.set(false);
        this.loadFailed.set(true);
      },
    });
  }

  // "2026-12-01T09:00" is read as the browser's local time and sent as a full UTC time.
  private toIso(local: string): string {
    return new Date(local).toISOString();
  }

  // Shows an exam time in Arabic, in the user's local time.
  when(iso: string): string {
    return new Date(iso).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' });
  }

  // ----- step 1: the exam -----

  createExam() {
    const title = this.title().trim();
    const passMark = Number(this.passMark());
    if (title.length < 3 || title.length > 150) {
      this.examError.set('اسم الامتحان لازم يكون بين 3 و150 حرف.');
      return;
    }
    if (this.passMark() === '' || passMark < 0 || passMark > 100) {
      this.examError.set('درجة النجاح لازم تكون بين 0 و100.');
      return;
    }
    const minutes = Number(this.timeLimit());
    if (this.timeLimit() !== '' && (!Number.isInteger(minutes) || minutes < 1)) {
      this.examError.set('مدة الامتحان لازم تكون عدد دقايق صحيح من 1 فوق، أو سيبها فاضية.');
      return;
    }
    if (!this.opensAt() || !this.closesAt()) {
      this.examError.set('حدد وقت فتح الامتحان ووقت قفله.');
      return;
    }
    const opens = new Date(this.opensAt());
    const closes = new Date(this.closesAt());
    if (closes <= opens) {
      this.examError.set('وقت القفل لازم يكون بعد وقت الفتح.');
      return;
    }
    if (closes <= new Date()) {
      this.examError.set('وقت القفل لازم يكون في المستقبل.');
      return;
    }

    this.examError.set('');
    this.creating.set(true);
    this.exams
      .create({
        title,
        description: this.description().trim(),
        passMark,
        opensAt: this.toIso(this.opensAt()),
        closesAt: this.toIso(this.closesAt()),
        courseId: this.courseId,
        timeLimit: this.timeLimit() === '' ? undefined : minutes,
      })
      .subscribe({
        next: (exam) => {
          this.creating.set(false);
          this.title.set('');
          this.description.set('');
          this.opensAt.set('');
          this.closesAt.set('');
          this.timeLimit.set('');
          this.loadExams();
          // open it straight away, the next thing he does is add questions
          this.showQuestions({ ...exam, course: { id: this.courseId, title: this.courseTitle() } });
        },
        error: (err: HttpErrorResponse) => {
          this.creating.set(false);
          this.examError.set(this.saveError(err));
        },
      });
  }

  // ----- step 2: the questions -----

  showQuestions(exam: TeacherExam) {
    this.openExam.set(exam);
    this.questions.set([]);
    this.publishError.set('');
    this.resetQuestionForm();
    this.loadQuestions();
  }

  private loadQuestions() {
    const exam = this.openExam();
    if (!exam) return;
    this.exams.questions(exam.id).subscribe({
      next: (list) => this.questions.set(list),
      error: () => this.questions.set([]),
    });
  }

  private resetQuestionForm() {
    this.kind.set('mcq');
    this.questionText.set('');
    this.mark.set('1');
    this.choiceTexts.set(['', '', '', '']);
    this.correct.set(0);
    this.questionError.set('');
  }

  chooseKind(kind: QuestionKind) {
    this.kind.set(kind);
    this.correct.set(0);
    this.questionError.set('');
  }

  setChoice(index: number, text: string) {
    this.choiceTexts.update((list) => list.map((old, i) => (i === index ? text : old)));
  }

  addQuestion() {
    const exam = this.openExam();
    if (!exam) return;

    const text = this.questionText().trim();
    const mark = Number(this.mark());
    if (!text) {
      this.questionError.set('اكتب نص السؤال.');
      return;
    }
    if (!Number.isInteger(mark) || mark < 1) {
      this.questionError.set('درجة السؤال لازم تكون رقم صحيح من 1 فوق.');
      return;
    }

    // a true/false question always has the same two answers
    const texts = this.kind() === 'true_false' ? ['صح', 'غلط'] : this.choiceTexts();
    // for a multiple choice question we ignore the empty boxes
    const filled = texts
      .map((choice, index) => ({ text: choice.trim(), index }))
      .filter((choice) => choice.text !== '');
    if (this.kind() === 'mcq' && filled.length < 2) {
      this.questionError.set('اكتب اختيارين على الأقل.');
      return;
    }
    if (!filled.some((choice) => choice.index === this.correct())) {
      this.questionError.set('اختار الإجابة الصح من الاختيارات المكتوبة.');
      return;
    }

    this.questionError.set('');
    this.savingQuestion.set(true);
    this.exams
      .addQuestion(exam.id, {
        question: text,
        type: this.kind(),
        mark,
        order: this.questions().length + 1,
        choices: filled.map((choice, position) => ({
          text: choice.text,
          isCorrect: choice.index === this.correct(),
          order: position + 1,
        })),
      })
      .subscribe({
        next: () => {
          this.savingQuestion.set(false);
          this.resetQuestionForm();
          this.loadQuestions();
          this.loadExams(); // the total marks changed
        },
        error: (err: HttpErrorResponse) => {
          this.savingQuestion.set(false);
          this.questionError.set(this.saveError(err));
        },
      });
  }

  // Remove one question of a draft exam.
  removeQuestion(question: ExamQuestion) {
    this.exams.deleteQuestion(question.id).subscribe({
      next: () => {
        this.loadQuestions();
        this.loadExams(); // the total marks changed
      },
      error: (err: HttpErrorResponse) => this.questionError.set(this.saveError(err)),
    });
  }

  // Change the minutes of a draft exam. The backend refuses once a student started it.
  newLimit = signal('');
  limitError = signal('');

  saveTimeLimit() {
    const exam = this.openExam();
    const minutes = Number(this.newLimit());
    if (!exam) return;
    if (!Number.isInteger(minutes) || minutes < 1) {
      this.limitError.set('اكتب عدد دقايق صحيح من 1 فوق.');
      return;
    }
    this.limitError.set('');
    this.exams.setTimeLimit(exam.id, minutes).subscribe({
      next: (saved) => {
        this.openExam.set({ ...exam, timeLimit: saved.timeLimit });
        this.newLimit.set('');
        this.loadExams();
      },
      error: (err: HttpErrorResponse) => this.limitError.set(this.saveError(err)),
    });
  }

  // ----- step 3: publish -----

  publish() {
    const exam = this.openExam();
    if (!exam) return;
    if (this.questions().length === 0) {
      this.publishError.set('ضيف سؤال واحد على الأقل قبل ما تنشر الامتحان.');
      return;
    }
    this.publishError.set('');
    this.publishing.set(true);
    this.exams.publish(exam.id).subscribe({
      next: () => {
        this.publishing.set(false);
        this.openExam.set({ ...exam, isPublished: true });
        this.loadExams();
      },
      error: (err: HttpErrorResponse) => {
        this.publishing.set(false);
        this.publishError.set(this.saveError(err));
      },
    });
  }

  private saveError(err: HttpErrorResponse): string {
    if (err.status === 403) return 'الكورس ده مش بتاعك، مينفعش تعدّل فيه.';
    if (err.status === 409) return 'في طلاب بدأوا الامتحان، فمينفعش يتعدّل.';
    return errorMessage(err);
  }
}
