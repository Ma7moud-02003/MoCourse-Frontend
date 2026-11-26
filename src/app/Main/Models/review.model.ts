/** One review as the public list endpoint returns it (no user id, no email). */
export interface Review {
  id: number;
  comment: string;
  /** spelled like the backend field */
  rateing: number;
  createdAt: string;
  updatedAt: string;
  user: { fullName: string; avatar: string | null };
}

/** What the student sends when adding or editing a review. */
export interface ReviewInput {
  comment: string;
  rateing: number;
}

/** The backend rules, kept in one place so the form and the tests use the same numbers. */
export const REVIEW_RULES = {
  commentMin: 5,
  commentMax: 200,
  ratingMin: 1,
  ratingMax: 5,
};
