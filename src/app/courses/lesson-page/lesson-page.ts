import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CurriculumService, Lesson, Section } from '../../core/curriculum.service';
import { lessonTime } from '../../core/course-display';
import { errorMessage } from '../../core/error-message';
import { LessonDetails, LessonService } from '../../core/lesson.service';
import { Quiz, QuizService } from '../../core/quiz.service';
import { CourseProgress, ProgressService } from '../../core/progress.service';
import { AppFooter } from '../../layout/app-footer/app-footer';
import { AppHeader } from '../../layout/app-header/app-header';

// One section of the course with the lessons inside it, for the outline beside the lesson.
interface OutlineGroup {
  section: Section;
  lessons: Lesson[];
}

// One lesson, opened from the course page: the video, the file, or the written text.
@Component({
  selector: 'app-lesson-page',
  imports: [RouterLink, AppHeader, AppFooter],
  templateUrl: './lesson-page.html',
})
export class LessonPage implements OnInit {
  private route = inject(ActivatedRoute);
  private lessons = inject(LessonService);
  private curriculum = inject(CurriculumService);
  private progress = inject(ProgressService);
  private quizService = inject(QuizService);

  lesson = signal<LessonDetails | null>(null);
  loading = signal(true);
  errorText = signal('');

  // The course we came from, so the "back to the course" link works.
  courseId = 0;
  lessonId = 0;

  // The course outline beside the lesson, and the lesson before and after this one.
  outline = signal<OutlineGroup[]>([]);
  previousLesson = computed(() => this.neighbour(-1));
  nextLesson = computed(() => this.neighbour(1));
  private allLessons = computed(() => this.outline().flatMap((group) => group.lessons));

  // The ids of the lessons he finished (for the check marks in the outline),
  // and the exams of the course (they need him to be enrolled, so they may stay empty).
  doneIds = signal<number[]>([]);
  quizzes = signal<Quiz[]>([]);

  // Progress. It stays empty for a lesson he cannot track (a preview before he joins).
  done = signal(false);
  courseProgress = signal<CourseProgress | null>(null);
  savingDone = signal(false);
  private startAt = 0; // the second to open the video at
  private lastSaved = 0; // when we last sent the video position (ms)

  // helpers the template uses
  readonly lessonTime = lessonTime;

  ngOnInit() {
    this.courseId = Number(this.route.snapshot.paramMap.get('courseId'));
    const id = Number(this.route.snapshot.paramMap.get('lessonId'));
    this.lessonId = id;

    if (!id) {
      this.loading.set(false);
      this.errorText.set('الدرس مش موجود.');
      return;
    }

    this.lessons.get(id).subscribe({
      next: (lesson) => {
        this.lesson.set(lesson);
        this.loading.set(false);
        this.loadOutline(this.courseId);
        this.loadProgress();
        this.loadQuizzes();
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        // 401 means the lesson is real but needs a subscription (the backend says so).
        if (err.status === 401) {
          this.errorText.set(
            'الدرس ده جزء من كورس مدفوع. اشترك في الكورس الأول وبعدها تقدر تفتحه.',
          );
        } else if (err.status === 404) {
          this.errorText.set('الدرس مش موجود أو مش متاح لك.');
        } else {
          this.errorText.set(errorMessage(err));
        }
      },
    });
  }

  // What he finished so far: this lesson, and the whole course.
  private loadProgress() {
    this.progress.lesson(this.lessonId).subscribe({
      next: (p) => {
        this.done.set(p.completed);
        // A finished video starts from the beginning. An unfinished one continues where he stopped.
        this.startAt = p.completed ? 0 : p.lastPosition;
      },
      // 401 here just means he is not enrolled, so there is nothing to track
      error: () => undefined,
    });
    this.refreshCourseProgress();
  }

  private loadQuizzes() {
    this.quizService.courseQuizzes(this.courseId).subscribe({
      next: (list) => this.quizzes.set(list),
      error: () => this.quizzes.set([]),
    });
  }

