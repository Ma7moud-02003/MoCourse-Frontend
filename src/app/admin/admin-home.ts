import { Component } from '@angular/core';
import { AppFooter } from '../layout/app-footer/app-footer';
import { AppHeader } from '../layout/app-header/app-header';

// Where an admin lands after login, so every role has its own home page.
@Component({
  selector: 'app-admin-home',
  imports: [AppHeader, AppFooter],
  templateUrl: './admin-home.html',
})
export class AdminHome {}
