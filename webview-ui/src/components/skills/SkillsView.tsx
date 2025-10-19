import React, { useState, useEffect } from "react"
import type { Skill } from "@roo-code/types"
import { SkillsPanel } from "./SkillsPanel"
import { vscode } from "../../utils/vscode"

interface SkillsViewProps {
	onDone: () => void
}

export const SkillsView: React.FC<SkillsViewProps> = ({ onDone }) => {
	const [skills, setSkills] = useState<Skill[]>([])
	const [activeSkills, setActiveSkills] = useState<string[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		// Request skills data from extension
		vscode.postMessage({ type: "getSkills" })

		// Listen for skills data response
		const handleMessage = (event: MessageEvent) => {
			const message = event.data
			if (message.type === "skillsData") {
				setSkills(message.skills || [])
				setActiveSkills(message.activeSkills || [])
				setError(message.error || null)
				setIsLoading(false)
			}
		}

		window.addEventListener("message", handleMessage)
		return () => window.removeEventListener("message", handleMessage)
	}, [])

	const handleRefresh = () => {
		setIsLoading(true)
		setError(null)
		vscode.postMessage({ type: "refreshSkills" })
	}

	const handleCreate = () => {
		vscode.postMessage({ type: "createSkill" })
	}

	return (
		<div
			style={{
				position: "fixed",
				inset: 0,
				display: "flex",
				flexDirection: "column",
				backgroundColor: "var(--vscode-editor-background)",
				overflow: "hidden",
			}}>
			{/* Header with back button */}
			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: "12px",
					padding: "12px 16px",
					borderBottom: "1px solid var(--vscode-panel-border)",
				}}>
				<button
					onClick={onDone}
					style={{
						display: "flex",
						alignItems: "center",
						gap: "6px",
						padding: "6px 12px",
						backgroundColor: "transparent",
						border: "1px solid var(--vscode-button-border)",
						color: "var(--vscode-button-foreground)",
						borderRadius: "2px",
						cursor: "pointer",
						fontSize: "13px",
					}}
					aria-label="Back to chat">
					<span className="codicon codicon-arrow-left"></span>
					Back
				</button>
				<h2 style={{ margin: 0, flex: 1, fontSize: "18px", fontWeight: 500 }}>Agent Skills</h2>
			</div>

			{/* Skills panel content */}
			<div style={{ flex: 1, overflow: "auto", padding: "16px" }}>
				{isLoading ? (
					<div
						style={{
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							height: "100%",
							color: "var(--vscode-descriptionForeground)",
						}}>
						<div style={{ textAlign: "center" }}>
							<div
								className="codicon codicon-loading codicon-modifier-spin"
								style={{ fontSize: "32px" }}></div>
							<p style={{ marginTop: "12px" }}>Loading skills...</p>
						</div>
					</div>
				) : (
					<SkillsPanel
						skills={skills}
						activeSkills={activeSkills}
						onRefresh={handleRefresh}
						onCreate={handleCreate}
						error={error}
					/>
				)}
			</div>
		</div>
	)
}
