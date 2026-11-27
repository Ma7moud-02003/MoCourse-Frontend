import { Component } from '@angular/core';

// The white band at the bottom of every page: the logo, a few links, a line about the platform
// and the year.
@Component({
  selector: 'app-footer',
  template: `
    <footer class="mt-14 border-t border-line bg-white">
      <div class="mx-auto w-full max-w-[1120px] px-5 py-8">
        <div class="flex flex-col items-center gap-5 sm:flex-row sm:justify-between">
          <div class="flex items-center gap-2.5">
            <img src="logo.svg" alt="" width="38" height="38" />
            <span class="text-[22px] font-bold">MoCourse</span>
          </div>
          <nav class="flex flex-wrap justify-center gap-x-6 gap-y-2 text-[13px] font-medium text-ink" aria-label="روابط المنصة">
            <span>عن المنصة</span>
            <span>المساعدة</span>
            <span>تواصل معنا</span>
            <span>الشروط والخصوصية</span>
          </nav>
        </div>
        <p class="mt-5 text-center text-[13px] font-medium text-mint sm:text-start">
          «كل درس بتخلّصه بيقرّبك لهدفك.»
        </p>
        <p class="mt-4 border-t border-line pt-4 text-center text-[12px] text-muted sm:text-start">
          © {{ year }} MoCourse. كل الحقوق محفوظة.
        </p>
      </div>
    </footer>
  `,
})
export class AppFooter {
  readonly year = new Date().getFullYear();
}
