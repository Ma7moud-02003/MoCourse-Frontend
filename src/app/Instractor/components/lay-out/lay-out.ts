import { Component, inject, signal } from '@angular/core';
import { Sidebar } from '../sidebar/sidebar';
import {  RouterOutlet } from '@angular/router';
import {  UserInfo } from '../../../core/services/Services/instractor-info';
import { Navbar } from '../navbar/navbar';
import { InstractorInfo } from '../../../Main/Models/user-info.model';


@Component({
  imports: [Sidebar,RouterOutlet,Navbar],
  selector: 'app-lay-out',
  styles: ``,
  templateUrl: './lay-out.html',
})
export class LayOut {
  isSidebarCollapsed = signal(false);
 private userInfoService = inject(UserInfo);
  // دالة تغيير الحالة
  toggleSidebar() {
    this.isSidebarCollapsed.update((val) => !val);
  }
  userInfo = signal<any>(null);

  constructor() {
    this.getUserInfo();
  }
  getUserInfo() {
    this.userInfoService.getInstractorInfo().subscribe({
      next: (data:InstractorInfo|any) => {
        this.userInfo.set(data.personalInfo);
        console.log('User info:', this.userInfo);
      },
      error: (error) => {
        console.error('Error fetching user info:', error);
      },
    });
  }


}
