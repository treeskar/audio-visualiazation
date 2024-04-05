import {SOUND_COLOR, SOUND_DATA} from './utils.ts';

async function getAudioAnalyser(mediaStream: MediaStream): Promise<AnalyserNode> {
	// Audio Web API primary paradigm is of an audio graph, where a number of AudioNodes are connected together to define the overall audio rendering.
	// For our case the audio graph is going to be:
	// [source node] -> [analyser node] -> [destination node]
	// Create audio context
	// The AudioContext interface represents an audio-processing graph built from audio modules linked together, each represented by an AudioNode
	const audioContext = new AudioContext();
	// Create audio source node from user's media stream
	const sourceNode = audioContext.createMediaStreamSource(mediaStream);
	// The AnalyserNode is an AudioNode that passes the audio stream unchanged from the input to the output,
	// but allows you to take the generated data, process it, and create audio visualizations.
	const analyserNode = audioContext.createAnalyser();
	// Defines the buffer size, that is used to perform the analysis
	analyserNode.fftSize = 128;
	// Create audio destination node
	const destinationNode = audioContext.createMediaStreamDestination();
	// connect audio nodes to the process graph
	sourceNode.connect(analyserNode).connect(destinationNode);
	return analyserNode;
}

/**
 * Call callback function before each animation frame
 */
function runWithRequestAnimationFrame(callback: () => void): void {
	requestAnimationFrame(() => {
		runWithRequestAnimationFrame(callback);
		callback();
	});
}

/**
 * Registers custom CSS properties
 */
function registerCSSProperty(name: string, syntax = '*', initialValue?: string): void {
	const properties: PropertyDefinition = {name, syntax, inherits: false, initialValue};
	CSS.registerProperty(properties);
}


(async function main(): Promise<void> {
	// Get user audio input (mic) as a media stream
	const mediaStream = await navigator.mediaDevices.getUserMedia({video: false, audio: true});
	const audioAnalyser: AnalyserNode = await getAudioAnalyser(mediaStream);
	// defined data collectors
	const audioDbData = new Float32Array(audioAnalyser.fftSize);

	// register css properties
	registerCSSProperty(SOUND_COLOR, '<color>', '#fff');
	registerCSSProperty(SOUND_DATA, '*');

	// add paint worklet
	await CSS.paintWorklet.addModule(new URL('./paint.ts', import.meta.url));

	runWithRequestAnimationFrame(() => {
		// audio waveform, is a time domain display of sound amplitude/intensity (decibels dB) in a range -1 to 1.
		audioAnalyser.getFloatTimeDomainData(audioDbData);
		// update sound intensity data
		document.body.style.setProperty(SOUND_DATA, audioDbData.join(','));
	});
}().then());
