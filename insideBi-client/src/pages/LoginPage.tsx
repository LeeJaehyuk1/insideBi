import * as React from "react";
import { useNavigate } from "react-router-dom";
import { BarChart3, Eye, EyeOff, Lock, User } from "lucide-react";
import { useRole } from "@/context/RoleContext";

function LoginForm() {
  const navigate = useNavigate();
  const { login } = useRole();
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPw, setShowPw] = React.useState(false);
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!username.trim() || !password) return;
    setLoading(true);
    setError("");
    await new Promise((resolve) => setTimeout(resolve, 400));
    const ok = login(username.trim(), password);
    setLoading(false);
    if (ok) {
      navigate("/");
    } else {
      setError("아이디 또는 비밀번호가 올바르지 않습니다.");
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 flex items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg">
            <BarChart3 className="h-7 w-7 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-foreground">Inside BI</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">SQL-first analytics workspace</p>
          </div>
        </div>

        <div className="space-y-5 rounded-2xl border border-border bg-card p-8 shadow-xl">
          <div>
            <h2 className="text-base font-semibold text-foreground">로그인</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">계정 정보를 입력하세요.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">아이디</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  autoFocus
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="admin / editor / viewer"
                  className="w-full rounded-lg border border-input bg-background py-2.5 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">비밀번호</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="비밀번호 입력"
                  className="w-full rounded-lg border border-input bg-background py-2.5 pl-9 pr-10 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !username.trim() || !password}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
              {loading ? "로그인 중..." : "로그인"}
            </button>
          </form>

          <div className="space-y-1.5 rounded-lg border border-border bg-muted/50 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Demo Accounts</p>
            <div className="space-y-1 font-mono text-xs text-muted-foreground">
              <p><span className="font-semibold text-foreground">admin</span> / admin123</p>
              <p><span className="font-semibold text-foreground">editor</span> / edit123</p>
              <p><span className="font-semibold text-foreground">viewer</span> / view123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <LoginForm />;
}
