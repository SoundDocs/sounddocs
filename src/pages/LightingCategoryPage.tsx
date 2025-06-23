{
      /*
      src/pages/LightingCategoryPage.tsx
      - Implemented various lighting formulas and calculators.
      - Formulas include: Lumens/Lux, Lux/Foot-candle, Inverse Square Law, Beam Diameter, DMX Channel Offset, Power Load, CCT Conversion, Luminous Efficacy, Candela to Lumens, Throw Distance for Min Lux, Lighting Energy Density, Gobo Projection Size.
      - REMOVED: Flicker-Free Shutter Speed (moved to VideoCategoryPage.tsx).
      - Styled with a yellow/orange theme.
      - Includes a back link to the main formula categories page.
      - Added py-1 to h1, h2 and h3 elements to prevent text clipping.
      */
    }
    import React, { useState, useMemo } from "react";
    import Header from "../components/Header";
    import Footer from "../components/Footer";
    import { Link as RouterLink } from "react-router-dom";
    import { 
      ArrowLeft, Lightbulb, Sun, Ruler, Maximize, Minimize, Sigma, Calculator, Zap, Network, Hash, Power, Percent, BarChartHorizontalBig, ScanLine, Thermometer, Sunrise, TrendingUp, Leaf, Disc3
      // Removed Video icon as it's no longer used here
    } from "lucide-react";

    const LightingCategoryPage: React.FC = () => {
      // Lumens & Lux
      const [lumens, setLumens] = useState<number | string>(1000);
      const [areaM2, setAreaM2] = useState<number | string>(10);
      const [luxForLumens, setLuxForLumens] = useState<number | string>(100);

      // Lux / Foot-candle Converter
      const [luxToFc, setLuxToFc] = useState<number | string>(100);
      const [fcToLux, setFcToLux] = useState<number | string>(10);

      // Inverse Square Law
      const [initialIlluminance, setInitialIlluminance] = useState<number | string>(1000);
      const [distance1, setDistance1] = useState<number | string>(1);
      const [distance2, setDistance2] = useState<number | string>(2);
      const [islUnit, setIslUnit] = useState<"lux" | "fc">("lux");

      // Beam Diameter
      const [beamAngle, setBeamAngle] = useState<number | string>(30);
      const [beamDistance, setBeamDistance] = useState<number | string>(5);
      const [beamUnit, setBeamUnit] = useState<"meters" | "feet">("meters");

      // DMX Channel Offset
      const [dmxStartAddress, setDmxStartAddress] = useState<number | string>(1);
      const [dmxChannelOffset, setDmxChannelOffset] = useState<number | string>(0);

      // Power Load
      const [powerPerFixture, setPowerPerFixture] = useState<number | string>(150);
      const [numberOfFixtures, setNumberOfFixtures] = useState<number | string>(10);

      // CCT Conversion
      const [kelvinToMired, setKelvinToMired] = useState<number | string>(5600);
      const [miredToKelvin, setMiredToKelvin] = useState<number | string>(178);

      // Luminous Efficacy
      const [efficacyLumens, setEfficacyLumens] = useState<number | string>(3000);
      const [efficacyWatts, setEfficacyWatts] = useState<number | string>(25);

      // Candela to Lumens
      const [candelaValue, setCandelaValue] = useState<number | string>(10000);
      const [candelaBeamAngle, setCandelaBeamAngle] = useState<number | string>(15);

      // Throw Distance for Min Lux
      const [throwCandela, setThrowCandela] = useState<number | string>(50000);
      const [minLuxTarget, setMinLuxTarget] = useState<number | string>(200);
      const [throwDistanceUnit, setThrowDistanceUnit] = useState<"meters" | "feet">("meters");

      // Lighting Energy Density
      const [totalPowerWatts, setTotalPowerWatts] = useState<number | string>(1000);
      const [totalAreaSq, setTotalAreaSq] = useState<number | string>(100);
      const [energyDensityUnit, setEnergyDensityUnit] = useState<"m2" | "ft2">("m2");

      // Gobo Projection Size
      const [goboDiameter, setGoboDiameter] = useState<number | string>(50); // mm
      const [lensFocalLength, setLensFocalLength] = useState<number | string>(150); // mm
      const [projectionDistance, setProjectionDistance] = useState<number | string>(5); // meters
      const [goboUnits, setGoboUnits] = useState<"mm" | "inches">("mm");
      const [projectionSizeUnit, setProjectionSizeUnit] = useState<"meters" | "feet">("meters");

      // --- Calculations ---

      // Lumens & Lux
      const numLumens = useMemo(() => typeof lumens === 'number' && lumens > 0 ? lumens : NaN, [lumens]);
      const numAreaM2 = useMemo(() => typeof areaM2 === 'number' && areaM2 > 0 ? areaM2 : NaN, [areaM2]);
      const numLuxForLumens = useMemo(() => typeof luxForLumens === 'number' && luxForLumens > 0 ? luxForLumens : NaN, [luxForLumens]);

      const calculatedLux = useMemo(() => (!isNaN(numLumens) && !isNaN(numAreaM2)) ? numLumens / numAreaM2 : NaN, [numLumens, numAreaM2]);
      const calculatedLumens = useMemo(() => (!isNaN(numLuxForLumens) && !isNaN(numAreaM2)) ? numLuxForLumens * numAreaM2 : NaN, [numLuxForLumens, numAreaM2]);

      // Lux / Foot-candle Converter
      const numLuxToFc = useMemo(() => typeof luxToFc === 'number' && luxToFc >= 0 ? luxToFc : NaN, [luxToFc]);
      const numFcToLux = useMemo(() => typeof fcToLux === 'number' && fcToLux >= 0 ? fcToLux : NaN, [fcToLux]);
      const LUX_TO_FC_FACTOR = 10.7639;
      const calculatedFc = useMemo(() => !isNaN(numLuxToFc) ? numLuxToFc / LUX_TO_FC_FACTOR : NaN, [numLuxToFc]);
      const calculatedLuxFromFc = useMemo(() => !isNaN(numFcToLux) ? numFcToLux * LUX_TO_FC_FACTOR : NaN, [numFcToLux]);

      // Inverse Square Law
      const numInitialIlluminance = useMemo(() => typeof initialIlluminance === 'number' && initialIlluminance > 0 ? initialIlluminance : NaN, [initialIlluminance]);
      const numDistance1 = useMemo(() => typeof distance1 === 'number' && distance1 > 0 ? distance1 : NaN, [distance1]);
      const numDistance2 = useMemo(() => typeof distance2 === 'number' && distance2 > 0 ? distance2 : NaN, [distance2]);
      const illuminanceAtD2 = useMemo(() => {
        if (!isNaN(numInitialIlluminance) && !isNaN(numDistance1) && !isNaN(numDistance2)) {
          return numInitialIlluminance * Math.pow(numDistance1 / numDistance2, 2);
        }
        return NaN;
      }, [numInitialIlluminance, numDistance1, numDistance2]);

      // Beam Diameter
      const numBeamAngle = useMemo(() => typeof beamAngle === 'number' && beamAngle > 0 && beamAngle < 180 ? beamAngle : NaN, [beamAngle]);
      const numBeamDistance = useMemo(() => typeof beamDistance === 'number' && beamDistance > 0 ? beamDistance : NaN, [beamDistance]);
      const calculatedBeamDiameter = useMemo(() => {
        if (!isNaN(numBeamAngle) && !isNaN(numBeamDistance)) {
          return 2 * numBeamDistance * Math.tan((numBeamAngle * Math.PI / 180) / 2);
        }
        return NaN;
      }, [numBeamAngle, numBeamDistance]);

      // DMX Channel Offset
      const numDmxStartAddress = useMemo(() => typeof dmxStartAddress === 'number' && dmxStartAddress >= 1 && dmxStartAddress <= 512 ? dmxStartAddress : NaN, [dmxStartAddress]);
      const numDmxChannelOffset = useMemo(() => typeof dmxChannelOffset === 'number' && dmxChannelOffset >= 0 ? dmxChannelOffset : NaN, [dmxChannelOffset]);
      const absoluteDmxAddress = useMemo(() => {
        if (!isNaN(numDmxStartAddress) && !isNaN(numDmxChannelOffset)) {
          const addr = numDmxStartAddress + numDmxChannelOffset;
          return addr <= 512 ? addr : NaN; 
        }
        return NaN;
      }, [numDmxStartAddress, numDmxChannelOffset]);

      // Power Load
      const numPowerPerFixture = useMemo(() => typeof powerPerFixture === 'number' && powerPerFixture > 0 ? powerPerFixture : NaN, [powerPerFixture]);
      const numNumberOfFixtures = useMemo(() => typeof numberOfFixtures === 'number' && numberOfFixtures > 0 && Number.isInteger(numberOfFixtures) ? numberOfFixtures : NaN, [numberOfFixtures]);
      const totalPowerLoad = useMemo(() => (!isNaN(numPowerPerFixture) && !isNaN(numNumberOfFixtures)) ? numPowerPerFixture * numNumberOfFixtures : NaN, [numPowerPerFixture, numNumberOfFixtures]);
      const totalAmps120V = useMemo(() => !isNaN(totalPowerLoad) ? totalPowerLoad / 120 : NaN, [totalPowerLoad]);
      const totalAmps230V = useMemo(() => !isNaN(totalPowerLoad) ? totalPowerLoad / 230 : NaN, [totalPowerLoad]);

      // CCT Conversion
      const numKelvinToMired = useMemo(() => typeof kelvinToMired === 'number' && kelvinToMired > 0 ? kelvinToMired : NaN, [kelvinToMired]);
      const numMiredToKelvin = useMemo(() => typeof miredToKelvin === 'number' && miredToKelvin > 0 ? miredToKelvin : NaN, [miredToKelvin]);
      const calculatedMired = useMemo(() => !isNaN(numKelvinToMired) ? 1000000 / numKelvinToMired : NaN, [numKelvinToMired]);
      const calculatedKelvinFromMired = useMemo(() => !isNaN(numMiredToKelvin) ? 1000000 / numMiredToKelvin : NaN, [numMiredToKelvin]);

      // Luminous Efficacy
      const numEfficacyLumens = useMemo(() => typeof efficacyLumens === 'number' && efficacyLumens > 0 ? efficacyLumens : NaN, [efficacyLumens]);
      const numEfficacyWatts = useMemo(() => typeof efficacyWatts === 'number' && efficacyWatts > 0 ? efficacyWatts : NaN, [efficacyWatts]);
      const calculatedEfficacy = useMemo(() => (!isNaN(numEfficacyLumens) && !isNaN(numEfficacyWatts)) ? numEfficacyLumens / numEfficacyWatts : NaN, [numEfficacyLumens, numEfficacyWatts]);

      // Candela to Lumens
      const numCandelaValue = useMemo(() => typeof candelaValue === 'number' && candelaValue > 0 ? candelaValue : NaN, [candelaValue]);
      const numCandelaBeamAngle = useMemo(() => typeof candelaBeamAngle === 'number' && candelaBeamAngle > 0 && candelaBeamAngle < 360 ? candelaBeamAngle : NaN, [candelaBeamAngle]);
      const calculatedLumensFromCandela = useMemo(() => {
        if (!isNaN(numCandelaValue) && !isNaN(numCandelaBeamAngle)) {
          const beamAngleRadians = numCandelaBeamAngle * (Math.PI / 180);
          return numCandelaValue * (2 * Math.PI * (1 - Math.cos(beamAngleRadians / 2)));
        }
        return NaN;
      }, [numCandelaValue, numCandelaBeamAngle]);

      // Throw Distance for Min Lux
      const numThrowCandela = useMemo(() => typeof throwCandela === 'number' && throwCandela > 0 ? throwCandela : NaN, [throwCandela]);
      const numMinLuxTarget = useMemo(() => typeof minLuxTarget === 'number' && minLuxTarget > 0 ? minLuxTarget : NaN, [minLuxTarget]);
      const calculatedThrowDistance = useMemo(() => {
        if (!isNaN(numThrowCandela) && !isNaN(numMinLuxTarget)) {
          let distance = Math.sqrt(numThrowCandela / numMinLuxTarget);
          if (throwDistanceUnit === 'feet') {
            distance *= 3.28084; // Convert meters to feet
          }
          return distance;
        }
        return NaN;
      }, [numThrowCandela, numMinLuxTarget, throwDistanceUnit]);

      // Lighting Energy Density
      const numTotalPowerWatts = useMemo(() => typeof totalPowerWatts === 'number' && totalPowerWatts > 0 ? totalPowerWatts : NaN, [totalPowerWatts]);
      const numTotalAreaSq = useMemo(() => typeof totalAreaSq === 'number' && totalAreaSq > 0 ? totalAreaSq : NaN, [totalAreaSq]);
      const calculatedEnergyDensity = useMemo(() => {
        if (!isNaN(numTotalPowerWatts) && !isNaN(numTotalAreaSq)) {
          return numTotalPowerWatts / numTotalAreaSq;
        }
        return NaN;
      }, [numTotalPowerWatts, numTotalAreaSq]);

      // Gobo Projection Size
      const numGoboDiameter = useMemo(() => {
        let val = typeof goboDiameter === 'number' && goboDiameter > 0 ? goboDiameter : NaN;
        if (!isNaN(val) && goboUnits === 'inches') val *= 25.4; // convert inches to mm
        return val;
      }, [goboDiameter, goboUnits]);
      const numLensFocalLength = useMemo(() => typeof lensFocalLength === 'number' && lensFocalLength > 0 ? lensFocalLength : NaN, [lensFocalLength]);
      const numProjectionDistance = useMemo(() => typeof projectionDistance === 'number' && projectionDistance > 0 ? projectionDistance : NaN, [projectionDistance]);

      const calculatedGoboProjectionSize = useMemo(() => {
        if (!isNaN(numGoboDiameter) && !isNaN(numLensFocalLength) && !isNaN(numProjectionDistance)) {
          const goboDiameterM = numGoboDiameter / 1000;
          const focalLengthM = numLensFocalLength / 1000;
          let sizeM = (goboDiameterM / focalLengthM) * numProjectionDistance;
          
          if (projectionSizeUnit === 'feet') {
            sizeM *= 3.28084; // Convert meters to feet
          }
          return sizeM;
        }
        return NaN;
      }, [numGoboDiameter, numLensFocalLength, numProjectionDistance, projectionSizeUnit]);
      

      // --- Input Handlers ---
      const handleSimpleNumberChange = (setter: React.Dispatch<React.SetStateAction<number | string>>, allowZero: boolean = false, allowFloat: boolean = true, isInteger: boolean = false) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value === "") { setter(value); return; }
        const numValue = isInteger ? parseInt(value, 10) : parseFloat(value);

        if (!isNaN(numValue)) {
          if (!allowZero && numValue <= 0 && value !== "0.") { /* Do nothing */ }
          else if (isInteger && !Number.isInteger(numValue) && value !== "" && !value.endsWith(".")) { /* Do nothing for non-integers if integer expected */ }
          else { setter(numValue); }
        } else if (value.endsWith(".") && allowFloat && !isInteger) { setter(value); }
      };

      const handleLumensChange = handleSimpleNumberChange(setLumens, false, true);
      const handleAreaM2Change = handleSimpleNumberChange(setAreaM2, false, true);
      const handleLuxForLumensChange = handleSimpleNumberChange(setLuxForLumens, false, true);
      const handleLuxToFcChange = handleSimpleNumberChange(setLuxToFc, true, true);
      const handleFcToLuxChange = handleSimpleNumberChange(setFcToLux, true, true);
      const handleInitialIlluminanceChange = handleSimpleNumberChange(setInitialIlluminance, false, true);
      const handleDistance1Change = handleSimpleNumberChange(setDistance1, false, true);
      const handleDistance2Change = handleSimpleNumberChange(setDistance2, false, true);
      const handleBeamAngleChange = handleSimpleNumberChange(setBeamAngle, false, true);
      const handleBeamDistanceChange = handleSimpleNumberChange(setBeamDistance, false, true);
      const handleDmxStartAddressChange = handleSimpleNumberChange(setDmxStartAddress, false, false, true);
      const handleDmxChannelOffsetChange = handleSimpleNumberChange(setDmxChannelOffset, true, false, true);
      const handlePowerPerFixtureChange = handleSimpleNumberChange(setPowerPerFixture, false, true);
      const handleNumberOfFixturesChange = handleSimpleNumberChange(setNumberOfFixtures, false, false, true);

      const handleKelvinToMiredChange = handleSimpleNumberChange(setKelvinToMired, false, true);
      const handleMiredToKelvinChange = handleSimpleNumberChange(setMiredToKelvin, false, true);
      const handleEfficacyLumensChange = handleSimpleNumberChange(setEfficacyLumens, false, true);
      const handleEfficacyWattsChange = handleSimpleNumberChange(setEfficacyWatts, false, true);
      const handleCandelaValueChange = handleSimpleNumberChange(setCandelaValue, false, true);
      const handleCandelaBeamAngleChange = handleSimpleNumberChange(setCandelaBeamAngle, false, true);
      const handleThrowCandelaChange = handleSimpleNumberChange(setThrowCandela, false, true);
      const handleMinLuxTargetChange = handleSimpleNumberChange(setMinLuxTarget, false, true);

      const handleTotalPowerWattsChange = handleSimpleNumberChange(setTotalPowerWatts, false, true);
      const handleTotalAreaSqChange = handleSimpleNumberChange(setTotalAreaSq, false, true);
      const handleGoboDiameterChange = handleSimpleNumberChange(setGoboDiameter, false, true);
      const handleLensFocalLengthChange = handleSimpleNumberChange(setLensFocalLength, false, true);
      const handleProjectionDistanceChange = handleSimpleNumberChange(setProjectionDistance, false, true);


      // --- Formatting & Rendering ---
      const formatNumber = (num: number | string, precision: number = 2): string => {
        if (typeof num === 'string') {
          if (num === "") return num;
          const parsed = parseFloat(num);
          if (isNaN(parsed) || !isFinite(parsed)) return "N/A";
          return parsed.toFixed(precision);
        }
        if (isNaN(num) || !isFinite(num)) return "N/A";
        return num.toFixed(precision);
      };

      const renderCalcGroup = (title: string, icon: React.ElementType, inputs: React.ReactNode, outputs: React.ReactNode, condition: boolean = true, errorMsg: string = "Please enter valid positive inputs.") => (
        <div className="mb-8 bg-gray-800 p-6 sm:p-8 rounded-xl shadow-xl border border-yellow-700/30">
          <h3 className="text-xl font-semibold text-yellow-300 mb-4 flex items-center py-1">
            {React.createElement(icon, { className: "mr-2 h-6 w-6" })} {title}
          </h3>
          {inputs}
          {condition ? (
            outputs && (
              <div>
                <h4 className="text-lg font-medium text-yellow-200 mb-3 mt-4">Calculated Values:</h4>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {outputs}
                </div>
              </div>
            )
          ) : (
            <p className="text-orange-400 text-center bg-orange-900/30 p-3 rounded-md mt-4">{errorMsg}</p>
          )}
        </div>
      );

      const renderOutputItem = (label: string, value: string, unit: string) => (
        <div key={label} className="bg-gray-700/70 p-4 rounded-md shadow">
          <p className="text-xs text-yellow-300">{label}</p>
          <p className="text-xl font-bold text-white">
            {value} <span className="text-sm font-normal text-gray-400">{unit}</span>
          </p>
        </div>
      );
      
      const renderInputField = (id: string, label: string, value: string | number, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, unit?: string, placeholder?: string, icon?: React.ElementType, min?: string, max?: string, step?: string) => (
        <div>
          <label htmlFor={id} className="block text-sm font-medium text-yellow-300 mb-2">
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
              className={`bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:ring-yellow-500 focus:border-yellow-500 block w-full ${icon ? 'pl-10' : 'pl-4'} pr-4 py-2.5 rounded-md shadow-sm text-lg`}
              placeholder={placeholder || `e.g., ${typeof value === 'number' ? value : '10'}`}
              min={min}
              max={max}
              step={step || (min === "0" || (typeof value === 'string' && value.includes('.')) || (typeof value === 'number' && !Number.isInteger(value)) ? "any" : "1")}
            />
          </div>
        </div>
      );
      
      const renderSelectField = (id: string, label: string, value: string | number, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, options: {value: string | number, label: string}[], icon?: React.ElementType) => (
        <div>
          <label htmlFor={id} className="block text-sm font-medium text-yellow-300 mb-2">{label}</label>
          <div className="relative">
            {icon && <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {React.createElement(icon, { className: "h-5 w-5 text-gray-400", "aria-hidden": true })}
            </div>}
            <select 
              id={id} 
              name={id} 
              value={value} 
              onChange={onChange} 
              className={`bg-gray-700 border border-gray-600 text-white focus:ring-yellow-500 focus:border-yellow-500 block w-full ${icon ? 'pl-10' : 'pl-4'} pr-8 py-2.5 rounded-md shadow-sm text-lg appearance-none`}
            >
              {options.map(opt => <option key={opt.value} value={opt.value} className="bg-gray-800 text-white">{opt.label}</option>)}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.23 8.29a.75.75 0 01.02-1.06z" clipRule="evenodd" />
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
                className="inline-flex items-center text-yellow-400 hover:text-yellow-300 transition-colors duration-200 group"
              >
                <ArrowLeft className="mr-2 h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                Back to Formula Categories
              </RouterLink>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-12 text-center text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 py-1">
              Lighting Formulas & Calculators
            </h1>

            {/* Lumens & Lux Section */}
            <section id="lumens-lux-section" className="mb-12">
              <h2 className="text-2xl font-semibold text-yellow-300 mb-6 flex items-center py-1">
                <Lightbulb className="mr-3 h-7 w-7" /> Lumens & Lux
              </h2>
              {renderCalcGroup("Calculate Lux from Lumens", Sun,
                (<div className="grid md:grid-cols-2 gap-6 mb-6">
                  {renderInputField("lumens", "Total Lumens (lm)", lumens, handleLumensChange, "lm", "1000", Lightbulb, "0")}
                  {renderInputField("areaM2", "Surface Area (m²)", areaM2, handleAreaM2Change, "m²", "10", Maximize, "0")}
                </div>),
                [
                  { label: "Illuminance", value: formatNumber(calculatedLux), unit: "lux" },
                ].map(item => renderOutputItem(item.label, item.value, item.unit)),
                !isNaN(numLumens) && !isNaN(numAreaM2)
              )}
              <hr className="border-gray-700 my-8" />
              {renderCalcGroup("Calculate Lumens from Lux", Lightbulb,
                (<div className="grid md:grid-cols-2 gap-6 mb-6">
                  {renderInputField("luxForLumens", "Illuminance (lux)", luxForLumens, handleLuxForLumensChange, "lux", "100", Sun, "0")}
                  {renderInputField("areaM2ForLumens", "Surface Area (m²)", areaM2, handleAreaM2Change, "m²", "10", Maximize, "0")}
                </div>),
                [
                  { label: "Total Lumens", value: formatNumber(calculatedLumens), unit: "lm" },
                ].map(item => renderOutputItem(item.label, item.value, item.unit)),
                !isNaN(numLuxForLumens) && !isNaN(numAreaM2)
              )}
            </section>

            {/* Lux / Foot-candle Converter Section */}
            <section id="lux-fc-converter-section" className="mb-12">
              <h2 className="text-2xl font-semibold text-yellow-300 mb-6 flex items-center py-1">
                <Ruler className="mr-3 h-7 w-7" /> Lux / Foot-candle Converter
              </h2>
              {renderCalcGroup("Lux to Foot-candles", Calculator,
                (<div className="grid md:grid-cols-1 gap-6 mb-6">
                  {renderInputField("luxToFc", "Illuminance (lux)", luxToFc, handleLuxToFcChange, "lux", "100", Sun, "0")}
                </div>),
                [
                  { label: "Illuminance", value: formatNumber(calculatedFc, 3), unit: "fc" },
                ].map(item => renderOutputItem(item.label, item.value, item.unit)),
                !isNaN(numLuxToFc)
              )}
              <hr className="border-gray-700 my-8" />
              {renderCalcGroup("Foot-candles to Lux", Calculator,
                (<div className="grid md:grid-cols-1 gap-6 mb-6">
                  {renderInputField("fcToLux", "Illuminance (fc)", fcToLux, handleFcToLuxChange, "fc", "10", Ruler, "0")}
                </div>),
                [
                  { label: "Illuminance", value: formatNumber(calculatedLuxFromFc, 3), unit: "lux" },
                ].map(item => renderOutputItem(item.label, item.value, item.unit)),
                !isNaN(numFcToLux)
              )}
            </section>

            {/* Inverse Square Law Section */}
            <section id="inverse-square-law-section" className="mb-12">
              <h2 className="text-2xl font-semibold text-yellow-300 mb-6 flex items-center py-1">
                <BarChartHorizontalBig className="mr-3 h-7 w-7" /> Inverse Square Law for Light
              </h2>
              {renderCalcGroup("Illuminance Change with Distance", BarChartHorizontalBig,
                (<div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                  {renderInputField("initialIlluminance", "Initial Illuminance", initialIlluminance, handleInitialIlluminanceChange, islUnit, "1000", Sun, "0")}
                  {renderInputField("distance1", "Distance 1", distance1, handleDistance1Change, "units", "1", Ruler, "0")}
                  {renderInputField("distance2", "Distance 2", distance2, handleDistance2Change, "units", "2", Ruler, "0")}
                  {renderSelectField("islUnit", "Illuminance Unit", islUnit, (e) => setIslUnit(e.target.value as "lux" | "fc"), 
                    [{value: "lux", label: "Lux"}, {value: "fc", label: "Foot-candles"}], Percent)}
                </div>),
                [
                  { label: `Illuminance at Distance 2`, value: formatNumber(illuminanceAtD2), unit: islUnit },
                ].map(item => renderOutputItem(item.label, item.value, item.unit)),
                !isNaN(numInitialIlluminance) && !isNaN(numDistance1) && !isNaN(numDistance2)
              )}
            </section>

            {/* Beam Diameter Section */}
            <section id="beam-diameter-section" className="mb-12">
              <h2 className="text-2xl font-semibold text-yellow-300 mb-6 flex items-center py-1">
                <ScanLine className="mr-3 h-7 w-7" /> Beam Diameter Calculator
              </h2>
              {renderCalcGroup("Calculate Beam Diameter", ScanLine,
                (<div className="grid md:grid-cols-3 gap-6 mb-6">
                  {renderInputField("beamAngle", "Beam Angle", beamAngle, handleBeamAngleChange, "degrees", "30", Percent, "1", "179")}
                  {renderInputField("beamDistance", "Distance to Surface", beamDistance, handleBeamDistanceChange, beamUnit, "5", Ruler, "0")}
                  {renderSelectField("beamUnit", "Distance Unit", beamUnit, (e) => setBeamUnit(e.target.value as "meters" | "feet"), 
                    [{value: "meters", label: "Meters"}, {value: "feet", label: "Feet"}], Ruler)}
                </div>),
                [
                  { label: "Beam Diameter", value: formatNumber(calculatedBeamDiameter), unit: beamUnit },
                ].map(item => renderOutputItem(item.label, item.value, item.unit)),
                !isNaN(numBeamAngle) && !isNaN(numBeamDistance)
              )}
            </section>

            {/* CCT Conversion Section */}
            <section id="cct-conversion-section" className="mb-12">
              <h2 className="text-2xl font-semibold text-yellow-300 mb-6 flex items-center py-1">
                <Thermometer className="mr-3 h-7 w-7" /> Color Temperature Conversion
              </h2>
              {renderCalcGroup("Kelvin to MIRED", Thermometer,
                (<div className="grid md:grid-cols-1 gap-6 mb-6">
                  {renderInputField("kelvinToMired", "Color Temperature (Kelvin)", kelvinToMired, handleKelvinToMiredChange, "K", "5600", Thermometer, "0")}
                </div>),
                [
                  { label: "MIRED Value", value: formatNumber(calculatedMired, 0), unit: "MIRED" },
                ].map(item => renderOutputItem(item.label, item.value, item.unit)),
                !isNaN(numKelvinToMired)
              )}
              <hr className="border-gray-700 my-8" />
              {renderCalcGroup("MIRED to Kelvin", Thermometer,
                (<div className="grid md:grid-cols-1 gap-6 mb-6">
                  {renderInputField("miredToKelvin", "MIRED Value", miredToKelvin, handleMiredToKelvinChange, "MIRED", "178", Thermometer, "0")}
                </div>),
                [
                  { label: "Color Temperature", value: formatNumber(calculatedKelvinFromMired, 0), unit: "K" },
                ].map(item => renderOutputItem(item.label, item.value, item.unit)),
                !isNaN(numMiredToKelvin)
              )}
            </section>

            {/* Luminous Efficacy Section */}
            <section id="luminous-efficacy-section" className="mb-12">
              <h2 className="text-2xl font-semibold text-yellow-300 mb-6 flex items-center py-1">
                <TrendingUp className="mr-3 h-7 w-7" /> Luminous Efficacy
              </h2>
              {renderCalcGroup("Calculate Luminous Efficacy", TrendingUp,
                (<div className="grid md:grid-cols-2 gap-6 mb-6">
                  {renderInputField("efficacyLumens", "Total Lumens (lm)", efficacyLumens, handleEfficacyLumensChange, "lm", "3000", Lightbulb, "0")}
                  {renderInputField("efficacyWatts", "Total Power (Watts)", efficacyWatts, handleEfficacyWattsChange, "W", "25", Zap, "0")}
                </div>),
                [
                  { label: "Luminous Efficacy", value: formatNumber(calculatedEfficacy), unit: "lm/W" },
                ].map(item => renderOutputItem(item.label, item.value, item.unit)),
                !isNaN(numEfficacyLumens) && !isNaN(numEfficacyWatts)
              )}
            </section>

            {/* Candela to Lumens Section */}
            <section id="candela-lumens-section" className="mb-12">
              <h2 className="text-2xl font-semibold text-yellow-300 mb-6 flex items-center py-1">
                <Sunrise className="mr-3 h-7 w-7" /> Candela to Lumens Converter
              </h2>
              {renderCalcGroup("Calculate Lumens from Candela & Beam Angle", Sunrise,
                (<div className="grid md:grid-cols-2 gap-6 mb-6">
                  {renderInputField("candelaValue", "Luminous Intensity (cd)", candelaValue, handleCandelaValueChange, "cd", "10000", Sunrise, "0")}
                  {renderInputField("candelaBeamAngle", "Beam Angle (degrees)", candelaBeamAngle, handleCandelaBeamAngleChange, "°", "15", Percent, "1", "359")}
                </div>),
                [
                  { label: "Luminous Flux", value: formatNumber(calculatedLumensFromCandela), unit: "lm" },
                ].map(item => renderOutputItem(item.label, item.value, item.unit)),
                !isNaN(numCandelaValue) && !isNaN(numCandelaBeamAngle)
              )}
            </section>

            {/* Throw Distance for Minimum Lux Section */}
            <section id="throw-distance-section" className="mb-12">
              <h2 className="text-2xl font-semibold text-yellow-300 mb-6 flex items-center py-1">
                <Maximize className="mr-3 h-7 w-7" /> Throw Distance for Minimum Lux
              </h2>
              {renderCalcGroup("Calculate Max Throw Distance", Maximize,
                (<div className="grid md:grid-cols-3 gap-6 mb-6">
                  {renderInputField("throwCandela", "Luminous Intensity (cd)", throwCandela, handleThrowCandelaChange, "cd", "50000", Sunrise, "0")}
                  {renderInputField("minLuxTarget", "Desired Minimum Illuminance (lux)", minLuxTarget, handleMinLuxTargetChange, "lux", "200", Sun, "0")}
                  {renderSelectField("throwDistanceUnit", "Distance Unit", throwDistanceUnit, (e) => setThrowDistanceUnit(e.target.value as "meters" | "feet"), 
                    [{value: "meters", label: "Meters"}, {value: "feet", label: "Feet"}], Ruler)}
                </div>),
                [
                  { label: "Max Throw Distance", value: formatNumber(calculatedThrowDistance), unit: throwDistanceUnit },
                ].map(item => renderOutputItem(item.label, item.value, item.unit)),
                !isNaN(numThrowCandela) && !isNaN(numMinLuxTarget)
              )}
            </section>
            
            {/* Lighting Energy Density Section */}
            <section id="energy-density-section" className="mb-12">
              <h2 className="text-2xl font-semibold text-yellow-300 mb-6 flex items-center py-1">
                <Leaf className="mr-3 h-7 w-7" /> Lighting Energy Density
              </h2>
              {renderCalcGroup("Calculate Watts per Area", Leaf,
                (<div className="grid md:grid-cols-3 gap-6 mb-6">
                  {renderInputField("totalPowerWatts", "Total Lighting Power", totalPowerWatts, handleTotalPowerWattsChange, "Watts", "1000", Zap, "0")}
                  {renderInputField("totalAreaSq", "Total Area", totalAreaSq, handleTotalAreaSqChange, energyDensityUnit === "m2" ? "m²" : "ft²", "100", Maximize, "0")}
                  {renderSelectField("energyDensityUnit", "Area Unit", energyDensityUnit, (e) => setEnergyDensityUnit(e.target.value as "m2" | "ft2"),
                    [{value: "m2", label: "Square Meters (m²)"}, {value: "ft2", label: "Square Feet (ft²)"}], Maximize)}
                </div>),
                [
                  { label: "Energy Density", value: formatNumber(calculatedEnergyDensity), unit: `W/${energyDensityUnit}` },
                ].map(item => renderOutputItem(item.label, item.value, item.unit)),
                !isNaN(numTotalPowerWatts) && !isNaN(numTotalAreaSq)
              )}
            </section>

            {/* Gobo Projection Size Section */}
            <section id="gobo-projection-section" className="mb-12">
              <h2 className="text-2xl font-semibold text-yellow-300 mb-6 flex items-center py-1">
                <Disc3 className="mr-3 h-7 w-7" /> Gobo Projection Size
              </h2>
              {renderCalcGroup("Estimate Projection Size", Disc3,
                (<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                  {renderInputField("goboDiameter", "Gobo Image Diameter", goboDiameter, handleGoboDiameterChange, goboUnits, "50", Disc3, "0")}
                  {renderSelectField("goboUnits", "Gobo Diameter Unit", goboUnits, (e) => setGoboUnits(e.target.value as "mm" | "inches"),
                    [{value: "mm", label: "Millimeters (mm)"}, {value: "inches", label: "Inches"}], Ruler)}
                  {renderInputField("lensFocalLength", "Lens Focal Length", lensFocalLength, handleLensFocalLengthChange, "mm", "150", Percent, "0")}
                  {renderInputField("projectionDistance", "Projection Distance", projectionDistance, handleProjectionDistanceChange, "meters", "5", Ruler, "0")}
                  {renderSelectField("projectionSizeUnit", "Output Projection Size Unit", projectionSizeUnit, (e) => setProjectionSizeUnit(e.target.value as "meters" | "feet"),
                    [{value: "meters", label: "Meters"}, {value: "feet", label: "Feet"}], Maximize)}
                </div>),
                [
                  { label: "Projected Image Diameter", value: formatNumber(calculatedGoboProjectionSize), unit: projectionSizeUnit },
                ].map(item => renderOutputItem(item.label, item.value, item.unit)),
                !isNaN(numGoboDiameter) && !isNaN(numLensFocalLength) && !isNaN(numProjectionDistance)
              )}
            </section>

            {/* DMX Channel Offset Section */}
            <section id="dmx-offset-section" className="mb-12">
              <h2 className="text-2xl font-semibold text-yellow-300 mb-6 flex items-center py-1">
                <Network className="mr-3 h-7 w-7" /> DMX Channel Offset Calculator
              </h2>
              {renderCalcGroup("Calculate Absolute DMX Address", Network,
                (<div className="grid md:grid-cols-2 gap-6 mb-6">
                  {renderInputField("dmxStartAddress", "Fixture Start Address", dmxStartAddress, handleDmxStartAddressChange, "", "1", Hash, "1", "512", "1")}
                  {renderInputField("dmxChannelOffset", "Channel Offset (0-indexed)", dmxChannelOffset, handleDmxChannelOffsetChange, "", "0", Sigma, "0", "511", "1")}
                </div>),
                [
                  { label: "Absolute DMX Address", value: formatNumber(absoluteDmxAddress, 0), unit: "" },
                ].map(item => renderOutputItem(item.label, item.value, item.unit)),
                !isNaN(numDmxStartAddress) && !isNaN(numDmxChannelOffset) && absoluteDmxAddress <= 512,
                "Start address must be 1-512. Offset must be non-negative. Resulting address must not exceed 512."
              )}
            </section>

            {/* Power Load Section */}
            <section id="power-load-section" className="mb-12">
              <h2 className="text-2xl font-semibold text-yellow-300 mb-6 flex items-center py-1">
                <Power className="mr-3 h-7 w-7" /> Lighting Power Load Calculator
              </h2>
              {renderCalcGroup("Estimate Total Power Load", Power,
                (<div className="grid md:grid-cols-2 gap-6 mb-6">
                  {renderInputField("powerPerFixture", "Power per Fixture", powerPerFixture, handlePowerPerFixtureChange, "Watts", "150", Zap, "0")}
                  {renderInputField("numberOfFixtures", "Number of Fixtures", numberOfFixtures, handleNumberOfFixturesChange, "", "10", Hash, "1", undefined, "1")}
                </div>),
                [
                  { label: "Total Power Load", value: formatNumber(totalPowerLoad, 0), unit: "Watts" },
                  { label: "Total Current (120V)", value: formatNumber(totalAmps120V, 2), unit: "Amps" },
                  { label: "Total Current (230V)", value: formatNumber(totalAmps230V, 2), unit: "Amps" },
                ].map(item => renderOutputItem(item.label, item.value, item.unit)),
                !isNaN(numPowerPerFixture) && !isNaN(numNumberOfFixtures)
              )}
            </section>

          </main>
          <Footer />
        </div>
      );
    };

    export default LightingCategoryPage;
