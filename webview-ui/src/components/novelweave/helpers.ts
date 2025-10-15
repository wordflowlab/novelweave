import { JETBRAIN_PRODUCTS, NovelWeaveWrapperProperties } from "../../../../src/shared/novelweave/wrapper"

const getJetbrainsUrlScheme = (code: string) => {
	return JETBRAIN_PRODUCTS[code as keyof typeof JETBRAIN_PRODUCTS]?.urlScheme || "jetbrains"
}

const getNovelWeaveSource = (uriScheme: string = "vscode", kiloCodeWrapperProperties?: NovelWeaveWrapperProperties) => {
	if (
		!kiloCodeWrapperProperties?.kiloCodeWrapped ||
		!kiloCodeWrapperProperties.kiloCodeWrapper ||
		!kiloCodeWrapperProperties.kiloCodeWrapperCode
	) {
		return uriScheme
	}

	return `${getJetbrainsUrlScheme(kiloCodeWrapperProperties.kiloCodeWrapperCode)}`
}

export function getNovelWeaveBackendSignInUrl(
	uriScheme: string = "vscode",
	uiKind: string = "Desktop",
	kiloCodeWrapperProperties?: NovelWeaveWrapperProperties,
) {
	const baseUrl = "https://novelweave.ai"
	const source = uiKind === "Web" ? "web" : getNovelWeaveSource(uriScheme, kiloCodeWrapperProperties)
	return `${baseUrl}/sign-in-to-editor?source=${source}`
}

export function getNovelWeaveBackendSignUpUrl(
	uriScheme: string = "vscode",
	uiKind: string = "Desktop",
	kiloCodeWrapperProperties?: NovelWeaveWrapperProperties,
) {
	const baseUrl = "https://novelweave.ai"
	const source = uiKind === "Web" ? "web" : getNovelWeaveSource(uriScheme, kiloCodeWrapperProperties)
	return `${baseUrl}/users/sign_up?source=${source}`
}
