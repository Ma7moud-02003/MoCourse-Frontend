import { CommonModule, DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { catchError, firstValueFrom, map, of, startWith } from 'rxjs';

import {
  Category,
  CourseLevel,

  UploadedImage,
  
} from '../../../Main/Models/wizard.models';
import { CoursesService } from '../../../core/services/Services/course';

type FieldName =
  | 'title'
  | 'description'
  | 'categoryId'
  | 'level'
  | 'duration'
  | 'price'
  | 'discountPrice';

type ItemKind = 'lesson' | 'quiz';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function discountBelowPrice(group: AbstractControl): ValidationErrors | null {
  const price = group.get('price')?.value as number | null;
  const discount = group.get('discountPrice')?.value as number | null;
  if (price == null || discount == null || discount === 0) return null;
  return discount >= price ? { discountTooHigh: true } : null;
}

@Component({
  selector: 'app-create-course',
  standalone: true,
  imports: [ReactiveFormsModule, DecimalPipe, CommonModule, RouterModule],
  templateUrl: './creat-course.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { dir: 'rtl' },
})
export class CreateCourse {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly coursesService = inject(CoursesService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly steps = [
    { id: 1, label: 'المعلومات الأساسية' },
    { id: 2, label: 'تفاصيل الكورس' },
    { id: 3, label: 'التسعير' },
    { id: 4, label: 'المراجعة والنشر' },
  ] as const;

  readonly levels = [
    { value: CourseLevel.Beginner, label: 'مبتدئ' },
    { value: CourseLevel.Intermediate, label: 'متوسط' },
    { value: CourseLevel.Advanced, label: 'متقدم' },
  ];

  readonly form = this.fb.group(
    {
      title: this.fb.control('', [
        Validators.required,
        Validators.minLength(5),
        Validators.maxLength(150),
      ]),
      description: this.fb.control('', [
        Validators.required,
        Validators.minLength(20),
        Validators.maxLength(4000),
      ]),
      categoryId: this.fb.control<number | null>(null, []),
      level: this.fb.control<CourseLevel | null>(null, [Validators.required]),
      duration: this.fb.control<number | null>(null, [
        Validators.required,
        Validators.min(5),
        Validators.max(1000),
      ]),
      price: this.fb.control<number | null>(null, [
        Validators.required,
        Validators.min(100),
        Validators.max(10000),
      ]),
      discountPrice: this.fb.control<number | null>(null, [
        Validators.min(100),
        Validators.max(10000),
      ]),
    },
    { validators: discountBelowPrice },
  );

  readonly pendingRequirement = this.fb.control('');
  readonly sectionTitle = this.fb.control('');
  readonly itemTitle = this.fb.control('');
  readonly editTitle = this.fb.control('');
  // ── 1. إضافة الـ Signals الخاصة بالـ Covers في بداية الكلاس ──
readonly pendingCover = this.fb.control('');
readonly covers = signal<string[]>([]);
readonly coverError = signal<string | null>(null);

  // ── Wizard state ────────────────────────────────────────────
  readonly currentStep = signal(1);
  readonly maxReachedStep = signal(1);
  readonly requirements = signal<string[]>([]);
  readonly requirementError = signal<string | null>(null);
  readonly selectedImage = signal<File | null>(null);
  readonly imagePreview = signal<string | null>(null);
  readonly imageError = signal<string | null>(null);
  readonly isDragging = signal(false);
  readonly uploadedImage = signal<UploadedImage | null>(null);
  readonly isUploading = signal(false);
  readonly isSubmitting = signal(false);
  readonly courseId = signal<number | null>(null);
  readonly submitError = signal<string | null>(null);
 

  // ── Content builder state ──

  readonly editingSectionId = signal<string | null>(null);
  readonly adding = signal<{ sectionId: string; kind: ItemKind } | null>(null);

  readonly categories = toSignal(
    this.coursesService.getCategories().pipe(catchError(() => of([] as Category[]))),
    { initialValue: [] as Category[] },
  );

  private readonly formValue = toSignal(
    this.form.valueChanges.pipe(
      startWith(null),
      map(() => this.form.getRawValue()),
    ),
    { requireSync: true },
  );

  readonly descriptionLength = computed(() => this.formValue().description.length);

  readonly discountPercentage = computed(() => {
    const { price, discountPrice } = this.formValue();
    if (!price || !discountPrice || discountPrice >= price) return 0;
    return Math.round((1 - discountPrice / price) * 100);
  });

  readonly courseProgress = computed(() =>
    Math.round(((this.currentStep() - 1) / (this.steps.length - 1)) * 100),
  );

  readonly selectedCategory = computed(
    () => this.categories().find((c) => c.id === this.formValue().categoryId)?.name ?? '—',
  );

  readonly selectedLevel = computed(
    () => this.levels.find((l) => l.value === this.formValue().level)?.label ?? '—',
  );


  constructor(private readonly route: ActivatedRoute) {
      const id = this.route.snapshot.paramMap.get('id');

  if (id) {
    this.courseId.set(Number(id));
    this.loadCourse(Number(id));
  }
    this.destroyRef.onDestroy(() => this.revokePreview());
  }

  // ── Navigation ──────────────────────────────────────────────
  goTo(step: number): void {
    if (step <= this.maxReachedStep()) this.currentStep.set(step);
  }

  back(): void {
    if (this.currentStep() > 1) this.currentStep.update((s) => s - 1);
  }

  async next(): Promise<void> {
    const step = this.currentStep();
    if (step <= 4 && !this.validateStep(step)) return;

    // Persist as a draft at the end of step 3 so courseId exists before content.
    if (step === 4 && !(await this.persist(false))) return;

    const target = Math.min(step + 1, this.steps.length);
    this.currentStep.set(target);
    this.maxReachedStep.update((m) => Math.max(m, target));
  }

  private validateStep(step: number): boolean {
    const fields: Record<number, FieldName[]> = {
      1: ['title', 'description', 'categoryId', 'level'],
      2: ['duration'],
      3: ['price'], // تم إبعاد discountPrice لأن وجوده اختياري
    };

    const names = fields[step] ?? [];
    names.forEach((n) => this.form.controls[n].markAsTouched());

    let valid = names.every((n) => this.form.controls[n].valid);

    if (step === 1 && !this.selectedImage() && !this.uploadedImage()&&!this.imagePreview()&&!this.courseId()) {
      this.imageError.set('صورة الكورس مطلوبة');
      valid = false;
    }

    if (step === 3) {
      if (this.form.controls.discountPrice.invalid && this.form.controls.discountPrice.value) {
        valid = false;
      }
      if (this.form.hasError('discountTooHigh')) {
        valid = false;
      }
    }

    return valid;
  }

  // ── Validation messages ─────────────────────────────────────
  errorOf(name: FieldName): string | null {
    const c = this.form.controls[name];
    if (!c.touched || !c.errors) return null;
    const e = c.errors;
    if (e['required']) return 'هذا الحقل مطلوب';
    switch (name) {
      case 'title':
        return e['minlength']
          ? 'العنوان يجب أن يحتوي على 5 أحرف على الأقل'
          : 'العنوان يجب ألا يتجاوز 150 حرفًا';
      case 'description':
        return e['minlength']
          ? 'الوصف يجب أن يحتوي على 20 حرفًا على الأقل'
          : 'الوصف يجب ألا يتجاوز 4000 حرف';
      case 'duration':
        return 'المدة يجب أن تكون بين 5 و1000 دقيقة';
      case 'price':
      case 'discountPrice':
        return 'السعر يجب أن يكون بين 100 و10000';
      default:
        return null;
    }
  }

  get discountError(): string | null {
    if (this.form.controls.discountPrice.touched && this.form.hasError('discountTooHigh')) {
      return 'السعر بعد الخصم يجب أن يكون أقل من السعر الأساسي';
    }
    return this.errorOf('discountPrice');
  }

  fieldClass(name: FieldName): string {
    const base =
      'w-full rounded-xl border bg-white px-4 py-3 t text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2';
    return this.errorOf(name)
      ? `${base} border-red-400 focus:ring-red-200`
      : `${base} border-slate-300 focus:border-indigo-600 focus:ring-indigo-600/20`;
  }

  loading = signal(false);
  error = signal(false);
  loadCourse(id: number) {
  this.loading.set(true);

  this.coursesService.getCourseById(id).subscribe({
    next: (course) => {
      console.log('Loaded course:', course);
      this.form.patchValue({
        title: course.title,
        description: course.describtion,
        price: course.price,
        discountPrice: course.discountPrice,
        duration: course.duration,
        level: course.level,
        categoryId: course.category?.id,
       
      });

      this.requirements.set(course.requirements ?? []);
      this.covers.set(course.covers ?? []);
      this.loading.set(false);
      this.imagePreview.set(course.thumbnail);
    },

    error: () => {
      this.loading.set(false);
      this.error.set(true);
    }
  });
}

  stepBadgeClass(id: number): string {
    if (id === this.currentStep()) return 'border-indigo-600 bg-indigo-600 text-white';
    if (id < this.maxReachedStep()) return 'border-indigo-600 bg-indigo-50 text-indigo-700';
    return 'border-slate-300 bg-white text-slate-400';
  }

  // ── Thumbnail ───────────────────────────────────────────────
  onFilePicked(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.setImage(input.files?.[0] ?? null);
    input.value = '';
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    this.setImage(event.dataTransfer?.files?.[0] ?? null);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
  }

  removeImage(): void {
    this.revokePreview();
    this.selectedImage.set(null);
    this.imagePreview.set(null);
    this.uploadedImage.set(null);
  }

  private setImage(file: File | null): void {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.imageError.set('يرجى اختيار ملف صورة فقط');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      this.imageError.set('حجم الصورة يجب ألا يتجاوز 5 ميجابايت');
      return;
    }
    this.revokePreview();
    this.imageError.set(null);
    this.uploadedImage.set(null);
    this.selectedImage.set(file);
    this.imagePreview.set(URL.createObjectURL(file));
  }

  private revokePreview(): void {
    const url = this.imagePreview();
    if (url) URL.revokeObjectURL(url);
  }

  // ── Requirements ────────────────────────────────────────────
  addRequirement(): void {
    const value = this.pendingRequirement.value.trim();
    if (!value) {
      this.requirementError.set('لا يمكن إضافة متطلب فارغ');
      return;
    }
    if (this.requirements().includes(value)) {
      this.requirementError.set('هذا المتطلب مضاف بالفعل');
      return;
    }
    this.requirementError.set(null);
    this.requirements.update((list) => [...list, value]);
    this.pendingRequirement.reset('');
  }
  

  removeRequirement(index: number): void {
    this.requirements.update((list) => list.filter((_, i) => i !== index));
  }
  // ── 2. إضافة الميثودات الخاصة بالتحكم في الـ Covers ──
addCover(): void {
  const value = this.pendingCover.value.trim();
  if (!value) {
    this.coverError.set('لا يمكن إضافة نقطة تغطية فارغة');
    return;
  }
  if (this.covers().includes(value)) {
    this.coverError.set('هذه النقطة مضافة بالفعل');
    return;
  }
  this.coverError.set(null);
  this.covers.update((list) => [...list, value]);
  this.pendingCover.reset('');
}

removeCover(index: number): void {
  this.covers.update((list) => list.filter((_, i) => i !== index));
}

  




 
  // ── Save / publish ──────────────────────────────────────────
  async saveDraft(): Promise<void> {
    if (await this.persist(false)) await this.router.navigate(['/instractor/my-courses']);
  }

  async publish(): Promise<void> {
    if (await this.persist(true)) await this.router.navigate(['/instractor/my-courses']);
  }

  private async persist(isPublished: boolean): Promise<boolean> {
    console.log('Persisting course');
    console.log(isPublished);
    
    this.submitError.set(null);
    this.isSubmitting.set(true);
    try {
      const formData = this.buildFormData(isPublished);
      if (!formData) return false;

      const id = this.courseId();
      const saved = id
        ? await firstValueFrom(this.coursesService.updateCourse(id, formData))
        : await firstValueFrom(this.coursesService.createCourse(formData));

      this.courseId.set(saved.id);
      console.log(this.courseId());
      
      return true;
    } catch (err) {
      console.error('API Persist Error:', err);
      this.submitError.set('تعذّر حفظ الكورس، حاول مرة أخرى');
      return false;
    } finally {
      this.isSubmitting.set(false);
    }
  }

  private buildFormData(isPublished: boolean): FormData | null {
    const v = this.form.getRawValue();
    if (v.categoryId == null || v.level == null || v.price == null || v.duration == null) {
      return null;
    }

    const formData = new FormData();
    formData.append('title', v.title.trim());
    
    // ملاحظة: تم تعديل المفتاح ليطابق اسم الحقـل في الموديل لدى الـ Backend (describtion)
    formData.append('describtion', v.description.trim());
    formData.append('categoryId', String(v.categoryId));
    formData.append('level', String(v.level));
    formData.append('price', String(v.price));
    formData.append('duration', String(v.duration));
    formData.append('isPublished', String(isPublished));

    if (v.discountPrice) {
      formData.append('discountPrice', String(v.discountPrice));
    }

   // إرسال المتطلبات (Requirements)
this.requirements().forEach((req) => {
  formData.append('requirements[]', req);
});

// إرسال النقاط التي يغطيها الكورس (Covers)
this.covers().forEach((cover) => {
  formData.append('covers[]', cover);
});

    const imageFile = this.selectedImage();
    if (imageFile) {
      // إرسال ملف الصورة باسم المفتاح المتوقع لدى الـ Backend
      formData.append('thumbnail', imageFile, imageFile.name);
    }


    return formData;
  }
}