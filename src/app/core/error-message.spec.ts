import { HttpErrorResponse } from '@angular/common/http';
import { describe, expect, it } from 'vitest';
import { errorMessage } from './error-message';

// A test checks that a small piece of code gives the answer we expect.
describe('errorMessage', () => {
  it('explains a wrong email or password', () => {
    const err = new HttpErrorResponse({ status: 400, error: { message: 'Invalid Cardinality' } });
    expect(errorMessage(err)).toBe('الإيميل أو كلمة السر غلط.');
  });

  it('explains a used email', () => {
    const err = new HttpErrorResponse({ status: 400, error: { message: 'Email is already used' } });
    expect(errorMessage(err)).toContain('مسجّل قبل كده');
  });

  it('explains too many attempts', () => {
    expect(errorMessage(new HttpErrorResponse({ status: 429 }))).toContain('محاولات كتير');
  });

  it('explains when the server is off', () => {
    expect(errorMessage(new HttpErrorResponse({ status: 0 }))).toContain('للسيرفر');
  });
});
