import * as React from "react";
import { Eye, EyeOff, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AdminLoginProps {
  onLogin: (password: string) => Promise<void>;
}

export function AdminLogin({ onLogin }: AdminLoginProps) {
  const [password, setPassword] = React.useState("");
  const [showPw, setShowPw] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!password.trim()) return;

    setLoading(true);
    setError("");

    try {
      await onLogin(password);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
        <Shield className="h-8 w-8 text-primary" />
      </div>

      <div className="text-center">
        <h2 className="text-xl font-semibold">관리자 인증</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          AI 학습 데이터와 운영 설정을 변경하려면 관리자 비밀번호가 필요합니다.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-3">
        <div className="relative">
          <Input
            type={showPw ? "text" : "password"}
            placeholder="관리자 비밀번호"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="pr-10"
            autoFocus
          />
          <button
            type="button"
            onClick={() => setShowPw((value) => !value)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <Button type="submit" className="w-full" disabled={loading || !password.trim()}>
          {loading ? "확인 중..." : "로그인"}
        </Button>
      </form>
    </div>
  );
}
