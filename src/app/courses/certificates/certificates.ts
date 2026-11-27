import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  CertificateCheck,
  CertificateDetails,
  CertificateService,
  CertificateSummary,
} from '../../core/certificate.service';
import { errorMessage } from '../../core/error-message';
import { AppFooter } from '../../layout/app-footer/app-footer';
import { AppHeader } from '../../layout/app-header/app-header';

// "شهاداتي": the certificates the student earned, a preview of the chosen one,
// and a box to check any certificate number.
@Component({
  selector: 'app-certificates',
  imports: [AppHeader, AppFooter, RouterLink],
  templateUrl: './certificates.html',
})
export class Certificates implements OnInit {
  private certificates = inject(CertificateService);

  items = signal<CertificateSummary[]>([]);
  loading = signal(true);
  error = signal('');

  // the certificate shown in the big preview
  selectedId = signal(0);
  selected = signal<CertificateDetails | null>(null);

  // the "check a number" box
  checking = signal(false);
  checkResult = signal<CertificateCheck | null>(null);
  checkError = signal('');

  ngOnInit() {
    this.certificates.mine().subscribe({
      next: (list) => {
        this.items.set(list);
        this.loading.set(false);
        if (list.length > 0) this.select(list[0].id);
      },
      error: (err) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }

  // Show one certificate in the preview (the list only has a short version, so we ask for the full one).
  select(id: number) {
    this.selectedId.set(id);
    this.selected.set(null);
    this.certificates.one(id).subscribe({
      next: (c) => this.selected.set(c),
      error: () => {},
    });
  }

  // The "تحقق" button.
  check(number: string) {
    const text = number.trim();
    this.checkResult.set(null);
    this.checkError.set('');
    if (!text) {
      this.checkError.set('اكتب رقم الشهادة الأول.');
      return;
    }
    this.checking.set(true);
    this.certificates.verify(text).subscribe({
      next: (result) => {
        this.checkResult.set(result);
        this.checking.set(false);
      },
      error: (err) => {
        this.checkError.set(errorMessage(err));
        this.checking.set(false);
      },
    });
  }

  // 2026-11-27 -> "27 نوفمبر 2026"
  dateText(value: string): string {
    return new Date(value).toLocaleDateString('ar-EG-u-nu-latn', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }
}
