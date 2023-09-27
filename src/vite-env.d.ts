/// <reference types="vite/client" />
declare interface PaintSize {
	width: number;
	height: number;
}

declare interface PaintProcessor {
	paint: (context: CanvasRenderingContext2D, size: PaintSize, params: StylePropertyMapReadOnly) => void
}

type paintProcessor = new () => PaintProcessor;

declare function registerPaint(name: string, pinter: paintProcessor): void

declare namespace CSS {
	namespace paintWorklet {
		export function addModule(url: URL | string): Promise<void>;
	}
}

