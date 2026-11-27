import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { CourseDetails, CourseService } from '../../core/course.service';
import { CurriculumService, Lesson, Section } from '../../core/curriculum.service';
import { finalPrice, hasDiscount, lessonTime, priceText } from '../../core/course-display';
import { errorMessage } from '../../core/error-message';
import { Quiz, QuizService } from '../../core/quiz.service';
import { AppFooter } from '../../layout/app-footer/app-footer';
import { AppHeader } from '../../layout/app-header/app-header';
import { CourseEnroll } from './course-enroll/course-enroll';

// One course page: what the course is about, who teaches it, and its content
// (sections, and the lessons inside each section).
@Component({
  selector: 'app-course-details',
  imports: [RouterLink, AppHeader, AppFooter, CourseEnroll],
  templateUrl: './course-details.html',
})
export class CourseDetailsPage implements OnInit {
  private route = inject(ActivatedRoute);
  private courseService = inject(CourseService);
  private curriculum = inject(CurriculumService);
  private quizService = inject(QuizService);
  private auth = inject(AuthService);

  // helpers the template uses to show a price and a lesson length
  readonly priceText = priceText;
  readonly finalPrice = finalPrice;
  readonly hasDiscount = hasDiscount;
  readonly lessonTime = lessonTime;

  course = signal<CourseDetails | null>(null);
  sections = signal<Section[]>([]);

  loading = signal(true);
  error = signal('');
  notFound = signal(false);

  // Which section is open right now, and the lessons we already downloaded for each section.
  // We download a section's lessons the first time it is opened, not all of them at once.
  openSection = signal<number | null>(null);
  lessons = signal<Record<number, Lesson[]>>({});
  lessonsLoading = signal<number | null>(null);

  // The exams of this course, shown under its content.
  quizzes = signal<Quiz[]>([]);
  quizzesLoading = signal(true);
  quizzesNote = signal(''); // one clear line when the list cannot be shown

  ngOnInit() {
    this.load();
  }

  load() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.notFound.set(true);
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.courseService.details(id).subscribe({
      next: (course) => {
        this.course.set(course);
        this.loading.set(false);
        this.loadSections(id);
        this.loadQuizzes(id);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        // 404 means the course is a draft, or it does not exist at all
        if (err.status === 404) {
          this.notFound.set(true);
          return;
        }
        this.error.set(errorMessage(err));
      },
    });
  }

  // The sections of the course. If this fails we still show the rest of the page.
  private loadSections(courseId: number) {
    this.curriculum.sections(courseId).subscribe({
      next: (page) => {
        this.sections.set(page.data);
        // open the first section, so the page does not look empty
        if (page.data.length > 0) this.toggleSection(page.data[0]);
      },
      error: () => this.sections.set([]),
    });
  }

  // Clicking a section title opens or closes it (like a folder).
  toggleSection(section: Section) {
    if (this.openSection() === section.id) {
      this.openSection.set(null);
      return;
    }

    this.openSection.set(section.id);

    // already downloaded before? then just show it
    if (this.lessons()[section.id]) return;

    this.lessonsLoading.set(section.id);
    this.curriculum.lessons(section.id).subscribe({
      next: (list) => {
        this.lessons.update((all) => ({ ...all, [section.id]: list }));
        this.lessonsLoading.set(null);
      },
      error: () => this.lessonsLoading.set(null),
    });
  }

  // The exams of this course. A student who is not enrolled gets a 403 from the
  // backend, and we say that in one plain line instead of an empty box.
  loadQuizzes(courseId: number) {
    this.quizzesLoading.set(true);
    this.quizzesNote.set('');
    this.quizService.courseQuizzes(courseId).subscribe({
      next: (list) => {
        this.quizzes.set(list);
        this.quizzesLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.quizzesLoading.set(false);
        this.quizzesNote.set(
          err.status === 403
            ? 'الامتحانات بتظهر بعد ما تشترك في الكورس.'
            : 'مش عارفين نجيب امتحانات الكورس دلوقتي.',
        );
      },
    });
  }

  // The join card is only for a student who is not in the course yet.
  canJoin(): boolean {
    const course = this.course();
    return this.auth.role() === 'student' && !!course && !course.isEnrolled && !course.canAccess;
  }

  lessonsOf(section: Section): Lesson[] {
    return this.lessons()[section.id] ?? [];
  }

  // A lesson the student can watch before joining, or one he can watch because he joined.
  canPlay(lesson: Lesson): boolean {
    const course = this.course();
    return lesson.isPreview || !!course?.isEnrolled || !!course?.canAccess;
  }
}
