import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().min(2, "用户名至少2个字符"),
  password: z.string().min(6, "密码至少6个字符"),
});

export const userCreateSchema = z.object({
  name: z.string().optional(),
  username: z.string().min(2, "用户名至少2个字符").optional(),
  password: z.string().min(6, "密码至少6个字符").optional(),
  role: z.enum(["super_admin", "school_admin", "teacher", "student"]),
  schoolId: z.string().optional(),
  classId: z.string().optional(),
});

export const schoolSchema = z.object({
  schoolName: z.string().min(2, "学校名称至少2个字符"),
  status: z.enum(["active", "disabled"]).optional(),
});

export const classSchema = z.object({
  className: z.string().min(1, "班级名称不能为空"),
  schoolId: z.string().min(1, "请选择学校"),
});

export const questionSchema = z.object({
  questionType: z.enum([
    "single_choice",
    "multi_choice",
    "true_false",
    "programming",
  ]),
  title: z.string().min(1, "题目题干不能为空"),
  titleImgs: z.array(z.string()).optional(),
  optionContent: z.record(z.string(), z.string()).optional(),
  optionImgs: z.record(z.string(), z.array(z.string())).optional(),
  score: z.number().min(1, "分值至少为1"),
  answer: z.string().min(1, "请输入答案"),
  analysis: z.string().optional(),
  analysisImgs: z.array(z.string()).optional(),
});

export const paperSchema = z.object({
  paperTitle: z.string().min(1, "试卷标题不能为空"),
  startTime: z.date({ message: "请选择开始时间" }),
  endTime: z.date({ message: "请选择结束时间" }),
  examDuration: z.number().min(1, "考试时长至少1分钟"),
  isPublic: z.boolean(),
  classIds: z.array(z.string()).min(1, "请选择至少一个班级"),
  passScore: z.number().nullable().optional(),
  isRetry: z.boolean(),
});

export const passwordChangeSchema = z.object({
  oldPassword: z.string().min(6, "原密码至少6个字符"),
  newPassword: z.string().min(6, "新密码至少6个字符"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "两次密码不一致",
  path: ["confirmPassword"],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type UserCreateInput = z.infer<typeof userCreateSchema>;
export type SchoolInput = z.infer<typeof schoolSchema>;
export type ClassInput = z.infer<typeof classSchema>;
export type QuestionInput = z.infer<typeof questionSchema>;
export type PaperInput = z.infer<typeof paperSchema>;
