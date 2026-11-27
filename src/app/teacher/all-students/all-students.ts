import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CourseStudent, TeacherCourse, TeacherService } from '../../core/teacher.service';
import { AppFooter } from '../../layout/app-footer/app-footer';
import { AppHeader } from '../../layout/app-header/app-header';

// The teacher picks one of his courses and sees its students with how far each one got.
@Component({
  selector: 'app-all-students',
  imports: [RouterLink, AppHeader, AppFooter],
  templateUrl: './all-students.html',
})
export class AllStudents implements OnInit {
  private teacher = inject(TeacherService);

  courses = signal<TeacherCourse[]>([]);
  courseId = signal(0);
  students = signal<CourseStudent[]>([]);
  // the percent of each student, by student id; missing until it arrives
  progress = signal<Record<number, number>>({});
  search = signal('');
  loading = signal(true);
  failed = signal(false);

  // the students whose name contains the search text
  shown = computed(() => {
    const text = this.search().trim().toLowerCase();
    return this.students().filter((s) => s.user.fullName.toLowerCase().includes(text));
  });

  // the three number tiles
  learning = computed(() => this.students().filter((s) => s.status !== 'completed').length);
  finished = computed(() => this.students().filter((s) => s.status === 'completed').length);

  ngOnInit() {
    this.teacher.myCourses().subscribe({
      next: (list) => {
        this.courses.set(list);
        if (list.length > 0) this.pick(list[0].id);
        else this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.failed.set(true);
      },
    });
  }

  pick(id: number) {
    this.courseId.set(id);
    this.students.set([]);
    this.progress.set({});
    this.loading.set(true);
    this.teacher.students(id).subscribe({
      next: (list) => {
        this.students.set(list);
        this.loading.set(false);
        // one small request per student for his percent
        for (const s of list) {
          this.teacher.studentProgress(id, s.user.id).subscribe({
            next: (p) =>
              this.progress.update((all) => ({ ...all, [s.user.id]: Math.round(p.persentage) })),
          });
        }
      },
      error: () => {
        this.loading.set(false);
        this.failed.set(true);
      },
    });
  }
}
