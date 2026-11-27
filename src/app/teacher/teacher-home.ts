import { Component } from '@angular/core';
import { AppFooter } from '../layout/app-footer/app-footer';
import { AppHeader } from '../layout/app-header/app-header';

// Where a teacher lands after login. Before this page, a teacher was sent to the
// student courses page, which is not his place to work in.
@Component({
  selector: 'app-teacher-home',
  imports: [AppHeader, AppFooter],
  templateUrl: './teacher-home.html',
})
export class TeacherHome {}
