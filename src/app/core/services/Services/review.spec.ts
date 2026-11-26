import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { ReviewService, reviewErrorMessage } from './review';

const fail = (status: number, message?: string | string[]) =>
  new HttpErrorResponse({ status, error: message === undefined ? null : { message } });

describe('reviewErrorMessage', () => {
  it('maps already reviewed (409)', () => {
    expect(reviewErrorMessage(fail(409, 'You already reviewed this course.'))).toContain('من قبل');
  });

  it('maps not enrolled (401)', () => {
    expect(reviewErrorMessage(fail(401, 'You Need TO Purshace This Course Frist'))).toContain(
      'الاشتراك',
    );
  });

  it('maps comment too long (400)', () => {
    const msg = reviewErrorMessage(
      fail(400, ['comment must be shorter than or equal to 200 characters']),
    );
    expect(msg).toContain('200');
  });

  it('maps comment too short (400)', () => {
    const msg = reviewErrorMessage(
      fail(400, ['comment must be longer than or equal to 5 characters']),
    );
    expect(msg).toContain('5');
  });

  it('maps bad rating (400)', () => {
    expect(reviewErrorMessage(fail(400, ['rateing must not be greater than 5']))).toContain(
      'التقييم',
    );
  });

  it('handles no connection and unknown errors', () => {
    expect(reviewErrorMessage(fail(0))).toContain('الاتصال');
    expect(reviewErrorMessage('boom')).toContain('غير متوقع');
  });
});

describe('ReviewService', () => {
  let service: ReviewService;
  let http: HttpTestingController;
  const base = `${environment.apiUrl}review/`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ReviewService);
    http = TestBed.inject(HttpTestingController);
  });

  it('loads the public list of a course', () => {
    service.getCourseReviews(7).subscribe();
    const req = http.expectOne((r) => r.url === `${base}course/7`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('adds, updates and deletes with the backend routes', () => {
    service.addReview(7, { comment: 'كورس ممتاز', rateing: 5 }).subscribe();
    expect(http.expectOne(`${base}add/7`).request.method).toBe('POST');

    service.updateReview(7, 3, { comment: 'كورس ممتاز جدا', rateing: 4 }).subscribe();
    expect(http.expectOne(`${base}update/7/3`).request.method).toBe('PATCH');

    service.deleteReview(7, 3).subscribe();
    expect(http.expectOne(`${base}delete/7/3`).request.method).toBe('DELETE');
  });

  it('turns myReviews into a list of ids', () => {
    let ids: number[] = [];
    service.getMyReviewIds().subscribe((v) => (ids = v));
    http.expectOne(`${base}myReviews`).flush([{ id: 3 }, { id: 9 }]);
    expect(ids).toEqual([3, 9]);
  });
});
