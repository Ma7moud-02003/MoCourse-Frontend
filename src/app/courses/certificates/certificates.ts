import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CertificateService, CertificateSummary } from '../../core/certificate.service';
import { errorMessage } from '../../core/error-message';
import { AppFooter } from '../../layout/app-footer/app-footer';
import { AppHeader } from '../../layout/app-header/app-header';

// "شهاداتي": the certificates the student earned by finishing courses.
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

  ngOnInit() {
    this.certificates.mine().subscribe({
      next: (list) => {
        this.items.set(list);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }

  // 2026-11-27 -> "27 نوفمبر 2026"
  dateText(value: string): string {
    return new Date(value).toLocaleDateString('ar-EG-u-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' });
  }
}
