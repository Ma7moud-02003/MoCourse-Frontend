import { CourseCard } from './course.service';

// The price the student actually pays: the discount when there is one, otherwise the normal price.
export function finalPrice(course: CourseCard): number {
  const discount = course.discountPrice;
  const hasRealDiscount = typeof discount === 'number' && discount > 0 && discount < course.price;
  return hasRealDiscount ? discount : course.price;
}

export function hasDiscount(course: CourseCard): boolean {
  return finalPrice(course) !== course.price;
}

// 350 -> "350 ج.م" / 1250 -> "1,250 ج.م"
export function priceText(price: number): string {
  return `${new Intl.NumberFormat('en-US').format(price)} ج.م`;
}

// A course added in the last 14 days gets the "جديد" badge.
export function isNew(createdAt: string, now: number = Date.now()): boolean {
  const added = new Date(createdAt).getTime();
  if (Number.isNaN(added)) return false;
  const twoWeeks = 14 * 24 * 60 * 60 * 1000;
  return now - added < twoWeeks;
}

// Arabic counts change with the number: 1 كورس, 2 كورسان, 3-10 كورسات, 11+ كورس.
export function coursesCountText(total: number): string {
  if (total === 0) return 'مفيش كورسات';
  if (total === 1) return 'كورس واحد';
  if (total === 2) return 'كورسان';
  if (total <= 10) return `${total} كورسات`;
  return `${total} كورس`;
}

// A lesson length in seconds -> "12:30". Nothing is shown when the teacher did not set one.
export function lessonTime(seconds: number | null): string {
  if (!seconds || seconds <= 0) return '';
  const minutes = Math.floor(seconds / 60);
  const rest = Math.floor(seconds % 60);
  return `${minutes}:${rest.toString().padStart(2, '0')}`;
}
