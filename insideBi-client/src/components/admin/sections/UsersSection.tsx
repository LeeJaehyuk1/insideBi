
import * as React from "react";
import {
  Plus, Search, MoreHorizontal, Trash2, UserCog,
  CheckCircle2, XCircle, Clock, Mail, ShieldCheck, Pencil, Eye,
  KeyRound, Users2, Copy, Check, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import type { AdminUser, AdminGroup } from "@/lib/mock-data/admin-users";
import type { Role } from "@/context/RoleContext";
import { ROLES } from "@/context/RoleContext";

const ROLE_COLORS: Record<Role, string> = {
  admin:  "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  editor: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  viewer: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

const ROLE_ICONS: Record<Role, React.ElementType> = {
  admin:  ShieldCheck,
  editor: Pencil,
  viewer: Eye,
};

interface AddUserFormProps {
  onSave: (user: AdminUser) => void;
  onCancel: () => void;
}

function AddUserForm({ onSave, onCancel }: AddUserFormProps) {
  const [displayName, setDisplayName] = React.useState("");
  const [email, setEmail]             = React.useState("");
  const [username, setUsername]       = React.useState("");
  const [role, setRole]               = React.useState<Role>("viewer");
  const [submitted, setSubmitted]     = React.useState(false);

  const handleSave = () => {
    setSubmitted(true);
    if (!displayName.trim() || !email.trim() || !username.trim()) return;
    onSave({
      id: `user-${Date.now()}`,
      username: username.trim(),
      displayName: displayName.trim(),
      email: email.trim(),
      role,
      status: "active",
      createdAt: new Date().toISOString(),
    });
  };

  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 space-y-4">
      <h3 className="text-sm font-semibold text-foreground">새 사용자 추가</h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">이름 *</label>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="홍길동"
            className={cn(
              "w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30",
              submitted && !displayName.trim() ? "border-red-400" : "border-input bg-background"
            )}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">사용자명 *</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="gildong"
            className={cn(
              "w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30",
              submitted && !username.trim() ? "border-red-400" : "border-input bg-background"
            )}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">이메일 *</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="hong@company.com"
            className={cn(
              "w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30",
              submitted && !email.trim() ? "border-red-400" : "border-input bg-background"
            )}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">역할</label>
          <div className="flex gap-2">
            {ROLES.map((r) => (
              <button
                key={r.role}
                onClick={() => setRole(r.role)}
                className={cn(
                  "flex-1 rounded-lg border px-2 py-2 text-xs font-semibold transition-colors",
                  role === r.role
                    ? `${ROLE_COLORS[r.role]} border-current`
                    : "border-border hover:bg-muted"
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
        >
          취소
        </button>
        <button
          onClick={handleSave}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          저장
        </button>
      </div>
    </div>
  );
}

/* ── 초대 링크 모달 ── */
function InviteModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<Role>("viewer");
  const [link, setLink] = React.useState("");
  const [copied, setCopied] = React.useState(false);

  const generate = () => {
    const token = Math.random().toString(36).slice(2, 10).toUpperCase();
    setLink(`${window.location.origin}/invite?token=${token}&role=${role}&email=${encodeURIComponent(email)}`);
  };
  const copy = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-border bg-background p-6 space-y-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-foreground">사용자 초대</h3>
          <button onClick={onClose}><X className="h-4 w-4 text-muted-foreground" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">이메일</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="user@company.com"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">역할</label>
            <div className="flex gap-2">
              {ROLES.map((r) => (
                <button key={r.role} onClick={() => setRole(r.role)}
                  className={cn("flex-1 rounded-lg border px-2 py-2 text-xs font-semibold transition-colors",
                    role === r.role ? `${ROLE_COLORS[r.role]} border-current` : "border-border hover:bg-muted"
                  )}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          {link && (
            <div className="rounded-lg bg-muted/40 p-3 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">초대 링크</p>
              <div className="flex items-center gap-2">
                <input value={link} readOnly className="flex-1 text-xs font-mono bg-background border border-input rounded px-2 py-1 focus:outline-none truncate" />
                <button onClick={copy} className="flex items-center gap-1 rounded-md bg-primary/10 px-2.5 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors whitespace-nowrap">
                  {copied ? <><Check className="h-3 w-3" />복사됨</> : <><Copy className="h-3 w-3" />복사</>}
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">링크는 24시간 후 만료됩니다.</p>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted transition-colors">닫기</button>
          <button onClick={generate} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
            초대 링크 생성
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── 그룹 배정 모달 ── */
function GroupModal({ user, groups, onClose, onSave }: {
  user: AdminUser; groups: AdminGroup[];
  onClose: () => void;
  onSave: (groupIds: string[]) => void;
}) {
  const currentGroups = groups.filter((g) => g.memberIds.includes(user.id)).map((g) => g.id);
  const [selected, setSelected] = React.useState<string[]>(currentGroups);

  const toggle = (id: string) => setSelected((prev) =>
    prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl border border-border bg-background p-6 space-y-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-foreground">{user.displayName} — 그룹 배정</h3>
          <button onClick={onClose}><X className="h-4 w-4 text-muted-foreground" /></button>
        </div>
        <div className="space-y-1 max-h-60 overflow-y-auto">
          {groups.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">등록된 그룹이 없습니다</p>}
          {groups.map((g) => (
            <button key={g.id} onClick={() => toggle(g.id)}
              className={cn("w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                selected.includes(g.id) ? "bg-primary/10 text-primary" : "hover:bg-muted"
              )}>
              <div className={cn("flex h-5 w-5 items-center justify-center rounded border-2 transition-colors",
                selected.includes(g.id) ? "border-primary bg-primary" : "border-muted"
              )}>
                {selected.includes(g.id) && <Check className="h-3 w-3 text-white" />}
              </div>
              <div>
                <p className="text-sm font-medium">{g.name}</p>
                {g.description && <p className="text-xs text-muted-foreground">{g.description}</p>}
              </div>
            </button>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted transition-colors">취소</button>
          <button onClick={() => { onSave(selected); onClose(); }}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
            저장
          </button>
        </div>
      </div>
    </div>
  );
}

export function UsersSection() {
  const { users, groups, hydrated, updateUser, addUser, deleteUser, updateGroup } = useAdminUsers();
  const [search, setSearch]       = React.useState("");
  const [showAdd, setShowAdd]     = React.useState(false);
  const [showInvite, setShowInvite] = React.useState(false);
  const [groupModalUser, setGroupModalUser] = React.useState<AdminUser | null>(null);
  const [menuOpenId, setMenuOpenId] = React.useState<string | null>(null);
  const [editRoleId, setEditRoleId] = React.useState<string | null>(null);
  const [resetDoneId, setResetDoneId] = React.useState<string | null>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenId(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = users.filter(
    (u) =>
      !search.trim() ||
      u.displayName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase())
  );

  if (!hydrated) return null;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">사용자 관리</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {users.filter((u) => u.status === "active").length}명 활성 · 전체 {users.length}명
          </p>
        </div>
          <div className="flex items-center gap-2">
          <button
            onClick={() => setShowInvite(true)}
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-muted transition-colors"
          >
            <Mail className="h-4 w-4" />
            초대
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            사용자 추가
          </button>
        </div>
      </div>

      {showAdd && (
        <AddUserForm
          onSave={(u) => { addUser(u); setShowAdd(false); }}
          onCancel={() => setShowAdd(false)}
        />
      )}
      {showInvite && <InviteModal onClose={() => setShowInvite(false)} />}
      {groupModalUser && (
        <GroupModal
          user={groupModalUser}
          groups={groups}
          onClose={() => setGroupModalUser(null)}
          onSave={(groupIds) => {
            // Update all groups: add user to selected, remove from unselected
            groups.forEach((g) => {
              const shouldBeMember = groupIds.includes(g.id);
              const isMember = g.memberIds.includes(groupModalUser.id);
              if (shouldBeMember && !isMember) {
                updateGroup(g.id, { memberIds: [...g.memberIds, groupModalUser.id] });
              } else if (!shouldBeMember && isMember) {
                updateGroup(g.id, { memberIds: g.memberIds.filter((id) => id !== groupModalUser.id) });
              }
            });
          }}
        />
      )}

      {/* 검색 */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="이름, 이메일, 사용자명 검색..."
          className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* 사용자 테이블 */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="grid grid-cols-[40px_1fr_180px_110px_130px_120px_40px] gap-3 px-4 py-3 bg-muted/30 border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
          <span />
          <span>사용자</span>
          <span>이메일</span>
          <span>역할</span>
          <span>마지막 로그인</span>
          <span>상태</span>
          <span />
        </div>

        {filtered.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
            검색 결과가 없습니다
          </div>
        ) : (
          filtered.map((user) => {
            const RoleIcon = ROLE_ICONS[user.role];
            return (
              <div
                key={user.id}
                className="grid grid-cols-[40px_1fr_180px_110px_130px_120px_40px] gap-3 px-4 py-3.5 border-b border-border last:border-0 items-center hover:bg-muted/20 transition-colors"
              >
                {/* 아바타 */}
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary text-xs font-bold">
                  {user.displayName.slice(0, 1)}
                </div>

                {/* 이름 */}
                <div>
                  <p className="text-sm font-semibold text-foreground">{user.displayName}</p>
                  <p className="text-xs text-muted-foreground">@{user.username}</p>
                </div>

                {/* 이메일 */}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{user.email}</span>
                </div>

                {/* 역할 */}
                <div>
                  {editRoleId === user.id ? (
                    <div className="flex gap-1">
                      {ROLES.map((r) => (
                        <button
                          key={r.role}
                          onClick={() => {
                            updateUser(user.id, { role: r.role });
                            setEditRoleId(null);
                          }}
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[11px] font-semibold border transition-colors",
                            user.role === r.role
                              ? `${ROLE_COLORS[r.role]} border-current`
                              : "border-border hover:bg-muted"
                          )}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditRoleId(user.id)}
                      className={cn(
                        "flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold hover:opacity-80 transition-opacity",
                        ROLE_COLORS[user.role]
                      )}
                    >
                      <RoleIcon className="h-3 w-3" />
                      {ROLES.find((r) => r.role === user.role)?.label}
                    </button>
                  )}
                </div>

                {/* 마지막 로그인 */}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    {user.lastLogin
                      ? new Date(user.lastLogin).toLocaleDateString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                      : "없음"}
                  </span>
                </div>

                {/* 상태 */}
                <button
                  onClick={() => updateUser(user.id, { status: user.status === "active" ? "inactive" : "active" })}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors w-fit",
                    user.status === "active"
                      ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {user.status === "active"
                    ? <><CheckCircle2 className="h-3 w-3" /> 활성</>
                    : <><XCircle className="h-3 w-3" /> 비활성</>
                  }
                </button>

                {/* 메뉴 */}
                <div className="relative" ref={menuOpenId === user.id ? menuRef : undefined}>
                  <button
                    onClick={() => setMenuOpenId(menuOpenId === user.id ? null : user.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted transition-colors"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                  {menuOpenId === user.id && (
                    <div className="absolute right-0 top-full mt-1 z-50 w-44 rounded-lg border border-border bg-background shadow-lg overflow-hidden">
                      <button
                        onClick={() => { setEditRoleId(user.id); setMenuOpenId(null); }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                      >
                        <UserCog className="h-3.5 w-3.5" />
                        역할 변경
                      </button>
                      <button
                        onClick={() => { setGroupModalUser(user); setMenuOpenId(null); }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                      >
                        <Users2 className="h-3.5 w-3.5" />
                        그룹 배정
                      </button>
                      <button
                        onClick={() => {
                          setResetDoneId(user.id);
                          setTimeout(() => setResetDoneId(null), 2500);
                          setMenuOpenId(null);
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                      >
                        {resetDoneId === user.id
                          ? <><Check className="h-3.5 w-3.5 text-emerald-500" /><span className="text-emerald-600">링크 발송됨</span></>
                          : <><KeyRound className="h-3.5 w-3.5" />비밀번호 초기화</>
                        }
                      </button>
                      <div className="border-t border-border" />
                      <button
                        onClick={() => { deleteUser(user.id); setMenuOpenId(null); }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        삭제
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
