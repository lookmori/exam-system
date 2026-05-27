export const ROLES = {
  SUPER_ADMIN: "super_admin",
  SCHOOL_ADMIN: "school_admin",
  TEACHER: "teacher",
  STUDENT: "student",
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: "超级管理员",
  school_admin: "学校管理员",
  teacher: "教师",
  student: "学生",
};

export const QUESTION_TYPES = {
  SINGLE_CHOICE: "single_choice",
  MULTI_CHOICE: "multi_choice",
  TRUE_FALSE: "true_false",
  PROGRAMMING: "programming",
} as const;

export type QuestionType = (typeof QUESTION_TYPES)[keyof typeof QUESTION_TYPES];

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  single_choice: "单选题",
  multi_choice: "多选题",
  true_false: "判断题",
  programming: "编程题",
};

export const PAPER_STATUS = {
  DRAFT: "draft",
  PUBLISHED: "published",
  ENDED: "ended",
  REMOVED: "removed",
} as const;

export type PaperStatus = (typeof PAPER_STATUS)[keyof typeof PAPER_STATUS];

export const PAPER_STATUS_LABELS: Record<PaperStatus, string> = {
  draft: "草稿",
  published: "已发布",
  ended: "已结束",
  removed: "已下架",
};

export const EXAM_RECORD_STATUS = {
  IN_PROGRESS: "in_progress",
  SUBMITTED: "submitted",
  GRADED: "graded",
} as const;

export type ExamRecordStatus =
  (typeof EXAM_RECORD_STATUS)[keyof typeof EXAM_RECORD_STATUS];

export const PAGE_SIZE = 20;

export const IMAGE_ACCEPT_TYPES = ".jpg,.jpeg,.png,.gif";
export const IMAGE_MAX_SIZE = 5 * 1024 * 1024; // 5MB
export const EXCEL_ACCEPT_TYPES = ".xlsx,.xls";

export const AUTO_SAVE_INTERVAL = 30 * 1000; // 30 seconds
export const EXAM_TIME_WARNING = 5 * 60; // 5 minutes in seconds

export const ROLE_HOME: Record<UserRole, string> = {
  super_admin: "/admin/dashboard",
  school_admin: "/admin/dashboard",
  teacher: "/admin/dashboard",
  student: "/student/dashboard",
};

export const SIDEBAR_MENUS: Record<
  string,
  { label: string; href: string; icon: string }[]
> = {
  super_admin: [
    { label: "数据总览", href: "/admin/super/overview", icon: "bar-chart" },
    { label: "学校管理", href: "/admin/super/schools", icon: "school" },
    { label: "用户管理", href: "/admin/super/users", icon: "users" },
    { label: "系统配置", href: "/admin/super/system", icon: "settings" },
  ],
  school_admin: [
    { label: "数据仪表盘", href: "/admin/dashboard", icon: "bar-chart" },
    { label: "班级管理", href: "/admin/school/classes", icon: "book-open" },
    { label: "教师管理", href: "/admin/school/teachers", icon: "user-check" },
    { label: "学生管理", href: "/admin/school/students", icon: "users" },
    { label: "考试管理", href: "/admin/school/exams", icon: "clipboard" },
    { label: "数据统计", href: "/admin/school/statistics", icon: "trending-up" },
  ],
  teacher: [
    { label: "数据仪表盘", href: "/admin/dashboard", icon: "bar-chart" },
    { label: "班级管理", href: "/admin/school/classes", icon: "book-open" },
    { label: "题库管理", href: "/admin/teacher/questions", icon: "library" },
    { label: "试卷管理", href: "/admin/teacher/papers", icon: "file-text" },
    { label: "阅卷中心", href: "/admin/teacher/grading", icon: "check-circle" },
    { label: "成绩管理", href: "/admin/teacher/scores", icon: "award" },
  ],
};
