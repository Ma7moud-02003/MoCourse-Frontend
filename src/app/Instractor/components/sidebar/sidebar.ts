import { CommonModule } from '@angular/common';
import { Component, input, output, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
interface NavItem {
  id: string;
  label: string;
  icon: string;
  badge?: string;
  path?: string;
}
@Component({
  imports: [CommonModule,RouterModule],
  selector: 'app-sidebar',
  styles: ``,
  templateUrl: './sidebar.html',
})
export class Sidebar {
  // Angular Signal للتحكم في حالة تصغير وتكبير الشريط الجانبي
  isCollapsed = input<boolean>();

  // Angular Signal لتحديد العنصر النشط حالياً
  activeId = signal<string>('dashboard');

  // قائمة التنقل الرئيسية
 mainNavItems: NavItem[] = [
  {
    id: 'dashboared',
    path: '/instractor',
    label: 'لوحة التحكم',
    icon: 'fa-solid fa-chart-line'
  },
  {
    id: 'my-courses',
    label: 'كورساتي',
    path: '/instractor/my-courses',
    icon: 'fa-solid fa-book-open'
  },
  {
    id: 'myPurchases',
    label: 'طلبات الدفع',
    path: '/instractor/myPurchases',
    icon: 'fa-solid fa-wallet'
  },
  {
    id: 'add-course',
    label: 'إضافة كورس',
    path: '/instractor/create-course',
    icon: 'fa-solid fa-circle-plus'
  },
  {
    id: 'exams',
    path: '/instractor/insQuizzes',
    label: 'امتحاناتي',
    icon: 'fa-solid fa-file-signature'
  },
  
  {
    id: 'students',
    label: 'الطلاب',
    icon: 'fa-solid fa-user-graduate'
  },
  {
    id: 'reviews',
    label: 'التقييمات',
    icon: 'fa-solid fa-star'
  },
  {
    id: 'earnings',
    label: 'الأرباح',
    icon: 'fa-solid fa-wallet'
  }
];
  // حساب والحساب الشخصي
 accountNavItems: NavItem[] = [
  {
    id: 'profile',
    label: 'الملف الشخصي',
    icon: 'fa-solid fa-user'
  },
  {
    id: 'settings',
    label: 'الإعدادات',
    path:'/instractor/settings',
    icon: 'fa-solid fa-gear'
  }
];
// استقبال الحالة من المكون الأب
 
  // تبديل حالة الفتح والإغلاق
  toggle = output<void>();
  toggleSidebar(): void {
    this.toggle.emit();
  }

  // اختيار عنصر
  setActive(id: string): void {
    this.activeId.set(id);
  }

  // تسجيل الخروج
  logout(): void {
    console.log('Logging out...');
  }
}
