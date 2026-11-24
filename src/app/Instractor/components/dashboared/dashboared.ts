import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { InstructorDashboardInsights, InstructorDashboardStats } from '../../../Main/Models/instractor.dashoared';
import { InstructorDashboardService } from '../../../core/services/dashboared';



type StatIcon = 'book' | 'users' | 'wallet' | 'cart' | 'clock' | 'check';
type StatTone = 'blue' | 'green' | 'orange' | 'amber' | 'indigo';

interface StatCard {
  label: string;
  value: string;
  icon: StatIcon;
  tone: StatTone;
}

type StatusKey = 'pending' | 'approved' | 'rejected' | 'unknown';

const TONE_CLASSES: Record<StatTone, string> = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-emerald-50 text-emerald-600',
  orange: 'bg-orange-50 text-orange-600',
  amber: 'bg-amber-50 text-amber-600',
  indigo: 'bg-indigo-50 text-indigo-600',
};

const PAYMENT_LABELS: Record<string, string> = {
  instapay: 'إنستاباي',
  vodafone_cash: 'فودافون كاش',
  vodafonecash: 'فودافون كاش',
  card: 'بطاقة بنكية',
  credit_card: 'بطاقة بنكية',
  bank_transfer: 'تحويل بنكي',
  fawry: 'فوري',
  paypal: 'باي بال',
};

const APPROVED = ['APPROVED', 'ACCEPTED', 'COMPLETED', 'PAID', 'SUCCESS', 'ACTIVE'];
const REJECTED = ['REJECTED', 'DECLINED', 'FAILED', 'CANCELLED', 'CANCELED'];

@Component({
  imports: [RouterModule],
  selector: 'app-dashboared',
  styles: ``,
  templateUrl: './dashboared.html',
})
export class Dashboared {

  private readonly service = inject(InstructorDashboardService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly stats = signal<InstructorDashboardStats | null>(null);
  readonly insights = signal<InstructorDashboardInsights | null>(null);

  readonly skeletons = [1, 2, 3, 4, 5, 6];

  // ===== دائرة التقدم =====
  readonly radius = 52;
  readonly circumference = 2 * Math.PI * this.radius;

  readonly percentage = computed(() => {
    const p = Number(this.stats()?.completionPercentage ?? 0);
    return Math.min(100, Math.max(0, Math.round(p)));
  });

  readonly dashOffset = computed(
    () => this.circumference * (1 - this.percentage() / 100),
  );

  readonly statCards = computed<StatCard[]>(() => {
    const s = this.stats();
    if (!s) return [];
    return [
      { label: 'إجمالي الكورسات', value: this.num(s.coursesCount), icon: 'book', tone: 'blue' },
      { label: 'الطلاب المسجلون', value: this.num(s.enrolledStudents), icon: 'users', tone: 'indigo' },
      { label: 'إجمالي الأرباح', value: this.money(Number(s.totalProfite)), icon: 'wallet', tone: 'green' },
      { label: 'إجمالي المشتريات', value: this.num(s.totalPurchase), icon: 'cart', tone: 'orange' },
      { label: 'بانتظار الموافقة', value: this.num(s.wateing_aproave), icon: 'clock', tone: 'amber' },
      { label: 'نسبة الإكمال', value: `${this.num(s.completionPercentage)}%`, icon: 'check', tone: 'blue' },
    ];
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      stats: this.service.getStats(),
      insights: this.service.getInsights(),
    }).subscribe({
      next: ({ stats, insights }) => {
        this.stats.set(stats);
        this.insights.set(insights);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('تعذّر تحميل بيانات لوحة التحكم. تحقق من الاتصال ثم أعد المحاولة.');
        this.loading.set(false);
      },
    });
  }

  // ===== أدوات التنسيق =====
  tone(t: StatTone): string {
    return TONE_CLASSES[t];
  }

  num(value: number | string): string {
    return new Intl.NumberFormat('ar-EG').format(Number(value) || 0);
  }

  money(value: number): string {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      maximumFractionDigits: 0,
    }).format(Number(value) || 0);
  }

  date(iso: string): string {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    return new Intl.DateTimeFormat('ar-EG', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(d);
  }

  paymentLabel(method: string): string {
    return PAYMENT_LABELS[(method ?? '').toLowerCase()] ?? 'طريقة أخرى';
  }

  statusKey(status: string): StatusKey {
    const s = (status ?? '').toUpperCase();
    if (s === 'WAITING_APPROVAL' || s === 'PENDING') return 'pending';
    if (APPROVED.includes(s)) return 'approved';
    if (REJECTED.includes(s)) return 'rejected';
    return 'unknown';
  }

  statusLabel(status: string): string {
    const labels: Record<StatusKey, string> = {
      pending: 'قيد المراجعة',
      approved: 'مقبول',
      rejected: 'مرفوض',
      unknown: 'غير معروف',
    };
    return labels[this.statusKey(status)];
  }

  statusClass(status: string): string {
    const classes: Record<StatusKey, string> = {
      pending: 'bg-amber-50 text-amber-700 ring-amber-200',
      approved: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
      rejected: 'bg-red-50 text-red-700 ring-red-200',
      unknown: 'bg-gray-100 text-gray-600 ring-gray-200',
    };
    return classes[this.statusKey(status)];
  }
}
