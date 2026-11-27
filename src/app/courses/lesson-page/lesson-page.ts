import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { lessonTime } from '../../core/course-display';
import { errorMessage } from '../../core/error-message';
import { LessonDetails, LessonService } from '../../core/lesson.service';
import { AppFooter } from '../../layout/app-footer/app-footer';
import { AppHeader } from '../../layout/app-header/app-header';

// One lesson, opened from the course page: the video, the file, or the written text.
@Component({
  selector: 'app-lesson-page',
  imports: [RouterLink, AppHeader, AppFooter],
  templateUrl: './lesson-page.html',
})
export class LessonPage implements OnInit {
  private route = inject(ActivatedRoute);
  private lessons = inject(LessonService);

  lesson = signal<LessonDetails | null>(null);
  loading = signal(true);
  errorText = signal('');

  // The course we came from, so the "back to the course" link works.
  courseId = 0;

  // helpers the template uses
  readonly lessonTime = lessonTime;

  ngOnInit() {
    this.courseId = Number(this.route.snapshot.paramMap.get('courseId'));
    const id = Number(this.route.snapshot.paramMap.get('lessonId'));

    if (!id) {
      this.loading.set(false);
      this.errorText.set('الدرس مش موجود.');
      return;
    }

    this.lessons.get(id).subscribe({
      next: (lesson) => {
        this.lesson.set(lesson);
        this.loading.set(false);
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
