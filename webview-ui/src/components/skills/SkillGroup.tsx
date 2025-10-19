import React from "react"
import type { Skill } from "@roo-code/types"
import { SkillItem } from "./SkillItem"

interface SkillGroupProps {
	title: string
	skills: Skill[]
	activeSkills: string[]
	isExpanded: boolean
	onToggle: () => void
}

export const SkillGroup: React.FC<SkillGroupProps> = ({ title, skills, activeSkills, isExpanded, onToggle }) => {
	return (
		<div className="skill-group" style={{ marginBottom: "12px" }}>
			<div
				className="skill-group-header"
				style={{
					display: "flex",
					alignItems: "center",
					gap: "8px",
					padding: "8px",
					cursor: "pointer",
					borderRadius: "4px",
					backgroundColor: "var(--vscode-sideBar-background)",
				}}
				onClick={onToggle}
				role="button"
				tabIndex={0}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault()
						onToggle()
					}
				}}
				aria-expanded={isExpanded}>
				<span className={`codicon codicon-chevron-${isExpanded ? "down" : "right"}`}></span>
				<span style={{ flex: 1, fontWeight: 500 }}>
					{title} ({skills.length})
				</span>
			</div>

			{isExpanded && (
				<div className="skill-group-body" style={{ paddingLeft: "24px", paddingTop: "8px" }}>
					{skills.length === 0 ? (
						<div
							style={{
								padding: "16px",
								textAlign: "center",
								color: "var(--vscode-descriptionForeground)",
							}}>
							No skills in this group
						</div>
					) : (
						<div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
							{skills.map((skill) => (
								<SkillItem key={skill.id} skill={skill} isActive={activeSkills.includes(skill.id)} />
							))}
						</div>
					)}
				</div>
			)}
		</div>
	)
}
