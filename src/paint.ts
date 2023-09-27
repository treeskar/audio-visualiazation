import * as d3 from 'd3';
import {FREQUENCY_COLOR, InterpolateFn, SOUND_WAVE, SoundWave, SoundWaveColors} from './utils.ts';

/**
 * Transforms color interpolation function to a canvas linear gradient
 */
function colorsFnToLinearGradient(context: CanvasRenderingContext2D, size: PaintSize, colorInterpolateFn: InterpolateFn): CanvasGradient {
	const gradient = context.createLinearGradient(0,  0,  size.width,  size.height);
	for (let i = 0; i <= 1; i += 0.1) {
		gradient.addColorStop(i, colorInterpolateFn(i));
	}
	return gradient;
}

/**
 * Transforms list of stop points to a canvas linear gradient
 */
function getMaskGradient(context: CanvasRenderingContext2D, size: PaintSize, stopPoints: Array<[number, number]>, color = d3.rgb(0, 0, 0)): CanvasGradient {
	const maskGradient = context.createLinearGradient(0,  0,  size.width,  size.height);
	// first value is stop point position, second is a color opacity
	stopPoints.forEach(
		([offset, opacity]) => {
			color.opacity = opacity;
			maskGradient.addColorStop(offset, color.toString())
		}
	);
	return maskGradient;
}

class SoundPainter implements PaintProcessor {
	static inputProperties = [FREQUENCY_COLOR, SOUND_WAVE.LEFT, SOUND_WAVE.RIGHT, SOUND_WAVE.CENTER];
	static soundWaveColors: SoundWaveColors = {
		[SOUND_WAVE.LEFT]: d3.interpolateRainbow,
		[SOUND_WAVE.CENTER]: d3.interpolatePlasma,
		[SOUND_WAVE.RIGHT]: d3.interpolateRainbow
	}

	/**
	 * Draws mask over canvas
	 */
	private drawMask(context: CanvasRenderingContext2D, size: PaintSize): void {
		// first value is stop point position, second is a color opacity
		const maskStopPoints: Array<[number, number]> = [[0.2, 0], [0.4, 1], [0.7, 1], [0.8, 0]];
		context.beginPath();
		context.globalCompositeOperation = 'destination-in';
		context.rect(0, 0, size.width,  size.height);
		context.fillStyle = getMaskGradient(context, size, maskStopPoints);
		context.fill();
	}

	/**
	Creates sound wave drawing function
	 */
	private getDrawFn(context: CanvasRenderingContext2D, size: PaintSize, data: Float32Array): d3.Area<number> {
		// x scale maps item index to a "x" coordinate on canvas
		const xScale = d3.scaleLinear([0, data.length - 1], [0, size.width]);
		// in order to render area shape we need two y coordinates
		const minY = size.height;
		const maxY = 0;
		// y scale maps sound intensity value to a "y" coordinate on canvas
		const y0Scale = d3.scaleLinear([-1, 1], [minY, maxY]);
		const y1Scale = d3.scaleLinear([-1, 1], [maxY, minY]);

		return d3
			.area<number>()
			.curve(d3.curveBasis)
			.x((_, index) => xScale(index))
			.y0(((value) => y0Scale(value)))
			.y1(((value) => y1Scale(value)))
			.context(context);
	}

	private getSoundWave(context: CanvasRenderingContext2D, size: PaintSize, data: Float32Array, colorFn: InterpolateFn): SoundWave {
		return {
			draw: this.getDrawFn(context, size, data),
			style: {
				globalCompositeOperation: 'lighter', // defines blending mode with already rendered image
				fill: colorsFnToLinearGradient(context, size, colorFn),
				shadowBlur: size.height / 2
			}
		};
	}

	private getSoundDecibels(soundDataValue: CSSStyleValue): Float32Array {
		const data = soundDataValue
			.toString()
			.split(',')
			.map(parseFloat)
			// Infinity number indicates absence of any sound, so we change it to zero in order to visualize the data.
			.map((value: number) => Number.isFinite(value) ? value : 0);
		return Float32Array.from(data);
	}

	private getShadowColor(props: StylePropertyMapReadOnly): string {
		const color = props.get(FREQUENCY_COLOR) ?? '#000';
		return color.toString();
	}

	paint(context: CanvasRenderingContext2D, size: PaintSize, props: StylePropertyMapReadOnly): void {
		// clear previous image
		context.clearRect(0, 0, size.width, size.height);
		// set shadow color based on sound frequency
		const shadowColor = this.getShadowColor(props);
		// render sound waves
		[SOUND_WAVE.LEFT, SOUND_WAVE.CENTER, SOUND_WAVE.RIGHT].forEach((soundWaveName, i) => {
			const soundWaveValue = props.get(soundWaveName) ?? '';
			const decibels  = this.getSoundDecibels(soundWaveValue);
			const colorFn = SoundPainter.soundWaveColors[soundWaveName];
			const soundWave = this.getSoundWave(context, size, decibels, colorFn);

			// render sound wave
			context.beginPath();
			context.globalCompositeOperation = soundWave.style.globalCompositeOperation;
			context.globalAlpha = soundWave.style.alpha ?? 1;
			context.translate( (i - 1) * 100, 0);
			soundWave.draw(decibels);
			context.fillStyle = soundWave.style.fill;
			context.shadowColor = shadowColor;
			context.shadowBlur = soundWave.style.shadowBlur ?? 0;
			context.fill();
			context.resetTransform();
		})

		// blur left/right edges of the sound waves
		this.drawMask(context, size);
	}
}

registerPaint('sound', SoundPainter);
