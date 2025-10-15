import { vscode } from "@/utils/vscode"
import { CommitRange } from "@roo-code/types"
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react"
import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"

export const SeeNewChangesButtons = ({ commitRange }: { commitRange: CommitRange }) => {
	const { t } = useTranslation()
	const [revertingChanges, setRevertingChanges] = useState(false)

	const seeNewChangesCallback = useCallback(() => {
		vscode.postMessage({
			type: "seeNewChanges",
			payload: {
				commitRange,
			},
		})
	}, [commitRange])

	const revertAllChangesCallback = useCallback(() => setRevertingChanges(true), [])

	const confirmRevertChangesCallback = useCallback(() => {
		vscode.postMessage({
			type: "checkpointRestore",
			payload: {
				mode: "restore",
				ts: commitRange.fromTimeStamp ?? 0,
				commitHash: commitRange.from,
			},
		})
	}, [commitRange])

	const cancelRevertChangesCallback = useCallback(() => setRevertingChanges(false), [])

	return (
		<div className="flex flex-horizontal gap-2 w-full">
			{revertingChanges ? (
				<>
					<VSCodeButton
						className="w-full mt-2 bg-red-500 text-white"
						disabled={!commitRange.fromTimeStamp}
						onClick={confirmRevertChangesCallback}>
						{t("novelweave:chat.confirmRevertChanges")}
					</VSCodeButton>
					<VSCodeButton className="w-full mt-2" appearance="secondary" onClick={cancelRevertChangesCallback}>
						{t("novelweave:chat.cancelRevertChanges")}
					</VSCodeButton>
				</>
			) : (
				<>
					<VSCodeButton className="w-full mt-2" appearance="secondary" onClick={seeNewChangesCallback}>
						{t("novelweave:chat.seeNewChanges")}
					</VSCodeButton>
					<VSCodeButton
						className="w-full mt-2"
						appearance="secondary"
						disabled={!commitRange.fromTimeStamp}
						onClick={revertAllChangesCallback}>
						{t("novelweave:chat.revertNewChanges")}
					</VSCodeButton>
				</>
			)}
		</div>
	)
}
