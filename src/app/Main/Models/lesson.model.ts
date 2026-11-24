export enum LessonType {
  VIDEO = 'video', // NEEDS TO BE CHANGED لو الـ backend يستخدم قيمًا مختلفة
  PDF = 'pdf', // NEEDS TO BE CHANGED لو الـ backend يستخدم قيمًا مختلفة
}

export interface Lesson {
  id: number;
  title: string;
  description?: string | null;
  type: LessonType;
  videoUrl?: string | null;
  pdfUrl?: string | null;
  videoPublicId?: string | null;
  pdfPublicId?: string | null;
  content?: string | null;
  duration?: number | null;
  order: number;
  isPreview: boolean;
  fileSize?: number | null;
  createdAt?: string;
  updatedAt?: string;
  section?: {
    id: number;
  };
}

export interface CreateLessonRequest {
  title: string;
  description?: string;
  type: LessonType;
  order: number;
  sectionId: number;
  isPreview: boolean;
  content?: string;
}

export interface UpdateLessonRequest {
  title?: string;
  description?: string;
  type?: LessonType;
  order?: number;
  isPreview?: boolean;
  content?: string;
}