// GitHub Integration Service
// Handles repository operations, deployments, and version control

import { Octokit } from '@octokit/rest';

export interface GitHubConfig {
  owner: string;
  repo: string;
  token?: string;
}

export interface FileContent {
  path: string;
  content: string;
  message?: string;
}

export interface CommitInfo {
  sha: string;
  message: string;
  author: string;
  date: string;
  url: string;
}

export interface DeploymentStatus {
  id: string;
  state: 'pending' | 'success' | 'failure';
  url?: string;
  environment: string;
}

export class GitHubService {
  private octokit: Octokit | null = null;
  private config: GitHubConfig;

  constructor(config: GitHubConfig) {
    this.config = config;
    if (config.token) {
      this.octokit = new Octokit({ auth: config.token });
    }
  }

  /**
   * Initialize with user token
   */
  setToken(token: string) {
    this.config.token = token;
    this.octokit = new Octokit({ auth: token });
  }

  /**
   * Check if service is authenticated
   */
  isAuthenticated(): boolean {
    return this.octokit !== null;
  }

  /**
   * Get repository information
   */
  async getRepo() {
    if (!this.octokit) throw new Error('Not authenticated');
    
    try {
      const { data } = await this.octokit.repos.get({
        owner: this.config.owner,
        repo: this.config.repo,
      });
      return data;
    } catch (error) {
      throw new Error(`Failed to get repository: ${error}`);
    }
  }

  /**
   * List branches
   */
  async listBranches() {
    if (!this.octokit) throw new Error('Not authenticated');
    
    try {
      const { data } = await this.octokit.repos.listBranches({
        owner: this.config.owner,
        repo: this.config.repo,
      });
      return data;
    } catch (error) {
      throw new Error(`Failed to list branches: ${error}`);
    }
  }

  /**
   * Get file content from repository
   */
  async getFile(path: string, branch: string = 'main') {
    if (!this.octokit) throw new Error('Not authenticated');
    
    try {
      const { data } = await this.octokit.repos.getContent({
        owner: this.config.owner,
        repo: this.config.repo,
        path,
        ref: branch,
      });
      
      if ('content' in data && data.type === 'file') {
        const content = Buffer.from(data.content, 'base64').toString('utf-8');
        return {
          content,
          sha: data.sha,
          path: data.path,
        };
      }
      
      throw new Error('Path is not a file');
    } catch (error) {
      throw new Error(`Failed to get file: ${error}`);
    }
  }

  /**
   * Create or update a file
   */
  async createOrUpdateFile(
    path: string,
    content: string,
    message: string,
    branch: string = 'main',
    sha?: string
  ) {
    if (!this.octokit) throw new Error('Not authenticated');
    
    try {
      const { data } = await this.octokit.repos.createOrUpdateFileContents({
        owner: this.config.owner,
        repo: this.config.repo,
        path,
        message,
        content: Buffer.from(content).toString('base64'),
        branch,
        sha,
      });
      
      return {
        commit: data.commit,
        content: data.content,
      };
    } catch (error) {
      throw new Error(`Failed to create/update file: ${error}`);
    }
  }

  /**
   * Delete a file
   */
  async deleteFile(
    path: string,
    message: string,
    sha: string,
    branch: string = 'main'
  ) {
    if (!this.octokit) throw new Error('Not authenticated');
    
    try {
      const { data } = await this.octokit.repos.deleteFile({
        owner: this.config.owner,
        repo: this.config.repo,
        path,
        message,
        sha,
        branch,
      });
      
      return data;
    } catch (error) {
      throw new Error(`Failed to delete file: ${error}`);
    }
  }

  /**
   * Create a new branch
   */
  async createBranch(newBranch: string, fromBranch: string = 'main') {
    if (!this.octokit) throw new Error('Not authenticated');
    
    try {
      // Get the SHA of the source branch
      const { data: refData } = await this.octokit.git.getRef({
        owner: this.config.owner,
        repo: this.config.repo,
        ref: `heads/${fromBranch}`,
      });
      
      // Create new branch
      const { data } = await this.octokit.git.createRef({
        owner: this.config.owner,
        repo: this.config.repo,
        ref: `refs/heads/${newBranch}`,
        sha: refData.object.sha,
      });
      
      return data;
    } catch (error) {
      throw new Error(`Failed to create branch: ${error}`);
    }
  }

  /**
   * Get commit history
   */
  async getCommits(branch: string = 'main', limit: number = 10): Promise<CommitInfo[]> {
    if (!this.octokit) throw new Error('Not authenticated');
    
    try {
      const { data } = await this.octokit.repos.listCommits({
        owner: this.config.owner,
        repo: this.config.repo,
        sha: branch,
        per_page: limit,
      });
      
      return data.map(commit => ({
        sha: commit.sha,
        message: commit.commit.message,
        author: commit.commit.author?.name || 'Unknown',
        date: commit.commit.author?.date || '',
        url: commit.html_url,
      }));
    } catch (error) {
      throw new Error(`Failed to get commits: ${error}`);
    }
  }

