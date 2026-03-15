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

/* ─── 내장 사용자 목록 (데모용) ─── */
interface UserDef { password: string; role: Role; displayName: string; }
const USERS: Record<string, UserDef> = {
    admin:  { password: "admin123",  role: "admin",  displayName: "관리자" },
    editor: { password: "edit123",   role: "editor", displayName: "편집자" },
    viewer: { password: "view123",   role: "viewer", displayName: "뷰어"   },
};

/* ─── Context ─── */
interface RoleContextValue {
    role: Role;
    setRole: (role: Role) => void;
    userName: string;
    setUserName: (name: string) => void;
    isLoggedIn: boolean;
    hydrated: boolean;
    login: (username: string, password: string) => boolean;
    logout: () => void;
}

const RoleContext = React.createContext<RoleContextValue>({
    role: "viewer",
    setRole: () => { },
    userName: "사용자",
    setUserName: () => { },
    isLoggedIn: false,
    hydrated: false,
    login: () => false,
    logout: () => { },
});

const SESSION_KEY = "insightbi_session_v1";
const USER_NAME_KEY = "insightbi_user_name_v1";

interface Session { userName: string; role: Role; displayName: string; }

export function RoleProvider({ children }: { children: React.ReactNode }) {
    const [role, setRoleState] = React.useState<Role>("viewer");
    const [userName, setUserNameState] = React.useState<string>("사용자");
    const [isLoggedIn, setIsLoggedIn] = React.useState(false);
    const [hydrated, setHydrated] = React.useState(false);

    React.useEffect(() => {
        try {
            const s = localStorage.getItem(SESSION_KEY);
            if (s) {
                const session: Session = JSON.parse(s);
                setRoleState(session.role);
                setUserNameState(session.displayName);
                setIsLoggedIn(true);
            }
        } catch { /* 세션 없으면 로그인 필요 */ }
        setHydrated(true); // 복원 완료 — 이제 AuthGuard가 판단 가능
    }, []);

    const setRole = (next: Role) => {
        setRoleState(next);
        try {
            const s = localStorage.getItem(SESSION_KEY);
            if (s) {
                const session: Session = JSON.parse(s);
                localStorage.setItem(SESSION_KEY, JSON.stringify({ ...session, role: next }));
            }
        } catch { }
    };

    const setUserName = (name: string) => {
        setUserNameState(name);
        localStorage.setItem(USER_NAME_KEY, name);
        try {
            const s = localStorage.getItem(SESSION_KEY);
            if (s) {
                const session: Session = JSON.parse(s);
                localStorage.setItem(SESSION_KEY, JSON.stringify({ ...session, displayName: name }));
            }
        } catch { }
    };

    const login = (username: string, password: string): boolean => {
        const user = USERS[username.toLowerCase()];
        if (!user || user.password !== password) return false;
        const session: Session = { userName: username, role: user.role, displayName: user.displayName };
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        localStorage.setItem(USER_NAME_KEY, user.displayName);
        setRoleState(user.role);
        setUserNameState(user.displayName);
        setIsLoggedIn(true);
        return true;
    };

    const logout = () => {
        localStorage.removeItem(SESSION_KEY);
        setIsLoggedIn(false);
        setRoleState("viewer");
        setUserNameState("사용자");
    };

    return (
        <RoleContext.Provider value={{ role, setRole, userName, setUserName, isLoggedIn, hydrated, login, logout }}>
            {children}
        </RoleContext.Provider>
    );
}

export function useRole() {
    return React.useContext(RoleContext);
}
