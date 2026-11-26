import { HttpErrorResponse } from '@angular/common/http';

// Turns a backend error into a clear Arabic sentence for the user.
export function errorMessage(err: HttpErrorResponse): string {
  // status 0 means the request never reached the server
  if (err.status === 0) return 'مش قادرين نوصل للسيرفر، اتأكد إنه شغال وجرب تاني.';
  // the backend limits login/register attempts
  if (err.status === 429) return 'محاولات كتير، استنى شوية وجرب تاني.';

  // NestJS sends the message as text, or as a list when validation fails
  const msg = Array.isArray(err.error?.message) ? err.error.message.join(' ') : err.error?.message;
  if (msg === 'Invalid Cardinality') return 'الإيميل أو كلمة السر غلط.';
  if (msg === 'Email is already used') return 'الإيميل ده مسجّل قبل كده، جرّب تسجّل دخول.';
  return 'حصلت مشكلة، جرّب تاني بعد شوية.';
}
