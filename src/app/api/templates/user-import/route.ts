import * as XLSX from "xlsx";

export async function GET() {
  const headers = ["姓名", "角色", "登录账号", "密码", "学校", "班级"];
  const sample = [
    ["张三", "student", "(留空自动生成)", "(留空默认123456)", "阳光小学", "一年级1班"],
    ["李四", "student", "", "", "", ""],
    ["王老师", "teacher", "", "", "", ""],
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sample]);
  ws["!cols"] = [
    { wch: 12 }, { wch: 12 }, { wch: 18 }, { wch: 18 }, { wch: 14 }, { wch: 14 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "用户导入模板");

  const wbout = XLSX.write(wb, { type: "array", bookType: "xlsx" });

  return new Response(new Uint8Array(wbout), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="%E7%94%A8%E6%88%B7%E5%AF%BC%E5%85%A5%E6%A8%A1%E6%9D%BF.xlsx"',
    },
  });
}
