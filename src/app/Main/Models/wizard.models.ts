
// ASSUMPTION: replace with your existing CourseLevel enum / Category model if they already exist.
export enum CourseLevel {
  Beginner = 'beginner',
  Intermediate = 'intermediate',
  Advanced = 'advanced',
}

export interface Category {
  id: number;
  name: string;
}

export interface Lesson {
  id: string; // temporary client id until the Lesson API is available
  title: string;
}

export interface Quiz {
  id: string;
  title: string;
}


export interface UploadedImage {
  url: string;
  publicId: string;
}

/** What the instructor actually enters. `describtion` mirrors the backend entity spelling. */
export interface CoursePayload {
  title: string;
  describtion: string;
  categoryId: number;
  level: CourseLevel;
  price: number;
  discountPrice?: number;
  duration: number;
  requirements: string[];
  thumbnail: string;
  publicId: string;
  isPublished: boolean;
  category: Category;
  covers: string[];
  Instractor: {
    id: number;
    fullName: string;
    email:string;
    avatar:string;
  };
    isEnrolled:boolean;
    canAccess:boolean;
     quizzes:{
    id:number
    title:string
  }
}


export interface Course extends CoursePayload {
  id: number;
}