  // How many lessons of one section he finished, like "2/6".
  sectionDone(group: OutlineGroup): number {
    return group.lessons.filter((lesson) => this.doneIds().includes(lesson.id)).length;
  }

  private refreshCourseProgress() {
    this.progress.course(this.courseId).subscribe({
      next: (p) => this.courseProgress.set(p),
      error: () => this.courseProgress.set(null),
    });
  }

  // The video is ready: jump to the second he stopped at.
  onVideoReady(video: HTMLVideoElement) {
    if (this.startAt > 5 && this.startAt < video.duration - 5) video.currentTime = this.startAt;
  }

  // Send the video position. While playing we send it every 15 seconds; on pause or end, at once.
  saveVideo(video: HTMLVideoElement, now: boolean) {
    if (!now && Date.now() - this.lastSaved < 15000) return;
    if (video.currentTime < 1) return;
    this.lastSaved = Date.now();
    this.progress.save(this.lessonId, video.currentTime).subscribe({
      next: (p) => this.markDone(p.completed),
      error: () => undefined,
    });
  }

  // A PDF or a written lesson: the student tells us he finished it.
  finishLesson() {
    this.savingDone.set(true);
    this.progress.save(this.lessonId, 0, true).subscribe({
      next: (p) => {
        this.savingDone.set(false);
        this.markDone(p.completed);
      },
      error: () => this.savingDone.set(false),
    });
  }

  // Only refresh the course bar when this lesson just turned done.
  private markDone(completed: boolean) {
    if (completed && !this.done()) {
      this.done.set(true);
      this.doneIds.update((ids) => [...ids, this.lessonId]);
      this.refreshCourseProgress();
    }
  }

  // The outline beside the lesson: the sections of the course and the lessons inside each one.
  // It also tells us which lesson comes next, so the page can offer it at the bottom.
  private loadOutline(courseId: number) {
    this.curriculum.sections(courseId).subscribe({
      next: (page) => {
        // we start with every section and fill in its lessons as they arrive,
        // so the outline stays in the same order as the course
        this.outline.set(page.data.map((section) => ({ section, lessons: [] })));
        for (const section of page.data) this.loadLessons(section);
      },
      error: () => this.outline.set([]),
    });
  }

  private loadLessons(section: Section) {
    this.curriculum.lessons(section.id).subscribe({
      next: (lessons) => {
        // ask which of these lessons he finished (it fails when he is not enrolled, then nothing is ticked)
        for (const lesson of lessons) {
          this.progress.lesson(lesson.id).subscribe({
            next: (p) => {
              if (p.completed)
                this.doneIds.update((ids) => (ids.includes(lesson.id) ? ids : [...ids, lesson.id]));
            },
            error: () => undefined,
          });
        }
        this.outline.update((groups) =>
          groups.map((group) =>
            group.section.id === section.id ? { section: group.section, lessons } : group,
          ),
        );
      },
      // a section we cannot read just stays out of the outline; the lesson itself still shows
      error: () => undefined,
    });
  }

  // The lesson one step before or after this one, in course order. Null at either end.
  private neighbour(step: number): Lesson | null {
    const list = this.allLessons();
    const index = list.findIndex((lesson) => lesson.id === this.lessonId);
    if (index < 0) return null;
    return list[index + step] ?? null;
  }

  // The written lesson comes as one long text. We show every empty line as a new paragraph.
  paragraphs(text: string | null): string[] {
    if (!text) return [];
    return text
      .split(/\n{2,}/)
      .map((part) => part.trim())
      .filter((part) => part.length > 0);
  }

  // A short label above the title, so the student knows what he is about to see.
  typeLabel(type: string): string {
    if (type === 'video') return 'فيديو';
    if (type === 'pdf') return 'ملف PDF';
    return 'قراءة';
  }
}
