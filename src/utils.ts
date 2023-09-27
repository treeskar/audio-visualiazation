import * as d3 from 'd3';

export const FREQUENCY_COLOR = '--frequency-color';

export enum SOUND_WAVE {
	LEFT = '--channel-l',
	RIGHT = '--channel-r',
	CENTER = '--stereo',
}

export interface SoundWave {
	draw: d3.Area<number>;
	style: {
		fill: string | CanvasGradient;
		globalCompositeOperation: GlobalCompositeOperation;
		shadowBlur?: number;
		alpha?: number;
	}
}

export type AudioAnalysers = Record<SOUND_WAVE, AnalyserNode>;
export type AudioDbData = Record<SOUND_WAVE, Float32Array>;
export type InterpolateFn = (i: number) => string;
export type SoundWaveColors = Record<SOUND_WAVE, InterpolateFn>;
