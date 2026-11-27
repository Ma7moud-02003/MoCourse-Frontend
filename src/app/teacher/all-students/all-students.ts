import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CourseStudent, TeacherCourse, TeacherService } from '../../core/teacher.service';
import { AppFooter } from '../../layout/app-footer/app-footer';
import { AppHeader } from '../../layout/app-header/app-header';

// One row of the table: a student in one of his courses.
interface Row {
  student: CourseStudent;
  course: TeacherCourse;
}

// Every student of every course of the teacher, with a search box.
// The backend lists students per course, so we ask once for each course.
@Component({
  selector: 'app-all-students',
  imports: [RouterLink, AppHeader, AppFooter],
  templateUrl: './all-students.html',
})
export class AllStudents implements OnInit {
  private teacher = inject(TeacherService);

  rows = signal<Row[]>([]);
  search = signal('');
  loading = signal(true);
  failed = signal(false);

  // the rows whose student name contains the search text
  shown = computed(() => {
    const text = this.search().trim().toLowerCase();
    return this.rows().filter((row) => row.student.user.fullName.toLowerCase().includes(text));
  });

  ngOnInit() {
    this.teacher.myCourses().subscribe({
      next: (courses) => this.loadStudents(courses),
      error: () => {
        this.loading.set(false);
        this.failed.set(true);
      },
    });
  }

  private loadStudents(courses: TeacherCourse[]) {
    if (courses.length === 0) {
      this.loading.set(false);
      return;
    }
    let left = courses.length;
    for (const course of courses) {
      this.teacher.students(course.id).subscribe({
        next: (list) =>
          this.rows.update((all) => [...all, ...list.map((student) => ({ student, course }))]),
        error: () => {}, // one course failing should not hide the others
        complete: () => {
          if (--left === 0) this.loading.set(false);
        },
      });
    }
  }

  joined(iso: string): string {
    return new Date(iso).toLocaleDateString('ar-EG', { dateStyle: 'medium' });
  }
}
