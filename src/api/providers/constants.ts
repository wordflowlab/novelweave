import { X_NOVELWEAVE_VERSION } from "../../shared/novelweave/headers"
import { Package } from "../../shared/package"

export const DEFAULT_HEADERS = {
	"HTTP-Referer": "https://novelweave.ai",
	"X-Title": "Kilo Code",
	[X_NOVELWEAVE_VERSION]: Package.version,
	"User-Agent": `Kilo-Code/${Package.version}`,
}
