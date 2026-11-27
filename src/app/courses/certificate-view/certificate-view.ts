import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CertificateDetails, CertificateService } from '../../core/certificate.service';
import { AppFooter } from '../../layout/app-footer/app-footer';
import { AppHeader } from '../../layout/app-header/app-header';

// One certificate on a page he can print or save as PDF.
@Component({
  selector: 'app-certificate-view',
  imports: [AppHeader, AppFooter, RouterLink],
  templateUrl: './certificate-view.html',
})
export class CertificateView implements OnInit {
  private route = inject(ActivatedRoute);
  private certificates = inject(CertificateService);

  certificate = signal<CertificateDetails | null>(null);
  loading = signal(true);
  errorText = signal('');

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.loading.set(false);
      this.errorText.set('الشهادة مش موجودة.');
      return;
    }
    this.certificates.one(id).subscribe({
      next: (certificate) => {
        this.certificate.set(certificate);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        // 401 means it belongs to someone else, 404 means there is no such certificate
        this.errorText.set(
          err.status === 401 || err.status === 404
            ? 'الشهادة دي مش موجودة أو مش بتاعتك.'
            : 'حصلت مشكلة، جرّب تاني بعد شوية.',
        );
      },
    });
  }

  print() {
    window.print();
  }

  dateText(value: string): string {
    return new Date(value).toLocaleDateString('ar-EG-u-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' });
  }
}
