import { Component, input } from '@angular/core';

// The frame shared by login and register: the picture on one side, the form on the other.
// The form itself is passed in from outside and shows where <ng-content /> is.
@Component({
  selector: 'app-auth-shell',
  templateUrl: './auth-shell.html',
  styleUrl: './auth-shell.css',
})
export class AuthShell {
  // These values come from the page that uses the shell (see login.html)
  image = input.required<string>();
  headline = input.required<string>();
  caption = input.required<string>();
}
