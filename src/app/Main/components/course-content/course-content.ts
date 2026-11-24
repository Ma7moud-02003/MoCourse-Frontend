import { CommonModule, DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Course } from '../../Models/wizard.models';
import { CoursesService } from '../../../core/services/Services/course';
import { UserInfo } from '../../../core/services/Services/instractor-info';
import { UserInfoModel } from '../../Models/user-info.model';
const LEVEL_LABELS: Record<string, string> = {
  beginner: 'مبتدئ',
  intermediate: 'متوسط',
  advanced: 'متقدم',
};

@Component({
  selector: 'app-course-header',
  standalone: true,
  imports: [DecimalPipe,CommonModule,RouterModule],
  templateUrl: './course-content.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseHeader implements OnInit {
  private readonly courseService = inject(CoursesService);
  private readonly router = inject(Router);
  private readonly insInfo = inject(UserInfo);
  // Input للـ courseId
courseId = input.required<number>({ alias: 'id' });

  // Signals الخاصة بالكورس والـ State
  course = signal<Course | null>(null);
 
  loadingCourse = signal(true);
  errorCourse = signal(false);
   
 
  ngOnInit(): void {
    console.log('CourseHeader initialized with course ID:', this.courseId());
    this.loadCourse();
  
  }

  

  loadCourse(): void {
    this.loadingCourse.set(true);
    this.errorCourse.set(false);
    this.courseService.getCourseById(this.courseId()).subscribe({
      next: (course) => {
        console.log('Course loaded:', course);
        this.course.set(course);
        this.loadingCourse.set(false);
       this.sendData(this.course()?.Instractor.id || 0);
       this.insInfo.instructorId.set(this.course()?.Instractor.id || 0);
      this.currentUser.set(course.Instractor as UserInfoModel)
      },
      error: () => {
        this.errorCourse.set(true);
        this.loadingCourse.set(false);
      },
    });
  }
  currentUser=signal<UserInfoModel>({} as UserInfoModel)
  

  // تعريف الحدث
  instractorId = output<number>();

  sendData(message: number | string): void {
    console.log('Sending data from CourseHeader:', message);
    this.instractorId.emit(Number(message));
  }

  levelLabel(level: string): string {
    return LEVEL_LABELS[level.toLowerCase()] ?? level;
  }

  durationLabel(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    if (hours === 0) return `${rest} دقيقة`;
    return rest === 0 ? `${hours} ساعة` : `${hours} ساعة و ${rest} دقيقة`;
  }

  editCourse(): void {
    this.router.navigate(['/instractor/update-course', String(this.courseId())]);
  }
  creatExam():void{
    console.log('ddddddddddd');
    
    this.router.navigate([`/instractor/creat-exam/${ String(this.courseId())}/${null}/${null}`]);

  }
}