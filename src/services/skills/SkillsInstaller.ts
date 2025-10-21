import * as vscode from "vscode"
import * as path from "path"
import * as fs from "fs/promises"
import { exec } from "child_process"
import { promisify } from "util"
import * as yaml from "yaml"
import type { Skill } from "@roo-code/types"

const execAsync = promisify(exec)

export interface InstallSkillOptions {
	target: "project" | "personal"
	progressCallback?: (message: string, percent: number) => void
}

export interface UpdateSkillResult {
	wasUpdated: boolean
}

/**
 * Service for installing, updating, and managing Skills from Git repositories
 */
export class SkillsInstaller {
	constructor(private readonly context: vscode.ExtensionContext) {}

	/**
	 * Install a Skill from a Git repository
	 */
	async installSkill(
		repositoryUrl: string,
		skillId: string,
		options: InstallSkillOptions,
	): Promise<{ skillPath: string }> {
		const { target, progressCallback } = options

		// Determine target path
		const skillPath = await this.getSkillPath(skillId, target)

		// Check if skill already exists
		try {
			await fs.access(skillPath)
			throw new Error(`Skill already installed at ${skillPath}. Use updateSkill() to update it.`)
		} catch (error: any) {
			if (error.code !== "ENOENT") {
				throw error
			}
			// Skill doesn't exist, proceed with installation
		}

		// Create parent directory if needed
		await fs.mkdir(path.dirname(skillPath), { recursive: true })

		try {
			// Report progress
			progressCallback?.("Cloning repository...", 0)

			// Clone repository
			await this.cloneRepository(repositoryUrl, skillPath)

			progressCallback?.("Downloading files...", 50)

			// Disable Git hooks for security
			await this.disableGitHooks(skillPath)

			progressCallback?.("Validating...", 90)

			// Validate SKILL.md
			await this.validateSkill(skillPath)

			// Save remote repository info for updates
			await this.saveRemoteInfo(skillPath, repositoryUrl)

			progressCallback?.("Done!", 100)

			return { skillPath }
		} catch (error) {
			// Clean up on error
			try {
				await fs.rm(skillPath, { recursive: true, force: true })
			} catch {
				// Ignore cleanup errors
			}
			throw error
		}
	}

	/**
	 * Update an installed Skill to the latest version
	 */
	async updateSkill(skillPath: string, skillId: string): Promise<UpdateSkillResult> {
		// Check if .git directory exists (full Git repository)
		const gitPath = path.join(skillPath, ".git")
		try {
			await fs.access(gitPath)
			return await this.updateWithGitPull(skillPath)
		} catch {
			// No .git directory, try .git-remote file
		}

		// Check if .git-remote file exists
		const remotePath = path.join(skillPath, ".git-remote")
		try {
			const repositoryUrl = await fs.readFile(remotePath, "utf-8")
			return await this.updateWithReclone(skillPath, repositoryUrl.trim())
		} catch {
			throw new Error(
				"Cannot update skill: no Git repository information found. " +
					"This skill may have been manually created or copied.",
			)
		}
	}

	/**
	 * Check if an installed Skill has updates available
	 */
	async checkSkillUpdate(skillPath: string): Promise<boolean> {
		const gitPath = path.join(skillPath, ".git")
		try {
			await fs.access(gitPath)
		} catch {
			// No .git directory, cannot check for updates
			return false
		}

		try {
			// Fetch latest changes
			await execAsync("git fetch", { cwd: skillPath, timeout: 5000 })

			// Check if there are new commits
			const { stdout } = await execAsync("git rev-list HEAD...origin/main --count", {
				cwd: skillPath,
				timeout: 2000,
			})

			const count = parseInt(stdout.trim(), 10)
			return count > 0
		} catch {
			// Error checking for updates (e.g., network issue, no 'main' branch)
			return false
		}
	}

	/**
	 * Uninstall a Skill by removing its directory
	 */
	async uninstallSkill(skillPath: string): Promise<void> {
		await fs.rm(skillPath, { recursive: true, force: true })
	}

	/**
	 * Validate that a skill directory contains a valid SKILL.md
	 */
	async validateSkill(skillPath: string): Promise<void> {
		const skillFilePath = path.join(skillPath, "SKILL.md")

		// Check if SKILL.md exists
		try {
			await fs.access(skillFilePath)
		} catch {
			throw new Error(`Invalid skill: SKILL.md not found in ${skillPath}`)
		}

		// Parse and validate frontmatter
		const content = await fs.readFile(skillFilePath, "utf-8")
		const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/)

		if (!frontmatterMatch) {
			throw new Error("Invalid skill format: SKILL.md missing YAML frontmatter")
		}

