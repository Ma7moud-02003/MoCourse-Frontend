import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { errorMessage } from '../../core/error-message';
import { ExamService, TeacherExam } from '../../core/exam.service';
import { TeacherCourse, TeacherService } from '../../core/teacher.service';
import { AppFooter } from '../../layout/app-footer/app-footer';
import { AppHeader } from '../../layout/app-header/app-header';

// One group of the page: a course and its exams.
interface Group {
  courseId: number;
  title: string;
  exams: TeacherExam[];
}

// All the exams of all his courses in one place, grouped by course.
@Component({
  selector: 'app-exams-list',
  imports: [RouterLink, AppHeader, AppFooter],
  templateUrl: './exams-list.html',
})
export class ExamsList implements OnInit {
  private exams = inject(ExamService);
  private teacher = inject(TeacherService);
  private router = inject(Router);

  list = signal<TeacherExam[]>([]);
  courses = signal<TeacherCourse[]>([]);
  loading = signal(true);
  failed = signal(false);
  note = signal('');

  // the chip he picked: 0 means all courses
  filter = signal(0);
  // the "new exam" box where he picks the course
  picking = signal(false);

  // the exams grouped by course, after the filter
  groups = computed<Group[]>(() => {
    const result: Group[] = [];
    for (const exam of this.list()) {
      if (this.filter() !== 0 && exam.course.id !== this.filter()) continue;
      let group = result.find((g) => g.courseId === exam.course.id);
      if (!group) {
        group = { courseId: exam.course.id, title: exam.course.title, exams: [] };
        result.push(group);
      }
      group.exams.push(exam);
    }
    return result;
  });

  // the chips: every course that has at least one exam, with its count
  chips = computed(() => {
    const map = new Map<number, { id: number; title: string; count: number }>();
    for (const exam of this.list()) {
      const chip = map.get(exam.course.id) ?? {
        id: exam.course.id,
        title: exam.course.title,
        count: 0,
      };
      chip.count++;
      map.set(exam.course.id, chip);
    }
    return [...map.values()];
  });

  ngOnInit() {
    this.load();
    this.teacher.myCourses().subscribe({ next: (list) => this.courses.set(list) });
  }

  load() {
    this.exams.all().subscribe({
      next: (list) => {
        this.list.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.failed.set(true);
      },
    });
  }

  // "New exam" opens the exam page of the course he picks.
  newExam(courseId: string) {
    if (courseId) this.router.navigate(['/teacher/courses', Number(courseId), 'exams']);
  }

  // Delete one exam. The backend says 409 when a student already started it.
  remove(exam: TeacherExam) {
    this.note.set('');
    this.exams.delete(exam.id).subscribe({
      next: () => this.list.update((all) => all.filter((item) => item.id !== exam.id)),
      error: (err: HttpErrorResponse) =>
        this.note.set(
          err.status === 409 ? 'في طلاب بدأوا الامتحان ده، فمينفعش يتمسح.' : errorMessage(err),
        ),
    });
  }

  // so the card can ask "sure?" before deleting
  confirming = signal<number | null>(null);
}
