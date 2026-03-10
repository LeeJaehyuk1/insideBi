export type EntryType = "collection" | "dashboard" | "question" | "model";

export interface FolderEntry {
  id: string;
  type: EntryType;
  name: string;
  lastEditor?: string;
  lastModified?: string;  // "3월 10, 2026"
  href: string;
}

export interface CollectionFolder {
  id: string;
  name: string;
  parentId?: string;  // undefined = root
  entries: FolderEntry[];
}

export const ROOT_ID = "our-analytics";

export const collectionFolders: CollectionFolder[] = [
  {
    id: ROOT_ID,
    name: "우리의 분석",
    entries: [
      { id: "db-1111",   type: "dashboard",  name: "1111",                               lastEditor: "재혁 이", lastModified: "3월 10, 2026", href: "/dashboards/new?name=1111" },
      { id: "db-4444",   type: "dashboard",  name: "4444",                               lastEditor: "재혁 이", lastModified: "3월 10, 2026", href: "/dashboards/new?name=4444" },
      { id: "auto-dash", type: "collection", name: "Automatically Generated Dashboards",                                                      href: "/collections/auto-dash" },
      { id: "examples",  type: "collection", name: "Examples",                                                                                href: "/collections/examples" },
      { id: "q-tdirncr", type: "question",   name: "Td Irncr",                           lastEditor: "재혁 이", lastModified: "3월 10, 2026", href: "/browse/railway/td_irncr" },
      { id: "db-test",   type: "dashboard",  name: "TEST",                               lastEditor: "재혁 이", lastModified: "3월 10, 2026", href: "/dashboards/new?name=TEST" },
    ],
  },
  {
    id: "auto-dash",
    name: "Automatically Generated Dashboards",
    parentId: ROOT_ID,
    entries: [
      { id: "auto-1", type: "dashboard", name: "신용리스크 자동 대시보드",  lastEditor: "시스템", lastModified: "3월 1, 2026",  href: "/credit-risk" },
      { id: "auto-2", type: "dashboard", name: "시장리스크 자동 대시보드",  lastEditor: "시스템", lastModified: "3월 1, 2026",  href: "/market-risk" },
      { id: "auto-3", type: "dashboard", name: "유동성리스크 자동 대시보드", lastEditor: "시스템", lastModified: "3월 1, 2026", href: "/liquidity-risk" },
    ],
  },
  {
    id: "examples",
    name: "Examples",
    parentId: ROOT_ID,
    entries: [
      { id: "ex-1", type: "question",  name: "NPL 비율 추이 예시",    lastEditor: "재혁 이", lastModified: "3월 5, 2026", href: "/questions/nocode?dataset=npl-trend" },
      { id: "ex-2", type: "question",  name: "업종별 익스포저 예시",   lastEditor: "재혁 이", lastModified: "3월 5, 2026", href: "/questions/nocode?dataset=sector-exposure" },
      { id: "ex-3", type: "dashboard", name: "리스크 종합 현황 예시", lastEditor: "재혁 이", lastModified: "3월 6, 2026", href: "/" },
    ],
  },
];

export function getFolder(id: string): CollectionFolder | undefined {
  return collectionFolders.find((f) => f.id === id);
}
