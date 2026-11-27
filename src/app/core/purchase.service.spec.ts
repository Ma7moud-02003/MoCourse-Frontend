import { describe, expect, it } from 'vitest';
import { isWaitingForTeacher } from './purchase.service';

// A join request answers with one of two sentences: "go and pay", or "the request is
// with the teacher". This checks we read both of them the right way round.
describe('isWaitingForTeacher', () => {
  it('reads the answer that says the request is with the teacher', () => {
    expect(isWaitingForTeacher('طلبك قيد المراجعة من المدرس')).toBe(true);
  });

  it('reads the answer that sends him to pay as not waiting yet', () => {
    expect(isWaitingForTeacher('اذهب للدفع ثم اضف بيانات الدفع وانتظر التاكيد')).toBe(false);
  });
});
