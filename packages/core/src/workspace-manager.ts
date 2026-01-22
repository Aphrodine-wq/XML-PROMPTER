/**
 * Workspace Manager - Multi-Workspace Organization
 *
 * Provides workspace management for organizing projects:
 * - Create and manage multiple workspaces
 * - Workspace-specific settings and preferences
 * - Resource isolation between workspaces
 * - Workspace templates
 * - Import/export workspaces
 *
 * Performance Impact: Better organization for large teams and projects
 *
 * @module workspace-manager
 */

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  settings: WorkspaceSettings;
  members: WorkspaceMember[];
  projects: string[]; // Project IDs
  created: number;
  updated: number;
  quota?: WorkspaceQuota;
}

export interface WorkspaceSettings {
  defaultProvider?: string;
  defaultModel?: string;
  theme?: 'light' | 'dark' | 'auto';
  autoSave?: boolean;
  collaborationEnabled?: boolean;
  customSettings?: Record<string, any>;
}

export interface WorkspaceMember {
  userId: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  joinedAt: number;
  permissions: string[];
}

export interface WorkspaceQuota {
  maxGenerations: number;
  maxTokens: number;
  maxStorage: number; // bytes
  maxCollaborators: number;
  usedGenerations: number;
  usedTokens: number;
  usedStorage: number;
  resetDate?: number;
}

export interface WorkspaceTemplate {
  id: string;
  name: string;
  description: string;
  settings: WorkspaceSettings;
  includeProjects?: boolean;
}

/**
 * Workspace Manager
 */
export class WorkspaceManager {
  private workspaces: Map<string, Workspace> = new Map();
  private currentWorkspaceId?: string;
  private templates: Map<string, WorkspaceTemplate> = new Map();

  /**
   * Create a new workspace
   */
  createWorkspace(
    name: string,
    settings?: Partial<WorkspaceSettings>,
    ownerId?: string
  ): Workspace {
    const workspace: Workspace = {
      id: this.generateId(),
      name,
      description: '',
      settings: {
        autoSave: true,
        collaborationEnabled: false,
        ...settings,
      },
      members: ownerId
        ? [
            {
              userId: ownerId,
              role: 'owner',
              joinedAt: Date.now(),
              permissions: ['*'],
            },
          ]
        : [],
      projects: [],
      created: Date.now(),
      updated: Date.now(),
    };

    this.workspaces.set(workspace.id, workspace);
    return workspace;
  }

  /**
   * Get workspace by ID
   */
  getWorkspace(workspaceId: string): Workspace | undefined {
    return this.workspaces.get(workspaceId);
  }

  /**
   * Update workspace
   */
  updateWorkspace(
    workspaceId: string,
    updates: Partial<Omit<Workspace, 'id' | 'created'>>
  ): Workspace | undefined {
    const workspace = this.workspaces.get(workspaceId);
    if (!workspace) {
      return undefined;
    }

    const updated: Workspace = {
      ...workspace,
      ...updates,
      updated: Date.now(),
    };

    this.workspaces.set(workspaceId, updated);
    return updated;
  }

  /**
   * Delete workspace
   */
  deleteWorkspace(workspaceId: string): boolean {
    return this.workspaces.delete(workspaceId);
  }

  /**
   * List all workspaces for a user
   */
  listWorkspaces(userId?: string): Workspace[] {
    const workspaces = Array.from(this.workspaces.values());

    if (userId) {
      return workspaces.filter((ws) => ws.members.some((m) => m.userId === userId));
    }

    return workspaces;
  }

  /**
   * Set current active workspace
   */
  setCurrentWorkspace(workspaceId: string): void {
    if (!this.workspaces.has(workspaceId)) {
      throw new Error(`Workspace ${workspaceId} not found`);
    }
    this.currentWorkspaceId = workspaceId;
  }

  /**
   * Get current workspace
   */
  getCurrentWorkspace(): Workspace | undefined {
    return this.currentWorkspaceId ? this.workspaces.get(this.currentWorkspaceId) : undefined;
  }

  /**
   * Add member to workspace
   */
  addMember(
    workspaceId: string,
    userId: string,
    role: WorkspaceMember['role'] = 'member'
  ): boolean {
    const workspace = this.workspaces.get(workspaceId);
    if (!workspace) {
      return false;
    }

    // Check if already a member
    if (workspace.members.some((m) => m.userId === userId)) {
      return false;
    }

    workspace.members.push({
      userId,
      role,
      joinedAt: Date.now(),
      permissions: this.getRolePermissions(role),
    });

    workspace.updated = Date.now();
    return true;
  }

  /**
   * Remove member from workspace
   */
  removeMember(workspaceId: string, userId: string): boolean {
    const workspace = this.workspaces.get(workspaceId);
    if (!workspace) {
      return false;
    }

    const index = workspace.members.findIndex((m) => m.userId === userId);
    if (index === -1) {
      return false;
    }

    // Cannot remove the last owner
    if (workspace.members[index].role === 'owner') {
      const ownerCount = workspace.members.filter((m) => m.role === 'owner').length;
      if (ownerCount === 1) {
        throw new Error('Cannot remove the last owner');
      }
    }

    workspace.members.splice(index, 1);
    workspace.updated = Date.now();
    return true;
  }

