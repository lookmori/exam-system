import "dotenv/config";
import { Pool } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });

function cuid(): string {
  return crypto.randomUUID();
}

async function main() {
  console.log("🌱 Seeding database...");

  const hashedPassword = bcrypt.hashSync("123456", 12);

  // Create school
  const schoolId = cuid();
  await pool.query(
    `INSERT INTO school ("schoolId", "schoolName", status, create_time, update_time) VALUES ($1, $2, $3, NOW(), NOW())`,
    [schoolId, "第一中学", "active"]
  );
  console.log(`  ✓ School: 第一中学`);

  // Create users
  await pool.query(
    `INSERT INTO "user" ("userId", username, password, role, create_time, update_time) VALUES ($1, $2, $3, $4, NOW(), NOW())`,
    [cuid(), "admin", hashedPassword, "super_admin"]
  );
  console.log(`  ✓ Super Admin: admin / 123456`);

  await pool.query(
    `INSERT INTO "user" ("userId", username, password, role, admin_school_id, create_time, update_time) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
    [cuid(), "schooladmin", hashedPassword, "school_admin", schoolId]
  );
  console.log(`  ✓ School Admin: schooladmin / 123456`);

  const teacherId = cuid();
  await pool.query(
    `INSERT INTO "user" ("userId", username, password, role, create_time, update_time) VALUES ($1, $2, $3, $4, NOW(), NOW())`,
    [teacherId, "teacher", hashedPassword, "teacher"]
  );
  console.log(`  ✓ Teacher: teacher / 123456`);

  // Teacher-School association
  await pool.query(
    `INSERT INTO teacher_school (id, teacher_id, school_id, create_time) VALUES ($1, $2, $3, NOW())`,
    [cuid(), teacherId, schoolId]
  );

  // Create class
  const classId = cuid();
  await pool.query(
    `INSERT INTO class ("classId", school_id, class_name, create_time, update_time) VALUES ($1, $2, $3, NOW(), NOW())`,
    [classId, schoolId, "高一（1）班"]
  );
  console.log(`  ✓ Class: 高一（1）班`);

  await pool.query(
    `INSERT INTO "user" ("userId", username, password, role, school_id, class_id, create_time, update_time) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
    [cuid(), "student", hashedPassword, "student", schoolId, classId]
  );
  console.log(`  ✓ Student: student / 123456`);

  // Create questions
  const q1Id = cuid();
  await pool.query(
    `INSERT INTO question ("questionId", school_id, teacher_id, question_type, title, option_content, score, answer, analysis, create_time, update_time)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
    [q1Id, schoolId, teacherId, "single_choice",
      "下列选项中，关于微积分基本定理描述正确的是？",
      JSON.stringify({ A: "微积分基本定理建立了微分与积分的联系", B: "微积分基本定理只适用于多项式函数", C: "微积分基本定理与极限无关", D: "微积分基本定理只适用于不定积分" }),
      4, "A",
      "微积分基本定理（牛顿-莱布尼茨公式）建立了微分和积分之间的联系，是微积分学的核心定理。"]
  );
  console.log(`  ✓ Question 1: Single Choice`);

  const q2Id = cuid();
  await pool.query(
    `INSERT INTO question ("questionId", school_id, teacher_id, question_type, title, option_content, score, answer, analysis, create_time, update_time)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
    [q2Id, schoolId, teacherId, "multi_choice",
      "以下哪些属于函数的连续性条件？",
      JSON.stringify({ A: "函数在该点有定义", B: "函数在该点极限存在", C: "函数在该点极限等于函数值", D: "函数在该点可导" }),
      6, '["A","B","C"]',
      "函数在某点连续需要满足三个条件：该点有定义、该点极限存在、极限值等于函数值。可导性是比连续性更强的条件。"]
  );
  console.log(`  ✓ Question 2: Multi Choice`);

  const q3Id = cuid();
  await pool.query(
    `INSERT INTO question ("questionId", school_id, teacher_id, question_type, title, score, answer, analysis, create_time, update_time)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
    [q3Id, schoolId, teacherId, "true_false", "三角形内角和等于180度。",
      2, "true", "在欧几里得几何中，三角形内角和恒等于180度。"]
  );
  console.log(`  ✓ Question 3: True/False`);

  const q4Id = cuid();
  await pool.query(
    `INSERT INTO question ("questionId", school_id, teacher_id, question_type, title, score, answer, analysis, create_time, update_time)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
    [q4Id, schoolId, teacherId, "short_answer", "请简述微积分基本定理的内容及其意义。",
      10, "",
      "微积分基本定理包含两部分：第一部分建立了原函数与不定积分的关系；第二部分给出了定积分的计算方法（牛顿-莱布尼茨公式），极大地简化了定积分的计算。"]
  );
  console.log(`  ✓ Question 4: Short Answer`);

  // Create exam paper
  const now = new Date();
  const dayAfter = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
  const paperId = cuid();
  await pool.query(
    `INSERT INTO exam_paper ("paperId", paper_title, school_id, teacher_id, start_time, end_time, exam_duration, is_public, class_ids, total_score, pass_score, is_retry, paper_status, create_time, update_time)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())`,
    [paperId, "2026年高一数学期末测试", schoolId, teacherId, now.toISOString(), dayAfter.toISOString(),
      120, true, [classId], 22, 12, false, "published"]
  );

  // Link questions to paper
  const paperQuestions = [[q1Id, 1, 4], [q2Id, 2, 6], [q3Id, 3, 2], [q4Id, 4, 10]] as [string, number, number][];
  for (const [qId, sort, score] of paperQuestions) {
    await pool.query(
      `INSERT INTO paper_question (id, paper_id, question_id, sort, score) VALUES ($1, $2, $3, $4, $5)`,
      [cuid(), paperId, qId, sort, score]
    );
  }
  console.log(`  ✓ Paper: 2026年高一数学期末测试 (4 questions, 22 points)`);

  console.log("\n✅ Seed complete! Login credentials:");
  console.log("  admin / 123456       (Super Admin)");
  console.log("  schooladmin / 123456 (School Admin)");
  console.log("  teacher / 123456     (Teacher)");
  console.log("  student / 123456     (Student)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
