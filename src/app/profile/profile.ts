import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { AuthService } from '../core/auth.service';
import { errorMessage } from '../core/error-message';
import { Profile, UserService } from '../core/user.service';
import { RouterLink } from '@angular/router';
import { AppFooter } from '../layout/app-footer/app-footer';
import { AppHeader } from '../layout/app-header/app-header';

const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // the backend refuses a bigger image

// The backend answers in English; this turns the sentences we know into Arabic.
function profileError(err: HttpErrorResponse): string {
  const msg = String(err.error?.message ?? '');
  if (msg.includes('Current password is incorrect')) return 'كلمة السر الحالية غلط.';
  if (msg.includes('Password is incorrect')) return 'كلمة السر غلط.';
  if (msg.includes('too large')) return 'الصورة أكبر من 2 ميجا.';
  if (msg.includes('still has')) return 'الحساب ده لسه عنده كورسات فيها طلبة، فمينفعش يتحذف.';
  return errorMessage(err);
}

// "حسابي": the photo, the name, the password, and deleting the account.
@Component({
  selector: 'app-profile',
  imports: [AppHeader, AppFooter, RouterLink],
  templateUrl: './profile.html',
})
export class ProfilePage implements OnInit {
  private users = inject(UserService);
  private auth = inject(AuthService);

  profile = signal<Profile | null>(null);
  loading = signal(true);
  loadError = signal('');

  // One short message under each form: ok = true is green, false is red.
  photoNote = signal<{ ok: boolean; text: string } | null>(null);
  nameNote = signal<{ ok: boolean; text: string } | null>(null);
  passwordNote = signal<{ ok: boolean; text: string } | null>(null);
  deleteNote = signal('');
  busy = signal('');

  name = signal('');
  currentPassword = signal('');
  newPassword = signal('');
  confirmDelete = signal(false);
  deletePassword = signal('');

  ngOnInit() {
    this.users.me().subscribe({
      next: (res) => {
        this.profile.set(res.personalInfo);
        this.name.set(res.personalInfo.fullName ?? '');
        this.loading.set(false);
      },
      error: (err) => {
        this.loadError.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }

  isStudent = this.auth.role() === 'student';

  // The password boxes can show the letters (the "إظهار" button in the design).
  showPassword = signal(false);

  logout() {
    this.auth.logout();
  }

  roleText(role: string): string {
    if (role === 'student') return 'طالب';
    if (role === 'admin') return 'مسؤول';
    return 'مدرّس';
  }

  // Reads what was typed into an input.
  text(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  changePhoto(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ''; // so choosing the same file again still works
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.photoNote.set({ ok: false, text: 'اختار صورة (JPG أو PNG).' });
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      this.photoNote.set({ ok: false, text: 'الصورة أكبر من 2 ميجا.' });
      return;
    }
    this.busy.set('photo');
    this.photoNote.set(null);
    this.users.changeAvatar(file).subscribe({
      next: (res) => {
        this.profile.update((p) => (p ? { ...p, avatar: res.avatar } : p));
        this.photoNote.set({ ok: true, text: 'اتغيرت الصورة.' });
        this.busy.set('');
      },
      error: (err) => {
        this.photoNote.set({ ok: false, text: profileError(err) });
        this.busy.set('');
      },
    });
  }

  saveName() {
    const fullName = this.name().trim();
    if (!fullName) {
      this.nameNote.set({ ok: false, text: 'اكتب اسمك.' });
      return;
    }
    this.busy.set('name');
    this.nameNote.set(null);
    this.users.update({ fullName }).subscribe({
      next: () => {
        this.profile.update((p) => (p ? { ...p, fullName } : p));
        this.nameNote.set({ ok: true, text: 'اتحفظ الاسم.' });
        this.busy.set('');
      },
      error: (err) => {
        this.nameNote.set({ ok: false, text: profileError(err) });
        this.busy.set('');
      },
    });
  }

  savePassword() {
    if (!this.currentPassword()) {
      this.passwordNote.set({ ok: false, text: 'اكتب كلمة السر الحالية.' });
      return;
    }
    if (this.newPassword().length < 6) {
      this.passwordNote.set({ ok: false, text: 'كلمة السر الجديدة لازم تكون 6 حروف على الأقل.' });
      return;
    }
    this.busy.set('password');
    this.passwordNote.set(null);
    this.users
      .update({ password: this.newPassword(), currentPassword: this.currentPassword() })
      .subscribe({
        next: () => {
          this.currentPassword.set('');
          this.newPassword.set('');
          this.passwordNote.set({ ok: true, text: 'اتغيرت كلمة السر.' });
          this.busy.set('');
        },
        error: (err) => {
          this.passwordNote.set({ ok: false, text: profileError(err) });
          this.busy.set('');
        },
      });
  }

  deleteAccount() {
    if (!this.deletePassword()) {
      this.deleteNote.set('اكتب كلمة السر عشان تأكد.');
      return;
    }
    this.busy.set('delete');
    this.deleteNote.set('');
    this.users.deleteAccount(this.deletePassword()).subscribe({
      next: () => this.auth.logout(),
      error: (err) => {
        this.deleteNote.set(profileError(err));
        this.busy.set('');
      },
    });
  }
}
