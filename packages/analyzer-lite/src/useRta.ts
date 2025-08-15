import { useEffect, useRef, useState, useCallback } from "react";

export interface FrequencyData {
  frequencies: Float32Array;
  magnitudes: Float32Array;
  sampleRate: number;
  timestamp: number;
  spl: number; // Current SPL in dB
  leq: number; // Running Leq in dB
}

export interface RtaConfig {
  fftSize: 256 | 512 | 1024 | 2048 | 4096 | 8192;
  updateRate: number; // Hz
  smoothing: number; // 0-1, for temporal smoothing
  useAWeighting: boolean; // A-weighting filter
  responseTime: "fast" | "slow"; // RTA response time (affects visual smoothing)
}

export interface RtaState {
  isActive: boolean;
  frequencyData: FrequencyData | null;
  config: RtaConfig;
  error: string | null;
}

export interface RtaControls {
  start: () => Promise<void>;
  stop: () => void;
  updateConfig: (config: Partial<RtaConfig & { calibrationOffset: number }>) => void;
}

export function useRta(audioStream: MediaStream | null): RtaState & RtaControls {
  const [isActive, setIsActive] = useState(false);
  const [frequencyData, setFrequencyData] = useState<FrequencyData | null>(null);
  const [config, setConfig] = useState<RtaConfig>({
    fftSize: 2048,
    updateRate: 30,
    smoothing: 0.8,
    useAWeighting: false,
    responseTime: "fast",
  });
  const [error, setError] = useState<string | null>(null);

  // Refs for audio context and nodes
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const smoothedDataRef = useRef<Float32Array | null>(null);

  const start = useCallback(async () => {
    if (!audioStream) {
      setError("No audio stream available");
      return;
    }

    try {
      // Create AudioContext
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      // Create source from media stream
      const sourceNode = audioContext.createMediaStreamSource(audioStream);
      sourceNodeRef.current = sourceNode;

      // Load and add the worklet module
      // Create a blob URL with the worklet code to avoid CORS issues
      const workletCode = `
/**
 * AudioWorklet processor for real-time frequency analysis
 * This runs in the audio processing thread for optimal performance
 */

class RtaWorkletProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    
    this.fftSize = 2048;
    this.dataArray = new Float32Array(this.fftSize);
    this.frequencyArray = new Float32Array(this.fftSize / 2);
    this.windowFunction = new Float32Array(this.fftSize);
    this.frameCount = 0;
    this.updateRate = 30;
    this.smoothing = 0.8; // Temporal smoothing factor
    this.responseTime = 'fast'; // Response time mode
    
    // Audio buffer for accumulating samples
    this.audioBuffer = new Float32Array(this.fftSize * 2); // Double buffer
    this.bufferIndex = 0;
    
    // Create Hanning window for better frequency resolution
    for (let i = 0; i < this.fftSize; i++) {
      this.windowFunction[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / (this.fftSize - 1)));
    }

    // Listen for parameter changes from main thread
    this.port.onmessage = (event) => {
      const { type, data } = event.data;
      
      switch (type) {
        case 'setFFTSize':
          this.setFFTSize(data.fftSize);
          break;
        case 'setUpdateRate':
          this.updateRate = data.updateRate;
          break;
        case 'setAWeighting':
          this.useAWeighting = data.useAWeighting;
          break;
        case 'setCalibrationOffset':
          this.calibrationOffset = data.offset;
          break;
        case 'setSmoothing':
          this.smoothing = data.smoothing;
          break;
        case 'setResponseTime':
          this.responseTime = data.responseTime;
          break;
      }
    };
    
    // A-weighting flag
    this.useAWeighting = false;
    
    // SPL and Leq calculations
    this.calibrationOffset = 0; // dB offset for calibration
    // Initialize with reasonable default, will be resized when we get actual sample rate
    this.leqBuffer = new Float32Array(48000 * 60 * 30); // 30 minute buffer for Leq (default 48kHz)
    this.leqBufferIndex = 0;
    this.leqSampleCount = 0;
    this.actualSampleRate = 48000; // Will be updated from actual context
    
    // Smoothed magnitude array for temporal smoothing
    this.smoothedMagnitudes = null;

    // A-weighting filter for SPL/Leq
    this.aWeightFilter = this.createAWeightingFilter();
  }

  setFFTSize(newSize) {
    // Ensure FFT size is a power of 2
    const validSizes = [256, 512, 1024, 2048, 4096, 8192];
    if (validSizes.includes(newSize)) {
      this.fftSize = newSize;
      this.dataArray = new Float32Array(this.fftSize);
      this.frequencyArray = new Float32Array(this.fftSize / 2);
      this.audioBuffer = new Float32Array(this.fftSize * 2);
      this.bufferIndex = 0;
      
      // Recreate window function
      this.windowFunction = new Float32Array(this.fftSize);
      for (let i = 0; i < this.fftSize; i++) {
        this.windowFunction[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / (this.fftSize - 1)));
      }
    }
  }

  // A-weighting function based on IEC 61672-1 standard
  getAWeighting(frequency) {
    if (frequency <= 0) return -100; // Very low attenuation for DC
    
    const f2 = frequency * frequency;
    const f4 = f2 * f2;
    
    const c1 = Math.pow(12194, 2);
    const c2 = Math.pow(20.6, 2);
    const c3 = Math.pow(107.7, 2);
    const c4 = Math.pow(737.9, 2);
    
    const numerator = c1 * f4;
    const denominator = (f2 + c2) * Math.sqrt((f2 + c3) * (f2 + c4)) * (f2 + c1);
    
    const response = numerator / denominator;
    
    // Convert to dB and add reference adjustment
    return 20 * Math.log10(response) + 2.00;
  }

  // Biquad filter implementation
  createAWeightingFilter() {
    // This is a 4th order A-weighting filter approximated by two biquad filters
    // Coefficients are pre-calculated for 48kHz sample rate
    const filters = [
      { // High-pass
        b0: 0.9839, b1: -1.9678, b2: 0.9839,
        a1: -1.9677, a2: 0.9679,
        z1: 0, z2: 0
      },
      { // High-pass
        b0: 0.8433, b1: -1.6866, b2: 0.8433,
        a1: -1.6776, a2: 0.6956,
        z1: 0, z2: 0
      }
    ];

    return (input) => {
      let output = new Float32Array(input.length);
      for (let f of filters) {
        for (let i = 0; i < input.length; i++) {
          const out = input[i] * f.b0 + f.z1;
          f.z1 = input[i] * f.b1 - out * f.a1 + f.z2;
          f.z2 = input[i] * f.b2 - out * f.a2;
          output[i] = out;
        }
        input = output; // Chain the filters
      }
      return output;
    };
  }

  performFFT(inputData) {
    // Apply windowing function
    for (let i = 0; i < this.fftSize; i++) {
      this.dataArray[i] = inputData[i] * this.windowFunction[i];
    }

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
      let dbValue = 20 * Math.log10(Math.max(magnitude, 1e-10));
      
      // Apply A-weighting if enabled
      if (this.useAWeighting) {
        const frequency = (i * this.actualSampleRate) / this.fftSize;
        const aWeight = this.getAWeighting(frequency);
        dbValue += aWeight;
      }
      
      // Apply temporal smoothing in the worklet
      if (this.smoothedMagnitudes === null) {
        this.smoothedMagnitudes = new Float32Array(this.fftSize / 2);
        this.smoothedMagnitudes[i] = dbValue;
      } else {
        // Apply response time-based smoothing
        let effectiveSmoothing = this.smoothing;
        if (this.responseTime === 'slow') {
          effectiveSmoothing = 0.95; // Very high smoothing for slow mode
        } else if (this.responseTime === 'fast') {
          effectiveSmoothing = Math.max(this.smoothing, 0.3); // Minimum smoothing for stability
        }
        
        this.smoothedMagnitudes[i] = 
          effectiveSmoothing * this.smoothedMagnitudes[i] + 
          (1 - effectiveSmoothing) * dbValue;
      }
      
      this.frequencyArray[i] = this.smoothedMagnitudes[i];
    }
  }

  fft(real, imag) {
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
      const ang = 2 * Math.PI / len;
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

  generateFrequencyBins(sampleRate) {
    const bins = new Float32Array(this.fftSize / 2);
    for (let i = 0; i < this.fftSize / 2; i++) {
      bins[i] = (i * sampleRate) / this.fftSize;
    }
    return bins;
  }

  // Calculate RMS (Root Mean Square) of audio buffer
  calculateRMS(buffer) {
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) {
      sum += buffer[i] * buffer[i];
    }
    return Math.sqrt(sum / buffer.length);
  }

  // Calculate SPL from RMS value (for legacy compatibility)
  calculateSPL(rmsValue) {
    const referencePressure = 1.0;
    const spl = 20 * Math.log10(Math.max(rmsValue / referencePressure, 1e-10)) + 94;
    return spl + (this.calibrationOffset || 0);
  }

  // Update Leq calculation according to IEC 61672-1
  updateLeq(rmsValue) {
    // Store squared pressure values in circular buffer
    const pressureSquared = rmsValue * rmsValue;
    this.leqBuffer[this.leqBufferIndex] = pressureSquared;
    this.leqBufferIndex = (this.leqBufferIndex + 1) % this.leqBuffer.length;
    
    // Track how many samples we have
    if (this.leqSampleCount < this.leqBuffer.length) {
      this.leqSampleCount++;
    }
    
    // Calculate Leq over the accumulated time period
    let sumPressureSquared = 0;
    const samplesToUse = this.leqSampleCount;
    
    for (let i = 0; i < samplesToUse; i++) {
      const bufferPos = (this.leqBufferIndex - samplesToUse + i + this.leqBuffer.length) % this.leqBuffer.length;
      sumPressureSquared += this.leqBuffer[bufferPos];
    }
    
    const meanPressureSquared = sumPressureSquared / samplesToUse;
    const leq = 10 * Math.log10(Math.max(meanPressureSquared, 1e-20)) + 94;
    return leq + (this.calibrationOffset || 0);
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];

    if (input.length > 0 && input[0]) {
      const inputChannel = input[0];
      
      // Update actual sample rate from context
      try {
        if (typeof sampleRate !== 'undefined') {
          this.actualSampleRate = sampleRate;
        }
      } catch (e) {
        this.actualSampleRate = 48000;
      }
      
      // Copy input to output (pass-through)
      if (output.length > 0 && output[0]) {
        output[0].set(inputChannel);
      }

      // Accumulate audio samples in our buffer
      for (let i = 0; i < inputChannel.length; i++) {
        this.audioBuffer[this.bufferIndex] = inputChannel[i];
        this.bufferIndex = (this.bufferIndex + 1) % this.audioBuffer.length;
      }

      // Check if we should perform FFT analysis
      this.frameCount += inputChannel.length;
      const samplesPerUpdate = Math.floor(this.actualSampleRate / this.updateRate);
      
      if (this.frameCount >= samplesPerUpdate) {
        this.frameCount = 0;
        
        try {
          // Extract the most recent fftSize samples
          const audioData = new Float32Array(this.fftSize);
          for (let i = 0; i < this.fftSize; i++) {
            const bufferPos = (this.bufferIndex - this.fftSize + i + this.audioBuffer.length) % this.audioBuffer.length;
            audioData[i] = this.audioBuffer[bufferPos];
          }
          
          // Perform FFT analysis
          this.performFFT(audioData);
          
          // Apply A-weighting filter for SPL/Leq calculations
          const weightedChannel = this.aWeightFilter(inputChannel);

          // Calculate RMS from the A-weighted buffer
          const rmsValue = this.calculateRMS(weightedChannel);
          
          // Calculate SPL
          const splValue = this.calculateSPL(rmsValue);
          
          // Update and calculate Leq
          const leqValue = this.updateLeq(rmsValue);
          
          // Generate frequency bins
          const frequencyBins = this.generateFrequencyBins(this.actualSampleRate);
          
          // Send results to main thread
          const data = {
            frequencies: frequencyBins,
            magnitudes: new Float32Array(this.frequencyArray),
            sampleRate: this.actualSampleRate,
            timestamp: Date.now() / 1000,
            spl: splValue,
            leq: leqValue,
            rms: rmsValue
          };
          
          this.port.postMessage({
            type: 'frequencyData',
            data
          });
          
        } catch (error) {
          this.port.postMessage({
            type: 'error',
            error: 'Processing error: ' + error.message
          });
        }
      }
    }

    return true;
  }
}

registerProcessor('rta-worklet-processor', RtaWorkletProcessor);
      `;

      const blob = new Blob([workletCode], { type: "application/javascript" });
      const workletUrl = URL.createObjectURL(blob);
      await audioContext.audioWorklet.addModule(workletUrl);

      // Clean up the blob URL after loading
      URL.revokeObjectURL(workletUrl);

      // Create worklet node
      const workletNode = new AudioWorkletNode(audioContext, "rta-worklet-processor");
      workletNodeRef.current = workletNode;

      // Set up message handling
      workletNode.port.onmessage = (event) => {
        const { type, data, error } = event.data;

        if (type === "frequencyData") {
          const newData = data as FrequencyData;

          // Smoothing is now handled in the worklet, so just set the data directly
          setFrequencyData(newData);

          // Clear any previous errors if we're getting data
          if (error) {
            setError(null);
          }
        } else if (type === "error") {
          setError(`Worklet error: ${error}`);
          console.error("AudioWorklet error:", error);
        }
      };

      // Connect the audio graph
      sourceNode.connect(workletNode);
      // Note: We don't connect to destination to avoid feedback

      // Send initial configuration
      workletNode.port.postMessage({
        type: "setFFTSize",
        data: { fftSize: config.fftSize },
      });

      workletNode.port.postMessage({
        type: "setUpdateRate",
        data: { updateRate: config.updateRate },
      });

      workletNode.port.postMessage({
        type: "setAWeighting",
        data: { useAWeighting: config.useAWeighting },
      });

      workletNode.port.postMessage({
        type: "setSmoothing",
        data: { smoothing: config.smoothing },
      });

      workletNode.port.postMessage({
        type: "setResponseTime",
        data: { responseTime: config.responseTime },
      });

      // Send initial calibration offset (default 0)
      workletNode.port.postMessage({
        type: "setCalibrationOffset",
        data: { offset: 0 },
      });

      setIsActive(true);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start RTA");
      setIsActive(false);
    }
  }, [audioStream, config.fftSize, config.updateRate, config.smoothing]);

  const stop = useCallback(() => {
    if (workletNodeRef.current) {
      workletNodeRef.current.disconnect();
      workletNodeRef.current = null;
    }

    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    smoothedDataRef.current = null;
    setIsActive(false);
    setFrequencyData(null);
    setError(null);
  }, []);

  const updateConfig = useCallback(
    (newConfig: Partial<RtaConfig & { calibrationOffset: number }>) => {
      if (newConfig.calibrationOffset === undefined) {
        setConfig((prev) => ({ ...prev, ...newConfig }));
      }

      // Update worklet parameters if active
      if (workletNodeRef.current) {
        if (newConfig.fftSize !== undefined) {
          workletNodeRef.current.port.postMessage({
            type: "setFFTSize",
            data: { fftSize: newConfig.fftSize },
          });
        }

        if (newConfig.updateRate !== undefined) {
          workletNodeRef.current.port.postMessage({
            type: "setUpdateRate",
            data: { updateRate: newConfig.updateRate },
          });
        }

        if (newConfig.useAWeighting !== undefined) {
          workletNodeRef.current.port.postMessage({
            type: "setAWeighting",
            data: { useAWeighting: newConfig.useAWeighting },
          });
        }

        if (newConfig.smoothing !== undefined) {
          workletNodeRef.current.port.postMessage({
            type: "setSmoothing",
            data: { smoothing: newConfig.smoothing },
          });
        }

        if (newConfig.responseTime !== undefined) {
          workletNodeRef.current.port.postMessage({
            type: "setResponseTime",
            data: { responseTime: newConfig.responseTime },
          });
        }

        if (newConfig.calibrationOffset !== undefined) {
          workletNodeRef.current.port.postMessage({
            type: "setCalibrationOffset",
            data: { offset: newConfig.calibrationOffset },
          });
        }
      }
    },
    [],
  );

  // Clean up on unmount or when audio stream changes
  useEffect(() => {
    return () => {
      if (isActive) {
        stop();
      }
    };
  }, [isActive, stop]);

  // Stop and restart if config changes significantly
  useEffect(() => {
    if (isActive) {
      // Restart with new config
      stop();
      setTimeout(() => start(), 100);
    }
  }, [config.fftSize]); // Only restart for FFT size changes

  return {
    isActive,
    frequencyData,
    config,
    error,
    start,
    stop,
    updateConfig,
  };
}
