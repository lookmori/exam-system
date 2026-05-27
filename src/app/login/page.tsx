"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Eye, EyeOff, ShieldAlert, Star, School } from "lucide-react";

const floatingShapes = [
  { color: "bg-fun-coral/20", size: "w-32 h-32", pos: "top-8 left-12", delay: "0s" },
  { color: "bg-fun-sunny/20", size: "w-24 h-24", pos: "bottom-20 left-32", delay: "1s" },
  { color: "bg-fun-lavender/20", size: "w-40 h-40", pos: "top-32 right-16", delay: "2s" },
  { color: "bg-fun-mint/20", size: "w-28 h-28", pos: "bottom-12 right-32", delay: "0.5s" },
  { color: "bg-fun-pink/20", size: "w-20 h-20", pos: "top-1/2 left-20", delay: "1.5s" },
  { color: "bg-fun-sky/20", size: "w-36 h-36", pos: "top-10 right-32", delay: "2.5s" },
];

const funIcons = [
  { icon: "📚", pos: "top-[15%] left-[18%]", delay: "0s" },
  { icon: "🌟", pos: "top-[25%] right-[22%]", delay: "0.8s" },
  { icon: "🎨", pos: "bottom-[30%] left-[25%]", delay: "1.6s" },
  { icon: "🚀", pos: "bottom-[20%] right-[18%]", delay: "2.4s" },
  { icon: "🎯", pos: "top-[45%] left-[12%]", delay: "1.2s" },
  { icon: "💡", pos: "top-[40%] right-[12%]", delay: "2s" },
];

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!username.trim()) { setError("请输入用户名"); return; }
    if (!password) { setError("请输入密码"); return; }

    setLoading(true);
    try {
      const result = await signIn("credentials", {
        username: username.trim(),
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("用户名或密码错误");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/auth/session");
      const session = await res.json();
      const home = session?.user?.role === "student" ? "/student/dashboard" : "/admin/dashboard";
      router.push(home);
      router.refresh();
    } catch {
      setError("登录失败，请重试");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen relative overflow-hidden">
      {/* Fun background pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-rose-50 to-violet-50" />

      {/* Left: Branding Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-fun-coral via-fun-peach to-fun-pink">
        {/* Decorative blobs */}
        <div className="absolute inset-0">
          {floatingShapes.map((shape, i) => (
            <div
              key={i}
              className={`absolute ${shape.size} ${shape.pos} ${shape.color} rounded-full blur-2xl animate-float`}
              style={{ animationDelay: shape.delay }}
            />
          ))}
        </div>

        {/* Fun floating emoji icons */}
        {funIcons.map((item, i) => (
          <div
            key={i}
            className={`absolute ${item.pos} text-4xl animate-float select-none`}
            style={{ animationDelay: item.delay }}
          >
            {item.icon}
          </div>
        ))}

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16 xl:px-24 w-full">
          <div className="flex items-center gap-4 mb-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/25 backdrop-blur-sm shadow-[0_8px_30px_rgba(0,0,0,0.15)]">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <div>
              <span className="text-3xl font-extrabold tracking-tight text-white drop-shadow-sm">
                奇幻课堂
              </span>
              <p className="text-sm text-white/80 font-medium mt-0.5">在线考试系统</p>
            </div>
          </div>

          <h1 className="text-4xl xl:text-5xl font-extrabold leading-tight text-white drop-shadow-md">
            让考试变成<br />
            <span className="text-fun-sunny">一场奇妙冒险</span>
          </h1>

          <p className="mt-6 text-lg text-white/90 leading-relaxed max-w-md font-medium">
            在充满乐趣的奇幻课堂里，和小朋友们一起探索知识的海洋，完成每一次精彩的考试挑战！
          </p>

          {/* Fun stat bubbles */}
          <div className="mt-12 grid grid-cols-3 gap-6">
            <div className="rounded-2xl bg-white/15 backdrop-blur-sm p-5 text-center border border-white/20 shadow-[0_4px_15px_rgba(0,0,0,0.08)]">
              <div className="text-4xl mb-1">👨‍🏫</div>
              <div className="text-2xl font-bold text-white">4</div>
              <div className="text-sm text-white/80 font-medium mt-1">角色类型</div>
            </div>
            <div className="rounded-2xl bg-white/15 backdrop-blur-sm p-5 text-center border border-white/20 shadow-[0_4px_15px_rgba(0,0,0,0.08)]">
              <div className="text-4xl mb-1">📝</div>
              <div className="text-2xl font-bold text-white">6+</div>
              <div className="text-sm text-white/80 font-medium mt-1">趣味题型</div>
            </div>
            <div className="rounded-2xl bg-white/15 backdrop-blur-sm p-5 text-center border border-white/20 shadow-[0_4px_15px_rgba(0,0,0,0.08)]">
              <div className="text-4xl mb-1">🏰</div>
              <div className="text-2xl font-bold text-white">∞</div>
              <div className="text-sm text-white/80 font-medium mt-1">快乐教室</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Login Form */}
      <div className="flex flex-1 items-center justify-center px-6 py-12 lg:w-1/2 relative z-10">
        <div className="w-full max-w-sm">
          {/* Mobile branding */}
          <div className="lg:hidden flex flex-col items-center gap-3 mb-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-fun-coral via-fun-peach to-fun-sunny shadow-[0_8px_25px_rgba(255,107,107,0.3)]">
              <Sparkles className="h-7 w-7 text-white" />
            </div>
            <span className="text-2xl font-extrabold text-slate-800">奇幻课堂</span>
            <span className="text-sm text-slate-500 font-medium">在线考试系统</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-slate-800">
              欢迎回来 👋
            </h2>
            <p className="mt-2 text-slate-500 font-medium">
              输入你的魔法钥匙，开始奇妙之旅
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-red-50 border-2 border-red-200 px-4 py-3 text-sm font-medium text-red-600 animate-wiggle">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="username" className="text-slate-700 font-semibold">
                👤 用户名
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="请输入用户名"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoFocus
                error={!!error}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700 font-semibold">
                🔒 密码
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="请输入密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  error={!!error}
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-fun-lavender transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-bold rounded-xl bg-gradient-to-r from-fun-coral via-fun-peach to-fun-pink hover:from-[#ff5252] hover:via-[#ff8c2d] hover:to-[#f06595] shadow-[0_8px_25px_rgba(255,107,107,0.4)] hover:shadow-[0_12px_30px_rgba(255,107,107,0.5)] transition-all duration-300"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">🌟</span> 登录中...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  ✨ 开启奇幻之旅
                </span>
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-400 font-medium">
            没有魔法钥匙？请联系你的老师领取哦~
          </p>
        </div>
      </div>
    </div>
  );
}
