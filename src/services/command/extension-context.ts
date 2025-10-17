/**
 * Global extension context holder
 * 用于让命令服务访问扩展路径
 */

let globalExtensionPath: string | undefined

/**
 * Set the extension path globally
 */
export function setExtensionPath(path: string): void {
	globalExtensionPath = path
}

/**
 * Get the extension path
 */
export function getExtensionPath(): string | undefined {
	return globalExtensionPath
}
