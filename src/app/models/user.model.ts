export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Editor' | 'Viewer';
}

export interface RoleDistribution {
  Admin: number;
  Editor: number;
  Viewer: number;
}
