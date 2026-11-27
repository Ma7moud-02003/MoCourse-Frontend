import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { errorMessage } from '../../core/error-message';
import { MyPaymentInfo, PaymentInfoBody, TeacherService } from '../../core/teacher.service';
import { AppFooter } from '../../layout/app-footer/app-footer';
import { AppHeader } from '../../layout/app-header/app-header';

// The numbers his students send the money to (InstaPay, Vodafone Cash ...).
@Component({
  selector: 'app-payment-info',
  imports: [RouterLink, AppHeader, AppFooter],
  templateUrl: './payment-info.html',
})
export class PaymentInfo implements OnInit {
  private teacher = inject(TeacherService);

  paymentInfo = signal<MyPaymentInfo | null>(null);
  paymentSaving = signal(false);
  paymentNote = signal('');
  paymentSaved = signal(false);

  // the form he fills (empty strings so the inputs are never "undefined")
  form = signal<PaymentInfoBody>({
    instapay: '',
    vodafoneCash: '',
    orangeCash: '',
    bankAccount: '',
    ownerName: '',
  });

  ngOnInit() {
    this.loadPaymentInfo();
  }

  loadPaymentInfo() {
    this.teacher.myPaymentInfo().subscribe({
      next: (info) => {
        this.paymentInfo.set(info);
        this.form.set({
          instapay: info.instapay ?? '',
          vodafoneCash: info.vodafonCach ?? '',
          orangeCash: info.orangeCash ?? '',
          bankAccount: info.bankAccount ?? '',
          ownerName: info.ownerName ?? '',
        });
      },
      // 404 simply means he has not saved any numbers yet, which is not an error to show
      error: () => this.paymentInfo.set(null),
    });
  }

  setField(field: keyof PaymentInfoBody, value: string) {
    this.form.update((all) => ({ ...all, [field]: value }));
  }

  savePaymentInfo() {
    const info = this.form();
    if (!info.ownerName.trim()) {
      this.paymentNote.set('اكتب اسم صاحب الحساب اللي الطالب هيحوّل عليه.');
      return;
    }

    this.paymentSaving.set(true);
    this.paymentNote.set('');
    this.teacher.savePaymentInfo(info, this.paymentInfo() !== null).subscribe({
      next: () => {
        this.paymentSaving.set(false);
        this.paymentSaved.set(true);
      },
      error: (err: HttpErrorResponse) => {
        this.paymentSaving.set(false);
        this.paymentNote.set(this.paymentError(err));
      },
    });
  }

  // The backend checks each number's shape, so its own message is the useful one here.
  private paymentError(err: HttpErrorResponse): string {
    const body = err.error as { message?: string | string[] } | null;
    const raw = Array.isArray(body?.message) ? body?.message.join(' ') : body?.message;
    if (raw?.includes('Vodafone Cash'))
      return 'رقم فودافون كاش لازم يبقى 11 رقم ويبدأ بـ 010 أو 011 أو 012 أو 015.';
    if (raw?.includes('Orange Cash'))
      return 'رقم أورنج كاش لازم يبقى 11 رقم ويبدأ بـ 010 أو 011 أو 012 أو 015.';
    if (raw?.includes('bankAccount')) return 'رقم الحساب البنكي لازم يبقى بين 10 و34 رقم.';
    if (raw?.includes('instapay')) return 'رقم إنستاباي لازم يبقى بين 5 و100 حرف.';
    return errorMessage(err);
  }
}
