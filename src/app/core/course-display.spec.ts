import { describe, expect, it } from 'vitest';
import { CourseCard } from './course.service';
import {
  coursesCountText,
  finalPrice,
  hasDiscount,
  isNew,
  lessonTime,
  priceText,
} from './course-display';

// A tiny course we can change per test. Only the fields the helpers read are filled.
function course(overrides: Partial<CourseCard> = {}): CourseCard {
  return {
    id: 1,
    title: 'كورس تجريبي',
    price: 350,
    discountPrice: null,
    thumbnail: '',
    createdAt: '2026-11-01T10:00:00.000Z',
    category: { name: 'رياضيات' },
    Instractor: { id: 7, fullName: 'أحمد', avatar: null },
    ...overrides,
  };
}

describe('finalPrice', () => {
  it('uses the discount when there is one', () => {
    expect(finalPrice(course({ price: 350, discountPrice: 250 }))).toBe(250);
  });

  it('ignores a discount that is 0, negative, or higher than the price', () => {
    expect(finalPrice(course({ price: 350, discountPrice: 0 }))).toBe(350);
    expect(finalPrice(course({ price: 350, discountPrice: -50 }))).toBe(350);
    expect(finalPrice(course({ price: 350, discountPrice: 400 }))).toBe(350);
  });
});

describe('hasDiscount', () => {
  it('is true only when the student pays less than the normal price', () => {
    expect(hasDiscount(course({ price: 350, discountPrice: 250 }))).toBe(true);
    expect(hasDiscount(course({ price: 350, discountPrice: null }))).toBe(false);
  });
});

describe('priceText', () => {
  it('writes the price with the Egyptian pound', () => {
    expect(priceText(350)).toBe('350 ج.م');
    expect(priceText(1250)).toBe('1,250 ج.م');
  });
});

describe('isNew', () => {
  const now = new Date('2026-11-27T10:00:00.000Z').getTime();

  it('marks a course added a few days ago', () => {
    expect(isNew('2026-11-25T10:00:00.000Z', now)).toBe(true);
  });

  it('does not mark an older course', () => {
    expect(isNew('2026-10-01T10:00:00.000Z', now)).toBe(false);
  });

  it('does not break on a bad date', () => {
    expect(isNew('not a date', now)).toBe(false);
  });
});

describe('coursesCountText', () => {
  it('speaks Arabic correctly for every count', () => {
    expect(coursesCountText(0)).toBe('مفيش كورسات');
    expect(coursesCountText(1)).toBe('كورس واحد');
    expect(coursesCountText(2)).toBe('كورسان');
    expect(coursesCountText(5)).toBe('5 كورسات');
    expect(coursesCountText(12)).toBe('12 كورس');
  });
});

describe('lessonTime', () => {
  it('writes a lesson length as minutes:seconds', () => {
    expect(lessonTime(750)).toBe('12:30');
    expect(lessonTime(45)).toBe('0:45');
  });

  it('shows nothing when there is no length', () => {
    expect(lessonTime(null)).toBe('');
    expect(lessonTime(0)).toBe('');
  });
});
