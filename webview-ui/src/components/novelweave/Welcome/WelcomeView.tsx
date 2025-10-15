import { useCallback, useState } from "react"
import { useExtensionState } from "../../../context/ExtensionStateContext"
import { validateApiConfiguration } from "../../../utils/validate"
import { vscode } from "../../../utils/vscode"
import { Tab, TabContent } from "../../common/Tab"
import { useAppTranslation } from "../../../i18n/TranslationContext"
import { ButtonPrimary } from "../common/ButtonPrimary"
import { ButtonLink } from "../common/ButtonLink"
import ApiOptions from "../../settings/ApiOptions"
import NovelWeaveAuth from "../common/NovelWeaveAuth"
import { getNovelWeaveBackendSignInUrl } from "../helpers"

const WelcomeView = () => {
	const {
		apiConfiguration,
		currentApiConfigName,
		setApiConfiguration,
		uriScheme,
		uiKind,
		kiloCodeWrapperProperties,
	} = useExtensionState()
	const [errorMessage, setErrorMessage] = useState<string | undefined>()
	const [manualConfig, setManualConfig] = useState(false)
	const { t } = useAppTranslation()

	const handleSubmit = useCallback(() => {
		const error = apiConfiguration ? validateApiConfiguration(apiConfiguration) : undefined

		if (error) {
			setErrorMessage(error)
			return
		}

		setErrorMessage(undefined)
		vscode.postMessage({ type: "upsertApiConfiguration", text: currentApiConfigName, apiConfiguration })
	}, [apiConfiguration, currentApiConfigName])

	const isSettingUpNovelWeave =
		!apiConfiguration?.apiProvider ||
		(apiConfiguration?.apiProvider === "novelweave" && !apiConfiguration?.novelweaveToken)

	return (
		<Tab>
			<TabContent className="flex flex-col gap-5">
				{manualConfig ? (
					<>
						<ApiOptions
							fromWelcomeView
							apiConfiguration={apiConfiguration || {}}
							uriScheme={uriScheme}
							setApiConfigurationField={(field, value) => setApiConfiguration({ [field]: value })}
							errorMessage={errorMessage}
							setErrorMessage={setErrorMessage}
							hideNovelWeaveButton
						/>
						{isSettingUpNovelWeave ? (
							<ButtonLink
								href={getNovelWeaveBackendSignInUrl(uriScheme, uiKind, kiloCodeWrapperProperties)}>
								{t("novelweave:settings.provider.login")}
							</ButtonLink>
						) : (
							<ButtonPrimary onClick={handleSubmit}>{t("welcome:start")}</ButtonPrimary>
						)}
					</>
				) : (
					<div className="bg-vscode-sideBar-background p-4">
						<NovelWeaveAuth onManualConfigClick={() => setManualConfig(true)} />
					</div>
				)}
			</TabContent>
		</Tab>
	)
}

export default WelcomeView
