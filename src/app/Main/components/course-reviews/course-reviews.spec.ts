import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { CourseReviews } from './course-reviews';

const base = `${environment.apiUrl}review/`;
const review = (id: number, name: string, rateing = 4) => ({
  id,
  comment: 'تعليق تجريبي',
  rateing,
  createdAt: '2026-11-20T10:00:00.000Z',
  updatedAt: '2026-11-20T10:00:00.000Z',
  user: { fullName: name, avatar: null },
});

async function setup(canReview: boolean) {
  TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting()],
  });
  const fixture = TestBed.createComponent(CourseReviews);
  fixture.componentRef.setInput('courseId', 5);
  fixture.componentRef.setInput('canReview', canReview);
  await fixture.whenStable();
  const http = TestBed.inject(HttpTestingController);
  return { fixture, http, el: fixture.nativeElement as HTMLElement };
}

describe('CourseReviews', () => {
  it('shows the public list for a visitor, without a form or edit buttons', async () => {
    const { fixture, http, el } = await setup(false);
    http.expectOne((r) => r.url === `${base}course/5`).flush([review(1, 'سارة'), review(2, 'علي')]);
    await fixture.whenStable();

    expect(el.textContent).toContain('سارة');
    expect(el.textContent).toContain('علي');
    expect(el.querySelector('form')).toBeNull();
    expect(el.textContent).not.toContain('تعديل');
  });

  it('lets an enrolled student edit only their own review and hides the add form', async () => {
    const { fixture, http, el } = await setup(true);
    http.expectOne((r) => r.url === `${base}course/5`).flush([review(1, 'سارة'), review(2, 'علي')]);
    http.expectOne(`${base}myReviews`).flush([{ id: 2 }]);
    await fixture.whenStable();

    expect(el.querySelector('form')).toBeNull();
    expect(el.querySelectorAll('li').length).toBe(2);
    expect(el.textContent?.match(/تعديل/g)?.length).toBe(1);
  });

  it('blocks a too-short comment before calling the backend', async () => {
    const { fixture, http, el } = await setup(true);
    http.expectOne((r) => r.url === `${base}course/5`).flush([]);
    http.expectOne(`${base}myReviews`).flush([]);
    await fixture.whenStable();

    fixture.componentInstance.rating.set(5);
    fixture.componentInstance.comment.set('ok');
    fixture.componentInstance.submit();
    await fixture.whenStable();

    expect(fixture.componentInstance.formError()).toContain('5');
    http.expectNone(`${base}add/5`);
  });

  it('shows the Arabic message when the backend says already reviewed', async () => {
    const { fixture, http } = await setup(true);
    http.expectOne((r) => r.url === `${base}course/5`).flush([]);
    http.expectOne(`${base}myReviews`).flush([]);
    await fixture.whenStable();

    fixture.componentInstance.rating.set(5);
    fixture.componentInstance.comment.set('كورس ممتاز جدا');
    fixture.componentInstance.submit();
    http
      .expectOne(`${base}add/5`)
      .flush({ message: 'You already reviewed this course.' }, { status: 409, statusText: 'Conflict' });

    expect(fixture.componentInstance.formError()).toContain('من قبل');
  });
});
