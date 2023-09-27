import * as d3 from 'd3';
import {AudioAnalysers, AudioDbData, FREQUENCY_COLOR, SOUND_WAVE} from './utils.ts';

/**
 * Creates and return audio analyser node for sound visualisation
 */
function createAnalyserNode(audioContext: AudioContext): AnalyserNode {
	// The AnalyserNode is an AudioNode that passes the audio stream unchanged from the input to the output,
	// but allows you to take the generated data, process it, and create audio visualizations.
	const analyserNode = audioContext.createAnalyser();
	// Defines the buffer size, that is used to perform the analysis
	analyserNode.fftSize = 128;
	return analyserNode;
}

/**
 * Connects to user audio input (mic) stream and returns audio analysers for stereo & L/R channels
 */
async function getAudioAnalysers(mediaStream: MediaStream): Promise<AudioAnalysers> {
	// Create audio context
	// The AudioContext interface represents an audio-processing graph built from audio modules linked together, each represented by an AudioNode
	const audioContext = new AudioContext();
	// [source node] -> [analyser node] -> [destination node]
	// Create audio source node from user's media stream
	const sourceNode = audioContext.createMediaStreamSource(mediaStream);
	const fullLeftPanner = new StereoPannerNode(audioContext, {pan: -1});
	const fullRightPanner = new StereoPannerNode(audioContext, {pan: 1});
	// Create audio destination node
	const destinationNode = audioContext.createMediaStreamDestination();
	// Create audio analysers
	const analyserNodeR = createAnalyserNode(audioContext);
	const analyserNodeL = createAnalyserNode(audioContext);
	const analyserNodeStereo = createAnalyserNode(audioContext);
	// connect audio nodes
	sourceNode.connect(fullLeftPanner).connect(analyserNodeL).connect(destinationNode); // analyses left channel only
	sourceNode.connect(fullRightPanner).connect(analyserNodeR).connect(destinationNode); // analyses right channel only
	sourceNode.connect(analyserNodeStereo).connect(destinationNode); // analyses full stereo sound

	return {
		[SOUND_WAVE.CENTER]: analyserNodeStereo,
		[SOUND_WAVE.LEFT]: analyserNodeL,
		[SOUND_WAVE.RIGHT]: analyserNodeR
	};
}

/**
 * Finds frequency with maximal magnitude and returns its color representation
 * @param frequency - Sample of frequencies intensity at a particular time
 *  Each array value is a sample, the magnitude of the signal at a particular time.
 *  Each item in the array represents the decibel value for a specific frequency.
 * @param interpolateFn - maps frequency magnitude value to a color
 */
function findFrequencyColor(frequency: Float32Array, interpolateFn: (t: number) => string): string {
	const maxDzb = Math.max(...frequency);
	const maxHz = frequency.indexOf(maxDzb);
	const colorScale = d3.scaleLinear([0, frequency.length], [0, 1]);
	return interpolateFn(colorScale(maxHz));
}

/**
 * Registers custom CSS properties
 */
function registerCSSProperty(name: string, syntax = '*', initialValue?: string): void {
	const properties: PropertyDefinition = {name, syntax, inherits: false, initialValue};
	CSS.registerProperty(properties);
}

/**
 * Gets audio analytics data sample and updates paint properties
 */
function updateSoundProperties(audioAnalysers: AudioAnalysers, frequencyData: Float32Array, audioDbData: AudioDbData): void {
	// update frequency data
	audioAnalysers[SOUND_WAVE.CENTER].getFloatFrequencyData(frequencyData);
	// Frequency (Hz) to color
	const frequencyColor = findFrequencyColor(frequencyData, d3.interpolateRainbow);
	document.body.style.setProperty(FREQUENCY_COLOR, frequencyColor);

	// audio waveform, is a time domain display of sound amplitude/intensity (decibels dB) in a range -1 to 1.
	[SOUND_WAVE.LEFT, SOUND_WAVE.RIGHT, SOUND_WAVE.CENTER].forEach((soundWave) => {
		// update sound intensity data
		audioAnalysers[soundWave].getFloatTimeDomainData(audioDbData[soundWave]);
		document.body.style.setProperty(soundWave, audioDbData[soundWave].join(','));
	});
}

/**
 * Call callback function before each animation frame
 */
function runWithRequestAnimationFrame(callback: () => void): void {
	requestAnimationFrame(() => {
		callback();
		runWithRequestAnimationFrame(callback)
	});
}


(async function main(): Promise<void> {
	// Get user audio as a media stream
	const mediaStream = await navigator.mediaDevices.getUserMedia({video: false, audio: true});
	const audioAnalysers: AudioAnalysers = await getAudioAnalysers(mediaStream);
	// defined data collectors
	const frequencyData = new Float32Array(audioAnalysers[SOUND_WAVE.CENTER].frequencyBinCount);
	const audioDbData: AudioDbData = {
		[SOUND_WAVE.CENTER]: new Float32Array(audioAnalysers[SOUND_WAVE.CENTER].fftSize),
		[SOUND_WAVE.LEFT]: new Float32Array(audioAnalysers[SOUND_WAVE.LEFT].fftSize),
		[SOUND_WAVE.RIGHT]: new Float32Array(audioAnalysers[SOUND_WAVE.RIGHT].fftSize)
	}

	// register css properties
	registerCSSProperty(FREQUENCY_COLOR, '<color>', '#000');
	[SOUND_WAVE.LEFT, SOUND_WAVE.RIGHT, SOUND_WAVE.CENTER].forEach((name) => registerCSSProperty(name, '*'))

	// add paint worklet
	await CSS.paintWorklet.addModule(new URL('./paint.ts', import.meta.url));

	// get audio analytics data and updates paint properties in a loop
	runWithRequestAnimationFrame(() => updateSoundProperties(audioAnalysers, frequencyData, audioDbData));
}().then());
