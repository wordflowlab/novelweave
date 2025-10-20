import React, { useState } from "react"
import { useTranslation } from "react-i18next"
import type { Skill } from "@roo-code/types"
import { vscode } from "../../utils/vscode"

interface SkillItemProps {
	skill: Skill
	isActive: boolean
}

export const SkillItem: React.FC<SkillItemProps> = ({ skill, isActive }) => {
	const { t } = useTranslation("skills")
	const [isExpanded, setIsExpanded] = useState(false)

	const getSourceIcon = (source: string) => {
		switch (source) {
			case "project":
				return "folder"
			case "personal":
				return "person"
			case "extension":
				return "extensions"
			default:
				return "file"
		}
	}

	const handleViewDetails = () => {
		vscode.postMessage({
			type: "viewSkillDetails",
			skillId: skill.id,
		})
	}

	const handleDelete = () => {
		console.log("[SkillItem] handleDelete called for skill:", skill.name, "source:", skill.source, "id:", skill.id)

		// All skills (project and personal) can be deleted
		// Note: Can't use window.confirm() in webview sandbox, backend will handle confirmation
		const message = {
			type: "deleteSkill" as const,
			skillId: skill.id,
			skillName: skill.name, // Pass name for backend confirmation dialog
		}
		console.log("[SkillItem] Sending deleteSkill message:", message)
		vscode.postMessage(message)
		console.log("[SkillItem] Message sent successfully")
	}

	const toggleExpand = () => {
		setIsExpanded(!isExpanded)
	}

	return (
		<div
			className={`skill-item ${isActive ? "skill-item-active" : ""}`}
			style={{
				border: "1px solid var(--vscode-panel-border)",
				borderRadius: "4px",
				padding: "12px",
				backgroundColor: "var(--vscode-editor-background)",
				...(isActive && {
					borderColor: "var(--vscode-focusBorder)",
					borderWidth: "2px",
				}),
			}}>
			<div
				className="skill-item-header"
				style={{
					display: "flex",
					alignItems: "flex-start",
					gap: "8px",
					cursor: "pointer",
				}}
				onClick={toggleExpand}>
				<div style={{ flex: 1 }}>
					<div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
						<span
							className={`codicon codicon-${getSourceIcon(skill.source)}`}
							style={{ fontSize: "14px" }}></span>
						<span style={{ fontWeight: 600 }}>{skill.name}</span>
						{skill.version && (
							<span
								style={{
									fontSize: "11px",
									padding: "2px 6px",
									borderRadius: "3px",
									backgroundColor: "var(--vscode-badge-background)",
									color: "var(--vscode-badge-foreground)",
								}}>
								v{skill.version}
							</span>
						)}
						{isActive && (
							<span
								style={{
									fontSize: "11px",
									padding: "2px 6px",
									borderRadius: "3px",
									backgroundColor: "var(--vscode-testing-iconPassed)",
									color: "white",
								}}>
								{t("active")}
							</span>
						)}
					</div>
					<div
						style={{
							fontSize: "13px",
							color: "var(--vscode-descriptionForeground)",
							lineHeight: "1.4",
						}}>
						{skill.description}
					</div>
				</div>
				<span className={`codicon codicon-chevron-${isExpanded ? "up" : "down"}`}></span>
			</div>

			{isExpanded && (
				<div
					className="skill-item-details"
					style={{
						marginTop: "12px",
						paddingTop: "12px",
						borderTop: "1px solid var(--vscode-panel-border)",
					}}>
					{skill.keywords && skill.keywords.length > 0 && (
						<div style={{ marginBottom: "8px" }}>
							<span style={{ fontSize: "12px", color: "var(--vscode-descriptionForeground)" }}>
								{t("fields.keywords")}:{" "}
							</span>
							<span style={{ fontSize: "12px" }}>{skill.keywords.join(", ")}</span>
						</div>
					)}

					{skill.requiredModes && skill.requiredModes.length > 0 && (
						<div style={{ marginBottom: "8px", display: "flex", alignItems: "center", gap: "4px" }}>
							<span className="codicon codicon-location" style={{ fontSize: "12px" }}></span>
							<span style={{ fontSize: "12px", color: "var(--vscode-descriptionForeground)" }}>
								{t("fields.modes")}: {skill.requiredModes.join(", ")}
							</span>
						</div>
					)}

					{skill.whenToUse && (
						<div style={{ marginBottom: "8px" }}>
							<span
								style={{
									fontSize: "12px",
									color: "var(--vscode-descriptionForeground)",
									fontStyle: "italic",
								}}>
								{skill.whenToUse}
							</span>
						</div>
					)}

					{skill.supportFiles && skill.supportFiles.length > 0 && (
						<div style={{ marginBottom: "8px" }}>
							<span style={{ fontSize: "12px", color: "var(--vscode-descriptionForeground)" }}>
								{t("fields.supportFiles")}: {skill.supportFiles.length}
							</span>
						</div>
					)}

					<div style={{ marginTop: "12px", display: "flex", gap: "8px" }}>
						<button
							onClick={(e) => {
								e.stopPropagation()
								handleViewDetails()
							}}
							style={{
								padding: "4px 12px",
								fontSize: "12px",
								cursor: "pointer",
								border: "1px solid var(--vscode-button-border)",
								backgroundColor: "var(--vscode-button-secondaryBackground)",
								color: "var(--vscode-button-secondaryForeground)",
								borderRadius: "2px",
							}}>
							{t("viewFullContent")}
						</button>
						<button
							onClick={(e) => {
								e.stopPropagation()
								handleDelete()
							}}
							style={{
								padding: "4px 12px",
								fontSize: "12px",
								cursor: "pointer",
								border: "1px solid var(--vscode-button-border)",
								backgroundColor: "var(--vscode-inputValidation-errorBackground)",
								color: "var(--vscode-errorForeground)",
								borderRadius: "2px",
							}}>
							{t("delete")}
						</button>
					</div>
				</div>
			)}
		</div>
	)
}
