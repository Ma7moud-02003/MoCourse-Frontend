import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, input, output, signal } from '@angular/core';
import { CurriculumService, Lesson } from '../../../core/curriculum.service';
import { errorMessage } from '../../../core/error-message';

// One lesson in the teacher's content list: its icon, name and badges,
// with two buttons: edit (opens a small form right here) and delete (asks once more).
@Component({
  selector: 'app-lesson-row',
  templateUrl: './lesson-row.html',
})
export class LessonRow {
  private curriculum = inject(CurriculumService);

  lesson = input.required<Lesson>();
  // tell the page that something changed, so it can load the list again
  changed = output<void>();

  editing = signal(false);
  confirmingDelete = signal(false);
  busy = signal(false);
  note = signal('');

  // what he types while editing
  title = signal('');
  description = signal('');
  content = signal('');
  isPreview = signal(false);

  startEdit() {
    const lesson = this.lesson();
    this.title.set(lesson.title);
    this.description.set(lesson.description ?? '');
    this.content.set(lesson.content ?? '');
    this.isPreview.set(lesson.isPreview);
    this.note.set('');
    this.editing.set(true);
  }

  save() {
    const title = this.title().trim();
    if (title.length === 0 || title.length > 100) {
      this.note.set('اسم الدرس لازم يكون بين 1 و100 حرف.');
      return;
    }
    this.busy.set(true);
    this.note.set('');
    const changes: { title: string; description: string; isPreview: boolean; content?: string } = {
      title,
      description: this.description().trim(),
      isPreview: this.isPreview(),
    };
    if (this.lesson().type === 'text') changes.content = this.content().trim();

    this.curriculum.updateLesson(this.lesson().id, changes).subscribe({
      next: () => {
        this.busy.set(false);
        this.editing.set(false);
        this.changed.emit();
      },
      error: (err: HttpErrorResponse) => this.fail(err),
    });
  }

  remove() {
    this.busy.set(true);
    this.note.set('');
    this.curriculum.deleteLesson(this.lesson().id).subscribe({
      next: () => {
        this.busy.set(false);
        this.changed.emit();
      },
      error: (err: HttpErrorResponse) => {
        this.confirmingDelete.set(false);
        this.fail(err);
      },
    });
  }

  private fail(err: HttpErrorResponse) {
    this.busy.set(false);
    this.note.set(errorMessage(err));
  }

  // "12:40" for a video, the size for a PDF, a plain word for a written lesson
  subtitle(): string {
    const lesson = this.lesson();
    if (lesson.type === 'video' && lesson.duration) {
      const minutes = Math.floor(lesson.duration / 60);
      const seconds = String(lesson.duration % 60).padStart(2, '0');
      return `${minutes}:${seconds} دقيقة`;
    }
    if (lesson.type === 'pdf' && lesson.fileSize) {
      return `ملف PDF · ${(lesson.fileSize / 1024 / 1024).toFixed(1)} MB`;
    }
    return lesson.type === 'text' ? 'درس نصي' : lesson.type === 'pdf' ? 'ملف PDF' : 'فيديو';
  }

  // a video or PDF lesson is "waiting for its file" until the file is uploaded
  needsFile(): boolean {
    const lesson = this.lesson();
    return (
      (lesson.type === 'video' && !lesson.videoUrl) || (lesson.type === 'pdf' && !lesson.pdfUrl)
    );
  }

  iconText(): string {
    const type = this.lesson().type;
    return type === 'video' ? 'فيديو' : type === 'pdf' ? 'PDF' : 'نص';
  }

  iconColor(): string {
    const type = this.lesson().type;
    return type === 'video' ? 'bg-plum' : type === 'pdf' ? 'bg-coral' : 'bg-[#3f5bb0]';
  }
}