		try {
			const frontmatter = yaml.parse(frontmatterMatch[1])

			// Validate required fields
			if (!frontmatter.name || typeof frontmatter.name !== "string") {
				throw new Error("Invalid skill format: missing or invalid 'name' field")
			}

			if (!frontmatter.description || typeof frontmatter.description !== "string") {
				throw new Error("Invalid skill format: missing or invalid 'description' field")
			}

			// Validate optional field formats
			if (frontmatter.version && !/^\d+\.\d+\.\d+$/.test(frontmatter.version)) {
				throw new Error(
					`Invalid skill format: version '${frontmatter.version}' is not in semver format (e.g., 1.2.0)`,
				)
			}

			if (frontmatter.keywords && !Array.isArray(frontmatter.keywords)) {
				throw new Error("Invalid skill format: 'keywords' must be an array")
			}
		} catch (error: any) {
			if (error.name === "YAMLParseError") {
				throw new Error(`Invalid skill format: YAML parsing failed: ${error.message}`)
			}
			throw error
		}
	}

	/**
	 * Clone a Git repository using sparse checkout (optimized)
	 */
	private async cloneRepository(repositoryUrl: string, targetPath: string): Promise<void> {
		// Parse GitHub URL to handle both full repo URLs and tree URLs pointing to subdirectories
		const parsedUrl = this.parseGitHubUrl(repositoryUrl)

		try {
			// Try sparse checkout first (faster, smaller download)
			await execAsync(`git clone --depth 1 --filter=blob:none --sparse "${parsedUrl.repoUrl}" "${targetPath}"`, {
				timeout: 30000,
			})

			// Set sparse checkout to include the subdirectory if specified, or essential files
			if (parsedUrl.subdirectory) {
				await execAsync(`git sparse-checkout set "${parsedUrl.subdirectory}"`, {
					cwd: targetPath,
					timeout: 5000,
				})

				// Move subdirectory contents to root and clean up
				const subdirPath = path.join(targetPath, parsedUrl.subdirectory)
				try {
					await fs.access(subdirPath)
					// Create temp directory for subdirectory contents
					const tempPath = `${targetPath}_temp`
					await fs.rename(subdirPath, tempPath)

					// Get the .git directory before removing other files
					const gitPath = path.join(targetPath, ".git")
					const tempGitPath = `${targetPath}_git_temp`
					try {
						await fs.rename(gitPath, tempGitPath)
					} catch {
						// .git doesn't exist, that's okay
					}

					// Remove all files except temp directories
					const files = await fs.readdir(targetPath)
					for (const file of files) {
						const fullPath = path.join(targetPath, file)
						if (fullPath !== tempPath && fullPath !== tempGitPath) {
							await fs.rm(fullPath, { recursive: true, force: true })
						}
					}

					// Move temp subdirectory contents to target
					const tempFiles = await fs.readdir(tempPath)
					for (const file of tempFiles) {
						await fs.rename(path.join(tempPath, file), path.join(targetPath, file))
					}
					await fs.rm(tempPath, { recursive: true, force: true })

					// Restore .git directory if it existed
					try {
						await fs.access(tempGitPath)
						await fs.rename(tempGitPath, gitPath)
					} catch {
						// .git temp doesn't exist, skip
					}
				} catch {
					// Subdirectory doesn't exist or move failed, keep as is
				}
			} else {
				await execAsync(`git sparse-checkout set SKILL.md "*.md" examples/ templates/`, {
					cwd: targetPath,
					timeout: 5000,
				})
			}
		} catch (error) {
			// Fallback to regular shallow clone
			try {
				// Clean up failed sparse checkout attempt
				await fs.rm(targetPath, { recursive: true, force: true })
			} catch {
				// Ignore cleanup errors
			}

			try {
				await execAsync(`git clone --depth 1 "${parsedUrl.repoUrl}" "${targetPath}"`, { timeout: 30000 })

				// If there's a subdirectory, we need to move its contents to the target path
				if (parsedUrl.subdirectory) {
					const subdirPath = path.join(targetPath, parsedUrl.subdirectory)
					try {
						await fs.access(subdirPath)

						// Create temp directory for subdirectory contents
						const tempPath = `${targetPath}_temp`
						await fs.rename(subdirPath, tempPath)

						// Get the .git directory before removing other files
						const gitPath = path.join(targetPath, ".git")
						const tempGitPath = `${targetPath}_git_temp`
						try {
							await fs.rename(gitPath, tempGitPath)
						} catch {
							// .git doesn't exist, that's okay
						}

						// Remove all files except temp directories
						const files = await fs.readdir(targetPath)
						for (const file of files) {
							const fullPath = path.join(targetPath, file)
							if (fullPath !== tempPath && fullPath !== tempGitPath) {
								await fs.rm(fullPath, { recursive: true, force: true })
							}
						}

						// Move temp subdirectory contents to target
						const tempFiles = await fs.readdir(tempPath)
						for (const file of tempFiles) {
							await fs.rename(path.join(tempPath, file), path.join(targetPath, file))
						}
						await fs.rm(tempPath, { recursive: true, force: true })

						// Restore .git directory if it existed
						try {
							await fs.access(tempGitPath)
							await fs.rename(tempGitPath, gitPath)
						} catch {
							// .git temp doesn't exist, skip
						}
					} catch {
						// Subdirectory doesn't exist, use the whole repo
					}
				}
			} catch (cloneError: any) {
				// Parse Git error messages
				const errorMessage = cloneError.stderr || cloneError.message || String(cloneError)

				if (errorMessage.includes("Repository not found") || errorMessage.includes("not found")) {
					throw new Error(`Repository not found: ${parsedUrl.repoUrl}`)
				} else if (errorMessage.includes("Permission denied") || errorMessage.includes("access")) {
					throw new Error(`Permission denied: Unable to access ${parsedUrl.repoUrl}`)
				} else if (errorMessage.includes("Network") || errorMessage.includes("Could not resolve host")) {
					throw new Error("Network error: Unable to connect to Git repository")
				} else {
					throw new Error(`Failed to clone repository: ${errorMessage}`)
				}
			}
		}
	}

	/**
	 * Parse GitHub URL to extract repository URL and subdirectory
	 * Handles URLs like:
	 *   - https://github.com/owner/repo
	 *   - https://github.com/owner/repo.git
	 *   - https://github.com/owner/repo/tree/branch/path/to/skill
	 */
	private parseGitHubUrl(url: string): { repoUrl: string; subdirectory?: string } {
		// Match GitHub tree URL pattern
		const treeMatch = url.match(/^(https:\/\/github\.com\/[^\/]+\/[^\/]+)\/tree\/[^\/]+\/(.+)$/)
		if (treeMatch) {
			return {
				repoUrl: `${treeMatch[1]}.git`,
				subdirectory: treeMatch[2],
			}
		}

		// Regular repository URL
		if (url.endsWith(".git")) {
			return { repoUrl: url }
		}

		return { repoUrl: `${url}.git` }
	}

	/**
	 * Disable Git hooks for security
	 */
	private async disableGitHooks(skillPath: string): Promise<void> {
		const gitPath = path.join(skillPath, ".git")
		try {
			await fs.access(gitPath)
			await execAsync("git config core.hooksPath /dev/null", { cwd: skillPath, timeout: 2000 })
		} catch {
			// .git directory doesn't exist or command failed, skip
		}
	}

	/**
	 * Save remote repository URL for future updates
	 */
	private async saveRemoteInfo(skillPath: string, repositoryUrl: string): Promise<void> {
		const remotePath = path.join(skillPath, ".git-remote")
		await fs.writeFile(remotePath, repositoryUrl, "utf-8")
	}

	/**
	 * Update skill using git pull
	 */
	private async updateWithGitPull(skillPath: string): Promise<UpdateSkillResult> {
		try {
			const { stdout } = await execAsync("git pull", { cwd: skillPath, timeout: 10000 })

			// Check if already up to date
			if (stdout.includes("Already up to date") || stdout.includes("Already up-to-date")) {
				return { wasUpdated: false }
			}

			// Validate after update
			await this.validateSkill(skillPath)

			return { wasUpdated: true }
		} catch (error: any) {
			throw new Error(`Failed to update skill: ${error.message}`)
		}
	}

	/**
	 * Update skill by re-cloning repository
	 */
	private async updateWithReclone(skillPath: string, repositoryUrl: string): Promise<UpdateSkillResult> {
		// Remove old installation
		await fs.rm(skillPath, { recursive: true, force: true })

		// Re-clone
		await this.cloneRepository(repositoryUrl, skillPath)
		await this.disableGitHooks(skillPath)
		await this.validateSkill(skillPath)
		await this.saveRemoteInfo(skillPath, repositoryUrl)

		return { wasUpdated: true }
	}

	/**
	 * Get the installation path for a skill
	 */
	private async getSkillPath(skillId: string, target: "project" | "personal"): Promise<string> {
		if (target === "project") {
			const workspaceFolder = vscode.workspace.workspaceFolders?.[0]
			if (!workspaceFolder) {
				throw new Error("No workspace folder open. Cannot install to project.")
			}
			return path.join(workspaceFolder.uri.fsPath, ".agent", "skills", skillId)
		} else {
			// Personal skills go to globalStorage/skills/
			const globalStoragePath = this.context.globalStorageUri.fsPath
			await fs.mkdir(globalStoragePath, { recursive: true })
			return path.join(globalStoragePath, "skills", skillId)
		}
	}
}
