import { type ClassValue, clsx } from "clsx";
import { prisma } from "@/lib/prisma";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(date: Date | string, format?: string): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");

  if (format === "date") return `${year}-${month}-${day}`;
  if (format === "time") return `${hours}:${minutes}`;
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return `${h}小时${m > 0 ? `${m}分钟` : ""}`;
  return `${m}分钟`;
}

export function formatCountdown(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * 根据角色生成唯一的8位数字账号
 * 学生: 1xxxxxxx, 教师: 2xxxxxxx, 学校管理员: 3xxxxxxx, 超级管理员: 9xxxxxxx
 */
export function generateAccountNumber(role: string): string {
  const prefixes: Record<string, string> = {
    student: "1",
    teacher: "2",
    school_admin: "3",
    super_admin: "9",
  };
  const prefix = prefixes[role] || "1";
  const min = parseInt(`${prefix}0000000`);
  const max = parseInt(`${prefix}9999999`);

  const num = Math.floor(Math.random() * (max - min + 1)) + min;
  return String(num);
}

/**
 * 生成数据库中唯一的8位账号
 */
export async function generateUniqueAccount(role: string): Promise<string> {
  let account: string;
  let exists = true;
  let attempts = 0;

  do {
    account = generateAccountNumber(role);
    const user = await prisma.user.findUnique({ where: { username: account }, select: { userId: true } });
    exists = !!user;
    attempts++;
  } while (exists && attempts < 20);

  if (exists) {
    throw new Error("无法生成唯一账号，请稍后重试");
  }

  return account;
}
