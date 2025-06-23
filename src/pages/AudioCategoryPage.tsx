{
      /*
      src/pages/AudioCategoryPage.tsx
      - Dedicated page for Audio formulas and calculators.
      - Includes a back link to the main formula categories page (/resources/audio-formulas).
      - Added new formulas: dBFS to Percentage/Linear, Combining Identical Sound Sources (SPL), SPL Change with Power Ratio.
      - Corrected Audio File Size calculator to use shared `bitDepth` state.
      - Imported `Percent` and `Users` icons for new formulas.
      */
    }
    import React, { useState, useMemo } from "react";
    import Header from "../components/Header";
    import Footer from "../components/Footer";
    import { Link as RouterLink } from "react-router-dom";
    import { 
      ArrowLeft, Thermometer, Zap, HardDrive, Waves, Radio, Timer, SlidersHorizontal, Sigma, Hash, Calculator, Shuffle, TrendingUp,
      Bolt, Volume2, BarChartBig, ScatterChart, Binary, Database, Speaker, GitFork, Filter, Baseline, HomeIcon as Home, Lightbulb, Ruler, Disc3, AudioWaveform, Gauge, Square as SquareIcon,
      Percent, Users // New icons
    } from "lucide-react";

    const sampleRateOptions = [
      { value: "44.1", label: "44.1 kHz" },
      { value: "48", label: "48 kHz" },
      { value: "88.2", label: "88.2 kHz" },
      { value: "96", label: "96 kHz" },
      { value: "192", label: "192 kHz" },
    ];

    const AudioCategoryPage: React.FC = () => {
      const [temperatureC, setTemperatureC] = useState<number | string>(20);
      const [selectedSampleRate, setSelectedSampleRate] = useState<string>(sampleRateOptions[1].value);
      const [frequencyHz, setFrequencyHz] = useState<number | string>(1000);
      const [periodInputMs, setPeriodInputMs] = useState<number | string>(10);
      const [numberOfSamplesInput, setNumberOfSamplesInput] = useState<number | string>(480);
      const [phaseDegreesInput, setPhaseDegreesInput] = useState<number | string>(90);
      const [phaseFrequencyInput, setPhaseFrequencyInput] = useState<number | string>(1000);

      // Ohm's Law
      const [ohmsVoltage, setOhmsVoltage] = useState<number | string>(12);
      const [ohmsResistance, setOhmsResistance] = useState<number | string>(4);

      // Decibels
      const [dbPowerP1, setDbPowerP1] = useState<number | string>(10);
      const [dbPowerP0, setDbPowerP0] = useState<number | string>(1);
      const [dbVoltageV1, setDbVoltageV1] = useState<number | string>(1);
      const [dbVoltageV0, setDbVoltageV0] = useState<number | string>(0.1);
      const [dBuInput, setDBuInput] = useState<number | string>(0);
      const [voltsFordBuInput, setVoltsFordBuInput] = useState<number | string>(0.775);
      const [dBvInput, setDBvInput] = useState<number | string>(0);
      const [voltsFordBvInput, setVoltsFordBvInput] = useState<number | string>(1);
      const [dbfsValue, setDbfsValue] = useState<number | string>(-6); // New state for dBFS
      const [splSingleSource, setSplSingleSource] = useState<number | string>(90); // New state for SPL combining
      const [numberOfSources, setNumberOfSources] = useState<number | string>(2); // New state for SPL combining
      const [splInitialPower, setSplInitialPower] = useState<number | string>(90); // New state for SPL power change
      const [powerRatio, setPowerRatio] = useState<number | string>(2); // New state for SPL power change (e.g., 2 for double)


      // Inverse Square Law
      const [invSqSpl1, setInvSqSpl1] = useState<number | string>(90);
      const [invSqDist1, setInvSqDist1] = useState<number | string>(1);
      const [invSqDist2, setInvSqDist2] = useState<number | string>(2);

      // Comb Filtering
      const [combPathDiffM, setCombPathDiffM] = useState<number | string>(0.1);

      // Digital Audio
      const [bitDepth, setBitDepth] = useState<number | string>(16);
      const [fileSizeChannels, setFileSizeChannels] = useState<number | string>(2);
      const [fileSizeDurationMin, setFileSizeDurationMin] = useState<number | string>(3);

      // Speaker Impedance
      const [speakerImpedance1, setSpeakerImpedance1] = useState<number | string>(8);
      const [speakerImpedance2, setSpeakerImpedance2] = useState<number | string>(8);

      // Q Factor & Bandwidth
      const [qFactorFc, setQFactorFc] = useState<number | string>(1000);
      const [qFactorBw, setQFactorBw] = useState<number | string>(141);
      const [bwFactorQ, setBwFactorQ] = useState<number | string>(1.414);

      // Room Modes
      const [roomDimensionM, setRoomDimensionM] = useState<number | string>(5);


      const temperatureF = useMemo(() => {
        if (typeof temperatureC === "number") return (temperatureC * 9) / 5 + 32;
        return "";
      }, [temperatureC]);

      const speedOfSoundMPS = useMemo(() => {
        if (typeof temperatureC === "number") return 331.3 + 0.606 * temperatureC;
        return 0;
      }, [temperatureC]);

      const speedOfSoundFPS = useMemo(() => speedOfSoundMPS * 3.28084, [speedOfSoundMPS]);
      const speedOfSoundFtMs = useMemo(() => speedOfSoundFPS / 1000, [speedOfSoundFPS]);
      const speedOfSoundMsFt = useMemo(() => speedOfSoundFtMs !== 0 ? 1 / speedOfSoundFtMs : 0, [speedOfSoundFtMs]);
      const speedOfSoundMMs = useMemo(() => speedOfSoundMPS / 1000, [speedOfSoundMPS]);
      const speedOfSoundMsM = useMemo(() => speedOfSoundMMs !== 0 ? 1 / speedOfSoundMMs : 0, [speedOfSoundMMs]);

      const numericFrequencyHz = useMemo(() => {
        if (typeof frequencyHz === 'number' && frequencyHz > 0) return frequencyHz;
        return 0;
      }, [frequencyHz]);

      const periodMs = useMemo(() => numericFrequencyHz > 0 ? 1000 / numericFrequencyHz : 0, [numericFrequencyHz]);
      const wavelengthM = useMemo(() => (numericFrequencyHz > 0 && speedOfSoundMPS > 0) ? speedOfSoundMPS / numericFrequencyHz : 0, [numericFrequencyHz, speedOfSoundMPS]);
      const halfWavelengthM = useMemo(() => wavelengthM / 2, [wavelengthM]);
      const quarterWavelengthM = useMemo(() => wavelengthM / 4, [wavelengthM]);
      const samplesPerCycle = useMemo(() => {
        const sr = parseFloat(selectedSampleRate) * 1000;
        return (numericFrequencyHz > 0 && sr > 0) ? sr / numericFrequencyHz : 0;
      }, [selectedSampleRate, numericFrequencyHz]);
      const quarterWavelengthPeriodMs = useMemo(() => periodMs / 4, [periodMs]);

      const numericPeriodInputMs = useMemo(() => {
        if (typeof periodInputMs === 'number' && periodInputMs > 0) return periodInputMs;
        return 0;
      }, [periodInputMs]);

      const frequencyFromPeriodHz = useMemo(() => numericPeriodInputMs > 0 ? 1000 / numericPeriodInputMs : 0, [numericPeriodInputMs]);
      const wavelengthFromPeriodM = useMemo(() => (frequencyFromPeriodHz > 0 && speedOfSoundMPS > 0) ? speedOfSoundMPS / frequencyFromPeriodHz : 0, [frequencyFromPeriodHz, speedOfSoundMPS]);
      const samplesFromPeriod = useMemo(() => {
        const sr = parseFloat(selectedSampleRate) * 1000;
        return (frequencyFromPeriodHz > 0 && sr > 0) ? sr / frequencyFromPeriodHz : 0;
      }, [selectedSampleRate, frequencyFromPeriodHz]);

      const numericSamplesInput = useMemo(() => {
        if (typeof numberOfSamplesInput === 'number' && numberOfSamplesInput > 0) return numberOfSamplesInput;
        return 0;
      }, [numberOfSamplesInput]);

      const frequencyFromSamplesHz = useMemo(() => {
        const sr = parseFloat(selectedSampleRate) * 1000;
        return (numericSamplesInput > 0 && sr > 0) ? sr / numericSamplesInput : 0;
      }, [selectedSampleRate, numericSamplesInput]);

      const periodFromSamplesMs = useMemo(() => frequencyFromSamplesHz > 0 ? 1000 / frequencyFromSamplesHz : 0, [frequencyFromSamplesHz]);
      const wavelengthFromSamplesM = useMemo(() => (frequencyFromSamplesHz > 0 && speedOfSoundMPS > 0) ? speedOfSoundMPS / frequencyFromSamplesHz : 0, [frequencyFromSamplesHz, speedOfSoundMPS]);

      const numericPhaseDegrees = useMemo(() => {
        if (typeof phaseDegreesInput === 'number') return phaseDegreesInput;
        return NaN;
      }, [phaseDegreesInput]);

      const numericPhaseFrequencyForDelayCalc = useMemo(() => {
        if (typeof phaseFrequencyInput === 'number' && phaseFrequencyInput > 0) return phaseFrequencyInput;
        return 0;
      }, [phaseFrequencyInput]);

      const phaseDelayMs = useMemo(() => {
        if (!isNaN(numericPhaseDegrees) && numericPhaseFrequencyForDelayCalc > 0) {
          return (numericPhaseDegrees / 360) * (1000 / numericPhaseFrequencyForDelayCalc);
        }
        return 0;
      }, [numericPhaseDegrees, numericPhaseFrequencyForDelayCalc]);

      const numOhmsVoltage = useMemo(() => typeof ohmsVoltage === 'number' ? ohmsVoltage : NaN, [ohmsVoltage]);
      const numOhmsResistance = useMemo(() => typeof ohmsResistance === 'number' && ohmsResistance > 0 ? ohmsResistance : NaN, [ohmsResistance]);
      const ohmsCurrent = useMemo(() => !isNaN(numOhmsVoltage) && !isNaN(numOhmsResistance) ? numOhmsVoltage / numOhmsResistance : NaN, [numOhmsVoltage, numOhmsResistance]);
      const ohmsPower = useMemo(() => !isNaN(numOhmsVoltage) && !isNaN(ohmsCurrent) ? numOhmsVoltage * ohmsCurrent : NaN, [numOhmsVoltage, ohmsCurrent]);

      const numDbPowerP1 = useMemo(() => typeof dbPowerP1 === 'number' && dbPowerP1 > 0 ? dbPowerP1 : NaN, [dbPowerP1]);
      const numDbPowerP0 = useMemo(() => typeof dbPowerP0 === 'number' && dbPowerP0 > 0 ? dbPowerP0 : NaN, [dbPowerP0]);
      const dbPowerRatio = useMemo(() => !isNaN(numDbPowerP1) && !isNaN(numDbPowerP0) ? 10 * Math.log10(numDbPowerP1 / numDbPowerP0) : NaN, [numDbPowerP1, numDbPowerP0]);

      const numDbVoltageV1 = useMemo(() => typeof dbVoltageV1 === 'number' && dbVoltageV1 > 0 ? dbVoltageV1 : NaN, [dbVoltageV1]);
      const numDbVoltageV0 = useMemo(() => typeof dbVoltageV0 === 'number' && dbVoltageV0 > 0 ? dbVoltageV0 : NaN, [dbVoltageV0]);
      const dbVoltageRatio = useMemo(() => !isNaN(numDbVoltageV1) && !isNaN(numDbVoltageV0) ? 20 * Math.log10(numDbVoltageV1 / numDbVoltageV0) : NaN, [numDbVoltageV1, numDbVoltageV0]);
      
      const numdBuInput = useMemo(() => typeof dBuInput === 'number' ? dBuInput : NaN, [dBuInput]);
      const voltsFromDBu = useMemo(() => !isNaN(numdBuInput) ? 0.775 * Math.pow(10, numdBuInput / 20) : NaN, [numdBuInput]);
      const numVoltsFordBuInput = useMemo(() => typeof voltsFordBuInput === 'number' && voltsFordBuInput > 0 ? voltsFordBuInput : NaN, [voltsFordBuInput]);
      const dBuFromVolts = useMemo(() => !isNaN(numVoltsFordBuInput) ? 20 * Math.log10(numVoltsFordBuInput / 0.775) : NaN, [numVoltsFordBuInput]);

      const numdBvInput = useMemo(() => typeof dBvInput === 'number' ? dBvInput : NaN, [dBvInput]);
      const voltsFromDBv = useMemo(() => !isNaN(numdBvInput) ? Math.pow(10, numdBvInput / 20) : NaN, [numdBvInput]);
      const numVoltsFordBvInput = useMemo(() => typeof voltsFordBvInput === 'number' && voltsFordBvInput > 0 ? voltsFordBvInput : NaN, [voltsFordBvInput]);
      const dBvFromVolts = useMemo(() => !isNaN(numVoltsFordBvInput) ? 20 * Math.log10(numVoltsFordBvInput) : NaN, [numVoltsFordBvInput]);

      // New dBFS calculations
      const numDbfsValue = useMemo(() => typeof dbfsValue === 'number' ? dbfsValue : NaN, [dbfsValue]);
      const dbfsPercentage = useMemo(() => !isNaN(numDbfsValue) ? Math.pow(10, numDbfsValue / 20) * 100 : NaN, [numDbfsValue]);
      const dbfsLinear = useMemo(() => !isNaN(numDbfsValue) ? Math.pow(10, numDbfsValue / 20) : NaN, [numDbfsValue]);

      // New SPL Combining calculations
      const numSplSingleSource = useMemo(() => typeof splSingleSource === 'number' ? splSingleSource : NaN, [splSingleSource]);
      const numNumberOfSources = useMemo(() => typeof numberOfSources === 'number' && numberOfSources > 0 ? numberOfSources : NaN, [numberOfSources]);
      const combinedSpl = useMemo(() => !isNaN(numSplSingleSource) && !isNaN(numNumberOfSources) ? numSplSingleSource + 10 * Math.log10(numNumberOfSources) : NaN, [numSplSingleSource, numNumberOfSources]);

      // New SPL Power Change calculations
      const numSplInitialPower = useMemo(() => typeof splInitialPower === 'number' ? splInitialPower : NaN, [splInitialPower]);
      const numPowerRatio = useMemo(() => typeof powerRatio === 'number' && powerRatio > 0 ? powerRatio : NaN, [powerRatio]);
      const splFromPowerChange = useMemo(() => !isNaN(numSplInitialPower) && !isNaN(numPowerRatio) ? numSplInitialPower + 10 * Math.log10(numPowerRatio) : NaN, [numSplInitialPower, numPowerRatio]);


      const numInvSqSpl1 = useMemo(() => typeof invSqSpl1 === 'number' ? invSqSpl1 : NaN, [invSqSpl1]);
      const numInvSqDist1 = useMemo(() => typeof invSqDist1 === 'number' && invSqDist1 > 0 ? invSqDist1 : NaN, [invSqDist1]);
      const numInvSqDist2 = useMemo(() => typeof invSqDist2 === 'number' && invSqDist2 > 0 ? invSqDist2 : NaN, [invSqDist2]);
      const invSqSpl2 = useMemo(() => {
        if (!isNaN(numInvSqSpl1) && !isNaN(numInvSqDist1) && !isNaN(numInvSqDist2)) {
          return numInvSqSpl1 + 20 * Math.log10(numInvSqDist1 / numInvSqDist2);
        }
        return NaN;
      }, [numInvSqSpl1, numInvSqDist1, numInvSqDist2]);

      const numCombPathDiffM = useMemo(() => typeof combPathDiffM === 'number' && combPathDiffM > 0 ? combPathDiffM : NaN, [combPathDiffM]);
      const firstCombNullFreq = useMemo(() => {
        if (!isNaN(numCombPathDiffM) && speedOfSoundMPS > 0) {
          return speedOfSoundMPS / (2 * numCombPathDiffM);
        }
        return NaN;
      }, [numCombPathDiffM, speedOfSoundMPS]);

      const numBitDepth = useMemo(() => typeof bitDepth === 'number' && bitDepth > 0 && Number.isInteger(bitDepth) ? bitDepth : NaN, [bitDepth]);
      const dynamicRange = useMemo(() => !isNaN(numBitDepth) ? numBitDepth * 6.02 : NaN, [numBitDepth]);

      const numFileSizeChannels = useMemo(() => typeof fileSizeChannels === 'number' && fileSizeChannels > 0 && Number.isInteger(fileSizeChannels) ? fileSizeChannels : NaN, [fileSizeChannels]);
      const numFileSizeDurationMin = useMemo(() => typeof fileSizeDurationMin === 'number' && fileSizeDurationMin > 0 ? fileSizeDurationMin : NaN, [fileSizeDurationMin]);
      const audioFileSizeMB = useMemo(() => {
        const sr = parseFloat(selectedSampleRate) * 1000;
        if (!isNaN(numBitDepth) && !isNaN(numFileSizeChannels) && !isNaN(numFileSizeDurationMin) && sr > 0) {
          const durationSeconds = numFileSizeDurationMin * 60;
          return (sr * numBitDepth * numFileSizeChannels * durationSeconds) / (8 * 1024 * 1024);
        }
        return NaN;
      }, [selectedSampleRate, numBitDepth, numFileSizeChannels, numFileSizeDurationMin]);

      const numSpeakerImpedance1 = useMemo(() => typeof speakerImpedance1 === 'number' && speakerImpedance1 > 0 ? speakerImpedance1 : NaN, [speakerImpedance1]);
      const numSpeakerImpedance2 = useMemo(() => typeof speakerImpedance2 === 'number' && speakerImpedance2 > 0 ? speakerImpedance2 : NaN, [speakerImpedance2]);
      const seriesImpedance = useMemo(() => !isNaN(numSpeakerImpedance1) && !isNaN(numSpeakerImpedance2) ? numSpeakerImpedance1 + numSpeakerImpedance2 : NaN, [numSpeakerImpedance1, numSpeakerImpedance2]);
      const parallelImpedance = useMemo(() => {
        if (!isNaN(numSpeakerImpedance1) && !isNaN(numSpeakerImpedance2)) {
          return (numSpeakerImpedance1 * numSpeakerImpedance2) / (numSpeakerImpedance1 + numSpeakerImpedance2);
        }
        return NaN;
      }, [numSpeakerImpedance1, numSpeakerImpedance2]);

      const numQFactorFc = useMemo(() => typeof qFactorFc === 'number' && qFactorFc > 0 ? qFactorFc : NaN, [qFactorFc]);
      const numQFactorBw = useMemo(() => typeof qFactorBw === 'number' && qFactorBw > 0 ? qFactorBw : NaN, [qFactorBw]);
      const calculatedQ = useMemo(() => !isNaN(numQFactorFc) && !isNaN(numQFactorBw) ? numQFactorFc / numQFactorBw : NaN, [numQFactorFc, numQFactorBw]);
      
      const numBwFactorQ = useMemo(() => typeof bwFactorQ === 'number' && bwFactorQ > 0 ? bwFactorQ : NaN, [bwFactorQ]);
      const calculatedBw = useMemo(() => !isNaN(numQFactorFc) && !isNaN(numBwFactorQ) ? numQFactorFc / numBwFactorQ : NaN, [numQFactorFc, numBwFactorQ]);

      const numRoomDimensionM = useMemo(() => typeof roomDimensionM === 'number' && roomDimensionM > 0 ? roomDimensionM : NaN, [roomDimensionM]);
      const roomModes = useMemo(() => {
        if (!isNaN(numRoomDimensionM) && speedOfSoundMPS > 0) {
          return [1, 2, 3].map(n => (n * speedOfSoundMPS) / (2 * numRoomDimensionM));
        }
        return [NaN, NaN, NaN];
      }, [numRoomDimensionM, speedOfSoundMPS]);


      const handleSimpleNumberChange = (setter: React.Dispatch<React.SetStateAction<number | string>>, allowNegative: boolean = false, allowZero: boolean = false, allowFloat: boolean = true) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value === "") {
          setter(value);
          return;
        }
        if (allowNegative && value === "-") {
          setter(value);
          return;
        }
        const numValue = allowFloat ? parseFloat(value) : parseInt(value, 10);
        if (!isNaN(numValue)) {
          if (!allowZero && numValue === 0 && !allowNegative && value !== "0.") { // Allow "0." for float input
             // Do nothing if trying to set 0 and 0 is not allowed (unless it's a negative number context)
          } else if (!allowNegative && numValue < 0) {
            // Do nothing if negative numbers are not allowed
          }
          else {
            setter(numValue);
          }
        } else if (value.endsWith(".") && allowFloat) {
          setter(value);
        } else if (value === "0" && allowZero) {
           setter(numValue); // Allow explicit 0 if allowZero is true
        }
      };
      
      const handleTemperatureChange = handleSimpleNumberChange(setTemperatureC, true, true);
      const handleFrequencyChange = handleSimpleNumberChange(setFrequencyHz, false, false);
      const handlePeriodInputChange = handleSimpleNumberChange(setPeriodInputMs, false, false);
      const handleSamplesInputChange = handleSimpleNumberChange(setNumberOfSamplesInput, false, false, false);
      const handlePhaseDegreesChange = handleSimpleNumberChange(setPhaseDegreesInput, true, true);
      const handlePhaseFrequencyChange = handleSimpleNumberChange(setPhaseFrequencyInput, false, false);

      const handleOhmsVoltageChange = handleSimpleNumberChange(setOhmsVoltage, true, true);
      const handleOhmsResistanceChange = handleSimpleNumberChange(setOhmsResistance, false, false);
      
      const handleDbPowerP1Change = handleSimpleNumberChange(setDbPowerP1, false, false);
      const handleDbPowerP0Change = handleSimpleNumberChange(setDbPowerP0, false, false);
      const handleDbVoltageV1Change = handleSimpleNumberChange(setDbVoltageV1, false, false);
      const handleDbVoltageV0Change = handleSimpleNumberChange(setDbVoltageV0, false, false);
      const handleDBuInputChange = handleSimpleNumberChange(setDBuInput, true, true);
      const handleVoltsFordBuInputChange = handleSimpleNumberChange(setVoltsFordBuInput, false, false);
      const handleDBvInputChange = handleSimpleNumberChange(setDBvInput, true, true);
      const handleVoltsFordBvInputChange = handleSimpleNumberChange(setVoltsFordBvInput, false, false);
      const handleDbfsValueChange = handleSimpleNumberChange(setDbfsValue, true, true); // New handler
      const handleSplSingleSourceChange = handleSimpleNumberChange(setSplSingleSource, true, true); // New handler
      const handleNumberOfSourcesChange = handleSimpleNumberChange(setNumberOfSources, false, false, false); // New handler
      const handleSplInitialPowerChange = handleSimpleNumberChange(setSplInitialPower, true, true); // New handler
      const handlePowerRatioChange = handleSimpleNumberChange(setPowerRatio, false, false); // New handler


      const handleInvSqSpl1Change = handleSimpleNumberChange(setInvSqSpl1, true, true);
      const handleInvSqDist1Change = handleSimpleNumberChange(setInvSqDist1, false, false);
      const handleInvSqDist2Change = handleSimpleNumberChange(setInvSqDist2, false, false);
      
      const handleCombPathDiffMChange = handleSimpleNumberChange(setCombPathDiffM, false, false);

      const handleBitDepthChange = handleSimpleNumberChange(setBitDepth, false, false, false);
      const handleFileSizeChannelsChange = handleSimpleNumberChange(setFileSizeChannels, false, false, false);
      const handleFileSizeDurationMinChange = handleSimpleNumberChange(setFileSizeDurationMin, false, false);

      const handleSpeakerImpedance1Change = handleSimpleNumberChange(setSpeakerImpedance1, false, false);
      const handleSpeakerImpedance2Change = handleSimpleNumberChange(setSpeakerImpedance2, false, false);

      const handleQFactorFcChange = handleSimpleNumberChange(setQFactorFc, false, false);
      const handleQFactorBwChange = handleSimpleNumberChange(setQFactorBw, false, false);
      const handleBwFactorQChange = handleSimpleNumberChange(setBwFactorQ, false, false);

      const handleRoomDimensionMChange = handleSimpleNumberChange(setRoomDimensionM, false, false);


      const handleSampleRateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedSampleRate(e.target.value);
      };
      
      const formatNumber = (num: number | string, precision: number = 2): string => {
        if (typeof num === 'string') {
          if (num === "" || num === "-") return num;
          const parsed = parseFloat(num);
          if (isNaN(parsed) || !isFinite(parsed)) return "N/A";
          return parsed.toFixed(precision);
        }
        if (isNaN(num) || !isFinite(num)) return "N/A";
        return num.toFixed(precision);
      };

      const isValidTemperature = typeof temperatureC === 'number' && !isNaN(temperatureC);
      const isValidPhaseDegrees = typeof phaseDegreesInput === 'number' && !isNaN(phaseDegreesInput);
      const isValidPhaseFrequency = typeof phaseFrequencyInput === 'number' && phaseFrequencyInput > 0;

      const renderCalcGroup = (title: string, icon: React.ElementType, inputs: React.ReactNode, outputs: React.ReactNode, condition: boolean, errorMsg: string) => (
        <div className="mb-8 bg-gray-800 p-6 sm:p-8 rounded-xl shadow-xl border border-indigo-700/30">
          <h3 className="text-xl font-semibold text-indigo-300 mb-4 flex items-center">
            {React.createElement(icon, { className: "mr-2 h-6 w-6" })} {title}
          </h3>
          {inputs}
          {condition ? (
            <div>
              <h4 className="text-lg font-medium text-indigo-200 mb-3 mt-4">Calculated Values:</h4>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {outputs}
              </div>
            </div>
          ) : (
            <p className="text-yellow-400 text-center bg-yellow-900/30 p-3 rounded-md mt-4">{errorMsg}</p>
          )}
        </div>
      );

      const renderOutputItem = (label: string, value: string, unit: string) => (
        <div key={label} className="bg-gray-700/70 p-4 rounded-md shadow">
          <p className="text-xs text-indigo-300">{label}</p>
          <p className="text-xl font-bold text-white">
            {value} <span className="text-sm font-normal text-gray-400">{unit}</span>
          </p>
        </div>
      );

      const renderInputField = (id: string, label: string, value: string | number, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, unit?: string, placeholder?: string, icon?: React.ElementType, min?: string) => (
        <div>
          <label htmlFor={id} className="block text-sm font-medium text-indigo-300 mb-2">
            {label} {unit && `(${unit})`}
          </label>
          <div className="relative">
            {icon && <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {React.createElement(icon, { className: "h-5 w-5 text-gray-400", "aria-hidden": true })}
            </div>}
            <input
              type="number"
              name={id}
              id={id}
              value={value}
              onChange={onChange}
              className={`bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:ring-indigo-500 focus:border-indigo-500 block w-full ${icon ? 'pl-10' : 'pl-4'} pr-4 py-2.5 rounded-md shadow-sm text-lg`}
              placeholder={placeholder || `e.g., ${typeof value === 'number' ? value : '10'}`}
              min={min}
              step={min === "0" ? "any" : undefined} // Allow decimals if min is "0" (often for non-integer positive values)
            />
          </div>
        </div>
      );


      return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col">
          <Header />
          <main className="flex-grow container mx-auto px-4 py-16 sm:py-24">
            <div className="mb-8">
              <RouterLink
                to="/resources/audio-formulas" // Link back to the formula categories hub
                className="inline-flex items-center text-indigo-400 hover:text-indigo-300 transition-colors duration-200 group"
              >
                <ArrowLeft className="mr-2 h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                Back to Formula Categories
              </RouterLink>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-12 text-center text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">
              Audio Formulas & Calculators
            </h1>
            
            {/* Constants Section */}
            <section id="constants-section" className="mb-12">
              <h2 className="text-2xl font-semibold text-indigo-300 mb-6 flex items-center">
                <SlidersHorizontal className="mr-3 h-7 w-7" /> Constants & Environment
              </h2>
              <div className="bg-gray-850 p-5 rounded-lg shadow-xl border border-indigo-700/30">
                <p className="text-gray-300 mb-6 text-base leading-relaxed">
                  Define fundamental environmental and digital constants used in audio calculations.
                </p>
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-indigo-200 mb-4 flex items-center">
                    <Thermometer className="mr-2 h-6 w-6" /> Speed of Sound
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6 items-center mb-6">
                    {renderInputField("temperatureC", "Enter Temperature", temperatureC, handleTemperatureChange, "°C", "20", Thermometer)}
                    <div className="text-center md:text-left pt-4 md:pt-0">
                      <p className="text-gray-400 text-sm">Equivalent to:</p>
                      <p className="text-2xl font-semibold text-indigo-300">
                        {formatNumber(temperatureF)} °F
                      </p>
                    </div>
                  </div>
                  {isValidTemperature ? (
                    <div>
                      <h4 className="text-lg font-medium text-indigo-100 mb-3">Calculated Speed of Sound:</h4>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[
                          { label: "Meters per Second", value: formatNumber(speedOfSoundMPS), unit: "m/s" },
                          { label: "Feet per Second", value: formatNumber(speedOfSoundFPS), unit: "ft/s" },
                          { label: "Meters per Millisecond", value: formatNumber(speedOfSoundMMs, 4), unit: "m/ms" },
                          { label: "Feet per Millisecond", value: formatNumber(speedOfSoundFtMs, 4), unit: "ft/ms" },
                          { label: "Milliseconds per Meter", value: formatNumber(speedOfSoundMsM, 4), unit: "ms/m" },
                          { label: "Milliseconds per Foot", value: formatNumber(speedOfSoundMsFt, 4), unit: "ms/ft" },
                        ].map(item => renderOutputItem(item.label, item.value, item.unit))}
                      </div>
                    </div>
                  ) : ( <p className="text-yellow-400 text-center bg-yellow-900/30 p-3 rounded-md"> Please enter a valid number for temperature. </p> )}
                </div>
                <hr className="border-gray-700 my-8" />
                <div> 
                  <h3 className="text-xl font-semibold text-indigo-200 mb-4 flex items-center">
                    <HardDrive className="mr-2 h-6 w-6" /> Digital Audio Settings
                  </h3>
                  <label htmlFor="sampleRate" className="block text-sm font-medium text-indigo-200 mb-2"> Select Sample Rate (kHz) </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"> <HardDrive className="h-5 w-5 text-gray-400" aria-hidden="true" /> </div>
                    <select id="sampleRate" name="sampleRate" value={selectedSampleRate} onChange={handleSampleRateChange} className="bg-gray-700 border border-gray-600 text-white focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 pr-4 py-2.5 rounded-md shadow-sm text-lg appearance-none" >
                      {sampleRateOptions.map((option) => ( <option key={option.value} value={option.value} className="bg-gray-800 text-white"> {option.label} </option> ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"> <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"> <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.23 8.29a.75.75 0 01.02-1.06z" clipRule="evenodd" /> </svg> </div>
                  </div>
                  <p className="mt-3 text-sm text-gray-400"> Selected Sample Rate: <span className="font-semibold text-indigo-300">{selectedSampleRate} kHz</span> </p>
                </div>
              </div>
            </section>

            {/* Waveform Properties Section */}
            <section id="waveform-properties-section" className="mb-12">
              <h2 className="text-2xl font-semibold text-indigo-300 mb-6 flex items-center">
                <Sigma className="mr-3 h-7 w-7" /> Waveform Properties
              </h2>
              <div className="bg-gray-850 p-5 rounded-lg shadow-xl border border-indigo-700/30">
                <p className="text-gray-300 mb-6 text-base leading-relaxed"> Calculate properties of waveforms based on the defined constants. </p>
                {renderCalcGroup("Frequency & Wavelength", Waves, 
                  (<div className="mb-6">{renderInputField("frequencyHz", "Enter Frequency", frequencyHz, handleFrequencyChange, "Hz", "1000", Radio, "0")}</div>),
                  [
                    { label: "Period", value: formatNumber(periodMs, 3), unit: "ms" },
                    { label: "Wavelength", value: formatNumber(wavelengthM, 3), unit: "m" },
                    { label: "1/2 Wavelength", value: formatNumber(halfWavelengthM, 3), unit: "m" },
                    { label: "1/4 Wavelength", value: formatNumber(quarterWavelengthM, 3), unit: "m" },
                    { label: "Samples per Cycle", value: formatNumber(samplesPerCycle, 2), unit: "samples" },
                    { label: "1/4 Wavelength Period", value: formatNumber(quarterWavelengthPeriodMs, 3), unit: "ms" },
                  ].map(item => renderOutputItem(item.label, item.value, item.unit)),
                  numericFrequencyHz > 0 && isValidTemperature, "Please enter a valid positive frequency and a valid temperature."
                )}
                <hr className="border-gray-700 my-8" />
                {renderCalcGroup("Period & Related Values", Timer,
                  (<div className="mb-6">{renderInputField("periodInputMs", "Enter Period", periodInputMs, handlePeriodInputChange, "ms", "10", Timer, "0")}</div>),
                  [
                    { label: "Frequency", value: formatNumber(frequencyFromPeriodHz, 2), unit: "Hz" },
                    { label: "Wavelength", value: formatNumber(wavelengthFromPeriodM, 3), unit: "m" },
                    { label: "Samples per Cycle", value: formatNumber(samplesFromPeriod, 2), unit: "samples" },
                  ].map(item => renderOutputItem(item.label, item.value, item.unit)),
                  numericPeriodInputMs > 0 && isValidTemperature, "Please enter a valid positive period and a valid temperature."
                )}
                <hr className="border-gray-700 my-8" />
                {renderCalcGroup("Samples & Related Values", Calculator,
                  (<div className="mb-6">{renderInputField("numberOfSamplesInput", "Enter Number of Samples", numberOfSamplesInput, handleSamplesInputChange, "samples", "480", Hash, "0")}</div>),
                  [
                    { label: "Frequency", value: formatNumber(frequencyFromSamplesHz, 2), unit: "Hz" },
                    { label: "Period", value: formatNumber(periodFromSamplesMs, 3), unit: "ms" },
                    { label: "Wavelength", value: formatNumber(wavelengthFromSamplesM, 3), unit: "m" },
                  ].map(item => renderOutputItem(item.label, item.value, item.unit)),
                  numericSamplesInput > 0 && isValidTemperature, "Please enter a valid positive number of samples and a valid temperature."
                )}
                <hr className="border-gray-700 my-8" />
                {renderCalcGroup("Phase Delay Calculator", Shuffle,
                  (<div className="grid md:grid-cols-2 gap-6 mb-6">
                    {renderInputField("phaseDegreesInput", "Enter Phase", phaseDegreesInput, handlePhaseDegreesChange, "degrees", "90", TrendingUp)}
                    {renderInputField("phaseFrequencyInput", "Enter Frequency", phaseFrequencyInput, handlePhaseFrequencyChange, "Hz", "1000", Radio, "0")}
                  </div>),
                  [
                    { label: "Phase Delay", value: formatNumber(phaseDelayMs, 4), unit: "ms" },
                  ].map(item => renderOutputItem(item.label, item.value, item.unit)),
                  isValidPhaseDegrees && isValidPhaseFrequency, "Please enter a valid phase (degrees) and a valid positive frequency."
                )}
              </div>
            </section>

            {/* Ohm's Law & Power Section */}
            <section id="ohms-law-power-section" className="mb-12">
              <h2 className="text-2xl font-semibold text-indigo-300 mb-6 flex items-center">
                <Lightbulb className="mr-3 h-7 w-7" /> Ohm's Law & Power
              </h2>
              <div className="bg-gray-850 p-5 rounded-lg shadow-xl border border-indigo-700/30">
                {renderCalcGroup("Ohm's Law", Zap,
                  (<div className="grid md:grid-cols-2 gap-6 mb-6">
                    {renderInputField("ohmsVoltage", "Voltage (V)", ohmsVoltage, handleOhmsVoltageChange, "V", "12", Zap)}
                    {renderInputField("ohmsResistance", "Resistance (Ω)", ohmsResistance, handleOhmsResistanceChange, "Ω", "4", Sigma, "0")}
                  </div>),
                  [
                    { label: "Current (I)", value: formatNumber(ohmsCurrent, 3), unit: "A" },
                    { label: "Power (P)", value: formatNumber(ohmsPower, 3), unit: "W" },
                  ].map(item => renderOutputItem(item.label, item.value, item.unit)),
                  !isNaN(numOhmsVoltage) && !isNaN(numOhmsResistance), "Please enter valid voltage and positive resistance."
                )}
              </div>
            </section>

            {/* Decibels & Levels Section */}
            <section id="decibels-levels-section" className="mb-12">
              <h2 className="text-2xl font-semibold text-indigo-300 mb-6 flex items-center">
                <Volume2 className="mr-3 h-7 w-7" /> Decibels & Levels
              </h2>
              <div className="bg-gray-850 p-5 rounded-lg shadow-xl border border-indigo-700/30">
                {renderCalcGroup("dB from Power Ratio", BarChartBig,
                  (<div className="grid md:grid-cols-2 gap-6 mb-6">
                    {renderInputField("dbPowerP1", "Power 1 (P1)", dbPowerP1, handleDbPowerP1Change, "W", "10", Bolt, "0")}
                    {renderInputField("dbPowerP0", "Reference Power (P0)", dbPowerP0, handleDbPowerP0Change, "W", "1", Bolt, "0")}
                  </div>),
                  [{ label: "Decibels", value: formatNumber(dbPowerRatio, 2), unit: "dB" }].map(item => renderOutputItem(item.label, item.value, item.unit)),
                  !isNaN(numDbPowerP1) && !isNaN(numDbPowerP0), "Please enter valid positive power values."
                )}
                <hr className="border-gray-700 my-8" />
                {renderCalcGroup("dB from Voltage/Pressure Ratio", BarChartBig,
                  (<div className="grid md:grid-cols-2 gap-6 mb-6">
                    {renderInputField("dbVoltageV1", "Voltage/Pressure 1 (V1)", dbVoltageV1, handleDbVoltageV1Change, "units", "1", Zap, "0")}
                    {renderInputField("dbVoltageV0", "Reference V/P (V0)", dbVoltageV0, handleDbVoltageV0Change, "units", "0.1", Zap, "0")}
                  </div>),
                  [{ label: "Decibels", value: formatNumber(dbVoltageRatio, 2), unit: "dB" }].map(item => renderOutputItem(item.label, item.value, item.unit)),
                  !isNaN(numDbVoltageV1) && !isNaN(numDbVoltageV0), "Please enter valid positive voltage/pressure values."
                )}
                <hr className="border-gray-700 my-8" />
                {renderCalcGroup("dBu to Volts", Calculator,
                  (<div className="mb-6">{renderInputField("dBuInput", "dBu Value", dBuInput, handleDBuInputChange, "dBu", "0", Sigma)}</div>),
                  [{ label: "Voltage", value: formatNumber(voltsFromDBu, 3), unit: "V" }].map(item => renderOutputItem(item.label, item.value, item.unit)),
                  !isNaN(numdBuInput), "Please enter a valid dBu value."
                )}
                <hr className="border-gray-700 my-8" />
                {renderCalcGroup("Volts to dBu", Calculator,
                  (<div className="mb-6">{renderInputField("voltsFordBuInput", "Voltage (V)", voltsFordBuInput, handleVoltsFordBuInputChange, "V", "0.775", Zap, "0")}</div>),
                  [{ label: "dBu", value: formatNumber(dBuFromVolts, 2), unit: "dBu" }].map(item => renderOutputItem(item.label, item.value, item.unit)),
                  !isNaN(numVoltsFordBuInput), "Please enter a valid positive voltage."
                )}
                <hr className="border-gray-700 my-8" />
                {renderCalcGroup("dBV to Volts", Calculator,
                  (<div className="mb-6">{renderInputField("dBvInput", "dBV Value", dBvInput, handleDBvInputChange, "dBV", "0", Sigma)}</div>),
                  [{ label: "Voltage", value: formatNumber(voltsFromDBv, 3), unit: "V" }].map(item => renderOutputItem(item.label, item.value, item.unit)),
                  !isNaN(numdBvInput), "Please enter a valid dBV value."
                )}
                <hr className="border-gray-700 my-8" />
                {renderCalcGroup("Volts to dBV", Calculator,
                  (<div className="mb-6">{renderInputField("voltsFordBvInput", "Voltage (V)", voltsFordBvInput, handleVoltsFordBvInputChange, "V", "1", Zap, "0")}</div>),
                  [{ label: "dBV", value: formatNumber(dBvFromVolts, 2), unit: "dBV" }].map(item => renderOutputItem(item.label, item.value, item.unit)),
                  !isNaN(numVoltsFordBvInput), "Please enter a valid positive voltage."
                )}
                <hr className="border-gray-700 my-8" />
                {renderCalcGroup("dBFS Conversion", Percent,
                  (<div className="mb-6">{renderInputField("dbfsValue", "dBFS Value", dbfsValue, handleDbfsValueChange, "dBFS", "-6", Percent)}</div>),
                  [
                    { label: "Percentage of Full Scale", value: formatNumber(dbfsPercentage, 2), unit: "%" },
                    { label: "Linear Value (0 to 1)", value: formatNumber(dbfsLinear, 4), unit: "" },
                  ].map(item => renderOutputItem(item.label, item.value, item.unit)),
                  !isNaN(numDbfsValue), "Please enter a valid dBFS value."
                )}
                <hr className="border-gray-700 my-8" />
                {renderCalcGroup("Combining Identical Sound Sources (SPL)", Users,
                  (<div className="grid md:grid-cols-2 gap-6 mb-6">
                    {renderInputField("splSingleSource", "SPL of One Source", splSingleSource, handleSplSingleSourceChange, "dB", "90", Volume2)}
                    {renderInputField("numberOfSources", "Number of Sources", numberOfSources, handleNumberOfSourcesChange, "", "2", Users, "1")}
                  </div>),
                  [{ label: "Combined SPL", value: formatNumber(combinedSpl, 2), unit: "dB" }].map(item => renderOutputItem(item.label, item.value, item.unit)),
                  !isNaN(numSplSingleSource) && !isNaN(numNumberOfSources), "Please enter valid SPL and number of sources (must be > 0)."
                )}
                <hr className="border-gray-700 my-8" />
                {renderCalcGroup("SPL Change with Power Ratio", TrendingUp,
                  (<div className="grid md:grid-cols-2 gap-6 mb-6">
                    {renderInputField("splInitialPower", "Initial SPL", splInitialPower, handleSplInitialPowerChange, "dB", "90", Volume2)}
                    {renderInputField("powerRatio", "Power Ratio (New/Old)", powerRatio, handlePowerRatioChange, "", "2", Bolt, "0")}
                  </div>),
                  [{ label: "New SPL", value: formatNumber(splFromPowerChange, 2), unit: "dB" }].map(item => renderOutputItem(item.label, item.value, item.unit)),
                  !isNaN(numSplInitialPower) && !isNaN(numPowerRatio), "Please enter valid initial SPL and a positive power ratio."
                )}
              </div>
            </section>

            {/* Sound Propagation & Interaction Section */}
            <section id="sound-propagation-section" className="mb-12">
              <h2 className="text-2xl font-semibold text-indigo-300 mb-6 flex items-center">
                <ScatterChart className="mr-3 h-7 w-7" /> Sound Propagation
              </h2>
              <div className="bg-gray-850 p-5 rounded-lg shadow-xl border border-indigo-700/30">
                {renderCalcGroup("Inverse Square Law (SPL Change)", Ruler,
                  (<div className="grid md:grid-cols-3 gap-6 mb-6">
                    {renderInputField("invSqSpl1", "SPL at Distance 1", invSqSpl1, handleInvSqSpl1Change, "dB", "90", Volume2)}
                    {renderInputField("invSqDist1", "Distance 1", invSqDist1, handleInvSqDist1Change, "m", "1", Ruler, "0")}
                    {renderInputField("invSqDist2", "Distance 2", invSqDist2, handleInvSqDist2Change, "m", "2", Ruler, "0")}
                  </div>),
                  [{ label: "SPL at Distance 2", value: formatNumber(invSqSpl2, 2), unit: "dB" }].map(item => renderOutputItem(item.label, item.value, item.unit)),
                  !isNaN(numInvSqSpl1) && !isNaN(numInvSqDist1) && !isNaN(numInvSqDist2), "Please enter valid SPL and positive distances."
                )}
                <hr className="border-gray-700 my-8" />
                {renderCalcGroup("Comb Filtering (First Null)", AudioWaveform,
                  (<div className="mb-6">{renderInputField("combPathDiffM", "Path Length Difference", combPathDiffM, handleCombPathDiffMChange, "m", "0.1", Waves, "0")}</div>),
                  [{ label: "First Null Frequency", value: formatNumber(firstCombNullFreq, 2), unit: "Hz" }].map(item => renderOutputItem(item.label, item.value, item.unit)),
                  !isNaN(numCombPathDiffM) && isValidTemperature, "Please enter valid path difference and temperature."
                )}
              </div>
            </section>

            {/* Digital Audio Section */}
            <section id="digital-audio-section" className="mb-12">
              <h2 className="text-2xl font-semibold text-indigo-300 mb-6 flex items-center">
                <Disc3 className="mr-3 h-7 w-7" /> Digital Audio
              </h2>
              <div className="bg-gray-850 p-5 rounded-lg shadow-xl border border-indigo-700/30">
                {renderCalcGroup("Bit Depth & Dynamic Range", Binary,
                  (<div className="mb-6">{renderInputField("bitDepth", "Bit Depth", bitDepth, handleBitDepthChange, "bits", "16", Binary, "1")}</div>),
                  [{ label: "Dynamic Range", value: formatNumber(dynamicRange, 2), unit: "dB" }].map(item => renderOutputItem(item.label, item.value, item.unit)),
                  !isNaN(numBitDepth), "Please enter a valid positive integer for bit depth."
                )}
                <hr className="border-gray-700 my-8" />
                {renderCalcGroup("Audio File Size (Uncompressed)", Database,
                  (<div className="grid md:grid-cols-2 gap-6 mb-6">
                    {/* Corrected to use shared bitDepth state */}
                    {renderInputField("bitDepthForFileSize", "Bit Depth", bitDepth, handleBitDepthChange, "bits", "16", Binary, "1")}
                    {renderInputField("fileSizeChannels", "Number of Channels", fileSizeChannels, handleFileSizeChannelsChange, "", "2", Hash, "1")}
                    {renderInputField("fileSizeDurationMin", "Duration", fileSizeDurationMin, handleFileSizeDurationMinChange, "min", "3", Timer, "0")}
                  </div>),
                  [{ label: "File Size", value: formatNumber(audioFileSizeMB, 2), unit: "MB" }].map(item => renderOutputItem(item.label, item.value, item.unit)),
                  !isNaN(numBitDepth) && !isNaN(numFileSizeChannels) && !isNaN(numFileSizeDurationMin) && parseFloat(selectedSampleRate) > 0, "Please enter valid bit depth, channels, duration, and select a sample rate."
                )}
              </div>
            </section>

            {/* Speaker System Section */}
            <section id="speaker-system-section" className="mb-12">
              <h2 className="text-2xl font-semibold text-indigo-300 mb-6 flex items-center">
                <Speaker className="mr-3 h-7 w-7" /> Speaker Systems
              </h2>
              <div className="bg-gray-850 p-5 rounded-lg shadow-xl border border-indigo-700/30">
                {renderCalcGroup("Speaker Impedance (2 Speakers)", GitFork,
                  (<div className="grid md:grid-cols-2 gap-6 mb-6">
                    {renderInputField("speakerImpedance1", "Speaker 1 Impedance", speakerImpedance1, handleSpeakerImpedance1Change, "Ω", "8", Speaker, "0")}
                    {renderInputField("speakerImpedance2", "Speaker 2 Impedance", speakerImpedance2, handleSpeakerImpedance2Change, "Ω", "8", Speaker, "0")}
                  </div>),
                  [
                    { label: "Total Series Impedance", value: formatNumber(seriesImpedance, 2), unit: "Ω" },
                    { label: "Total Parallel Impedance", value: formatNumber(parallelImpedance, 2), unit: "Ω" },
                  ].map(item => renderOutputItem(item.label, item.value, item.unit)),
                  !isNaN(numSpeakerImpedance1) && !isNaN(numSpeakerImpedance2), "Please enter valid positive impedance values for both speakers."
                )}
              </div>
            </section>

            {/* Filters & Equalization Section */}
            <section id="filters-eq-section" className="mb-12">
              <h2 className="text-2xl font-semibold text-indigo-300 mb-6 flex items-center">
                <Filter className="mr-3 h-7 w-7" /> Filters & Equalization
              </h2>
              <div className="bg-gray-850 p-5 rounded-lg shadow-xl border border-indigo-700/30">
                {renderCalcGroup("Q Factor from Fc & Bandwidth", Gauge,
                  (<div className="grid md:grid-cols-2 gap-6 mb-6">
                    {renderInputField("qFactorFc_q", "Center Frequency (Fc)", qFactorFc, handleQFactorFcChange, "Hz", "1000", Radio, "0")}
                    {renderInputField("qFactorBw_q", "Bandwidth (BW)", qFactorBw, handleQFactorBwChange, "Hz", "141", Waves, "0")}
                  </div>),
                  [{ label: "Q Factor", value: formatNumber(calculatedQ, 3), unit: "" }].map(item => renderOutputItem(item.label, item.value, item.unit)),
                  !isNaN(numQFactorFc) && !isNaN(numQFactorBw), "Please enter valid positive Fc and Bandwidth."
                )}
                <hr className="border-gray-700 my-8" />
                {renderCalcGroup("Bandwidth from Fc & Q Factor", Gauge,
                  (<div className="grid md:grid-cols-2 gap-6 mb-6">
                    {renderInputField("qFactorFc_bw", "Center Frequency (Fc)", qFactorFc, handleQFactorFcChange, "Hz", "1000", Radio, "0")}
                    {renderInputField("bwFactorQ", "Q Factor", bwFactorQ, handleBwFactorQChange, "", "1.414", Baseline, "0")}
                  </div>),
                  [{ label: "Bandwidth", value: formatNumber(calculatedBw, 2), unit: "Hz" }].map(item => renderOutputItem(item.label, item.value, item.unit)),
                  !isNaN(numQFactorFc) && !isNaN(numBwFactorQ), "Please enter valid positive Fc and Q Factor."
                )}
              </div>
            </section>

            {/* Room Acoustics Section */}
            <section id="room-acoustics-section" className="mb-12">
              <h2 className="text-2xl font-semibold text-indigo-300 mb-6 flex items-center">
                <Home className="mr-3 h-7 w-7" /> Room Acoustics
              </h2>
              <div className="bg-gray-850 p-5 rounded-lg shadow-xl border border-indigo-700/30">
                {renderCalcGroup("Axial Room Modes (First 3)", SquareIcon,
                  (<div className="mb-6">{renderInputField("roomDimensionM", "Room Dimension (L, W, or H)", roomDimensionM, handleRoomDimensionMChange, "m", "5", Ruler, "0")}</div>),
                  roomModes.map((mode, index) => ({ label: `Mode ${index + 1}`, value: formatNumber(mode, 2), unit: "Hz" })).map(item => renderOutputItem(item.label, item.value, item.unit)),
                  !isNaN(numRoomDimensionM) && isValidTemperature, "Please enter a valid positive room dimension and temperature."
                )}
              </div>
            </section>
          </main>
          <Footer />
        </div>
      );
    };

    export default AudioCategoryPage;
