type Role = {
  _id: string;
  name: string;
  permissions: string[];
};

type Permission = {
  _id: string;
  name: string;
  guard: string;
};

type User = {
  _id: string;
  name: string;
  email: string;
  roles: Role[];
  permissions: Permission[];
  verifyAt: string | null;
};

export const hasRole = (user: User | null | undefined): string[] => {
  if (!user || !Array.isArray(user.roles)) {
    console.warn(`hasRole: invalid user or roles`, user);
    return [];
  }

  return user.roles.map((role) => role.name);
};

export const hasPermission = (user: User | null | undefined, resource: string): Record<string, boolean> => {
  const resourcePermissions: Record<string, boolean> = {};

  if (!user || !Array.isArray(user.permissions)) {
    console.warn(`hasPermission: invalid user or permissions`, user);
    return resourcePermissions;
  }

  user.permissions
    .filter((perm) => perm.name.includes(resource))
    .forEach((perm) => {
      resourcePermissions[perm.name] = true;
    });

  return resourcePermissions;
};
