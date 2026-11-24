export interface SectionModel {
  id: number;
  title: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface SectionsResponse {
  data: SectionModel[];
  pageNum: string;
  sectionsPerPage: number;
  isEnrolled:boolean;
  canAccess:boolean;
}

export interface Lesson {
  id: number;
  title: string;
  duration: number | null;
  order: number;
  isPreview: boolean;
}