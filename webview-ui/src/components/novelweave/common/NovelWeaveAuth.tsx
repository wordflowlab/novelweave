import React from "react"
import { ButtonLink } from "./ButtonLink"
import { ButtonSecondary } from "./ButtonSecondary"
import Logo from "./Logo"
import { useAppTranslation } from "@/i18n/TranslationContext"
import { getNovelWeaveBackendSignUpUrl } from "../helpers"
import { useExtensionState } from "@/context/ExtensionStateContext"

interface NovelWeaveAuthProps {
	onManualConfigClick?: () => void
	className?: string
}

const NovelWeaveAuth: React.FC<NovelWeaveAuthProps> = ({ onManualConfigClick, className = "" }) => {
	const { uriScheme, uiKind, kiloCodeWrapperProperties } = useExtensionState()

	const { t } = useAppTranslation()

	return (
		<div className={`flex flex-col items-center ${className}`}>
			<Logo />

			<h2 className="m-0 p-0 mb-4">{t("novelweave:welcome.greeting")}</h2>
			<p className="text-center mb-2">{t("novelweave:welcome.introText1")}</p>
			<p className="text-center mb-2">{t("novelweave:welcome.introText2")}</p>
			<p className="text-center mb-5">{t("novelweave:welcome.introText3")}</p>

			<div className="w-full flex flex-col gap-5">
				{/* "开始使用" button temporarily hidden - no backend service yet */}
				{/* <ButtonLink
					href={getNovelWeaveBackendSignUpUrl(uriScheme, uiKind, kiloCodeWrapperProperties)}
					onClick={() => {
						if (uiKind === "Web" && onManualConfigClick) {
							onManualConfigClick()
						}
					}}>
					{t("novelweave:welcome.ctaButton")}
				</ButtonLink> */}

				{!!onManualConfigClick && (
					<ButtonSecondary onClick={() => onManualConfigClick && onManualConfigClick()}>
						{t("novelweave:welcome.manualModeButton")}
					</ButtonSecondary>
				)}
			</div>
		</div>
	)
}

export default NovelWeaveAuth
