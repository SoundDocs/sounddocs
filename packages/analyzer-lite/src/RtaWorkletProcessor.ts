/**
 * AudioWorklet processor for real-time frequency analysis
 * This runs in the audio processing thread for optimal performance
 */

// AudioWorklet global declarations
declare var sampleRate: number;
declare var currentTime: number;

interface FrequencyData {
  frequencies: Float32Array;
  magnitudes: Float32Array;
  sampleRate: number;
  timestamp: number;
}

// AudioWorklet types for TypeScript
interface AudioWorkletProcessor {
  readonly port: MessagePort;
  process(
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    parameters: Record<string, Float32Array>,
  ): boolean;
}

interface AudioWorkletProcessorConstructor {
  new (options?: AudioWorkletNodeOptions): AudioWorkletProcessor;
}

declare var AudioWorkletProcessor: {
  prototype: AudioWorkletProcessor;
  new (): AudioWorkletProcessor;
};

declare function registerProcessor(
  name: string,
  processorCtor: AudioWorkletProcessorConstructor,
): void;

class RtaWorkletProcessor extends AudioWorkletProcessor {
  private fftSize: number = 2048;
  private dataArray: Float32Array;
  private frequencyArray: Float32Array;
  private windowFunction: Float32Array;
  private frameCount: number = 0;
  private updateRate: number = 30; // Updates per second

  constructor() {
    super();

    // Initialize data arrays
    this.dataArray = new Float32Array(this.fftSize);
    this.frequencyArray = new Float32Array(this.fftSize / 2);

    // Create Hanning window for better frequency resolution
    this.windowFunction = new Float32Array(this.fftSize);
    for (let i = 0; i < this.fftSize; i++) {
      this.windowFunction[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (this.fftSize - 1)));
    }

    // Listen for parameter changes from main thread
    this.port.onmessage = (event) => {
      const { type, data } = event.data;

      switch (type) {
        case "setFFTSize":
          this.setFFTSize(data.fftSize);
          break;
        case "setUpdateRate":
          this.updateRate = data.updateRate;
          break;
      }
    };
  }

  private setFFTSize(newSize: number) {
    // Ensure FFT size is a power of 2
    const validSizes = [256, 512, 1024, 2048, 4096, 8192];
    if (validSizes.includes(newSize)) {
      this.fftSize = newSize;
      this.dataArray = new Float32Array(this.fftSize);
      this.frequencyArray = new Float32Array(this.fftSize / 2);

      // Recreate window function
      this.windowFunction = new Float32Array(this.fftSize);
      for (let i = 0; i < this.fftSize; i++) {
        this.windowFunction[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (this.fftSize - 1)));
      }
    }
  }

  private performFFT(inputData: Float32Array): void {
    // Apply windowing function
    for (let i = 0; i < this.fftSize; i++) {
      this.dataArray[i] = inputData[i] * this.windowFunction[i];
    }

    // Simple FFT implementation (this is a basic version - in production you might want to use a more optimized library)
    const real = new Float32Array(this.fftSize);
    const imag = new Float32Array(this.fftSize);

    // Copy windowed data to real part
    for (let i = 0; i < this.fftSize; i++) {
      real[i] = this.dataArray[i];
      imag[i] = 0;
    }

    // Perform FFT using Cooley-Tukey algorithm
    this.fft(real, imag);

    // Calculate magnitudes and convert to dB
    for (let i = 0; i < this.fftSize / 2; i++) {
      const magnitude = Math.sqrt(real[i] * real[i] + imag[i] * imag[i]);
      // Convert to dB with reference and floor
      this.frequencyArray[i] = 20 * Math.log10(Math.max(magnitude, 1e-10));
    }
  }

  private fft(real: Float32Array, imag: Float32Array): void {
    const N = real.length;

    // Bit-reverse
    let j = 0;
    for (let i = 1; i < N; i++) {
      let bit = N >> 1;
      while (j & bit) {
        j ^= bit;
        bit >>= 1;
      }
      j ^= bit;

      if (i < j) {
        [real[i], real[j]] = [real[j], real[i]];
        [imag[i], imag[j]] = [imag[j], imag[i]];
      }
    }

    // Cooley-Tukey FFT
    for (let len = 2; len <= N; len <<= 1) {
      const ang = (2 * Math.PI) / len;
      const wlen_real = Math.cos(ang);
      const wlen_imag = Math.sin(ang);

      for (let i = 0; i < N; i += len) {
        let w_real = 1;
        let w_imag = 0;

        for (let j = 0; j < len / 2; j++) {
          const u_real = real[i + j];
          const u_imag = imag[i + j];
          const v_real = real[i + j + len / 2] * w_real - imag[i + j + len / 2] * w_imag;
          const v_imag = real[i + j + len / 2] * w_imag + imag[i + j + len / 2] * w_real;

          real[i + j] = u_real + v_real;
          imag[i + j] = u_imag + v_imag;
          real[i + j + len / 2] = u_real - v_real;
          imag[i + j + len / 2] = u_imag - v_imag;

          const next_w_real = w_real * wlen_real - w_imag * wlen_imag;
          w_imag = w_real * wlen_imag + w_imag * wlen_real;
          w_real = next_w_real;
        }
      }
    }
  }

  private generateFrequencyBins(sampleRate: number): Float32Array {
    const bins = new Float32Array(this.fftSize / 2);
    for (let i = 0; i < this.fftSize / 2; i++) {
      bins[i] = (i * sampleRate) / this.fftSize;
    }
    return bins;
  }

  process(
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    _parameters: Record<string, Float32Array>,
  ): boolean {
    const input = inputs[0];
    const output = outputs[0];

    if (input.length > 0) {
      const inputChannel = input[0];

      // Copy input to output (pass-through)
      if (output.length > 0) {
        output[0].set(inputChannel);
      }

      // Accumulate audio data for FFT
      if (inputChannel.length >= this.fftSize) {
        // Take the most recent samples
        const audioData = inputChannel.slice(-this.fftSize);

        // Only process at the specified update rate
        this.frameCount++;
        const samplesPerUpdate = Math.floor(sampleRate / this.updateRate);

        if (this.frameCount >= samplesPerUpdate) {
          this.frameCount = 0;

          // Perform FFT analysis
          this.performFFT(audioData);

          // Generate frequency bins
          const frequencyBins = this.generateFrequencyBins(sampleRate);

          // Send results to main thread
          const data: FrequencyData = {
            frequencies: frequencyBins,
            magnitudes: new Float32Array(this.frequencyArray),
            sampleRate,
            timestamp: currentTime,
          };

          this.port.postMessage({
            type: "frequencyData",
            data,
          });
        }
      }
    }

    return true;
  }
}

registerProcessor("rta-worklet-processor", RtaWorkletProcessor);
