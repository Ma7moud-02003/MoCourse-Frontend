export type LessonType = 'video' | 'pdf' | 'text';

// Full lesson as returned by the lesson details endpoint.
export interface LessonDetails {
  id: number;
  title: string;
  description: string | null;
  type: LessonType;
  videoUrl: string | null;
  pdfUrl: string | null;
  videoPublicId: string | null;
  pdfPublicId: string | null;
  content: string | null;
  duration: number | null; // seconds
  order: number;
  fileSize: number | null;
  isPreview: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EnrollmentStatus {
  isEnrolled: boolean;
}