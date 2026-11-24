export interface InstructorDashboardStats {
  coursesCount: number;
  enrolledStudents: number;
  totalPurchase: number;
  wateing_aproave: number;
  totalProfite: string;
  totalStudents: number;
  completedStudents: number;
  completionPercentage: number;
}

export interface DashboardPurchase {
  id: number;
  enrolledAt: string;
  status: string;
  paymentMethod: string;
  transactionId: string;
  amount: number;
  thumbnail: string;
  publicId: string;
  user: {
    id: number;
    fullName: string;
    avatar: string;
  };
  course: {
    title: string;
    price: number;
    discountPrice: number;
  };
}

export interface InstructorDashboardInsights {
  lastPurchase: DashboardPurchase[];
  mostCompletedLesson: {
    lessonId: number;
    lessonTitle: string;
    watchedCount: string;
  } | null;
  mostCoursePurshaced: {
    courseId: number;
    courseTitle: string;
    coursePrice: number;
    purchaseCount: string;
  } | null;
}