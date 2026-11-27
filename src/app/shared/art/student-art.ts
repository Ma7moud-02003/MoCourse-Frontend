import { Component } from '@angular/core';

// Two drawings of the same student (a girl in a hijab at her desk), made with plain SVG shapes.
// The colors are the design colors: plum, mint, coral and a soft cream.
// Both are decoration only, so screen readers skip them (aria-hidden).

// At the desk with a laptop: used on the student's home page.
@Component({
  selector: 'app-laptop-art',
  template: `
    <svg viewBox="0 0 400 320" class="h-full w-full" aria-hidden="true">
      <!-- the done mark and a plant -->
      <circle cx="318" cy="70" r="22" fill="#2fb58c" />
      <path
        d="M308 70l8 8 14-16"
        stroke="#fff"
        stroke-width="5"
        fill="none"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path d="M355 250c-10-30-4-55 12-70 4 28-2 52-12 70z" fill="#2fb58c" />
      <path d="M352 250c-18-18-30-34-26-58 18 12 28 34 26 58z" fill="#27a07a" />
      <rect x="338" y="246" width="30" height="40" rx="6" fill="#fff" />

      <!-- body and hijab -->
      <path d="M90 300c0-60 24-88 70-98h80c46 10 70 38 70 98z" fill="#6b2d86" />
      <path
        d="M130 200c10 40 40 62 70 62s60-22 70-62c-20-18-44-28-70-28s-50 10-70 28z"
        fill="#f6f1ea"
      />
      <ellipse cx="200" cy="120" rx="68" ry="78" fill="#f6f1ea" />
      <ellipse cx="200" cy="132" rx="42" ry="48" fill="#f2c3a5" />
      <path
        d="M150 112c4-34 28-52 52-52s46 18 50 52c-18-18-38-26-52-26s-34 8-50 26z"
        fill="#f6f1ea"
      />
      <!-- face -->
      <circle cx="184" cy="132" r="4" fill="#2a1636" />
      <circle cx="218" cy="132" r="4" fill="#2a1636" />
      <path
        d="M176 120q8-6 16 0M210 120q8-6 16 0"
        stroke="#2a1636"
        stroke-width="2.5"
        fill="none"
        stroke-linecap="round"
      />
      <path
        d="M190 152q10 8 22 0"
        stroke="#c0674a"
        stroke-width="3"
        fill="none"
        stroke-linecap="round"
      />
      <circle cx="174" cy="146" r="7" fill="#f4a58b" opacity="0.6" />
      <circle cx="228" cy="146" r="7" fill="#f4a58b" opacity="0.6" />
      <!-- hand under the cheek -->
      <path
        d="M268 250c10-30 6-60-18-80"
        stroke="#6b2d86"
        stroke-width="26"
        fill="none"
        stroke-linecap="round"
      />
      <circle cx="246" cy="160" r="13" fill="#f2c3a5" />

      <!-- the desk, the laptop and the mug -->
      <rect x="30" y="268" width="340" height="14" rx="7" fill="#55226d" />
      <path d="M150 268l12-70h128l-12 70z" fill="#4a1d63" />
      <path d="M160 262l9-56h112l-10 56z" fill="#3a1650" />
      <circle cx="226" cy="234" r="17" fill="#fff" />
      <path d="M221 225v18l15-9z" fill="#6b2d86" />
      <rect x="62" y="236" width="34" height="32" rx="6" fill="#e8654f" />
      <path d="M96 244c12 0 12 16 0 16" stroke="#e8654f" stroke-width="5" fill="none" />
      <rect x="40" y="252" width="70" height="16" rx="4" fill="#2fb58c" />
      <rect x="46" y="244" width="64" height="10" rx="3" fill="#6b2d86" />
    </svg>
  `,
  host: { class: 'block' },
})
export class LaptopArt {}

// At the desk with an exam paper and a stopwatch: used on the exam's first screen.
@Component({
  selector: 'app-exam-art',
  template: `
    <svg viewBox="0 0 400 320" class="h-full w-full" aria-hidden="true">
      <!-- a checklist card behind her -->
      <rect x="270" y="50" width="96" height="76" rx="10" fill="#fff" />
      <circle cx="288" cy="72" r="7" fill="#2fb58c" />
      <circle cx="288" cy="94" r="7" fill="#2fb58c" />
      <circle cx="288" cy="116" r="7" fill="#2fb58c" />
      <rect x="302" y="69" width="52" height="6" rx="3" fill="#d9cde2" />
      <rect x="302" y="91" width="52" height="6" rx="3" fill="#d9cde2" />
      <rect x="302" y="113" width="40" height="6" rx="3" fill="#d9cde2" />

      <!-- body and hijab -->
      <path d="M80 300c0-60 24-88 70-98h80c46 10 70 38 70 98z" fill="#6b2d86" />
      <path
        d="M120 200c10 40 40 62 70 62s60-22 70-62c-20-18-44-28-70-28s-50 10-70 28z"
        fill="#f6f1ea"
      />
      <ellipse cx="190" cy="120" rx="68" ry="78" fill="#f6f1ea" />
      <ellipse cx="190" cy="132" rx="42" ry="48" fill="#f2c3a5" />
      <path
        d="M140 112c4-34 28-52 52-52s46 18 50 52c-18-18-38-26-52-26s-34 8-50 26z"
        fill="#f6f1ea"
      />
      <circle cx="174" cy="134" r="4" fill="#2a1636" />
      <circle cx="208" cy="134" r="4" fill="#2a1636" />
      <path
        d="M166 122q8-6 16 0M200 122q8-6 16 0"
        stroke="#2a1636"
        stroke-width="2.5"
        fill="none"
        stroke-linecap="round"
      />
      <path
        d="M182 154q10 6 20 0"
        stroke="#c0674a"
        stroke-width="3"
        fill="none"
        stroke-linecap="round"
      />
      <circle cx="164" cy="148" r="7" fill="#f4a58b" opacity="0.6" />
      <circle cx="218" cy="148" r="7" fill="#f4a58b" opacity="0.6" />
      <!-- hand under the cheek -->
      <path
        d="M258 250c10-30 6-60-18-80"
        stroke="#6b2d86"
        stroke-width="26"
        fill="none"
        stroke-linecap="round"
      />
      <circle cx="236" cy="162" r="13" fill="#f2c3a5" />

      <!-- the desk, the paper and the pencil -->
      <rect x="20" y="268" width="360" height="14" rx="7" fill="#55226d" />
      <path d="M110 268l14-46h130l-14 46z" fill="#fff" />
      <rect x="140" y="236" width="86" height="5" rx="2.5" fill="#d9cde2" />
      <rect x="132" y="248" width="86" height="5" rx="2.5" fill="#d9cde2" />
      <path d="M150 210l40 22" stroke="#e8654f" stroke-width="7" stroke-linecap="round" />

      <!-- the stack of books and the stopwatch -->
      <rect x="30" y="246" width="84" height="22" rx="4" fill="#2fb58c" />
      <rect x="40" y="226" width="74" height="20" rx="4" fill="#6b2d86" />
      <rect x="34" y="208" width="70" height="18" rx="4" fill="#55226d" />
      <circle cx="320" cy="232" r="30" fill="#fff" stroke="#6b2d86" stroke-width="6" />
      <rect x="312" y="190" width="16" height="8" rx="3" fill="#6b2d86" />
      <path
        d="M320 232V214M320 232l12 8"
        stroke="#6b2d86"
        stroke-width="5"
        stroke-linecap="round"
      />
    </svg>
  `,
  host: { class: 'block' },
})
export class ExamArt {}
