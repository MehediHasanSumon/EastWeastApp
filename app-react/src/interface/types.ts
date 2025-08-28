import type React from "react";

export interface NavLinkProps {
  to: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export type IconType = "currency-dollar" | "users" | "shopping-cart" | "briefcase";

export interface FormField {
  name: string;
  label: string;
  type: string;
  placeholder: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  verifyAt: string | null;
}

export interface RootState {
  auth: {
    isLoading: boolean;
    isError: boolean;
    error: any | null;
    user: User | any;
  };
}

export interface PaginationMeta {
  total: number;
  perPage: number;
  currentPage: number;
  lastPage: number;
  from: number;
  to: number;
}

export type Column<T> = {
  header: string | React.ReactNode;
  accessor?: keyof T | ((row: T) => React.ReactNode);
  cell?: (row: T) => React.ReactNode;
  align?: "left" | "center" | "right";
};

export interface Category {
  _id: string;
  name: string;
  slug: string;
  status: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Blog {
  _id: string;
  title: string;
  slug: string;
  body: string;
  thumbnail?: string;
  tags: string[];
  category: Category | string;
  user: User | string;
  status: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Comment {
  _id: string;
  blog: string | Blog;
  user: string | User;
  body: string;
  parent?: string | Comment;
  status: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectCategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  status: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface TeamMember {
  memberName: string;
  designation: "designer" | "developer";
}

export interface ProjectFormData {
  name: string;
  slug: string;
  description: string;
  projectCategoryId: string;
  status: boolean;
  thumbnail: File | null;
  technologies: string[];
  photoGallery: File[];
  client: string;
  timeline: string;
  team: TeamMember[];
  viewCode: string;
  liveDemo: string;
}

export interface SlugAvailabilityResponse {
  available: boolean;
}

export interface PopularTechnologiesResponse {
  technologies: string[];
}

export interface ProjectCategoriesResponse {
  categories: ProjectCategory[];
}

// For API responses
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}


