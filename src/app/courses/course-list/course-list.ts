import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime } from 'rxjs';
import { CourseCard, CourseLevel, CourseService } from '../../core/course.service';
import {
  coursesCountText,
  finalPrice,
  hasDiscount,
  isNew,
  priceText,
} from '../../core/course-display';
import { errorMessage } from '../../core/error-message';
import { AuthService } from '../../core/auth.service';
import { AppFooter } from '../../layout/app-footer/app-footer';
import { AppHeader } from '../../layout/app-header/app-header';

// How many cards we ask for at a time (the backend's default is 10, we like 9: 3 rows of 3).
const PAGE_SIZE = 9;

// The filter buttons at the top. The empty value means "no filter".
const LEVELS: { value: CourseLevel | ''; label: string }[] = [
  { value: '', label: 'كل المستويات' },
  { value: 'beginner', label: 'مبتدئ' },
  { value: 'intermediate', label: 'متوسط' },
  { value: 'advanced', label: 'متقدم' },
];

@Component({
  selector: 'app-course-list',
  imports: [AppHeader, AppFooter],
  templateUrl: './course-list.html',
})
export class CourseList implements OnInit {
  private courseService = inject(CourseService);
  private auth = inject(AuthService);

  readonly levels = LEVELS;
  readonly priceText = priceText;
  readonly finalPrice = finalPrice;
  readonly hasDiscount = hasDiscount;
  readonly isNew = isNew;

  // What the user chose (this is what we send to the server)
  search = signal('');
  level = signal<CourseLevel | ''>('');
  page = signal(1);

  // What came back from the server
  items = signal<CourseCard[]>([]);
  total = signal(0);
  totalPages = signal(0);

  // The three states the page can be in
  loading = signal(true);
  error = signal('');

  // A short line above the grid: "12 كورس" or "بنجهّز الكورسات..."
  resultsText = computed(() =>
    this.loading() ? 'بنجهّز الكورسات...' : coursesCountText(this.total()),
  );

  // Any filter is on? Used to show the "امسح الفلاتر" button in the empty state.
  hasFilters = computed(() => this.search() !== '' || this.level() !== '');

  // Typing in the search box should not send a request for every letter.
  // We push the text here and wait 300ms of quiet before asking the server.
  private typing = new Subject<string>();

  // Every request gets a number. When an older answer arrives after a newer one,
  // we ignore it, so the grid never shows results for a search the user already changed.
  private lastRequest = 0;

  // Only for the grey placeholder cards while loading
  readonly skeletons = [1, 2, 3, 4, 5, 6];

  constructor() {
    this.typing.pipe(debounceTime(300), takeUntilDestroyed()).subscribe((text) => {
      this.search.set(text);
      this.page.set(1);
      this.load();
    });
  }

  ngOnInit() {
    this.load();
  }

  // The one place that asks the backend for a page of courses.
  load() {
    const requestId = ++this.lastRequest;
    this.loading.set(true);
    this.error.set('');

    this.courseService
      .list({ title: this.search(), level: this.level(), page: this.page(), limit: PAGE_SIZE })
      .subscribe({
        next: (res) => {
          if (requestId !== this.lastRequest) return; // a newer request is on its way
          this.items.set(res.items);
          this.total.set(res.total);
          this.totalPages.set(res.totalPages);
          this.loading.set(false);
        },
        error: (err: HttpErrorResponse) => {
          if (requestId !== this.lastRequest) return;
          // The token is old or wrong: send the student to the login page.
          if (err.status === 401) {
            this.auth.logout();
            return;
          }
          this.error.set(errorMessage(err));
          this.loading.set(false);
        },
      });
  }

  onSearch(value: string) {
    this.typing.next(value);
  }

  setLevel(level: CourseLevel | '') {
    this.level.set(level);
    this.page.set(1);
    this.load();
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages() || page === this.page()) return;
    this.page.set(page);
    this.load();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // "امسح الفلاتر" in the empty state
  clearFilters() {
    this.search.set('');
    this.level.set('');
    this.page.set(1);
    this.load();
  }
}
