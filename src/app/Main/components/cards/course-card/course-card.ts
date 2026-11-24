import { Component, input } from '@angular/core';
import { Course, CourseLevel } from '../../../Models/wizard.models';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  imports: [CommonModule,RouterModule],
  selector: 'app-course-card',
  styles: ``,
  templateUrl: './course-card.html',
})
export class CourseCard {
    readonly levelLabels: Record<CourseLevel, string> = {
    [CourseLevel.Beginner]: 'مبتدئ',
    [CourseLevel.Intermediate]: 'متوسط',
    [CourseLevel.Advanced]: 'متقدم',
  };

    readonly course = input.required<Course>();
}
