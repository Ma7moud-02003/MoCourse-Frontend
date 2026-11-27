import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ExamService, TeacherExam } from '../../core/exam.service';
import {
  CourseStudent,
  StudentLesson,
  StudentLessons,
  TeacherService,
} from '../../core/teacher.service';
import { AppFooter } from '../../layout/app-footer/app-footer';
import { AppHeader } from '../../layout/app-header/app-header';

// One section of the lessons list.
interface SectionGroup {
  title: string;
  lessons: StudentLesson[];
  done: number;
}

// One row of the exams table: the exam and what this student did in it.
interface ExamRow {
  exam: TeacherExam;
  state: 'passed' | 'failed' | 'waiting' | 'not_started';
  score: number | null;
}

// The record of one student in one course: his percent, his lessons and his exams.
@Component({
  selector: 'app-student-record',
  imports: [RouterLink, AppHeader, AppFooter],
  templateUrl: './student-record.html',
})
export class StudentRecord implements OnInit {
  private route = inject(ActivatedRoute);
  private teacher = inject(TeacherService);
  private exams = inject(ExamService);

  courseId = 0;
  studentId = 0;
  student = signal<CourseStudent | null>(null);
  courseTitle = signal('');
  record = signal<StudentLessons | null>(null);
  rows = signal<ExamRow[]>([]);
  loading = signal(true);
  failed = signal(false);

  // the lessons grouped by their section
  groups = computed<SectionGroup[]>(() => {
    const result: SectionGroup[] = [];
    for (const lesson of this.record()?.lessons ?? []) {
      let group = result.find((g) => g.title === lesson.sectionTitle);
      if (!group) {
        group = { title: lesson.sectionTitle, lessons: [], done: 0 };
        result.push(group);
      }
      group.lessons.push(lesson);
      if (lesson.completed) group.done++;
    }
    return result;
  });

  // the backend sends decimals like 90.909, we show whole numbers
  round = Math.round;

  passedExams = computed(() => this.rows().filter((r) => r.state === 'passed').length);

  // the lesson he stopped at: the first one that is not finished but has a position
  stoppedAt = computed(
    () => this.record()?.lessons.find((l) => !l.completed && l.lastPosition > 0)?.lessonId ?? 0,
  );

  // the ring around the percent, drawn with a conic gradient
  ring = computed(() => `conic-gradient(#5b2a86 ${this.record()?.persentage ?? 0}%, #ece4f3 0)`);

  ngOnInit() {
    this.courseId = Number(this.route.snapshot.paramMap.get('courseId'));
    this.studentId = Number(this.route.snapshot.paramMap.get('studentId'));

    this.teacher.students(this.courseId).subscribe({
      next: (list) => this.student.set(list.find((s) => s.user.id === this.studentId) ?? null),
    });
    this.teacher.myCourses().subscribe({
      next: (list) => this.courseTitle.set(list.find((c) => c.id === this.courseId)?.title ?? ''),
    });
    this.teacher.studentLessons(this.courseId, this.studentId).subscribe({
      next: (record) => {
        this.record.set(record);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.failed.set(true);
      },
    });
    this.loadExams();
  }

  // For each published exam of the course, find out what this student did.
  private loadExams() {
    this.exams.forCourse(this.courseId).subscribe({
      next: (list) => {
        for (const exam of list.filter((e) => e.isPublished)) {
          this.teacher.examResults(exam.id).subscribe({
            next: (results) => {
              const attempt = results.attempts.find((a) => a.student.id === this.studentId);
              const state: ExamRow['state'] = !attempt
                ? 'not_started'
                : attempt.status !== 'submitted'
                  ? 'waiting'
                  : attempt.passed
                    ? 'passed'
                    : 'failed';
              this.rows.update((all) => [...all, { exam, state, score: attempt?.score ?? null }]);
            },
          });
        }
      },
    });
  }

  stateText(state: ExamRow['state']): string {
    if (state === 'passed') return 'نجح';
    if (state === 'failed') return 'لسه ما نجحش';
    if (state === 'waiting') return 'لسه بيحل';
    return 'لسه';
  }
}
