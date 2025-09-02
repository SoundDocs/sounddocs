{
  /*
      src/pages/VideoCategoryPage.tsx
      - Adjusted grid layout for "Uncompressed Video Data Rate" inputs for better UI.
      - Changed from lg:grid-cols-5 to lg:grid-cols-3 for the input fields container.
      - Preserved all previous functionalities and other formula layouts.
      - ADDED: Flicker-Free Shutter Speed formula (moved from LightingCategoryPage.tsx).
      */
}
import React, { useState, useMemo } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Link as RouterLink } from "react-router-dom";

import {
  ArrowLeft,
  Clapperboard,
  Maximize,
  Minimize,
  Film,
  HardDrive,
  Tv,
  Smartphone,
  Sigma,
  Calculator,
  Ruler,
  Percent,
  RectangleHorizontal,
  Eye,
  Projector,
  DatabaseZap,
  Video,
  Zap, // Added Video and Zap icons
} from "lucide-react";

const commonAspectRatios = [
  { label: "16:9 (HD, UHD)", value: "16:9" },
  { label: "4:3 (SD, Vintage)", value: "4:3" },
  { label: "21:9 (Cinemascope)", value: "21:9" },
  { label: "1.85:1 (Academy Flat)", value: "1.85:1" },
  { label: "2.39:1 (Anamorphic Scope)", value: "2.39:1" },
  { label: "1:1 (Square)", value: "1:1" },
  { label: "9:16 (Vertical Video)", value: "9:16" },
  { label: "3:1", value: "3:1" },
  { label: "4:1", value: "4:1" },
  { label: "5:1", value: "5:1" },
];

const resolutionTypes = [
  { label: "1080p (Full HD)", value: "1080p" },
  { label: "1440p (QHD)", value: "1440p" },
  { label: "4K (UHD)", value: "4K" },
  { label: "8K (FUHD)", value: "8K" },
];

const commonBitDepths = [
  { label: "8-bit", value: 8 },
  { label: "10-bit", value: 10 },
  { label: "12-bit", value: 12 },
  { label: "16-bit", value: 16 },
];

