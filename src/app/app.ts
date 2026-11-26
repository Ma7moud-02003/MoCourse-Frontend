import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

// The root component. It only holds <router-outlet>:
// the router puts the page of the current URL (login, register...) in that spot.
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
export class App {}
