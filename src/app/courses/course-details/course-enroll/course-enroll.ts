import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, input, signal } from '@angular/core';
import { priceText } from '../../../core/course-display';
import { errorMessage } from '../../../core/error-message';
import { isWaitingForTeacher, PaymentInfo, PaymentMethod, PurchaseService } from '../../../core/purchase.service';

// The "join this course" card on the course page.
// The money moves outside the site, so the steps are: ask to join, pay the teacher,
// send a screenshot of the transfer, then wait for the teacher to approve.
@Component({
  selector: 'app-course-enroll',
  templateUrl: './course-enroll.html',
})
export class CourseEnroll {
  private purchases = inject(PurchaseService);

  courseId = input.required<number>();
  price = input.required<number>();

  // idle   = we did not ask the backend anything yet
  // pay    = the request is open, he still has to pay and send the proof
  // review = the proof reached the teacher and we wait for his answer
  step = signal<'idle' | 'pay' | 'review'>('idle');

  // helpers the template uses
  readonly priceText = priceText;

  joining = signal(false);
  note = signal(''); // one line when the join request itself fails

  paymentInfo = signal<PaymentInfo | null>(null);
  paymentNote = signal('');

  // the form he fills after paying
  readonly methods: { value: PaymentMethod; label: string }[] = [
    { value: 'instapay', label: 'إنستاباي' },
    { value: 'vodafonCach', label: 'فودافون كاش' },
    { value: 'orangeCash', label: 'أورنج كاش' },
    { value: 'bankAccount', label: 'تحويل بنكي' },
  ];
  method = signal<PaymentMethod>('instapay');
  transactionId = signal('');
  screenshot = signal<File | null>(null);
  formError = signal('');
  sending = signal(false);

  // The biggest screenshot the backend accepts (10 MB).
  private readonly maxProofBytes = 10 * 1024 * 1024;

  // Step one: ask the backend to open a join request for this course.
  join() {
    this.joining.set(true);
    this.note.set('');

    this.purchases.join(this.courseId()).subscribe({
      next: (answer) => {
        this.joining.set(false);
        // He already sent the proof before: the request is with the teacher.
        if (isWaitingForTeacher(answer.message)) {
          this.step.set('review');
          return;
        }
        this.step.set('pay');
        this.loadPaymentInfo();
      },
      error: (err: HttpErrorResponse) => {
        this.joining.set(false);
        this.note.set(this.joinError(err));
      },
    });
  }

  private joinError(err: HttpErrorResponse): string {
    const body = err.error as { message?: string } | null;
    if (body?.message === 'You alrealdy own this course') return 'إنت مشترك في الكورس ده بالفعل.';
    if (err.status === 403) return 'الاشتراك متاح لحساب طالب بس.';
    return errorMessage(err);
  }

  // Where to send the money. A teacher who did not fill his numbers yet answers 404,
  // and we say that instead of showing an empty list.
  private loadPaymentInfo() {
    this.paymentNote.set('');
    this.purchases.paymentInfo(this.courseId()).subscribe({
      next: (info) => this.paymentInfo.set(info),
      error: (err: HttpErrorResponse) => {
        this.paymentInfo.set(null);
        this.paymentNote.set(
          err.status === 404
            ? 'المدرّس لسه مضافش بيانات الدفع. كلّمه وهو هيقولك تحوّل فين، وبعدها ارفع صورة التحويل هنا.'
            : 'مش قادرين نجيب بيانات الدفع دلوقتي، جرّب تحدّث الصفحة.',
        );
      },
    });
  }

  // We check the screenshot here too, so he knows about a wrong file before uploading it.
  onScreenshot(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.formError.set('');
    this.screenshot.set(null);
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      input.value = '';
      this.formError.set('الملف لازم يكون صورة، زي صورة من الشاشة أو من الموبايل.');
      return;
    }
    if (file.size > this.maxProofBytes) {
      input.value = '';
      this.formError.set('الصورة كبيرة أوي، خليها أقل من 10 ميجا.');
      return;
    }
    this.screenshot.set(file);
  }

  // Step two: send the proof to the teacher.
  sendProof() {
    const screenshot = this.screenshot();
    if (!this.transactionId().trim()) {
      this.formError.set('اكتب رقم العملية اللي ظهر لك بعد ما حوّلت.');
      return;
    }
    if (!screenshot) {
      this.formError.set('ارفع صورة إثبات التحويل.');
      return;
    }

    this.formError.set('');
    this.sending.set(true);
    this.purchases.sendProof(this.courseId(), this.method(), this.transactionId().trim(), screenshot).subscribe({
      next: () => {
        this.sending.set(false);
        this.step.set('review');
      },
      error: (err: HttpErrorResponse) => {
        this.sending.set(false);
        this.formError.set(
          err.status === 500
            ? 'الصورة مش راضية تترفع دلوقتي. جرّب تاني بعد شوية، ولو المشكلة كملت كلّم المدرّس.'
            : errorMessage(err),
        );
      },
    });
  }
}
