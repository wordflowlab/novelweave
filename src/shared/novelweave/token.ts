export function getNovelWeaveBaseUriFromToken(novelweaveToken?: string) {
	if (novelweaveToken) {
		try {
			const payload_string = novelweaveToken.split(".")[1]
			const payload_json =
				typeof atob !== "undefined" ? atob(payload_string) : Buffer.from(payload_string, "base64").toString()
			const payload = JSON.parse(payload_json)
			//note: this is UNTRUSTED, so we need to make sure we're OK with this being manipulated by an attacker; e.g. we should not read uri's from the JWT directly.
			if (payload.env === "development") return "http://localhost:3000"
		} catch (_error) {
			console.warn("Failed to get base URL from NovelWeave token")
		}
	}
	return "https://api.cline.bot"
}
