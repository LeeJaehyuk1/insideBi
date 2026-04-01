
import * as React from "react";
import { Plus, Trash2, Users, ChevronDown, ChevronUp, Lock, Check, Database, Table2, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import type { AdminGroup } from "@/lib/mock-data/admin-users";
import { DATABASES, DB_TABLES } from "@/lib/db-catalog";

/* 컬렉션 권한 mock */
const COLLECTIONS = [
  { id: "our-analytics", name: "우리의 분석" },
  { id: "personal",      name: "개인 컬렉션" },
  { id: "auto-dash",     name: "자동 생성 대시보드" },
  { id: "examples",      name: "예제" },
];

type Permission = "none" | "view" | "edit";
type DataPerm = "none" | "readonly" | "full";

const PERM_OPTIONS: { value: Permission; label: string }[] = [
  { value: "none", label: "없음" },
  { value: "view", label: "보기" },
  { value: "edit", label: "편집" },
];

const DATA_PERM_OPTIONS: { value: DataPerm; label: string; color: string }[] = [
  { value: "none",     label: "없음",  color: "text-muted-foreground" },
  { value: "readonly", label: "조회",  color: "text-blue-600 dark:text-blue-400" },
  { value: "full",     label: "전체",  color: "text-emerald-600 dark:text-emerald-400" },
];

const LS_KEY      = "insightbi_group_permissions_v1";
const LS_DATA_KEY = "insightbi_group_data_perms_v1";
const LS_NQ_KEY   = "insightbi_group_native_query_v1";

type PermMatrix     = Record<string, Record<string, Permission>>;
type DataPermMatrix = Record<string, Record<string, DataPerm>>;  // groupId → tableKey → perm
type NativeQueryPerm = Record<string, boolean>; // groupId → allowed

type Tab = "collections" | "data";

function loadPerms(): PermMatrix {
  try {
    const s = typeof window !== "undefined" ? localStorage.getItem(LS_KEY) : null;
    if (s) return JSON.parse(s);
  } catch {}
  return {};
}
function savePerms(m: PermMatrix) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(m)); } catch {}
}

function loadDataPerms(): DataPermMatrix {
  try {
    const s = typeof window !== "undefined" ? localStorage.getItem(LS_DATA_KEY) : null;
    if (s) return JSON.parse(s);
  } catch {}
  return {};
}
function saveDataPerms(m: DataPermMatrix) {
  try { localStorage.setItem(LS_DATA_KEY, JSON.stringify(m)); } catch {}
}

function loadNativeQuery(): NativeQueryPerm {
  try {
    const s = typeof window !== "undefined" ? localStorage.getItem(LS_NQ_KEY) : null;
    if (s) return JSON.parse(s);
  } catch {}
  return {};
}
function saveNativeQuery(m: NativeQueryPerm) {
  try { localStorage.setItem(LS_NQ_KEY, JSON.stringify(m)); } catch {}
}

