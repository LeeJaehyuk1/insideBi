"use client";

import * as React from "react";

export type Role = "admin" | "editor" | "viewer";

export interface RoleInfo {
    role: Role;
    label: string;
    description: string;
    color: string;        // tailwind text color
    bgColor: string;      // tailwind bg color
}

export const ROLES: RoleInfo[] = [
    {
        role: "admin",
        label: "관리자",
        description: "모든 기능 사용 가능",
        color: "text-red-600 dark:text-red-400",
        bgColor: "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800",
    },
    {
        role: "editor",
        label: "편집자",
        description: "위젯 추가·편집 가능",
        color: "text-blue-600 dark:text-blue-400",
        bgColor: "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800",
    },
    {
        role: "viewer",
        label: "뷰어",
        description: "읽기 전용",
        color: "text-gray-500 dark:text-gray-400",
        bgColor: "bg-gray-50 dark:bg-gray-900/40 border-gray-200 dark:border-gray-700",
    },
];

export function getRoleInfo(role: Role): RoleInfo {
    return ROLES.find((r) => r.role === role)!;
}

/** 역할별 권한 체크 유틸 */
export const can = {
    editDashboard: (role: Role) => role === "admin" || role === "editor",
    addWidget: (role: Role) => role === "admin" || role === "editor",
    removeWidget: (role: Role) => role === "admin" || role === "editor",
    saveDashboard: (role: Role) => role === "admin" || role === "editor",
    resetDashboard: (role: Role) => role === "admin",
    addCatalog: (role: Role) => role === "admin" || role === "editor",
    deleteCatalog: (role: Role) => role === "admin",
};

/* ─── Context ─── */
interface RoleContextValue {
    role: Role;
    setRole: (role: Role) => void;
    userName: string;
    setUserName: (name: string) => void;
}

const RoleContext = React.createContext<RoleContextValue>({
    role: "viewer",
    setRole: () => { },
    userName: "사용자",
    setUserName: () => { },
});

const STORAGE_KEY = "InsightBi_role_v1";
const USER_NAME_KEY = "insightbi_user_name_v1";

export function RoleProvider({ children }: { children: React.ReactNode }) {
    const [role, setRoleState] = React.useState<Role>("viewer");
    const [userName, setUserNameState] = React.useState<string>("사용자");

    // localStorage 복원
    React.useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY) as Role | null;
        if (saved && ["admin", "editor", "viewer"].includes(saved)) {
            setRoleState(saved);
        }
        const savedName = localStorage.getItem(USER_NAME_KEY);
        if (savedName) setUserNameState(savedName);
    }, []);

    const setRole = (next: Role) => {
        setRoleState(next);
        localStorage.setItem(STORAGE_KEY, next);
    };

    const setUserName = (name: string) => {
        setUserNameState(name);
        localStorage.setItem(USER_NAME_KEY, name);
    };

    return (
        <RoleContext.Provider value={{ role, setRole, userName, setUserName }}>
            {children}
        </RoleContext.Provider>
    );
}

export function useRole() {
    return React.useContext(RoleContext);
}