  /**
   * Update member role
   */
  updateMemberRole(
    workspaceId: string,
    userId: string,
    newRole: WorkspaceMember['role']
  ): boolean {
    const workspace = this.workspaces.get(workspaceId);
    if (!workspace) {
      return false;
    }

    const member = workspace.members.find((m) => m.userId === userId);
    if (!member) {
      return false;
    }

    member.role = newRole;
    member.permissions = this.getRolePermissions(newRole);
    workspace.updated = Date.now();
    return true;
  }

  /**
   * Check if user has permission
   */
  hasPermission(workspaceId: string, userId: string, permission: string): boolean {
    const workspace = this.workspaces.get(workspaceId);
    if (!workspace) {
      return false;
    }

    const member = workspace.members.find((m) => m.userId === userId);
    if (!member) {
      return false;
    }

    return member.permissions.includes('*') || member.permissions.includes(permission);
  }

  /**
   * Add project to workspace
   */
  addProject(workspaceId: string, projectId: string): boolean {
    const workspace = this.workspaces.get(workspaceId);
    if (!workspace) {
      return false;
    }

    if (!workspace.projects.includes(projectId)) {
      workspace.projects.push(projectId);
      workspace.updated = Date.now();
      return true;
    }

    return false;
  }

  /**
   * Remove project from workspace
   */
  removeProject(workspaceId: string, projectId: string): boolean {
    const workspace = this.workspaces.get(workspaceId);
    if (!workspace) {
      return false;
    }

    const index = workspace.projects.indexOf(projectId);
    if (index > -1) {
      workspace.projects.splice(index, 1);
      workspace.updated = Date.now();
      return true;
    }

    return false;
  }

  /**
   * Update workspace quota
   */
  updateQuota(workspaceId: string, quota: Partial<WorkspaceQuota>): boolean {
    const workspace = this.workspaces.get(workspaceId);
    if (!workspace) {
      return false;
    }

    workspace.quota = {
      ...workspace.quota,
      ...quota,
    } as WorkspaceQuota;

    workspace.updated = Date.now();
    return true;
  }

  /**
   * Check quota usage
   */
  checkQuota(workspaceId: string, type: 'generations' | 'tokens' | 'storage'): boolean {
    const workspace = this.workspaces.get(workspaceId);
    if (!workspace || !workspace.quota) {
      return true; // No quota enforced
    }

    const quota = workspace.quota;

    switch (type) {
      case 'generations':
        return quota.usedGenerations < quota.maxGenerations;
      case 'tokens':
        return quota.usedTokens < quota.maxTokens;
      case 'storage':
        return quota.usedStorage < quota.maxStorage;
      default:
        return true;
    }
  }

  /**
   * Increment quota usage
   */
  incrementQuotaUsage(
    workspaceId: string,
    type: 'generations' | 'tokens' | 'storage',
    amount: number
  ): void {
    const workspace = this.workspaces.get(workspaceId);
    if (!workspace || !workspace.quota) {
      return;
    }

    switch (type) {
      case 'generations':
        workspace.quota.usedGenerations += amount;
        break;
      case 'tokens':
        workspace.quota.usedTokens += amount;
        break;
      case 'storage':
        workspace.quota.usedStorage += amount;
        break;
    }
  }

  /**
   * Create workspace template
   */
  createTemplate(name: string, settings: WorkspaceSettings): WorkspaceTemplate {
    const template: WorkspaceTemplate = {
      id: this.generateId(),
      name,
      description: '',
      settings,
    };

    this.templates.set(template.id, template);
    return template;
  }

  /**
   * Create workspace from template
   */
  createFromTemplate(templateId: string, name: string, ownerId?: string): Workspace | undefined {
    const template = this.templates.get(templateId);
    if (!template) {
      return undefined;
    }

    return this.createWorkspace(name, template.settings, ownerId);
  }

  /**
   * Export workspace
   */
  exportWorkspace(workspaceId: string): string | undefined {
    const workspace = this.workspaces.get(workspaceId);
    if (!workspace) {
      return undefined;
    }

    return JSON.stringify(workspace, null, 2);
  }

  /**
   * Import workspace
   */
  importWorkspace(json: string): Workspace {
    const data = JSON.parse(json);
    const workspace: Workspace = {
      ...data,
      id: this.generateId(), // Generate new ID
      created: Date.now(),
      updated: Date.now(),
    };

    this.workspaces.set(workspace.id, workspace);
    return workspace;
  }

  /**
   * Get workspace statistics
   */
  getStats(workspaceId: string): any {
    const workspace = this.workspaces.get(workspaceId);
    if (!workspace) {
      return null;
    }

    return {
      id: workspace.id,
      name: workspace.name,
      memberCount: workspace.members.length,
      projectCount: workspace.projects.length,
      created: workspace.created,
      updated: workspace.updated,
      quota: workspace.quota,
    };
  }

  private generateId(): string {
    return `ws-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getRolePermissions(role: WorkspaceMember['role']): string[] {
    switch (role) {
      case 'owner':
      case 'admin':
        return ['*'];
      case 'member':
        return ['read', 'write', 'generate'];
      case 'viewer':
        return ['read'];
      default:
        return [];
    }
  }
}

// Singleton instance
export const workspaceManager = new WorkspaceManager();