export function GroupsSection() {
  const { users, groups, hydrated, addGroup, deleteGroup } = useAdminUsers();
  const [perms, setPerms] = React.useState<PermMatrix>({});
  const [dataPerms, setDataPerms] = React.useState<DataPermMatrix>({});
  const [nativeQuery, setNativeQuery] = React.useState<NativeQueryPerm>({});
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = React.useState<Record<string, Tab>>({});
  const [showNewGroup, setShowNewGroup] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const [newDesc, setNewDesc] = React.useState("");

  React.useEffect(() => {
    setPerms(loadPerms());
    setDataPerms(loadDataPerms());
    setNativeQuery(loadNativeQuery());
  }, []);

  const getPerm = (groupId: string, colId: string): Permission =>
    perms[groupId]?.[colId] ?? "view";

  const setPerm = (groupId: string, colId: string, perm: Permission) => {
    setPerms((prev) => {
      const next = {
        ...prev,
        [groupId]: { ...(prev[groupId] ?? {}), [colId]: perm },
      };
      savePerms(next);
      return next;
    });
  };

  const getDataPerm = (groupId: string, tableKey: string): DataPerm =>
    dataPerms[groupId]?.[tableKey] ?? "none";

  const setDataPerm = (groupId: string, tableKey: string, perm: DataPerm) => {
    setDataPerms((prev) => {
      const next = {
        ...prev,
        [groupId]: { ...(prev[groupId] ?? {}), [tableKey]: perm },
      };
      saveDataPerms(next);
      return next;
    });
  };

  const getNativeQuery = (groupId: string): boolean =>
    nativeQuery[groupId] ?? false;

  const toggleNativeQuery = (groupId: string) => {
    setNativeQuery((prev) => {
      const next = { ...prev, [groupId]: !prev[groupId] };
      saveNativeQuery(next);
      return next;
    });
  };

  const handleAddGroup = () => {
    if (!newName.trim()) return;
    addGroup({
      id: `group-${Date.now()}`,
      name: newName.trim(),
      description: newDesc.trim() || undefined,
      memberIds: [],
    });
    setNewName("");
    setNewDesc("");
    setShowNewGroup(false);
  };

  const getMemberNames = (group: AdminGroup) =>
    group.memberIds
      .map((id) => users.find((u) => u.id === id)?.displayName)
      .filter(Boolean)
      .join(", ");

  const getGroupTab = (groupId: string): Tab => activeTab[groupId] ?? "collections";
  const setGroupTab = (groupId: string, tab: Tab) =>
    setActiveTab((p) => ({ ...p, [groupId]: tab }));

  if (!hydrated) return null;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">그룹 & 권한</h2>
          <p className="text-sm text-muted-foreground mt-0.5">그룹별 컬렉션 및 데이터 접근 권한을 설정합니다.</p>
        </div>
        <button
          onClick={() => setShowNewGroup(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          그룹 추가
        </button>
      </div>

      {/* 새 그룹 폼 */}
      {showNewGroup && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">새 그룹</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">그룹 이름 *</label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="팀 이름"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">설명</label>
              <input
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="선택"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowNewGroup(false)} className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted transition-colors">취소</button>
            <button onClick={handleAddGroup} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">저장</button>
          </div>
        </div>
      )}

      {/* 그룹 목록 + 권한 */}
      <div className="space-y-3">
        {groups.map((group) => (
          <div key={group.id} className="rounded-xl border border-border bg-background overflow-hidden">
            {/* 그룹 헤더 */}
            <div
              className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-muted/20 transition-colors"
              onClick={() => setExpanded((p) => ({ ...p, [group.id]: !p[group.id] }))}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{group.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {group.description ?? ""} · 멤버 {group.memberIds.length}명
                    {group.memberIds.length > 0 && ` (${getMemberNames(group)})`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); deleteGroup(group.id); }}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                {expanded[group.id]
                  ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                }
              </div>
            </div>

            {/* 권한 패널 */}
            {expanded[group.id] && (
              <div className="border-t border-border">
                {/* 탭 */}
                <div className="flex border-b border-border bg-muted/10">
                  {([
                    { id: "collections" as Tab, icon: Lock,     label: "컬렉션 권한" },
                    { id: "data"        as Tab, icon: Database,  label: "데이터 권한" },
                  ]).map(({ id, icon: Icon, label }) => (
                    <button
                      key={id}
                      onClick={() => setGroupTab(group.id, id)}
                      className={cn(
                        "flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold border-b-2 transition-colors",
                        getGroupTab(group.id) === id
                          ? "border-primary text-primary"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {label}
                    </button>
                  ))}
                </div>

                {/* 컬렉션 권한 탭 */}
                {getGroupTab(group.id) === "collections" && (
                  <div>
                    <div className="grid grid-cols-[1fr_repeat(3,80px)] gap-0 px-5 py-2.5 bg-muted/20 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                      <span className="flex items-center gap-1.5"><Lock className="h-3 w-3" /> 컬렉션</span>
                      {PERM_OPTIONS.map((p) => (
                        <span key={p.value} className="text-center">{p.label}</span>
                      ))}
                    </div>
                    {COLLECTIONS.map((col) => {
                      const current = getPerm(group.id, col.id);
                      return (
                        <div
                          key={col.id}
                          className="grid grid-cols-[1fr_repeat(3,80px)] gap-0 px-5 py-3 border-t border-border items-center"
                        >
                          <span className="text-sm text-foreground">{col.name}</span>
                          {PERM_OPTIONS.map((p) => (
                            <div key={p.value} className="flex justify-center">
                              <button
                                onClick={() => setPerm(group.id, col.id, p.value)}
                                className={cn(
                                  "flex h-7 w-7 items-center justify-center rounded-full border-2 transition-colors",
                                  current === p.value
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-muted hover:border-primary/50"
                                )}
                              >
                                {current === p.value && <Check className="h-3.5 w-3.5" />}
                              </button>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 데이터 권한 탭 */}
                {getGroupTab(group.id) === "data" && (
                  <div>
                    {/* 네이티브 쿼리 권한 */}
                    <div className="flex items-center justify-between px-5 py-3 bg-muted/10 border-b border-border">
                      <div className="flex items-center gap-2">
                        <Terminal className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium text-foreground">네이티브 쿼리 편집</p>
                          <p className="text-xs text-muted-foreground">SQL 직접 작성 허용</p>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleNativeQuery(group.id)}
                        className={cn(
                          "relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0",
                          getNativeQuery(group.id) ? "bg-primary" : "bg-muted-foreground/30"
                        )}
                      >
                        <span className={cn(
                          "inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform",
                          getNativeQuery(group.id) ? "translate-x-4" : "translate-x-0.5"
                        )} />
                      </button>
                    </div>

                    {/* DB/테이블 권한 매트릭스 */}
                    {DATABASES.map((db) => {
                      const tables = DB_TABLES[db.id] ?? [];
                      return (
                        <div key={db.id}>
                          {/* DB 헤더 */}
                          <div className="flex items-center gap-2 px-5 py-2.5 bg-muted/20 border-t border-border">
                            <Database className="h-3.5 w-3.5 text-primary" />
                            <span className="text-xs font-bold text-foreground">{db.label}</span>
                            <span className="text-xs text-muted-foreground">— {db.description}</span>
                          </div>

                          {/* 컬럼 헤더 */}
                          <div className="grid grid-cols-[1fr_repeat(3,90px)] gap-0 px-5 py-2 bg-muted/10 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide border-t border-border">
                            <span className="flex items-center gap-1.5"><Table2 className="h-3 w-3" /> 테이블</span>
                            {DATA_PERM_OPTIONS.map((p) => (
                              <span key={p.value} className={cn("text-center", p.color)}>{p.label}</span>
                            ))}
                          </div>

                          {/* 테이블 행 */}
                          {tables.map((tbl) => {
                            const tableKey = `${db.id}:${tbl.tableId}`;
                            const current = getDataPerm(group.id, tableKey);
                            return (
                              <div
                                key={tbl.tableId}
                                className="grid grid-cols-[1fr_repeat(3,90px)] gap-0 px-5 py-2.5 border-t border-border items-center hover:bg-muted/10"
                              >
                                <span className="text-sm text-foreground font-mono text-xs">{tbl.label}</span>
                                {DATA_PERM_OPTIONS.map((p) => (
                                  <div key={p.value} className="flex justify-center">
                                    <button
                                      onClick={() => setDataPerm(group.id, tableKey, p.value)}
                                      className={cn(
                                        "flex h-7 w-7 items-center justify-center rounded-full border-2 transition-colors",
                                        current === p.value
                                          ? p.value === "full"
                                            ? "border-emerald-500 bg-emerald-500 text-white"
                                            : p.value === "readonly"
                                              ? "border-blue-500 bg-blue-500 text-white"
                                              : "border-muted-foreground bg-muted text-muted-foreground"
                                          : "border-muted hover:border-primary/50"
                                      )}
                                    >
                                      {current === p.value && <Check className="h-3.5 w-3.5" />}
                                    </button>
                                  </div>
                                ))}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
