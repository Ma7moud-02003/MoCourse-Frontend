import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CourseService } from '../../core/course.service';
import { CurriculumService, Lesson, Section } from '../../core/curriculum.service';
import { errorMessage } from '../../core/error-message';
import { AppFooter } from '../../layout/app-footer/app-footer';
import { AppHeader } from '../../layout/app-header/app-header';

type LessonKind = 'video' | 'pdf' | 'text';

// The teacher builds his course here: he adds sections, and lessons inside each section.
@Component({
  selector: 'app-course-content',
  imports: [RouterLink, AppHeader, AppFooter],
  templateUrl: './course-content.html',
})
export class CourseContent implements OnInit {
  private route = inject(ActivatedRoute);
  private curriculum = inject(CurriculumService);
  private courses = inject(CourseService);

  courseId = 0;
  courseTitle = signal('');
  sections = signal<Section[]>([]);
  // the lessons of each section, by section id
  lessons = signal<Record<number, Lesson[]>>({});
  loading = signal(true);
  loadFailed = signal(false);

  // new section
  sectionTitle = signal('');
  sectionError = signal('');
  addingSection = signal(false);

  // new lesson: only one section has its lesson form open at a time
  openSectionId = signal<number | null>(null);
  lessonTitle = signal('');
  lessonDescription = signal('');
  lessonKind = signal<LessonKind>('video');
  lessonText = signal('');
  lessonPreview = signal(false);
  lessonFile = signal<File | null>(null);
  lessonError = signal('');
  addingLesson = signal(false);

  readonly kinds: { value: LessonKind; label: string }[] = [
    { value: 'video', label: 'فيديو' },
    { value: 'pdf', label: 'ملف PDF' },
    { value: 'text', label: 'نص مكتوب' },
  ];

  ngOnInit() {
    this.courseId = Number(this.route.snapshot.paramMap.get('id'));
    this.courses.details(this.courseId).subscribe({
      next: (course) => this.courseTitle.set(course.title),
      error: () => this.courseTitle.set(''),
    });
    this.loadSections();
  }

  private loadSections() {
    this.curriculum.sections(this.courseId).subscribe({
      next: (page) => {
        this.sections.set(page.data);
        this.loading.set(false);
        page.data.forEach((section) => this.loadLessons(section.id));
      },
      error: () => {
        this.loading.set(false);
        this.loadFailed.set(true);
      },
    });
  }

  private loadLessons(sectionId: number) {
    this.curriculum.lessons(sectionId).subscribe({
      next: (list) => this.lessons.update((all) => ({ ...all, [sectionId]: list })),
    });
  }

  lessonsOf(section: Section): Lesson[] {
    return this.lessons()[section.id] ?? [];
  }

  // ----- sections -----

  addSection() {
    const title = this.sectionTitle().trim();
    if (title.length < 5 || title.length > 150) {
      this.sectionError.set('اسم القسم لازم يكون بين 5 و150 حرف.');
      return;
    }
    this.sectionError.set('');
    this.addingSection.set(true);
    // the new section goes last
    const order = this.sections().length + 1;
    this.curriculum.addSection(this.courseId, title, order).subscribe({
      next: (section) => {
        this.sections.update((list) => [...list, section]);
        this.lessons.update((all) => ({ ...all, [section.id]: [] }));
        this.sectionTitle.set('');
        this.addingSection.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.addingSection.set(false);
        this.sectionError.set(this.saveError(err));
      },
    });
  }

  // ----- lessons -----

  openLessonForm(section: Section) {
    this.openSectionId.set(section.id);
    this.lessonTitle.set('');
    this.lessonDescription.set('');
    this.lessonKind.set('video');
    this.lessonText.set('');
    this.lessonPreview.set(false);
    this.lessonFile.set(null);
    this.lessonError.set('');
  }

  closeLessonForm() {
    this.openSectionId.set(null);
  }

  // Changing the type clears the chosen file, because a video does not fit a PDF lesson.
  chooseKind(kind: LessonKind) {
    this.lessonKind.set(kind);
    this.lessonFile.set(null);
    this.lessonError.set('');
  }

  onFile(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.lessonError.set('');
    this.lessonFile.set(null);
    if (!file) return;

    const wanted = this.lessonKind() === 'video' ? 'video/' : 'application/pdf';
    if (!file.type.startsWith(wanted)) {
      input.value = '';
      this.lessonError.set(
        this.lessonKind() === 'video' ? 'اختار ملف فيديو.' : 'اختار ملف PDF.',
      );
      return;
    }
    this.lessonFile.set(file);
  }

  addLesson(section: Section) {
    const problem = this.lessonProblem();
    if (problem) {
      this.lessonError.set(problem);
      return;
    }
    this.lessonError.set('');
    this.addingLesson.set(true);

    const kind = this.lessonKind();
    const order = this.lessonsOf(section).length + 1;
    this.curriculum
      .addLesson({
        title: this.lessonTitle().trim(),
        description: this.lessonDescription().trim(),
        type: kind,
        order,
        sectionId: section.id,
        isPreview: this.lessonPreview(),
        content: kind === 'text' ? this.lessonText().trim() : undefined,
      })
      .subscribe({
        next: (lesson) => {
          // text lessons are complete now; video and PDF lessons still need their file
          const file = this.lessonFile();
          if (kind === 'text' || !file) return this.lessonDone(section);
          this.curriculum.uploadFile(lesson.id, file).subscribe({
            next: () => this.lessonDone(section),
            error: (err: HttpErrorResponse) => {
              // the lesson exists already, so we say that, and show the list again
              this.addingLesson.set(false);
              this.loadLessons(section.id);
              this.lessonError.set(
                'الدرس اتحفظ، بس الملف ما اترفعش. ' + this.saveError(err),
              );
            },
          });
        },
        error: (err: HttpErrorResponse) => {
          this.addingLesson.set(false);
          this.lessonError.set(this.saveError(err));
        },
      });
  }

  private lessonDone(section: Section) {
    this.addingLesson.set(false);
    this.openSectionId.set(null);
    this.loadLessons(section.id);
  }

  private lessonProblem(): string {
    if (this.lessonTitle().trim().length === 0) return 'اكتب اسم الدرس.';
    if (this.lessonTitle().trim().length > 100) return 'اسم الدرس لازم يكون أقل من 100 حرف.';
    if (this.lessonKind() === 'text' && this.lessonText().trim().length === 0) {
      return 'اكتب نص الدرس.';
    }
    if (this.lessonKind() !== 'text' && !this.lessonFile()) {
      return this.lessonKind() === 'video' ? 'اختار فيديو للدرس.' : 'اختار ملف PDF للدرس.';
    }
    return '';
  }

  private saveError(err: HttpErrorResponse): string {
    if (err.status === 403 || err.status === 401) return 'الكورس ده مش بتاعك، مينفعش تعدّل فيه.';
    if (err.status === 413) return 'الملف كبير أوي.';
    return errorMessage(err);
  }
}
