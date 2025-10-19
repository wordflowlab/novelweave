import React from "react"
import type { Skill } from "@roo-code/types"

interface SkillsStatusBarProps {
	activeSkills: Skill[]
	onClick?: () => void
}

export const SkillsStatusBar: React.FC<SkillsStatusBarProps> = ({ activeSkills, onClick }) => {
	if (activeSkills.length === 0) {
		return null
	}

	const getDisplayText = () => {
		const count = activeSkills.length
		const plural = count > 1 ? "s" : ""

		if (count <= 3) {
			// Show names for up to 3 skills
			const names = activeSkills.map((s) => s.name).join(", ")
			return `${count} Skill${plural} Active: ${names}`
		} else {
			// Just show count for many skills
			return `${count} Skills Active`
		}
	}

	return (
		<div
			className="skills-status-bar"
			style={{
				padding: "8px 12px",
				backgroundColor: "var(--vscode-editor-inactiveSelectionBackground)",
				borderRadius: "4px",
				marginBottom: "8px",
				display: "flex",
				alignItems: "center",
				gap: "8px",
				cursor: onClick ? "pointer" : "default",
				transition: "background-color 0.2s",
			}}
			onClick={onClick}
			onMouseEnter={(e) => {
				if (onClick) {
					e.currentTarget.style.backgroundColor = "var(--vscode-list-hoverBackground)"
				}
			}}
			onMouseLeave={(e) => {
				e.currentTarget.style.backgroundColor = "var(--vscode-editor-inactiveSelectionBackground)"
			}}
			role={onClick ? "button" : "status"}
			tabIndex={onClick ? 0 : undefined}
			onKeyDown={
				onClick
					? (e) => {
							if (e.key === "Enter" || e.key === " ") {
								e.preventDefault()
								onClick()
							}
						}
					: undefined
			}>
			<span className="codicon codicon-lightbulb" style={{ color: "var(--vscode-editorInfo-foreground)" }}></span>
			<span style={{ fontSize: "13px" }}>{getDisplayText()}</span>
			{onClick && (
				<span
					className="codicon codicon-arrow-right"
					style={{
						marginLeft: "auto",
						opacity: 0.7,
					}}></span>
			)}
		</div>
	)
}
