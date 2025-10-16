import { useCallback } from "react"
import { VSCodeTextField } from "@vscode/webview-ui-toolkit/react"
import { getNovelWeaveBackendSignInUrl } from "../../helpers"
import { Button } from "@src/components/ui"
import { type ProviderSettings, type OrganizationAllowList } from "@roo-code/types"
import type { RouterModels } from "@roo/api"
import { useAppTranslation } from "@src/i18n/TranslationContext"
import { VSCodeButtonLink } from "@src/components/common/VSCodeButtonLink"
import { inputEventTransform } from "../../../settings/transforms"
import { ModelPicker } from "../../../settings/ModelPicker"
import { vscode } from "@src/utils/vscode"
import { OrganizationSelector } from "../../common/OrganizationSelector"
import { NovelWeaveWrapperProperties } from "../../../../../../src/shared/novelweave/wrapper"
import { useNovelWeaveIdentity } from "@src/utils/novelweave/useNovelWeaveIdentity"

type NovelWeaveProps = {
	apiConfiguration: ProviderSettings
	setApiConfigurationField: (field: keyof ProviderSettings, value: ProviderSettings[keyof ProviderSettings]) => void
	currentApiConfigName?: string
	hideNovelWeaveButton?: boolean
	routerModels?: RouterModels
	organizationAllowList: OrganizationAllowList
	uriScheme: string | undefined
	kiloCodeWrapperProperties: NovelWeaveWrapperProperties | undefined
	uiKind: string | undefined
	novelweaveDefaultModel: string
}

export const NovelWeave = ({
	apiConfiguration,
	setApiConfigurationField,
	currentApiConfigName,
	hideNovelWeaveButton,
	routerModels,
	organizationAllowList,
	uriScheme,
	uiKind,
	kiloCodeWrapperProperties,
	novelweaveDefaultModel,
}: NovelWeaveProps) => {
	const { t } = useAppTranslation()

	const handleInputChange = useCallback(
		<K extends keyof ProviderSettings, E>(
			field: K,
			transform: (event: E) => ProviderSettings[K] = inputEventTransform,
		) =>
			(event: E | Event) => {
				setApiConfigurationField(field, transform(event as E))
			},
		[setApiConfigurationField],
	)

	// Use the existing hook to get user identity
	const userIdentity = useNovelWeaveIdentity(apiConfiguration.novelweaveToken || "", "")
	const isNovelWeaveAiUser = userIdentity.endsWith("@novelweave.ai")

	const areNovelweaveWarningsDisabled = apiConfiguration.novelweaveTesterWarningsDisabledUntil
		? apiConfiguration.novelweaveTesterWarningsDisabledUntil > Date.now()
		: false

	const handleToggleTesterWarnings = useCallback(() => {
		const newTimestamp = Date.now() + (areNovelweaveWarningsDisabled ? 0 : 24 * 60 * 60 * 1000)
		setApiConfigurationField("novelweaveTesterWarningsDisabledUntil", newTimestamp)
	}, [areNovelweaveWarningsDisabled, setApiConfigurationField])

	return (
		<>
			<div>
				<label className="block font-medium -mb-2">{t("novelweave:settings.provider.account")}</label>
			</div>
			{!hideNovelWeaveButton &&
				(apiConfiguration.novelweaveToken ? (
					<div>
						<Button
							variant="secondary"
							onClick={async () => {
								setApiConfigurationField("novelweaveToken", "")

								vscode.postMessage({
									type: "upsertApiConfiguration",
									text: currentApiConfigName,
									apiConfiguration: {
										...apiConfiguration,
										novelweaveToken: "",
										novelweaveOrganizationId: undefined,
									},
								})
							}}>
							{t("novelweave:settings.provider.logout")}
						</Button>
					</div>
				) : (
					<VSCodeButtonLink
						variant="secondary"
						href={getNovelWeaveBackendSignInUrl(uriScheme, uiKind, kiloCodeWrapperProperties)}>
						{t("novelweave:settings.provider.login")}
					</VSCodeButtonLink>
				))}

			<VSCodeTextField
				value={apiConfiguration?.novelweaveToken || ""}
				type="password"
				onInput={handleInputChange("novelweaveToken")}
				placeholder={t("novelweave:settings.provider.apiKey")}
				className="w-full">
				<div className="flex justify-between items-center mb-1">
					<label className="block font-medium">{t("novelweave:settings.provider.apiKey")}</label>
				</div>
			</VSCodeTextField>

			<OrganizationSelector showLabel />

			<ModelPicker
				apiConfiguration={apiConfiguration}
				setApiConfigurationField={setApiConfigurationField}
				defaultModelId={novelweaveDefaultModel}
				models={routerModels?.["novelweave-openrouter"] ?? {}}
				modelIdKey="novelweaveModel"
				serviceName="NovelWeave"
				serviceUrl="https://novelweave.ai"
				organizationAllowList={organizationAllowList}
			/>

			{/* NOVELWEAVE-TESTER warnings setting - only visible for @novelweave.ai users */}
			{isNovelWeaveAiUser && (
				<div className="mb-4">
					<label className="block font-medium mb-2">Disable NOVELWEAVE-TESTER warnings</label>
					<div className="text-sm text-vscode-descriptionForeground mb-2">
						{areNovelweaveWarningsDisabled
							? `Warnings disabled until ${new Date(apiConfiguration.novelweaveTesterWarningsDisabledUntil || 0).toLocaleString()}`
							: "NOVELWEAVE-TESTER warnings are currently enabled"}
					</div>
					<Button variant="secondary" onClick={handleToggleTesterWarnings} className="text-sm">
						{areNovelweaveWarningsDisabled ? "Enable warnings now" : "Disable warnings for 1 day"}
					</Button>
				</div>
			)}
		</>
	)
}
