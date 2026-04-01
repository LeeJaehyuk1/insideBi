import type { Role } from "@/context/RoleContext";

export interface AdminUser {
  id: string;
  username: string;
  displayName: string;
  email: string;
  role: Role;
  status: "active" | "inactive";
  lastLogin?: string;
  createdAt: string;
}

export const mockAdminUsers: AdminUser[] = [
  {
    id: "user-admin",
    username: "admin",
    displayName: "관리자",
    email: "admin@insightbi.com",
    role: "admin",
    status: "active",
    lastLogin: "2026-03-17T09:00:00Z",
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "user-jaehyuk",
    username: "jaehyuk",
    displayName: "재혁 이",
    email: "jaehyuk@insightbi.com",
    role: "editor",
    status: "active",
    lastLogin: "2026-03-17T08:30:00Z",
    createdAt: "2026-01-10T00:00:00Z",
  },
  {
    id: "user-editor",
    username: "editor",
    displayName: "편집자",
    email: "editor@insightbi.com",
    role: "editor",
    status: "active",
    lastLogin: "2026-03-16T14:00:00Z",
    createdAt: "2026-01-15T00:00:00Z",
  },
  {
    id: "user-risk",
    username: "riskmgr",
    displayName: "리스크 관리자",
    email: "risk@insightbi.com",
    role: "viewer",
    status: "active",
    lastLogin: "2026-03-15T10:00:00Z",
    createdAt: "2026-02-10T00:00:00Z",
  },
  {
    id: "user-viewer",
    username: "viewer",
    displayName: "뷰어",
    email: "viewer@insightbi.com",
    role: "viewer",
    status: "inactive",
    lastLogin: "2026-03-10T11:00:00Z",
    createdAt: "2026-02-01T00:00:00Z",
  },
];

export interface AdminGroup {
  id: string;
  name: string;
  description?: string;
  memberIds: string[];
}

export const mockAdminGroups: AdminGroup[] = [
  {
    id: "group-risk",
    name: "리스크 관리팀",
    description: "신용·시장·유동성·NCR 리스크 담당",
    memberIds: ["user-admin", "user-jaehyuk", "user-risk"],
  },
  {
    id: "group-strategy",
    name: "전략기획팀",
    description: "경영 전략 및 데이터 분석 담당",
    memberIds: ["user-editor"],
  },
  {
    id: "group-exec",
    name: "경영진",
    description: "읽기 전용 대시보드 접근",
    memberIds: ["user-viewer"],
  },
];
