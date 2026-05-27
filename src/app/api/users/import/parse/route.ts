import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function POST(req: Request) {
  const session = await auth();
  const role = session?.user?.role;
  if (!session?.user?.id || (role !== "super_admin" && role !== "school_admin" && role !== "teacher")) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File;
  if (!file) return NextResponse.json({ error: "请上传文件" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet) as Record<string, string>[];

  const roleMap: Record<string, string> = {
    "学生": "student", "教师": "teacher", "老师": "teacher",
    "学校管理员": "school_admin", "超级管理员": "super_admin",
    "student": "student", "teacher": "teacher", "school_admin": "school_admin", "super_admin": "super_admin",
  };
  const roles = ["super_admin", "school_admin", "teacher", "student"];
  const rows = data.map((row) => {
    const name = String(row.name || row.Name || row["姓名"] || "").trim();
    const username = String(row.username || row.Username || row["登录账号"] || "").trim();
    const password = String(row.password || row.Password || row["密码"] || "").trim();
    let role = String(row.role || row.Role || row["角色"] || "").trim();
    const schoolName = String(row.schoolName || row.SchoolName || row.school || row["学校"] || "").trim();
    const className = String(row.className || row.ClassName || row.class || row["班级"] || "").trim();
    const errors: string[] = [];

    // Normalize role: map Chinese names to English, keep lowercase
    role = roleMap[role] || role.toLowerCase();
    if (!roles.includes(role)) errors.push("角色无效（请使用：学生/教师/学校管理员/超级管理员）");

    return {
      name: name || null,
      username: username || "(自动生成)",
      password: password ? "******" : "123456(默认)",
      role,
      schoolName,
      className,
      error: errors.length > 0 ? errors.join("; ") : undefined,
      _name: name || undefined,
      _password: password || "123456",
      _username: username,
    };
  });

  return NextResponse.json({ rows });
}
