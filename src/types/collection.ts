export type CollectionItemType = "dashboard" | "question" | "report";

export interface CollectionItem {
  id: string;
  title: string;
  description?: string;
  type: CollectionItemType;
  href: string;
  createdAt: string;
  updatedAt: string;
  author: string;
  pinned?: boolean;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  color: string;       // tailwind bg- class
  textColor: string;   // tailwind text- class
  icon: string;        // lucide icon name
  itemCount: number;
  items: CollectionItem[];
  createdAt: string;
  personal?: boolean;
}