  /**
   * Create a pull request
   */
  async createPullRequest(
    title: string,
    head: string,
    base: string = 'main',
    body?: string
  ) {
    if (!this.octokit) throw new Error('Not authenticated');
    
    try {
      const { data } = await this.octokit.pulls.create({
        owner: this.config.owner,
        repo: this.config.repo,
        title,
        head,
        base,
        body,
      });
      
      return data;
    } catch (error) {
      throw new Error(`Failed to create pull request: ${error}`);
    }
  }

  /**
   * Trigger a deployment (via repository dispatch)
   */
  async triggerDeployment(environment: string = 'production') {
    if (!this.octokit) throw new Error('Not authenticated');
    
    try {
      await this.octokit.repos.createDispatchEvent({
        owner: this.config.owner,
        repo: this.config.repo,
        event_type: 'deploy',
        client_payload: {
          environment,
          timestamp: new Date().toISOString(),
        },
      });
      
      return {
        success: true,
        environment,
        message: 'Deployment triggered successfully',
      };
    } catch (error) {
      throw new Error(`Failed to trigger deployment: ${error}`);
    }
  }

  /**
   * Get deployment status (via checks)
   */
  async getDeploymentStatus(ref: string = 'main'): Promise<DeploymentStatus[]> {
    if (!this.octokit) throw new Error('Not authenticated');
    
    try {
      const { data } = await this.octokit.repos.listDeployments({
        owner: this.config.owner,
        repo: this.config.repo,
        ref,
      });
      
      return data.map(deployment => ({
        id: deployment.id.toString(),
        state: (typeof deployment.payload === 'object' && deployment.payload !== null && 'state' in deployment.payload ? deployment.payload.state : 'pending') as 'pending' | 'success' | 'failure',
        url: deployment.url,
        environment: deployment.environment,
      }));
    } catch (error) {
      throw new Error(`Failed to get deployment status: ${error}`);
    }
  }

  /**
   * Push multiple files in a single commit
   */
  async pushFiles(
    files: FileContent[],
    commitMessage: string,
    branch: string = 'main'
  ) {
    if (!this.octokit) throw new Error('Not authenticated');
    
    try {
      // Get the latest commit SHA
      const { data: refData } = await this.octokit.git.getRef({
        owner: this.config.owner,
        repo: this.config.repo,
        ref: `heads/${branch}`,
      });
      
      const latestCommitSha = refData.object.sha;
      
      // Get the tree SHA of the latest commit
      const { data: commitData } = await this.octokit.git.getCommit({
        owner: this.config.owner,
        repo: this.config.repo,
        commit_sha: latestCommitSha,
      });
      
      const baseTreeSha = commitData.tree.sha;
      
      // Create blobs for all files
      const blobs = await Promise.all(
        files.map(async (file) => {
          const { data: blobData } = await this.octokit!.git.createBlob({
            owner: this.config.owner,
            repo: this.config.repo,
            content: Buffer.from(file.content).toString('base64'),
            encoding: 'base64',
          });
          
          return {
            path: file.path,
            mode: '100644' as const,
            type: 'blob' as const,
            sha: blobData.sha,
          };
        })
      );
      
      // Create a new tree
      const { data: treeData } = await this.octokit.git.createTree({
        owner: this.config.owner,
        repo: this.config.repo,
        base_tree: baseTreeSha,
        tree: blobs,
      });
      
      // Create a new commit
      const { data: newCommit } = await this.octokit.git.createCommit({
        owner: this.config.owner,
        repo: this.config.repo,
        message: commitMessage,
        tree: treeData.sha,
        parents: [latestCommitSha],
      });
      
      // Update the reference
      await this.octokit.git.updateRef({
        owner: this.config.owner,
        repo: this.config.repo,
        ref: `heads/${branch}`,
        sha: newCommit.sha,
      });
      
      return {
        commit: newCommit,
        filesCount: files.length,
      };
    } catch (error) {
      throw new Error(`Failed to push files: ${error}`);
    }
  }

  /**
   * Clone repository structure (get all files)
   */
  async getRepoStructure(path: string = '', branch: string = 'main'): Promise<any[]> {
    if (!this.octokit) throw new Error('Not authenticated');
    
    try {
      const { data } = await this.octokit.repos.getContent({
        owner: this.config.owner,
        repo: this.config.repo,
        path,
        ref: branch,
      });
      
      return Array.isArray(data) ? data : [data];
    } catch (error) {
      throw new Error(`Failed to get repo structure: ${error}`);
    }
  }
}

// Export a factory function
export function createGitHubService(config: GitHubConfig): GitHubService {
  return new GitHubService(config);
}

// Export default instance creator
export default createGitHubService;
