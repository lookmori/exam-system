import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { Pool } from "@neondatabase/serverless";
import { list, del } from "@vercel/blob";
import "dotenv/config";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaNeon(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("========== 数据库清理开始 ==========\n");

  // 1. ExamRecord
  const r1 = await prisma.examRecord.deleteMany();
  console.log(`[1/8] 考试记录: 删除 ${r1.count} 条`);

  // 2. PaperQuestion
  const r2 = await prisma.paperQuestion.deleteMany();
  console.log(`[2/8] 试卷题目关联: 删除 ${r2.count} 条`);

  // 3. ExamPaper
  const r3 = await prisma.examPaper.deleteMany();
  console.log(`[3/8] 试卷: 删除 ${r3.count} 份`);

  // 4. Question
  const r4 = await prisma.question.deleteMany();
  console.log(`[4/8] 题目: 删除 ${r4.count} 道`);

  // 5. TeacherSchool
  const r5 = await prisma.teacherSchool.deleteMany();
  console.log(`[5/8] 教师-学校关联: 删除 ${r5.count} 条`);

  // 6. Class
  const r6 = await prisma.class.deleteMany();
  console.log(`[6/8] 班级: 删除 ${r6.count} 个`);

  // 7. User (non-super-admin)
  const r7 = await prisma.user.deleteMany({
    where: { role: { not: "super_admin" } },
  });
  console.log(`[7/8] 非超级管理员用户: 删除 ${r7.count} 人`);

  // 8. School
  const r8 = await prisma.school.deleteMany();
  console.log(`[8/8] 学校: 删除 ${r8.count} 所`);

  // Verify super admins remain
  const admins = await prisma.user.findMany({
    where: { role: "super_admin" },
    select: { userId: true, username: true, name: true, role: true },
  });

  console.log(`\n保留超级管理员 (${admins.length} 人):`);
  for (const a of admins) {
    console.log(`  - ${a.username} (${a.name || "未命名"})`);
  }

  console.log("\n========== 数据库清理完成 ==========\n");

  // Clean Blob storage
  console.log("========== Blob 存储清理开始 ==========\n");

  let blobDeleted = 0;
  let cursor: string | undefined;

  do {
    const result = await list({ cursor, limit: 100 });
    cursor = result.cursor;

    for (const blob of result.blobs) {
      try {
        await del(blob.url);
        blobDeleted++;
        console.log(`  删除: ${blob.pathname}`);
      } catch (e) {
        console.log(`  失败: ${blob.pathname}`);
      }
    }

    if (!result.hasMore) break;
  } while (true);

  console.log(`\n删除 Blob 文件: ${blobDeleted} 个`);
  console.log("\n========== Blob 存储清理完成 ==========");
}

main()
  .catch((e) => {
    console.error("清理失败:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
