import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CurriculumService, Lesson, Section } from '../../core/curriculum.service';
import { lessonTime } from '../../core/course-display';
import { errorMessage } from '../../core/error-message';
import { LessonDetails, LessonService } from '../../core/lesson.service';
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
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        // 401 means the lesson is real but needs a subscription (the backend says so).
        if (err.status === 401) {
          this.errorText.set('الدرس ده جزء من كورس مدفوع. اشترك في الكورس الأول وبعدها تقدر تفتحه.');
        } else if (err.status === 404) {
          this.errorText.set('الدرس مش موجود أو مش متاح لك.');
        } else {
          this.errorText.set(errorMessage(err));
        }
      },
    });
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
        this.outline.update((groups) =>
          groups.map((group) => (group.section.id === section.id ? { section: group.section, lessons } : group)),
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
