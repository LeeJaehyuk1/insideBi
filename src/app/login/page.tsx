"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, Eye, EyeOff, Lock, User } from "lucide-react";
import { RoleProvider, useRole } from "@/context/RoleContext";

function LoginForm() {
  const router = useRouter();
  const { login } = useRole();
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPw, setShowPw] = React.useState(false);
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    setLoading(true);
    setError("");
    // 실제 서버 호출처럼 짧은 딜레이
    await new Promise((r) => setTimeout(r, 400));
    const ok = login(username.trim(), password);
    setLoading(false);
    if (ok) {
      router.push("/");
    } else {
      setError("아이디 또는 비밀번호가 올바르지 않습니다.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg">
            <ShieldAlert className="h-7 w-7 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-foreground">Risk BI</h1>
            <p className="text-sm text-muted-foreground mt-0.5">금융 리스크관리 BI 솔루션</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl shadow-xl p-8 space-y-5">
          <div>
            <h2 className="text-base font-semibold text-foreground">로그인</h2>
            <p className="text-xs text-muted-foreground mt-0.5">계정 정보를 입력하세요</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 아이디 */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">아이디</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin / editor / viewer"
                  className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
                />
              </div>
            </div>

            {/* 비밀번호 */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">비밀번호</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호 입력"
                  className="w-full rounded-lg border border-input bg-background pl-9 pr-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* 오류 메시지 */}
            {error && (
              <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 rounded-lg px-3 py-2 border border-red-200 dark:border-red-800">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !username.trim() || !password}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              {loading ? (
                <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : null}
              {loading ? "로그인 중..." : "로그인"}
            </button>
          </form>

          {/* 데모 계정 안내 */}
          <div className="rounded-lg bg-muted/50 border border-border px-4 py-3 space-y-1.5">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">데모 계정</p>
            <div className="space-y-1 text-xs text-muted-foreground font-mono">
              <p><span className="text-foreground font-semibold">admin</span> / admin123 — 관리자</p>
              <p><span className="text-foreground font-semibold">editor</span> / edit123 — 편집자</p>
              <p><span className="text-foreground font-semibold">viewer</span> / view123 — 뷰어</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <RoleProvider>
      <LoginForm />
    </RoleProvider>
  );
}
