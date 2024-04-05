import * as d3 from 'd3';
import {SOUND_COLOR, SOUND_DATA} from './utils.ts';

class SoundPainter implements PaintProcessor {
	static inputProperties = [SOUND_DATA, SOUND_COLOR];

	private parseSoundData(soundRawData: string): Float32Array {
		const data = soundRawData
			.split(',')
			.map(parseFloat)
			// -Infinity number indicates absence of any sound, so we change it to zero in order to visualize the data.
			.map((value: number) => Number.isFinite(value) ? value : -1);
		return Float32Array.from(data);
	}

	/**
	Creates sound wave drawing function
	 */
	private getDrawFn(context: CanvasRenderingContext2D, size: PaintSize, length: number): d3.Area<number> {
		// x scale maps item index to a "x" coordinate on canvas
		const xScale = d3.scaleLinear([0, length - 1], [0, size.width]);
		// in order to render area shape we need two y coordinates
		// y scale maps sound intensity value to a "y" coordinate on canvas
		const y0Scale = d3.scaleLinear([-1, 1], [size.height, 0]);
		const y1Scale = d3.scaleLinear([-1, 1], [0, size.height]);

		return d3
			.area<number>()
			.curve(d3.curveBasis)
			.x((_, index) => xScale(index))
			.y0(((value) => y0Scale(value)))
			.y1(((value) => y1Scale(value)))
			.context(context);
	}

	paint(context: CanvasRenderingContext2D, size: PaintSize, props: StylePropertyMapReadOnly): void {
		const color = props.get(SOUND_COLOR)!.toString();
		const soundRawData = props.get(SOUND_DATA)!.toString();
		const analyticalData = this.parseSoundData(soundRawData);
		const soundWaveDrawFn = this.getDrawFn(context, size, analyticalData.length);
		// render sound wave
		context.beginPath();
		soundWaveDrawFn(analyticalData);
		context.fillStyle = color;
		context.shadowColor = color;
		context.shadowBlur = 100;
		context.fill();
	}
}

registerPaint('sound', SoundPainter);
