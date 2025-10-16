import { useEffect, useState } from "react"
import { ProfileDataResponsePayload } from "@roo/WebviewMessage"
import { vscode } from "@/utils/vscode"

export function useNovelWeaveIdentity(novelweaveToken: string, machineId: string) {
	const [kiloIdentity, setNovelWeaveIdentity] = useState("")
	useEffect(() => {
		const handleMessage = (event: MessageEvent) => {
			if (event.data.type === "profileDataResponse") {
				const payload = event.data.payload as ProfileDataResponsePayload | undefined
				const success = payload?.success || false
				const tokenFromMessage = payload?.data?.novelweaveToken || ""
				const email = payload?.data?.user?.email || ""
				if (!success) {
					console.error(
						"KILOTEL: Failed to identify NovelWeave user, message doesn't indicate success:",
						payload,
					)
				} else if (tokenFromMessage !== novelweaveToken) {
					console.error("KILOTEL: Failed to identify NovelWeave user, token mismatch:", payload)
				} else if (!email) {
					console.error("KILOTEL: Failed to identify NovelWeave user, email missing:", payload)
				} else {
					console.debug("KILOTEL: NovelWeave user identified:", email)
					setNovelWeaveIdentity(email)
					window.removeEventListener("message", handleMessage)
				}
			}
		}

		if (novelweaveToken) {
			console.debug("KILOTEL: fetching profile...")
			window.addEventListener("message", handleMessage)
			vscode.postMessage({
				type: "fetchProfileDataRequest",
			})
		} else {
			console.debug("KILOTEL: no NovelWeave user")
			setNovelWeaveIdentity("")
		}

		return () => {
			window.removeEventListener("message", handleMessage)
		}
	}, [novelweaveToken])
	return kiloIdentity || machineId
}
