import { useState } from "react"

const RooHero = () => {
	// TODO: Replace with NovelWeave logo
	// Temporarily hidden - no logo displayed
	const [imagesBaseUri] = useState(() => {
		const w = window as any
		return w.IMAGES_BASE_URI || ""
	})

	return (
		// Logo temporarily hidden - will be replaced with NovelWeave branding
		<div className="flex flex-col items-center justify-center pb-2 forced-color-adjust-none">
			{/* <div
				style={{
					backgroundColor: "var(--vscode-foreground)",
					WebkitMaskImage: `url('${imagesBaseUri}/roo-logo.svg')`,
					WebkitMaskRepeat: "no-repeat",
					WebkitMaskSize: "contain",
					maskImage: `url('${imagesBaseUri}/roo-logo.svg')`,
					maskRepeat: "no-repeat",
					maskSize: "contain",
				}}
				className="mx-auto">
				<img src={imagesBaseUri + "/roo-logo.svg"} alt="Roo logo" className="h-8 opacity-0" />
			</div> */}
		</div>
	)
}

export default RooHero
