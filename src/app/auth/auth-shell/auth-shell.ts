import { Component, input } from '@angular/core';

// The frame shared by login and register: the picture on one side, the form on the other.
// The form itself is passed in from outside and shows where <ng-content /> is.
// All the styling is Tailwind classes in the html file, there is no separate css file.
@Component({
  selector: 'app-auth-shell',
  templateUrl: './auth-shell.html',
})
export class AuthShell {
  // These values come from the page that uses the shell (see login.html)
  image = input.required<string>();
  headline = input.required<string>();
  caption = input.required<string>();
}
