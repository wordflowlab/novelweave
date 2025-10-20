import React, { useState } from "react"
import { useTranslation } from "react-i18next"
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react"
import type { Skill } from "@roo-code/types"
import { SkillGroup } from "./SkillGroup"
import { vscode } from "../../utils/vscode"

interface SkillsPanelProps {
	skills: Skill[]
	activeSkills: string[]
	onRefresh?: () => void
	onCreate?: () => void
	error?: string | null
}

export const SkillsPanel: React.FC<SkillsPanelProps> = ({ skills, activeSkills, onRefresh, onCreate, error }) => {
	const { t } = useTranslation("skills")
	const [isRefreshing, setIsRefreshing] = useState(false)
	const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(["active"]))

	// Group skills by source
	const groupedSkills = React.useMemo(() => {
		const groups: Record<string, Skill[]> = {
			active: [],
			project: [],
			personal: [],
		}

		skills.forEach((skill) => {
			if (activeSkills.includes(skill.id)) {
				groups.active.push(skill)
			}
			groups[skill.source].push(skill)
		})

		// Remove empty groups
		Object.keys(groups).forEach((key) => {
			if (groups[key].length === 0 && key !== "active") {
				delete groups[key]
			}
		})

		return groups
	}, [skills, activeSkills])

	const handleRefresh = async () => {
		setIsRefreshing(true)
		try {
			if (onRefresh) {
				onRefresh()
			} else {
				vscode.postMessage({ type: "refreshSkills" })
			}
			// Wait for a short delay to show the loading state
			await new Promise((resolve) => setTimeout(resolve, 500))
		} finally {
			setIsRefreshing(false)
		}
	}

	const handleCreate = () => {
		if (onCreate) {
			onCreate()
		} else {
			vscode.postMessage({ type: "createSkill" })
		}
	}

	const toggleGroup = (groupKey: string) => {
		setExpandedGroups((prev) => {
			const newSet = new Set(prev)
			if (newSet.has(groupKey)) {
				newSet.delete(groupKey)
			} else {
				newSet.add(groupKey)
			}
			return newSet
		})
	}

	// Error state
	if (error) {
		return (
			<div className="skills-panel" style={{ padding: "16px" }}>
				<div
					className="skills-error-state"
					style={{
						textAlign: "center",
						padding: "32px 16px",
						backgroundColor: "var(--vscode-inputValidation-errorBackground)",
						border: "1px solid var(--vscode-inputValidation-errorBorder)",
						borderRadius: "4px",
					}}>
					<div style={{ fontSize: "48px", marginBottom: "16px" }}>⚠️</div>
					<h3 style={{ marginBottom: "8px", color: "var(--vscode-errorForeground)" }}>{t("error.title")}</h3>
					<p
						style={{
							color: "var(--vscode-descriptionForeground)",
							marginBottom: "16px",
							whiteSpace: "pre-wrap",
						}}>
						{error}
					</p>
					<VSCodeButton onClick={handleRefresh}>{t("error.tryAgain")}</VSCodeButton>
				</div>
			</div>
		)
	}

	// Empty state
	if (skills.length === 0) {
		return (
			<div className="skills-panel" style={{ padding: "16px" }}>
				<div className="skills-empty-state" style={{ textAlign: "center", padding: "32px 16px" }}>
					<div style={{ fontSize: "48px", marginBottom: "16px" }}>📚</div>
					<h3 style={{ marginBottom: "8px" }}>{t("empty.title")}</h3>
					<p style={{ color: "var(--vscode-descriptionForeground)", marginBottom: "16px" }}>
						{t("empty.description")}
					</p>
					<VSCodeButton onClick={handleCreate}>{t("createNew")}</VSCodeButton>
				</div>
			</div>
		)
	}

	const groupLabels: Record<string, string> = {
		active: t("groups.active"),
		project: t("groups.project"),
		personal: t("groups.personal"),
	}

	return (
		<div className="skills-panel">
			<div
				className="skills-panel-header"
				style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: "8px" }}>
				<h3 style={{ flex: 1, margin: 0 }}>{t("title")}</h3>
				<VSCodeButton
					appearance="icon"
					onClick={handleRefresh}
					disabled={isRefreshing}
					aria-label={t("refresh")}>
					<span className={`codicon codicon-refresh ${isRefreshing ? "spinning" : ""}`}></span>
				</VSCodeButton>
			</div>

			<div className="skills-panel-body" style={{ padding: "0 16px 16px" }}>
				{Object.entries(groupedSkills).map(([groupKey, groupSkills]) => {
					if (groupSkills.length === 0 && groupKey === "active") {
						return null // Don't show empty active group
					}

					return (
						<SkillGroup
							key={groupKey}
							title={groupLabels[groupKey] || groupKey}
							skills={groupSkills}
							activeSkills={activeSkills}
							isExpanded={expandedGroups.has(groupKey)}
							onToggle={() => toggleGroup(groupKey)}
						/>
					)
				})}

				<div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
					<VSCodeButton onClick={handleCreate} style={{ width: "100%" }}>
						{t("createNew")}
					</VSCodeButton>
					<VSCodeButton
						appearance="secondary"
						onClick={() => vscode.postMessage({ type: "skillsInitialize" })}
						style={{ width: "100%" }}>
						{t("initialize") || "Initialize Skills"}
					</VSCodeButton>
					<VSCodeButton
						appearance="secondary"
						onClick={() => vscode.postMessage({ type: "skillsCheckNew" })}
						style={{ width: "100%" }}>
						{t("checkNew") || "Check for New Skills"}
					</VSCodeButton>
				</div>
			</div>

			<style>{`
				.spinning {
					animation: spin 1s linear infinite;
				}
				
				@keyframes spin {
					from {
						transform: rotate(0deg);
					}
					to {
						transform: rotate(360deg);
					}
				}
			`}</style>
		</div>
	)
}
