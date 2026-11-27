import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Category, CourseLevel, CourseService } from '../../core/course.service';
import { errorMessage } from '../../core/error-message';
import { AppFooter } from '../../layout/app-footer/app-footer';
import { AppHeader } from '../../layout/app-header/app-header';

// A teacher opening a new course: the details, the price, what the student will learn,
// what he needs, and one picture for the course card.
@Component({
  selector: 'app-course-form',
  imports: [RouterLink, AppHeader, AppFooter],
  templateUrl: './course-form.html',
})
export class CourseForm implements OnInit {
  private courses = inject(CourseService);
  private router = inject(Router);

  categories = signal<Category[]>([]);
  saving = signal(false);
  errorText = signal('');

  // The biggest picture the backend accepts for a course card (5 MB).
  private readonly maxThumbnailBytes = 5 * 1024 * 1024;

  // what he typed, one signal per field so the form stays simple to read
  title = signal('');
  describtion = signal('');
  price = signal('');
  discountPrice = signal('');
  duration = signal('');
  level = signal<CourseLevel>('beginner');
  categoryId = signal<number | null>(null);
  covers = signal('');
  requirements = signal('');
  thumbnail = signal<File | null>(null);

  readonly levels: { value: CourseLevel; label: string }[] = [
    { value: 'beginner', label: 'مبتدئ' },
    { value: 'intermediate', label: 'متوسط' },
    { value: 'advanced', label: 'متقدم' },
  ];

  ngOnInit() {
    this.courses.categories().subscribe({
      next: (list) => {
        this.categories.set(list);
        // pick the first category, so he does not have to, and the field is never empty
        if (list.length > 0) this.categoryId.set(list[0].id);
      },
      error: () => this.categories.set([]),
    });
  }

  // We check the picture here, so he learns about a wrong file before the upload.
  onThumbnail(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.errorText.set('');
    this.thumbnail.set(null);
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      input.value = '';
      this.errorText.set('صورة الكورس لازم تكون صورة، زي JPG أو PNG.');
      return;
    }
    if (file.size > this.maxThumbnailBytes) {
      input.value = '';
      this.errorText.set('الصورة كبيرة أوي، خليها أقل من 5 ميجا.');
      return;
    }
    this.thumbnail.set(file);
  }

  // Each line he writes becomes one point ("هتتعلم إيه" and "محتاج تعرف قبل ما تبدأ").
  private lines(text: string): string[] {
    return text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  }

  save() {
    const problem = this.firstProblem();
    if (problem) {
      this.errorText.set(problem);
      return;
    }

    this.errorText.set('');
    this.saving.set(true);

    const thumbnail = this.thumbnail() as File;
    const discount = Number(this.discountPrice());

    this.courses
      .create(
        {
          title: this.title().trim(),
          describtion: this.describtion().trim(),
          price: Number(this.price()),
          discountPrice: discount > 0 ? discount : null,
          duration: Number(this.duration()),
          level: this.level(),
          categoryId: this.categoryId() as number,
          covers: this.lines(this.covers()),
          requirements: this.lines(this.requirements()),
        },
        thumbnail,
      )
      .subscribe({
        next: (course) => {
          this.saving.set(false);
          // straight to the new course, so he sees what the student will see
          this.router.navigate(['/courses', course.id]);
        },
        error: (err: HttpErrorResponse) => {
          this.saving.set(false);
          this.errorText.set(this.saveError(err));
        },
      });
  }

  // One clear sentence about the first thing that is missing or out of range.
  private firstProblem(): string {
    const title = this.title().trim();
    if (title.length < 5 || title.length > 150) return 'اسم الكورس لازم يكون بين 5 و150 حرف.';

    const describtion = this.describtion().trim();
    if (describtion.length < 20) return 'اكتب وصف للكورس 20 حرف على الأقل، عشان الطالب يعرف هو بياخد إيه.';

    const price = Number(this.price());
    if (!price || price < 100 || price > 10000) return 'السعر لازم يكون بين 100 و10000 جنيه.';

    const discount = Number(this.discountPrice());
    if (this.discountPrice() && (discount < 100 || discount > 10000)) {
      return 'سعر الخصم لازم يكون بين 100 و10000 جنيه، أو سيبه فاضي.';
    }

    const duration = Number(this.duration());
    if (!duration || duration < 5 || duration > 1000) return 'مدة الكورس لازم تكون بين 5 و1000.';

    if (this.categoryId() === null) return 'اختار القسم اللي الكورس بيتبعه.';
    if (this.lines(this.covers()).length === 0) return 'اكتب نقطة واحدة على الأقل في "هتتعلم إيه".';
    if (this.lines(this.requirements()).length === 0) return 'اكتب نقطة واحدة على الأقل في "محتاج تعرف قبل ما تبدأ".';
    if (!this.thumbnail()) return 'اختار صورة للكورس.';

    return '';
  }

  private saveError(err: HttpErrorResponse): string {
    const body = err.error as { message?: string | string[] } | null;
    const raw = Array.isArray(body?.message) ? body?.message.join(' ') : body?.message;
    if (raw?.includes('title')) return 'اسم الكورس لازم يكون بين 5 و150 حرف.';
    if (raw?.includes('describtion')) return 'الوصف لازم يكون بين 20 و4000 حرف.';
    if (raw?.includes('Thumbnail')) return 'الصورة مش مقبولة، جرّب صورة تانية.';
    if (err.status === 403) return 'إنشاء كورس متاح لحساب مدرّس بس.';
    return errorMessage(err);
  }
}
