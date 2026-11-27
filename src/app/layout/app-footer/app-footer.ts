import { Component } from '@angular/core';

// The white band at the bottom of the page: the name, one line about the platform,
// and the year. Small on purpose, so it closes the page without taking attention.
@Component({
  selector: 'app-footer',
  template: `
    <footer class="mt-14 border-t border-line bg-white">
      <div
        class="mx-auto flex w-full max-w-[1120px] flex-col items-center gap-4 px-5 py-8 text-center sm:flex-row sm:justify-between sm:text-start"
      >
        <div class="flex items-center gap-2.5">
          <img src="logo.svg" alt="" width="30" height="30" />
          <div>
            <p class="text-[15px] font-bold">MoCourse</p>
            <p class="text-[13px] text-muted">اتعلم على راحتك، خطوة كل يوم.</p>
          </div>
        </div>
        <p class="text-[13px] text-muted">© {{ year }} MoCourse — كل الحقوق محفوظة</p>
      </div>
    </footer>
  `,
})
export class AppFooter {
  readonly year = new Date().getFullYear();
}
