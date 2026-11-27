import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Category, CourseLevel, CourseService } from '../../core/course.service';
import { errorMessage } from '../../core/error-message';
import { AppFooter } from '../../layout/app-footer/app-footer';
import { AppHeader } from '../../layout/app-header/app-header';

// A teacher opening a new course, or changing one he already has (the address has an id).
// Six small steps on one page, with a live preview of the course card and a progress checklist.
// The details, the picture, the price, what the student will learn, what he needs, and publish or draft.
@Component({
  selector: 'app-course-form',
  imports: [RouterLink, AppHeader, AppFooter],
  templateUrl: './course-form.html',
})
export class CourseForm implements OnInit {
  private courses = inject(CourseService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // set when we are editing a course; null when we open a new one
  courseId: number | null = null;

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
  // the two lists: one text box per point, he can add and remove boxes
  covers = signal<string[]>(['']);
  requirements = signal<string[]>(['']);
  thumbnail = signal<File | null>(null);
  currentThumbnail = signal(''); // the picture the course has now, when editing
  previewUrl = signal(''); // the picture he just chose, to show in the preview
  dragging = signal(false);
  published = signal(true); // the switch in step 6
  saveKind = signal<'' | 'publish' | 'draft'>(''); // which button is working

  // What the preview and the checklist read
  categoryName = computed(
    () => this.categories().find((c) => c.id === this.categoryId())?.name ?? '',
  );
  Number = Number; // so the template can turn text into a number
  shownPrice = computed(() =>
    Number(this.discountPrice()) > 0 ? Number(this.discountPrice()) : Number(this.price()),
  );
  hasPicture = computed(() => !!this.thumbnail() || !!this.currentThumbnail());

  // The four checks of the progress card. Each one is a yes or no.
  checks = computed(() => [
    {
      label: 'الاسم والتصنيف والمستوى',
      done: this.title().trim().length >= 5 && this.categoryId() !== null,
    },
    {
      label: 'الوصف والسعر والمدة',
      done:
        this.describtion().trim().length >= 20 &&
        Number(this.price()) >= 100 &&
        Number(this.duration()) >= 5,
    },
    {
      label: 'نقاط التعلم والمتطلبات',
      done: this.lines(this.covers()).length > 0 && this.lines(this.requirements()).length > 0,
    },
    { label: 'صورة الكورس', done: this.hasPicture() },
  ]);
  percent = computed(() => Math.round((this.checks().filter((c) => c.done).length / 4) * 100));

  readonly levels: { value: CourseLevel; label: string }[] = [
    { value: 'beginner', label: 'مبتدئ' },
    { value: 'intermediate', label: 'متوسط' },
    { value: 'advanced', label: 'متقدم' },
  ];

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.courseId = Number(id);
      this.fillFromCourse(this.courseId);
    }
    this.courses.categories().subscribe({
      next: (list) => {
        this.categories.set(list);
        // pick the first category, so he does not have to, and the field is never empty
        if (list.length > 0 && this.categoryId() === null) this.categoryId.set(list[0].id);
      },
      error: () => this.categories.set([]),
    });
  }

  // Editing: put the course's current values in the fields.
  private fillFromCourse(id: number) {
    this.courses.details(id).subscribe({
      next: (course) => {
        this.title.set(course.title);
        this.describtion.set(course.describtion);
        this.price.set(String(course.price));
        this.discountPrice.set(course.discountPrice ? String(course.discountPrice) : '');
        this.duration.set(String(course.duration));
        this.level.set(course.level);
        if (course.category?.id) this.categoryId.set(course.category.id);
        this.covers.set(course.covers.length ? course.covers : ['']);
        this.requirements.set(course.requirements.length ? course.requirements : ['']);
        this.currentThumbnail.set(course.thumbnail);
        this.published.set(course.isPublished);
      },
      error: () => this.errorText.set('مقدرناش نحمّل بيانات الكورس. تأكد إنه بتاعك وجرّب تاني.'),
    });
  }

  // The picture comes from the file box or from a drop on the dashed area.
  onThumbnail(event: Event) {
    const input = event.target as HTMLInputElement;
    this.takePicture(input.files?.[0] ?? null);
    input.value = '';
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.dragging.set(false);
    this.takePicture(event.dataTransfer?.files[0] ?? null);
  }

  // We check the picture here, so he learns about a wrong file before the upload.
  private takePicture(file: File | null) {
    this.errorText.set('');
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.errorText.set('صورة الكورس لازم تكون صورة، زي JPG أو PNG.');
      return;
    }
    if (file.size > this.maxThumbnailBytes) {
      this.errorText.set('الصورة كبيرة أوي، خليها أقل من 5 ميجا.');
      return;
    }
    this.thumbnail.set(file);
    this.previewUrl.set(URL.createObjectURL(file));
  }

  // The lists of step 4 and 5
  setPoint(list: 'covers' | 'requirements', index: number, text: string) {
    this[list].update((all) => all.map((old, i) => (i === index ? text : old)));
  }

  addPoint(list: 'covers' | 'requirements') {
    this[list].update((all) => [...all, '']);
  }

  removePoint(list: 'covers' | 'requirements', index: number) {
    this[list].update((all) => (all.length > 1 ? all.filter((_, i) => i !== index) : ['']));
  }

  // The points he wrote, without the empty boxes.
  private lines(points: string[]): string[] {
    return points.map((point) => point.trim()).filter((point) => point.length > 0);
  }

  // "publish" shows the course to students; "draft" keeps it hidden until he is ready.
  save(kind: 'publish' | 'draft') {
    const problem = this.firstProblem();
    if (problem) {
      this.errorText.set(problem);
      return;
    }

    this.errorText.set('');
    this.saving.set(true);
    this.saveKind.set(kind);

    const discount = Number(this.discountPrice());
    const fields = {
      title: this.title().trim(),
      describtion: this.describtion().trim(),
      price: Number(this.price()),
      discountPrice: discount > 0 ? discount : null,
      duration: Number(this.duration()),
      level: this.level(),
      categoryId: this.categoryId() as number,
      covers: this.lines(this.covers()),
      requirements: this.lines(this.requirements()),
    };
    // a new course follows the button he pressed; an old one follows the switch
    const visible = this.courseId === null ? kind === 'publish' : this.published();

    if (this.courseId !== null) {
      const id = this.courseId;
      this.courses.update(id, fields, this.thumbnail(), visible).subscribe({
        next: () => this.finish(id),
        error: (err: HttpErrorResponse) => this.fail(err),
      });
      return;
    }

    this.courses.create(fields, this.thumbnail() as File).subscribe({
      next: (course) => {
        // the backend always creates a published course, so a draft is hidden right after
        if (visible) return this.finish(course.id);
        this.courses.update(course.id, fields, null, false).subscribe({
          next: () => this.finish(course.id),
          error: (err: HttpErrorResponse) => this.fail(err),
        });
      },
      error: (err: HttpErrorResponse) => this.fail(err),
    });
  }

  // Saved: go to the course content, where he adds the sections and lessons.
  private finish(id: number) {
    this.saving.set(false);
    this.router.navigate(['/teacher/courses', id, 'content']);
  }

  private fail(err: HttpErrorResponse) {
    this.saving.set(false);
    this.errorText.set(this.saveError(err));
  }

  // One clear sentence about the first thing that is missing or out of range.
  private firstProblem(): string {
    const title = this.title().trim();
    if (title.length < 5 || title.length > 150) return 'اسم الكورس لازم يكون بين 5 و150 حرف.';

    const describtion = this.describtion().trim();
    if (describtion.length < 20)
      return 'اكتب وصف للكورس 20 حرف على الأقل، عشان الطالب يعرف هو بياخد إيه.';

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
    if (this.lines(this.requirements()).length === 0)
      return 'اكتب نقطة واحدة على الأقل في "محتاج تعرف قبل ما تبدأ".';
    // a new course needs a picture; an old one already has one
    if (!this.thumbnail() && this.courseId === null) return 'اختار صورة للكورس.';

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
