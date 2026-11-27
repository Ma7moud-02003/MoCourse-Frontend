import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_URL } from './config';

// The account of the logged-in user.
export interface Profile {
  id: number;
  fullName: string | null;
  email: string;
  role: string;
  avatar: string | null;
}

// Reading and changing his own account: name, password, photo, and deleting it.
@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);

  // GET /api/user/currentUser
  me() {
    return this.http.get<{ personalInfo: Profile }>(`${API_URL}/user/currentUser`);
  }

  // PATCH /api/user/update — send only what changes. A new password also needs the current one.
  update(changes: { fullName?: string; password?: string; currentPassword?: string }) {
    return this.http.patch<{ message: string }>(`${API_URL}/user/update`, changes);
  }

  // PATCH /api/user/avatar — an image up to 2 MB, in the "avatar" field
  changeAvatar(image: File) {
    const form = new FormData();
    form.append('avatar', image);
    return this.http.patch<{ message: string; avatar: string }>(`${API_URL}/user/avatar`, form);
  }

  // DELETE /api/user/delete — needs his password. A teacher with courses that have students cannot delete.
  deleteAccount(password: string) {
    return this.http.delete(`${API_URL}/user/delete`, { body: { password } });
  }
}