const VideoCategoryPage: React.FC = () => {
  // Aspect Ratio
  const [arWidth, setArWidth] = useState<number | string>(1920);
  const [arHeight, setArHeight] = useState<number | string>(1080);
  const [arKnownDim, setArKnownDim] = useState<number | string>(1920);
  const [arKnownType, setArKnownType] = useState<"width" | "height">("width");
  const [arSelectedRatio, setArSelectedRatio] = useState<string>(commonAspectRatios[0].value);

  // Resolution to Megapixels
  const [resWidthPx, setResWidthPx] = useState<number | string>(1920);
  const [resHeightPx, setResHeightPx] = useState<number | string>(1080);

  // Video File Size
  const [fileSizeDurationMin, setFileSizeDurationMin] = useState<number | string>(60);
  const [fileSizeBitrateMbps, setFileSizeBitrateMbps] = useState<number | string>(10);

  // Diagonal Screen Size
  const [diagWidth, setDiagWidth] = useState<number | string>(27);
  const [diagHeight, setDiagHeight] = useState<number | string>(15.1875);
  const [diagUnit, setDiagUnit] = useState<"inches" | "cm">("inches");

  // Pixels Per Inch (PPI)
  const [ppiResolutionWidth, setPpiResolutionWidth] = useState<number | string>(1920);
  const [ppiResolutionHeight, setPpiResolutionHeight] = useState<number | string>(1080);
  const [ppiDiagonalInches, setPpiDiagonalInches] = useState<number | string>(27);

  // Optimal Viewing Distance
  const [ovdScreenDiagonal, setOvdScreenDiagonal] = useState<number | string>(55);
  const [ovdResolutionType, setOvdResolutionType] = useState<string>(resolutionTypes[0].value);
  const [ovdUnit, setOvdUnit] = useState<"inches" | "feet" | "cm" | "meters">("inches");

  // Projection Calculator
  const [projKnownValueType, setProjKnownValueType] = useState<"screenWidth" | "throwDistance">(
    "screenWidth",
  );
  const [projKnownValue, setProjKnownValue] = useState<number | string>(10); // e.g. 10 feet wide screen
  const [projThrowRatio, setProjThrowRatio] = useState<number | string>(1.5); // e.g. 1.5:1
  const [projUnit, setProjUnit] = useState<"feet" | "meters">("feet");

  // Uncompressed Video Data Rate
  const [udrWidth, setUdrWidth] = useState<number | string>(1920);
  const [udrHeight, setUdrHeight] = useState<number | string>(1080);
  const [udrFrameRate, setUdrFrameRate] = useState<number | string>(30);
  const [udrBitDepth, setUdrBitDepth] = useState<number>(commonBitDepths[0].value);
  const [udrColorComponents, setUdrColorComponents] = useState<number | string>(3);

  // Flicker-Free Shutter Speed
  const [lightSourceFreq, setLightSourceFreq] = useState<number | string>(120); // Hz (e.g., 60Hz mains * 2)
  const [pwmDimmingFreq, setPwmDimmingFreq] = useState<number | string>(""); // Hz

  // --- Calculations ---

  // Aspect Ratio
  const numArWidth = useMemo(
    () => (typeof arWidth === "number" && arWidth > 0 ? arWidth : NaN),
    [arWidth],
  );
  const numArHeight = useMemo(
    () => (typeof arHeight === "number" && arHeight > 0 ? arHeight : NaN),
    [arHeight],
  );
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const calculatedAspectRatio = useMemo(() => {
    if (!isNaN(numArWidth) && !isNaN(numArHeight)) {
      const commonDivisor = gcd(numArWidth, numArHeight);
      return `${numArWidth / commonDivisor}:${numArHeight / commonDivisor}`;
    }
    return "N/A";
  }, [numArWidth, numArHeight]);
  const numArKnownDim = useMemo(
    () => (typeof arKnownDim === "number" && arKnownDim > 0 ? arKnownDim : NaN),
    [arKnownDim],
  );
  const [ratioX, ratioY] = useMemo(() => {
    const parts = arSelectedRatio.split(":");
    return [parseFloat(parts[0]), parseFloat(parts[1])];
  }, [arSelectedRatio]);
  const calculatedDimension = useMemo(() => {
    if (isNaN(numArKnownDim) || isNaN(ratioX) || isNaN(ratioY) || ratioX <= 0 || ratioY <= 0)
      return NaN;
    if (arKnownType === "width") return (numArKnownDim * ratioY) / ratioX;
    return (numArKnownDim * ratioX) / ratioY;
  }, [numArKnownDim, arKnownType, ratioX, ratioY]);

  // Resolution to Megapixels
  const numResWidthPx = useMemo(
    () => (typeof resWidthPx === "number" && resWidthPx > 0 ? resWidthPx : NaN),
    [resWidthPx],
  );
  const numResHeightPx = useMemo(
    () => (typeof resHeightPx === "number" && resHeightPx > 0 ? resHeightPx : NaN),
    [resHeightPx],
  );
  const megapixels = useMemo(
    () =>
      !isNaN(numResWidthPx) && !isNaN(numResHeightPx)
        ? (numResWidthPx * numResHeightPx) / 1000000
        : NaN,
    [numResWidthPx, numResHeightPx],
  );

  // Video File Size
  const numFileSizeDurationMin = useMemo(
    () =>
      typeof fileSizeDurationMin === "number" && fileSizeDurationMin > 0
        ? fileSizeDurationMin
        : NaN,
    [fileSizeDurationMin],
  );
  const numFileSizeBitrateMbps = useMemo(
    () =>
      typeof fileSizeBitrateMbps === "number" && fileSizeBitrateMbps > 0
        ? fileSizeBitrateMbps
        : NaN,
    [fileSizeBitrateMbps],
  );
  const videoFileSizeMB = useMemo(() => {
    if (!isNaN(numFileSizeDurationMin) && !isNaN(numFileSizeBitrateMbps)) {
      return (numFileSizeBitrateMbps * (numFileSizeDurationMin * 60)) / 8;
    }
    return NaN;
  }, [numFileSizeDurationMin, numFileSizeBitrateMbps]);
  const videoFileSizeGB = useMemo(() => videoFileSizeMB / 1024, [videoFileSizeMB]);

  // Diagonal Screen Size
  const numDiagWidth = useMemo(
    () => (typeof diagWidth === "number" && diagWidth > 0 ? diagWidth : NaN),
    [diagWidth],
  );
  const numDiagHeight = useMemo(
    () => (typeof diagHeight === "number" && diagHeight > 0 ? diagHeight : NaN),
    [diagHeight],
  );
  const screenDiagonal = useMemo(
    () =>
      !isNaN(numDiagWidth) && !isNaN(numDiagHeight)
        ? Math.sqrt(Math.pow(numDiagWidth, 2) + Math.pow(numDiagHeight, 2))
        : NaN,
    [numDiagWidth, numDiagHeight],
  );
  const screenArea = useMemo(
    () => (!isNaN(numDiagWidth) && !isNaN(numDiagHeight) ? numDiagWidth * numDiagHeight : NaN),
    [numDiagWidth, numDiagHeight],
  );

  // Pixels Per Inch (PPI)
  const numPpiResWidth = useMemo(
    () =>
      typeof ppiResolutionWidth === "number" && ppiResolutionWidth > 0 ? ppiResolutionWidth : NaN,
    [ppiResolutionWidth],
  );
  const numPpiResHeight = useMemo(
    () =>
      typeof ppiResolutionHeight === "number" && ppiResolutionHeight > 0
        ? ppiResolutionHeight
        : NaN,
    [ppiResolutionHeight],
  );
  const numPpiDiagInches = useMemo(
    () =>
      typeof ppiDiagonalInches === "number" && ppiDiagonalInches > 0 ? ppiDiagonalInches : NaN,
    [ppiDiagonalInches],
  );
  const ppiValue = useMemo(() => {
    if (!isNaN(numPpiResWidth) && !isNaN(numPpiResHeight) && !isNaN(numPpiDiagInches)) {
      const diagonalPixels = Math.sqrt(Math.pow(numPpiResWidth, 2) + Math.pow(numPpiResHeight, 2));
      return diagonalPixels / numPpiDiagInches;
    }
    return NaN;
  }, [numPpiResWidth, numPpiResHeight, numPpiDiagInches]);

  // Optimal Viewing Distance
  const numOvdScreenDiagonal = useMemo(
    () =>
      typeof ovdScreenDiagonal === "number" && ovdScreenDiagonal > 0 ? ovdScreenDiagonal : NaN,
    [ovdScreenDiagonal],
  );
  const { ovdMinDistance, ovdMaxDistance } = useMemo(() => {
    if (isNaN(numOvdScreenDiagonal)) return { ovdMinDistance: NaN, ovdMaxDistance: NaN };
    let minFactor = 1.5,
      maxFactor = 2.5; // Default for 1080p
    if (ovdResolutionType === "1440p") {
      minFactor = 1.2;
      maxFactor = 2.0;
    } else if (ovdResolutionType === "4K") {
      minFactor = 1.0;
      maxFactor = 1.5;
    } else if (ovdResolutionType === "8K") {
      minFactor = 0.75;
      maxFactor = 1.25;
    }
    return {
      ovdMinDistance: numOvdScreenDiagonal * minFactor,
      ovdMaxDistance: numOvdScreenDiagonal * maxFactor,
    };
  }, [numOvdScreenDiagonal, ovdResolutionType]);

  // Projection Calculator
  const numProjKnownValue = useMemo(
    () => (typeof projKnownValue === "number" && projKnownValue > 0 ? projKnownValue : NaN),
    [projKnownValue],
  );
  const numProjThrowRatio = useMemo(
    () => (typeof projThrowRatio === "number" && projThrowRatio > 0 ? projThrowRatio : NaN),
    [projThrowRatio],
  );
  const projCalculatedValue = useMemo(() => {
    if (isNaN(numProjKnownValue) || isNaN(numProjThrowRatio)) return NaN;
    if (projKnownValueType === "screenWidth") return numProjKnownValue * numProjThrowRatio; // Calculate Throw Distance
    return numProjKnownValue / numProjThrowRatio; // Calculate Screen Width
  }, [numProjKnownValue, numProjThrowRatio, projKnownValueType]);

  // Uncompressed Video Data Rate
  const numUdrWidth = useMemo(
    () => (typeof udrWidth === "number" && udrWidth > 0 ? udrWidth : NaN),
    [udrWidth],
  );
  const numUdrHeight = useMemo(
    () => (typeof udrHeight === "number" && udrHeight > 0 ? udrHeight : NaN),
    [udrHeight],
  );
  const numUdrFrameRate = useMemo(
    () => (typeof udrFrameRate === "number" && udrFrameRate > 0 ? udrFrameRate : NaN),
    [udrFrameRate],
  );
  const numUdrBitDepth = useMemo(
    () => (typeof udrBitDepth === "number" && udrBitDepth > 0 ? udrBitDepth : NaN),
    [udrBitDepth],
  );
  const numUdrColorComponents = useMemo(
    () =>
      typeof udrColorComponents === "number" && udrColorComponents > 0 ? udrColorComponents : NaN,
    [udrColorComponents],
  );
  const uncompressedDataRateMbps = useMemo(() => {
    if (
      isNaN(numUdrWidth) ||
      isNaN(numUdrHeight) ||
      isNaN(numUdrFrameRate) ||
      isNaN(numUdrBitDepth) ||
      isNaN(numUdrColorComponents)
    )
      return NaN;
    return (
      (numUdrWidth * numUdrHeight * numUdrFrameRate * numUdrBitDepth * numUdrColorComponents) /
      (1024 * 1024)
    );
  }, [numUdrWidth, numUdrHeight, numUdrFrameRate, numUdrBitDepth, numUdrColorComponents]);
  const uncompressedDataRateMBps = useMemo(
    () => uncompressedDataRateMbps / 8,
    [uncompressedDataRateMbps],
  );

  // Flicker-Free Shutter Speed
  const numLightSourceFreq = useMemo(
    () => (typeof lightSourceFreq === "number" && lightSourceFreq > 0 ? lightSourceFreq : NaN),
    [lightSourceFreq],
  );
  const numPwmDimmingFreq = useMemo(
    () =>
      typeof pwmDimmingFreq === "number" && pwmDimmingFreq > 0
        ? pwmDimmingFreq
        : typeof pwmDimmingFreq === "string" && pwmDimmingFreq === ""
          ? null
          : NaN,
    [pwmDimmingFreq],
  );

  const flickerFreeShutterSpeeds = useMemo(() => {
    const targetFreq = numPwmDimmingFreq ?? numLightSourceFreq;
    if (isNaN(targetFreq) || targetFreq === null) return [];

    const commonDenominators = [
      24, 25, 30, 48, 50, 60, 100, 120, 125, 150, 180, 200, 240, 250, 300, 360, 400, 500, 720, 1000,
    ];
    let safeSpeeds: string[] = [];

    for (let i = 1; i <= 5; i++) {
      const idealDenominator = i * targetFreq;
      commonDenominators.forEach((denom) => {
        if (
          Math.abs(denom - idealDenominator) < idealDenominator * 0.1 ||
          denom % Math.round(targetFreq) === 0
        ) {
          if (!safeSpeeds.includes(`1/${denom}s`)) {
            safeSpeeds.push(`1/${denom}s`);
          }
        }
      });
    }
    commonDenominators
      .filter((d) => d > targetFreq * 2)
      .forEach((denom) => {
        if (!safeSpeeds.includes(`1/${denom}s`)) {
          safeSpeeds.push(`1/${denom}s`);
        }
      });

    const uniqueSortedSpeeds = [...new Set(safeSpeeds)].sort((a, b) => {
      const numA = parseInt(a.substring(2, a.length - 1));
      const numB = parseInt(b.substring(2, b.length - 1));
      return numA - numB;
    });

    return uniqueSortedSpeeds.slice(0, 10);
  }, [numLightSourceFreq, numPwmDimmingFreq]);

  // --- Input Handlers ---
  const handleSimpleNumberChange =
    (
      setter: React.Dispatch<React.SetStateAction<number | string>>,
      allowZero: boolean = false,
      allowFloat: boolean = true,
    ) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (value === "") {
        setter(value);
        return;
      }
      const numValue = allowFloat ? parseFloat(value) : parseInt(value, 10);
      if (!isNaN(numValue)) {
        if (!allowZero && numValue <= 0 && value !== "0.") {
          /* Do nothing */
        } else {
          setter(numValue);
        }
      } else if (value.endsWith(".") && allowFloat) {
        setter(value);
      }
    };

  const handleArWidthChange = handleSimpleNumberChange(setArWidth, false, false);
  const handleArHeightChange = handleSimpleNumberChange(setArHeight, false, false);
  const handleArKnownDimChange = handleSimpleNumberChange(setArKnownDim, false, true);
  const handleResWidthPxChange = handleSimpleNumberChange(setResWidthPx, false, false);
  const handleResHeightPxChange = handleSimpleNumberChange(setResHeightPx, false, false);
  const handleFileSizeDurationMinChange = handleSimpleNumberChange(
    setFileSizeDurationMin,
    false,
    true,
  );
  const handleFileSizeBitrateMbpsChange = handleSimpleNumberChange(
    setFileSizeBitrateMbps,
    false,
    true,
  );
  const handleDiagWidthChange = handleSimpleNumberChange(setDiagWidth, false, true);
  const handleDiagHeightChange = handleSimpleNumberChange(setDiagHeight, false, true);
  const handlePpiResWidthChange = handleSimpleNumberChange(setPpiResolutionWidth, false, false);
  const handlePpiResHeightChange = handleSimpleNumberChange(setPpiResolutionHeight, false, false);
  const handlePpiDiagInchesChange = handleSimpleNumberChange(setPpiDiagonalInches, false, true);

  const handleOvdScreenDiagonalChange = handleSimpleNumberChange(setOvdScreenDiagonal, false, true);
  const handleProjKnownValueChange = handleSimpleNumberChange(setProjKnownValue, false, true);
  const handleProjThrowRatioChange = handleSimpleNumberChange(setProjThrowRatio, false, true);

  const handleUdrWidthChange = handleSimpleNumberChange(setUdrWidth, false, false);
  const handleUdrHeightChange = handleSimpleNumberChange(setUdrHeight, false, false);
  const handleUdrFrameRateChange = handleSimpleNumberChange(setUdrFrameRate, false, false);
  const handleUdrColorComponentsChange = handleSimpleNumberChange(
    setUdrColorComponents,
    false,
    false,
  );

  const handleLightSourceFreqChange = handleSimpleNumberChange(setLightSourceFreq, false, true);
  const handlePwmDimmingFreqChange = handleSimpleNumberChange(setPwmDimmingFreq, true, true);

  // --- Formatting & Rendering ---
  const formatNumber = (num: number | string, precision: number = 2): string => {
    if (typeof num === "string") {
      if (num === "") return num;
      const parsed = parseFloat(num);
      if (isNaN(parsed) || !isFinite(parsed)) return "N/A";
      return parsed.toFixed(precision);
    }
    if (isNaN(num) || !isFinite(num)) return "N/A";
    return num.toFixed(precision);
  };

  const renderCalcGroup = (
    title: string,
    icon: React.ElementType,
    inputs: React.ReactNode,
    outputs: React.ReactNode,
    condition: boolean = true,
    errorMsg: string = "Please enter valid positive inputs.",
  ) => (
    <div className="mb-8 bg-gray-800 p-6 sm:p-8 rounded-xl shadow-xl border border-green-700/30">
      <h3 className="text-xl font-semibold text-green-300 mb-4 flex items-center">
        {React.createElement(icon, { className: "mr-2 h-6 w-6" })} {title}
      </h3>
      {inputs}
      {condition ? (
        outputs && (
          <div>
            <h4 className="text-lg font-medium text-green-200 mb-3 mt-4">Calculated Values:</h4>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{outputs}</div>
          </div>
        )
      ) : (
        <p className="text-yellow-400 text-center bg-yellow-900/30 p-3 rounded-md mt-4">
          {errorMsg}
        </p>
      )}
    </div>
  );

  const renderOutputItem = (label: string, value: string, unit: string) => (
    <div key={label} className="bg-gray-700/70 p-4 rounded-md shadow">
      <p className="text-xs text-green-300">{label}</p>
      <p className="text-xl font-bold text-white">
        {value} <span className="text-sm font-normal text-gray-400">{unit}</span>
      </p>
    </div>
  );

  const renderOutputList = (label: string, values: string[], unit: string) => (
    <div className="bg-gray-700/70 p-4 rounded-md shadow sm:col-span-2 lg:col-span-3">
      <p className="text-xs text-green-300">{label}</p>
      {values.length > 0 ? (
        <ul className="list-disc list-inside mt-1">
          {values.map((val, idx) => (
            <li key={idx} className="text-lg text-white">
              {val} <span className="text-sm font-normal text-gray-400">{unit}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-lg text-white">No suggestions based on input.</p>
      )}
    </div>
  );

  const renderInputField = (
    id: string,
    label: string,
    value: string | number,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
    unit?: string,
    placeholder?: string,
    icon?: React.ElementType,
    min?: string,
  ) => (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-green-300 mb-2">
        {label} {unit && `(${unit})`}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {React.createElement(icon, { className: "h-5 w-5 text-gray-400", "aria-hidden": true })}
          </div>
        )}
        <input
          type="number"
          name={id}
          id={id}
          value={value}
          onChange={onChange}
          className={`bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:ring-green-500 focus:border-green-500 block w-full ${icon ? "pl-10" : "pl-4"} pr-4 py-2.5 rounded-md shadow-sm text-lg`}
          placeholder={placeholder || `e.g., ${typeof value === "number" ? value : "10"}`}
          min={min}
          step={
            min === "0" ||
            (typeof value === "string" && value.includes(".")) ||
            (typeof value === "number" && !Number.isInteger(value))
              ? "any"
              : "1"
          }
        />
      </div>
    </div>
  );

  const renderSelectField = (
    id: string,
    label: string,
    value: string | number,
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void,
    options: { value: string | number; label: string }[],
    icon?: React.ElementType,
  ) => (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-green-300 mb-2">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {React.createElement(icon, { className: "h-5 w-5 text-gray-400", "aria-hidden": true })}
          </div>
        )}
        <select
          id={id}
          name={id}
          value={value}
          onChange={onChange}
          className={`bg-gray-700 border border-gray-600 text-white focus:ring-green-500 focus:border-green-500 block w-full ${icon ? "pl-10" : "pl-4"} pr-8 py-2.5 rounded-md shadow-sm text-lg appearance-none`}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-gray-800 text-white">
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <svg
            className="h-5 w-5 text-gray-400"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.23 8.29a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-16 sm:py-24">
        <div className="mb-8">
          <RouterLink
            to="/resources/audio-formulas"
            className="inline-flex items-center text-green-400 hover:text-green-300 transition-colors duration-200 group"
          >
            <ArrowLeft className="mr-2 h-5 w-5 group-hover:-translate-x-1 transition-transform" />
            Back to Formula Categories
          </RouterLink>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold mb-12 text-center text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-teal-500">
          Video Formulas & Calculators
        </h1>

        {/* Aspect Ratio Section */}
        <section id="aspect-ratio-section" className="mb-12">
          <h2 className="text-2xl font-semibold text-green-300 mb-6 flex items-center">
            <RectangleHorizontal className="mr-3 h-7 w-7" /> Aspect Ratio
          </h2>
          {renderCalcGroup(
            "Calculate Aspect Ratio from Dimensions",
            RectangleHorizontal,
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {renderInputField(
                "arWidth",
                "Width",
                arWidth,
                handleArWidthChange,
                "units",
                "1920",
                Maximize,
                "1",
              )}
              {renderInputField(
                "arHeight",
                "Height",
                arHeight,
                handleArHeightChange,
                "units",
                "1080",
                Maximize,
                "1",
              )}
            </div>,
            [{ label: "Aspect Ratio", value: calculatedAspectRatio, unit: "" }].map((item) =>
              renderOutputItem(item.label, item.value, item.unit),
            ),
            !isNaN(numArWidth) && !isNaN(numArHeight),
          )}
          <hr className="border-gray-700 my-8" />
          {renderCalcGroup(
            "Calculate Dimension from Aspect Ratio",
            RectangleHorizontal,
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              {renderInputField(
                "arKnownDim",
                "Known Dimension",
                arKnownDim,
                handleArKnownDimChange,
                "units",
                "1920",
                Ruler,
                "0",
              )}
              {renderSelectField(
                "arKnownType",
                "Known Dimension Type",
                arKnownType,
                (e) => setArKnownType(e.target.value as "width" | "height"),
                [
                  { value: "width", label: "Width" },
                  { value: "height", label: "Height" },
                ],
                RectangleHorizontal,
              )}
              {renderSelectField(
                "arSelectedRatio",
                "Select Aspect Ratio",
                arSelectedRatio,
                (e) => setArSelectedRatio(e.target.value),
                commonAspectRatios,
                RectangleHorizontal,
              )}
            </div>,
            [
              {
                label: `Calculated ${arKnownType === "width" ? "Height" : "Width"}`,
                value: formatNumber(calculatedDimension),
                unit: "units",
              },
            ].map((item) => renderOutputItem(item.label, item.value, item.unit)),
            !isNaN(numArKnownDim) && !isNaN(ratioX) && !isNaN(ratioY) && ratioX > 0 && ratioY > 0,
          )}
        </section>

        {/* Resolution & Megapixels Section */}
        <section id="resolution-megapixels-section" className="mb-12">
          <h2 className="text-2xl font-semibold text-green-300 mb-6 flex items-center">
            <Tv className="mr-3 h-7 w-7" /> Resolution & Megapixels
          </h2>
          {renderCalcGroup(
            "Resolution to Megapixels",
            Tv,
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {renderInputField(
                "resWidthPx",
                "Width",
                resWidthPx,
                handleResWidthPxChange,
                "pixels",
                "1920",
                Maximize,
                "1",
              )}
              {renderInputField(
                "resHeightPx",
                "Height",
                resHeightPx,
                handleResHeightPxChange,
                "pixels",
                "1080",
                Maximize,
                "1",
              )}
            </div>,
            [{ label: "Total Megapixels", value: formatNumber(megapixels, 2), unit: "MP" }].map(
              (item) => renderOutputItem(item.label, item.value, item.unit),
            ),
            !isNaN(numResWidthPx) && !isNaN(numResHeightPx),
          )}
        </section>

        {/* Video File Size Section */}
        <section id="video-file-size-section" className="mb-12">
          <h2 className="text-2xl font-semibold text-green-300 mb-6 flex items-center">
            <HardDrive className="mr-3 h-7 w-7" /> Video File Size Estimator
          </h2>
          {renderCalcGroup(
            "Estimate File Size (Compressed)",
            HardDrive,
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {renderInputField(
                "fileSizeDurationMin",
                "Duration",
                fileSizeDurationMin,
                handleFileSizeDurationMinChange,
                "minutes",
                "60",
                Film,
                "0",
              )}
              {renderInputField(
                "fileSizeBitrateMbps",
                "Bitrate",
                fileSizeBitrateMbps,
                handleFileSizeBitrateMbpsChange,
                "Mbps",
                "10",
                Sigma,
                "0",
              )}
            </div>,
            [
              {
                label: "Estimated File Size (MB)",
                value: formatNumber(videoFileSizeMB, 2),
                unit: "MB",
              },
              {
                label: "Estimated File Size (GB)",
                value: formatNumber(videoFileSizeGB, 2),
                unit: "GB",
              },
            ].map((item) => renderOutputItem(item.label, item.value, item.unit)),
            !isNaN(numFileSizeDurationMin) && !isNaN(numFileSizeBitrateMbps),
          )}
        </section>

        {/* Screen Dimensions Section */}
        <section id="screen-dimensions-section" className="mb-12">
          <h2 className="text-2xl font-semibold text-green-300 mb-6 flex items-center">
            <Smartphone className="mr-3 h-7 w-7" /> Screen Dimensions
          </h2>
          {renderCalcGroup(
            "Diagonal Screen Size & Area",
            Smartphone,
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              {renderInputField(
                "diagWidth",
                "Width",
                diagWidth,
                handleDiagWidthChange,
                diagUnit,
                "27",
                Maximize,
                "0",
              )}
              {renderInputField(
                "diagHeight",
                "Height",
                diagHeight,
                handleDiagHeightChange,
                diagUnit,
                "15.1875",
                Maximize,
                "0",
              )}
              {renderSelectField(
                "diagUnit",
                "Unit",
                diagUnit,
                (e) => setDiagUnit(e.target.value as "inches" | "cm"),
                [
                  { value: "inches", label: "Inches" },
                  { value: "cm", label: "Centimeters" },
                ],
                Ruler,
              )}
            </div>,
            [
              { label: "Diagonal Size", value: formatNumber(screenDiagonal, 2), unit: diagUnit },
              { label: "Screen Area", value: formatNumber(screenArea, 2), unit: `sq. ${diagUnit}` },
            ].map((item) => renderOutputItem(item.label, item.value, item.unit)),
            !isNaN(numDiagWidth) && !isNaN(numDiagHeight),
          )}
          <hr className="border-gray-700 my-8" />
          {renderCalcGroup(
            "Pixels Per Inch (PPI)",
            Percent,
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              {renderInputField(
                "ppiResolutionWidth",
                "Resolution Width",
                ppiResolutionWidth,
                handlePpiResWidthChange,
                "pixels",
                "1920",
                Maximize,
                "1",
              )}
              {renderInputField(
                "ppiResolutionHeight",
                "Resolution Height",
                ppiResolutionHeight,
                handlePpiResHeightChange,
                "pixels",
                "1080",
                Maximize,
                "1",
              )}
              {renderInputField(
                "ppiDiagonalInches",
                "Diagonal Size",
                ppiDiagonalInches,
                handlePpiDiagInchesChange,
                "inches",
                "27",
                Smartphone,
                "0",
              )}
            </div>,
            [{ label: "Pixels Per Inch", value: formatNumber(ppiValue, 0), unit: "PPI" }].map(
              (item) => renderOutputItem(item.label, item.value, item.unit),
            ),
            !isNaN(numPpiResWidth) && !isNaN(numPpiResHeight) && !isNaN(numPpiDiagInches),
          )}
        </section>

        {/* Optimal Viewing Distance Section */}
        <section id="optimal-viewing-distance-section" className="mb-12">
          <h2 className="text-2xl font-semibold text-green-300 mb-6 flex items-center">
            <Eye className="mr-3 h-7 w-7" /> Optimal Viewing Distance
          </h2>
          {renderCalcGroup(
            "Calculate Viewing Distance",
            Eye,
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              {renderInputField(
                "ovdScreenDiagonal",
                "Screen Diagonal",
                ovdScreenDiagonal,
                handleOvdScreenDiagonalChange,
                ovdUnit,
                "55",
                Smartphone,
                "0",
              )}
              {renderSelectField(
                "ovdResolutionType",
                "Screen Resolution",
                ovdResolutionType,
                (e) => setOvdResolutionType(e.target.value),
                resolutionTypes,
                Tv,
              )}
              {renderSelectField(
                "ovdUnit",
                "Unit",
                ovdUnit,
                (e) => setOvdUnit(e.target.value as "inches" | "feet" | "cm" | "meters"),
                [
                  { value: "inches", label: "Inches" },
                  { value: "feet", label: "Feet" },
                  { value: "cm", label: "Centimeters" },
                  { value: "meters", label: "Meters" },
                ],
                Ruler,
              )}
            </div>,
            [
              {
                label: "Min Recommended Distance",
                value: formatNumber(ovdMinDistance, 1),
                unit: ovdUnit,
              },
              {
                label: "Max Recommended Distance",
                value: formatNumber(ovdMaxDistance, 1),
                unit: ovdUnit,
              },
            ].map((item) => renderOutputItem(item.label, item.value, item.unit)),
            !isNaN(numOvdScreenDiagonal),
          )}
        </section>

        {/* Projection Calculator Section */}
        <section id="projection-calculator-section" className="mb-12">
          <h2 className="text-2xl font-semibold text-green-300 mb-6 flex items-center">
            <Projector className="mr-3 h-7 w-7" /> Projection Calculator
          </h2>
          {renderCalcGroup(
            "Calculate Projection Parameters",
            Projector,
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {renderSelectField(
                "projKnownValueType",
                "Calculate For",
                projKnownValueType,
                (e) => setProjKnownValueType(e.target.value as "screenWidth" | "throwDistance"),
                [
                  { value: "throwDistance", label: "Throw Distance" },
                  { value: "screenWidth", label: "Screen Width" },
                ],
                Calculator,
              )}
              {renderInputField(
                "projKnownValue",
                projKnownValueType === "screenWidth"
                  ? "Known Screen Width"
                  : "Known Throw Distance",
                projKnownValue,
                handleProjKnownValueChange,
                projUnit,
                projKnownValueType === "screenWidth" ? "10" : "15",
                Ruler,
                "0",
              )}
              {renderInputField(
                "projThrowRatio",
                "Throw Ratio (e.g., 1.5 for 1.5:1)",
                projThrowRatio,
                handleProjThrowRatioChange,
                "",
                "1.5",
                Sigma,
                "0",
              )}
              {renderSelectField(
                "projUnit",
                "Unit",
                projUnit,
                (e) => setProjUnit(e.target.value as "feet" | "meters"),
                [
                  { value: "feet", label: "Feet" },
                  { value: "meters", label: "Meters" },
                ],
                Ruler,
              )}
            </div>,
            [
              {
                label: `Calculated ${projKnownValueType === "screenWidth" ? "Throw Distance" : "Screen Width"}`,
                value: formatNumber(projCalculatedValue, 2),
                unit: projUnit,
              },
            ].map((item) => renderOutputItem(item.label, item.value, item.unit)),
            !isNaN(numProjKnownValue) && !isNaN(numProjThrowRatio),
          )}
        </section>

        {/* Uncompressed Video Data Rate Section */}
        <section id="uncompressed-data-rate-section" className="mb-12">
          <h2 className="text-2xl font-semibold text-green-300 mb-6 flex items-center">
            <DatabaseZap className="mr-3 h-7 w-7" /> Uncompressed Video Data Rate
          </h2>
          {renderCalcGroup(
            "Estimate Uncompressed Data Rate",
            DatabaseZap,
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {renderInputField(
                "udrWidth",
                "Resolution Width",
                udrWidth,
                handleUdrWidthChange,
                "pixels",
                "1920",
                Maximize,
                "1",
              )}
              {renderInputField(
                "udrHeight",
                "Resolution Height",
                udrHeight,
                handleUdrHeightChange,
                "pixels",
                "1080",
                Maximize,
                "1",
              )}
              {renderInputField(
                "udrFrameRate",
                "Frame Rate",
                udrFrameRate,
                handleUdrFrameRateChange,
                "fps",
                "30",
                Film,
                "1",
              )}
              {renderSelectField(
                "udrBitDepth",
                "Bit Depth (per component)",
                udrBitDepth,
                (e) => setUdrBitDepth(Number(e.target.value)),
                commonBitDepths,
                Sigma,
              )}
              {renderInputField(
                "udrColorComponents",
                "Color Components (e.g., 3 for RGB)",
                udrColorComponents,
                handleUdrColorComponentsChange,
                "",
                "3",
                Sigma,
                "1",
              )}
            </div>,
            [
              {
                label: "Data Rate (Mbps)",
                value: formatNumber(uncompressedDataRateMbps, 2),
                unit: "Mbps",
              },
              {
                label: "Data Rate (MB/s)",
                value: formatNumber(uncompressedDataRateMBps, 2),
                unit: "MB/s",
              },
            ].map((item) => renderOutputItem(item.label, item.value, item.unit)),
            !isNaN(numUdrWidth) &&
              !isNaN(numUdrHeight) &&
              !isNaN(numUdrFrameRate) &&
              !isNaN(numUdrBitDepth) &&
              !isNaN(numUdrColorComponents),
          )}
        </section>

        {/* Flicker-Free Shutter Speed Section */}
        <section id="flicker-free-shutter-section" className="mb-12">
          <h2 className="text-2xl font-semibold text-green-300 mb-6 flex items-center">
            <Video className="mr-3 h-7 w-7" /> Flicker-Free Shutter Speed
          </h2>
          {renderCalcGroup(
            "Suggested Shutter Speeds",
            Video,
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {renderInputField(
                "lightSourceFreq",
                "Mains/Light Frequency",
                lightSourceFreq,
                handleLightSourceFreqChange,
                "Hz (e.g., 100 or 120 for AC)",
                "120",
                Zap,
                "0",
              )}
              {renderInputField(
                "pwmDimmingFreq",
                "LED PWM Frequency (Optional)",
                pwmDimmingFreq,
                handlePwmDimmingFreqChange,
                "Hz (if known)",
                "2000",
                Percent,
                "0",
              )}
            </div>,
            renderOutputList("Suggested Flicker-Safe Shutter Speeds", flickerFreeShutterSpeeds, ""),
            (!isNaN(numLightSourceFreq) ||
              (numPwmDimmingFreq !== null && !isNaN(numPwmDimmingFreq))) &&
              flickerFreeShutterSpeeds.length > 0,
            "Enter light source frequency. PWM frequency overrides if entered.",
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default VideoCategoryPage;
