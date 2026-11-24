import { Component, input, output, signal } from '@angular/core';

@Component({
  imports: [],
  selector: 'app-navbar',
  styles: ``,
  templateUrl: './navbar.html',
})
export class Navbar {
  fullName = input.required<string>();
  email = input.required<string>();
  role = input.required<string>();
  avatar = input<string>('');// إشارة الخروج
  onLogout = output<void>();

  isMenuOpen = signal<boolean>(false);

  toggleUserMenu() {
    this.isMenuOpen.update((val) => !val);
  }

  logout() {
    this.isMenuOpen.set(false);
    this.onLogout.emit();
  }
}
