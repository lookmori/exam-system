import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;

      // 未登录只能访问登录页
      if (!isLoggedIn) {
        if (pathname === "/login") return true;
        return false;
      }

      // 已登录访问登录页 → 重定向到首页
      if (pathname === "/login") {
        const role = auth.user?.role;
        const home =
          role === "student" ? "/student/dashboard" : "/admin/dashboard";
        return Response.redirect(new URL(home, nextUrl));
      }

      const role = auth.user?.role as string;

      // 学生只能访问学生前台
      if (role === "student" && pathname.startsWith("/admin")) {
        return Response.redirect(new URL("/student/dashboard", nextUrl));
      }

      // 非超级管理员禁止访问超级管理员页面
      if (role !== "super_admin" && pathname.startsWith("/admin/super")) {
        return Response.redirect(new URL("/admin/dashboard", nextUrl));
      }

      // 非学校管理员禁止访问学校管理员页面
      if (
        role !== "school_admin" &&
        role !== "super_admin" &&
        pathname.startsWith("/admin/school")
      ) {
        return Response.redirect(new URL("/admin/dashboard", nextUrl));
      }

      // 非教师禁止访问教师页面
      if (role !== "teacher" && pathname.startsWith("/admin/teacher")) {
        return Response.redirect(new URL("/admin/dashboard", nextUrl));
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role as string;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  providers: [],
};
