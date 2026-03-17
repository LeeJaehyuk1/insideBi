"use client";

import * as React from "react";
import type { AdminUser, AdminGroup } from "@/lib/mock-data/admin-users";
import { mockAdminUsers, mockAdminGroups } from "@/lib/mock-data/admin-users";

const USERS_KEY  = "insightbi_admin_users_v1";
const GROUPS_KEY = "insightbi_admin_groups_v1";

function loadUsers(): AdminUser[] {
  if (typeof window === "undefined") return [...mockAdminUsers];
  try {
    const s = localStorage.getItem(USERS_KEY);
    if (s) {
      const stored: AdminUser[] = JSON.parse(s);
      const ids = new Set(stored.map((u) => u.id));
      return [...stored, ...mockAdminUsers.filter((u) => !ids.has(u.id))];
    }
  } catch {}
  return [...mockAdminUsers];
}

function loadGroups(): AdminGroup[] {
  if (typeof window === "undefined") return [...mockAdminGroups];
  try {
    const s = localStorage.getItem(GROUPS_KEY);
    if (s) return JSON.parse(s);
  } catch {}
  return [...mockAdminGroups];
}

function saveUsers(data: AdminUser[]) {
  try { localStorage.setItem(USERS_KEY, JSON.stringify(data)); } catch {}
}
function saveGroups(data: AdminGroup[]) {
  try { localStorage.setItem(GROUPS_KEY, JSON.stringify(data)); } catch {}
}

export function useAdminUsers() {
  const [users, setUsers]   = React.useState<AdminUser[]>([]);
  const [groups, setGroups] = React.useState<AdminGroup[]>([]);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    setUsers(loadUsers());
    setGroups(loadGroups());
    setHydrated(true);
  }, []);

  const updateUser = React.useCallback((id: string, patch: Partial<AdminUser>) => {
    setUsers((prev) => {
      const next = prev.map((u) => (u.id === id ? { ...u, ...patch } : u));
      saveUsers(next);
      return next;
    });
  }, []);

  const addUser = React.useCallback((user: AdminUser) => {
    setUsers((prev) => {
      const next = [user, ...prev];
      saveUsers(next);
      return next;
    });
  }, []);

  const deleteUser = React.useCallback((id: string) => {
    setUsers((prev) => {
      const next = prev.filter((u) => u.id !== id);
      saveUsers(next);
      return next;
    });
  }, []);

  const addGroup = React.useCallback((group: AdminGroup) => {
    setGroups((prev) => {
      const next = [group, ...prev];
      saveGroups(next);
      return next;
    });
  }, []);

  const updateGroup = React.useCallback((id: string, patch: Partial<AdminGroup>) => {
    setGroups((prev) => {
      const next = prev.map((g) => (g.id === id ? { ...g, ...patch } : g));
      saveGroups(next);
      return next;
    });
  }, []);

  const deleteGroup = React.useCallback((id: string) => {
    setGroups((prev) => {
      const next = prev.filter((g) => g.id !== id);
      saveGroups(next);
      return next;
    });
  }, []);

  return { users, groups, hydrated, updateUser, addUser, deleteUser, addGroup, updateGroup, deleteGroup };
}
