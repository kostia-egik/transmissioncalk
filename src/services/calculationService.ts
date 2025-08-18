

import { EngineParams, StageCalculationData, FinalCalculationResults, GearType, ModuleSpecificInputs, GearInputParams, ChainInputParams, PlanetaryInputParams, PlanetaryShaftType, RotationDirection, CalculationOutput, CascadeValues, ModuleCalculationData, ToothedBeltInputParams, BeltInputParams, BevelGearInputParams, BevelGearConfigType, WormGearInputParams, ShaftOrientation, WormGearConfigType, PlanetaryConfig, PLANETARY_CONFIG_MAP } from '../types';

// Helper to parse numeric input robustly
const parseNumeric = (value: string | number | undefined): number | null => {
  if (value === undefined || value === null || String(value).trim() === '') return null;
  const strValue = String(value).replace(',', '.');
  const num = parseFloat(strValue);
  return isNaN(num) ? null : num;
};

export const calculateSingleModule = (
    moduleType: GearType, 
    inputs: ModuleSpecificInputs, 
    inDirection: RotationDirection,
    inShaftOrientation: ShaftOrientation
): CalculationOutput => {
  
  let u = 0;
  const output: Partial<CalculationOutput> = {};
  output.outDirection = inDirection; 
  output.outOrientation = inShaftOrientation; // Default: maintain orientation

  switch (moduleType) {
    case GearType.Gear: {
      const { z1: z1Str, z2: z2Str, m: mStr } = inputs as GearInputParams;
      const z1 = parseNumeric(z1Str);
      const z2 = parseNumeric(z2Str);
      const m = parseNumeric(mStr);

      if (z1 === null || z2 === null || m === null) return { u: 0, error: "Не все поля (z1, z2, m) заполнены или некорректны.", outDirection: inDirection, outOrientation: inShaftOrientation };
      if (z1 <= 0 || z2 <= 0 || m <= 0) return { u: 0, error: "Значения z1, z2, m должны быть > 0.", outDirection: inDirection, outOrientation: inShaftOrientation };
      
      u = z2 / z1;
      output.d1 = m * z1;
      output.d2 = m * z2;
      output.a = (output.d1 + output.d2) / 2;

      output.da1 = output.d1 + 2 * m;
      output.da2 = output.d2 + 2 * m;
      output.df1 = output.d1 - 2.5 * m;
      output.df2 = output.d2 - 2.5 * m;

      if (inDirection === RotationDirection.Clockwise) output.outDirection = RotationDirection.CounterClockwise;
      else output.outDirection = RotationDirection.Clockwise;
      // Orientation maintained
      break;
    }
    case GearType.Chain: {
      const { z1: z1Str, z2: z2Str, p: pStr } = inputs as ChainInputParams;
      const z1 = parseNumeric(z1Str);
      const z2 = parseNumeric(z2Str);
      const p = parseNumeric(pStr);

      if (z1 === null || z2 === null || p === null) return { u: 0, error: "Не все поля (z1, z2, p) заполнены или некорректны.", outDirection: inDirection, outOrientation: inShaftOrientation };
      if (z1 <= 0 || z2 <= 0 || p <= 0) return { u: 0, error: "Значения z1, z2, p должны быть > 0.", outDirection: inDirection, outOrientation: inShaftOrientation };

      const PI = Math.PI;
      u = z2 / z1;
      output.chain_d1 = p / Math.sin(PI / z1);
      output.chain_d2 = p / Math.sin(PI / z2);
      output.chain_da1 = p * (0.6 + 1 / Math.tan(PI / z1));
      output.chain_da2 = p * (0.6 + 1 / Math.tan(PI / z2));
      output.chain_amin = (output.chain_d1 + output.chain_d2) / 2;
      output.outDirection = inDirection; 
      // Orientation maintained
      break;
    }
    case GearType.Planetary: {
      const { zSun: zSunStr, zRing: zRingStr, m: mStr, shaftConfig } = inputs as PlanetaryInputParams;
      const zSun = parseNumeric(zSunStr);
      const zRing = parseNumeric(zRingStr);
      const m = parseNumeric(mStr);

      if (zSun === null || zRing === null || m === null) return { u: 0, error: "Не все поля (z Солнца, z Короны, m) заполнены или некорректны.", outDirection: inDirection, outOrientation: inShaftOrientation };
      if (shaftConfig === "") return { u: 0, error: "Конфигурация валов (вход/выход) должна быть выбрана.", outDirection: inDirection, outOrientation: inShaftOrientation };
      if (zSun <= 0 || zRing <= 0 || m <= 0) return { u: 0, error: "Значения z Солнца, z Короны, m должны быть > 0.", outDirection: inDirection, outOrientation: inShaftOrientation };

      const shaftMap = PLANETARY_CONFIG_MAP[shaftConfig as PlanetaryConfig];
      if (!shaftMap) {
          return { u: 0, error: "Неверная конфигурация валов.", outDirection: inDirection, outOrientation: inShaftOrientation };
      }
      const { in: inShaft, out: outShaft } = shaftMap;

      const zPlanet = (zRing - zSun) / 2;
      output.zPlanet = zPlanet;
      
      output.planetary_dSun = m * zSun;
      output.planetary_dRing = m * zRing;

      if (zPlanet !== Math.floor(zPlanet) || zPlanet <= 0) {
        output.assemblyPossible = false;
        output.assemblyError = "СБОРКА НЕВОЗМОЖНА (z Сателлита не целое или <=0)";
      } else {
        output.planetary_dPlanet = m * zPlanet;
        output.planetary_a = (output.planetary_dSun + output.planetary_dPlanet) / 2;
        output.assemblyPossible = true;
        const shafts = [PlanetaryShaftType.Sun, PlanetaryShaftType.Carrier, PlanetaryShaftType.Ring];
        output.fixedShaft = shafts.find(s => s !== inShaft && s !== outShaft) || "Не определен";

        if (inShaft === PlanetaryShaftType.Sun && outShaft === PlanetaryShaftType.Carrier) u = 1 + zRing / zSun;
        else if (inShaft === PlanetaryShaftType.Carrier && outShaft === PlanetaryShaftType.Sun) u = 1 / (1 + zRing / zSun);
        else if (inShaft === PlanetaryShaftType.Ring && outShaft === PlanetaryShaftType.Carrier) u = 1 / (1 + zSun / zRing);
        else if (inShaft === PlanetaryShaftType.Carrier && outShaft === PlanetaryShaftType.Ring) u = 1 + zSun / zRing;
        else if (inShaft === PlanetaryShaftType.Sun && outShaft === PlanetaryShaftType.Ring) u = -zRing / zSun;
        else if (inShaft === PlanetaryShaftType.Ring && outShaft === PlanetaryShaftType.Sun) u = -zSun / zRing;
        else u = 0; 

        if (u === 0 && output.assemblyPossible) {
             return { u: 0, error: "Недопустимая комбинация входного/выходного вала для расчета u.", outDirection: inDirection, outOrientation: inShaftOrientation };
        }
      }
      if (u < 0) {
        output.outDirection = (inDirection === RotationDirection.Clockwise) ? RotationDirection.CounterClockwise : RotationDirection.Clockwise;
      } else {
        output.outDirection = inDirection; 
      }
      break;
    }
    case GearType.ToothedBelt: {
      const { z1: z1Str, z2: z2Str, p: pStr } = inputs as ToothedBeltInputParams;
      const z1 = parseNumeric(z1Str);
      const z2 = parseNumeric(z2Str);
      const p = parseNumeric(pStr);

      if (z1 === null || z2 === null || p === null) return { u: 0, error: "Не все поля (z1, z2, p) заполнены или некорректны.", outDirection: inDirection, outOrientation: inShaftOrientation };
      if (z1 <= 0 || z2 <= 0 || p <= 0) return { u: 0, error: "Значения z1, z2, p должны быть > 0.", outDirection: inDirection, outOrientation: inShaftOrientation };
      
      const PI = Math.PI;
      u = z2 / z1;
      output.tb_d1 = (p * z1) / PI;
      output.tb_d2 = (p * z2) / PI;
      output.tb_amin = (output.tb_d1 + output.tb_d2) / 2;
      output.outDirection = inDirection; 
      break;
    }
    case GearType.Belt: {
      const { d1: d1Str, d2: d2Str } = inputs as BeltInputParams;
      const d1 = parseNumeric(d1Str);
      const d2 = parseNumeric(d2Str);

      if (d1 === null || d2 === null) return { u: 0, error: "Не все поля (d1, d2) заполнены или некорректны.", outDirection: inDirection, outOrientation: inShaftOrientation };
      if (d1 <= 0 || d2 <= 0) return { u: 0, error: "Значения d1, d2 должны быть > 0.", outDirection: inDirection, outOrientation: inShaftOrientation };
      
      u = d2 / d1;
      output.actual_d1 = d1;
      output.actual_d2 = d2;
      output.belt_amin = (d1 + d2) / 2;
      output.outDirection = inDirection; 
      break;
    }
    case GearType.Bevel: {
      const { z1: z1Str, z2: z2Str, m: mStr, b: bStr, config } = inputs as BevelGearInputParams;
      const z1 = parseNumeric(z1Str);
      const z2 = parseNumeric(z2Str);
      const m = parseNumeric(mStr);
      const b = parseNumeric(bStr);
      
      if (z1 === null || z2 === null || m === null || b === null) return { u: 0, error: "Не все поля (z1, z2, m, b) заполнены или некорректны.", outDirection: inDirection, outOrientation: inShaftOrientation };
      if (z1 <= 0 || z2 <= 0 || m <= 0 || b <= 0) return { u: 0, error: "Значения z1, z2, m, b должны быть > 0.", outDirection: inDirection, outOrientation: inShaftOrientation };
      if (config === "") return { u: 0, error: "Тип конической передачи не выбран.", outDirection: inDirection, outOrientation: inShaftOrientation };

      u = z2 / z1;
      
      const d1 = m * z1;
      const d2 = m * z2;
      const delta1_rad = Math.atan(z1 / z2);
      const delta2_rad = Math.atan(z2 / z1); // Assuming 90 deg shaft angle

      output.bevel_d1 = d1;
      output.bevel_d2 = d2;
      output.bevel_delta1 = delta1_rad * 180 / Math.PI;
      output.bevel_delta2 = delta2_rad * 180 / Math.PI;
      output.bevel_Re = (m / 2) * Math.sqrt(z1**2 + z2**2);
      
      if (b > 0.35 * output.bevel_Re) {
         output.error = "Ширина венца (b) велика (b > 0.35 * Re)";
      }
      output.bevel_dm1 = d1 - b * Math.sin(delta1_rad);
      output.bevel_dm2 = d2 - b * Math.sin(delta2_rad);

      switch(config) {
        case BevelGearConfigType.Config1:
          output.outDirection = (inDirection === RotationDirection.Clockwise) ? RotationDirection.CounterClockwise : RotationDirection.Clockwise;
          break;
        case BevelGearConfigType.Config2:
          output.outDirection = inDirection; // Сохранение
          break;
        case BevelGearConfigType.Config3:
          output.outDirection = inDirection; // Сохранение
          break;
        default: // Should not happen if config is validated
          output.outDirection = (inDirection === RotationDirection.Clockwise) ? RotationDirection.CounterClockwise : RotationDirection.Clockwise;
          break;
      }
      
      if (inShaftOrientation === ShaftOrientation.Horizontal) {
        output.outOrientation = ShaftOrientation.Vertical;
      } else { // Vertical input
        output.outOrientation = ShaftOrientation.Horizontal;
      }
      break;
    }
    case GearType.Worm: {
        const { z1: z1Str, z2: z2Str, m: mStr, q: qStr, config: wormConfig } = inputs as WormGearInputParams;
        const z1 = parseNumeric(z1Str); 
        const z2 = parseNumeric(z2Str); 
        const m = parseNumeric(mStr);   
        const q = parseNumeric(qStr);   

        if (z1 === null || z2 === null || m === null || q === null) return { u: 0, error: "Не все поля (z1, z2, m, q) заполнены или некорректны.", outDirection: inDirection, outOrientation: inShaftOrientation };
        if (z1 <= 0 || z2 <= 0 || m <= 0 || q <= 0) return { u: 0, error: "Значения z1, z2, m, q должны быть > 0.", outDirection: inDirection, outOrientation: inShaftOrientation };
        if (wormConfig === "") return { u: 0, error: "Тип червячной передачи не выбран.", outDirection: inDirection, outOrientation: inShaftOrientation };

        u = z2 / z1;
        output.worm_d1 = m * q;
        output.worm_d2 = m * z2;
        output.worm_a = m * (q + z2) / 2;
        output.worm_gamma = Math.atan(z1 / q) * 180 / Math.PI;
        output.worm_da1 = output.worm_d1 + 2 * m;
        output.worm_da2 = output.worm_d2 + 2 * m;
        output.worm_df2 = output.worm_d2 - 2.5 * m;

        if (inShaftOrientation === ShaftOrientation.Horizontal) {
            output.outOrientation = ShaftOrientation.Vertical;
        } else {
            output.outOrientation = ShaftOrientation.Horizontal;
        }
        
        if (wormConfig === WormGearConfigType.TopApproach) {
            // "Червяк сверху" - инверсия вращения
            output.outDirection = (inDirection === RotationDirection.Clockwise) ? RotationDirection.CounterClockwise : RotationDirection.Clockwise;
        } else { // WormGearConfigType.BottomApproach
            // "Червяк снизу" - сохранение вращения
            output.outDirection = inDirection;
        }
        break;
    }
    default:
      return { u: 0, error: `Неизвестный тип передачи: ${moduleType}`, outDirection: inDirection, outOrientation: inShaftOrientation };
  }

  const finalOutDirection: RotationDirection = output.outDirection!;
  const finalOutOrientation: ShaftOrientation = output.outOrientation!;

  return {
    u,
    error: output.error,
    assemblyError: output.assemblyError,
    // Cylindrical
    a: output.a,
    d1: output.d1,
    d2: output.d2,
    da1: output.da1,
    da2: output.da2,
    df1: output.df1,
    df2: output.df2,
    // Chain
    chain_d1: output.chain_d1,
    chain_d2: output.chain_d2,
    chain_da1: output.chain_da1,
    chain_da2: output.chain_da2,
    chain_amin: output.chain_amin,
    // Planetary
    zPlanet: output.zPlanet,
    assemblyPossible: output.assemblyPossible,
    fixedShaft: output.fixedShaft,
    planetary_a: output.planetary_a,
    planetary_dPlanet: output.planetary_dPlanet,
    planetary_dRing: output.planetary_dRing,
    planetary_dSun: output.planetary_dSun,
    // Toothed Belt
    tb_d1: output.tb_d1,
    tb_d2: output.tb_d2,
    tb_amin: output.tb_amin,
    // Belt
    belt_amin: output.belt_amin,
    actual_d1: output.actual_d1,
    actual_d2: output.actual_d2,
    // Bevel
    bevel_d1: output.bevel_d1,
    bevel_d2: output.bevel_d2,
    bevel_delta1: output.bevel_delta1,
    bevel_delta2: output.bevel_delta2,
    bevel_dm1: output.bevel_dm1,
    bevel_dm2: output.bevel_dm2,
    bevel_Re: output.bevel_Re,
    // Worm
    worm_a: output.worm_a,
    worm_d1: output.worm_d1,
    worm_d2: output.worm_d2,
    worm_da1: output.worm_da1,
    worm_da2: output.worm_da2,
    worm_df2: output.worm_df2,
    worm_gamma: output.worm_gamma,
    // Out
    outDirection: finalOutDirection,
    outOrientation: finalOutOrientation,
  };
};


export const calculateCascade = (
  engineParams: EngineParams,
  calculationData: StageCalculationData[]
): { results: FinalCalculationResults | null; updatedCalculationData: StageCalculationData[]; error?: string } => {
  
  const updatedData = JSON.parse(JSON.stringify(calculationData)) as StageCalculationData[]; // Deep copy
  let overallError: string | undefined = undefined;

  let currentTorque = engineParams.initialTorque;
  let currentMinRpm = engineParams.initialMinRpm;
  let currentMaxRpm = engineParams.initialMaxRpm;
  let currentDirection = engineParams.initialDirection;
  let currentOrientation = engineParams.initialOrientation; 
  let totalGearRatio = 1;
  let totalEfficiency = 1;

  for (let i = 0; i < updatedData.length; i++) {
    const stage = updatedData[i];
    
    stage.modules.forEach(mod => {
        mod.moduleInDirection = currentDirection;
        mod.moduleInOrientation = currentOrientation;

        const { outDirection, outOrientation, ...restOfCalc } = calculateSingleModule(mod.type, mod.inputs, currentDirection, currentOrientation);
        
        Object.assign(mod, restOfCalc);
        
        mod.moduleOutDirection = outDirection;
        mod.moduleOutOrientation = outOrientation;

        mod.cascadeIn = undefined;
        mod.cascadeOut = undefined;
    });

    const selectedModule = stage.modules.find(m => m.isSelected);

    if (!selectedModule) {
      if (stage.modules.length > 0) { 
        const errorMsg = `На ступени ${stage.stageName} не выбрана передача.`;
        overallError = overallError ? `${overallError}\n${errorMsg}` : errorMsg;
        stage.stageError = `Не выбрана передача на ступени: ${stage.stageName.replace("Валы ", "").replace(" и ", "-")}`;
      }
      continue; 
    }
    stage.stageError = undefined; 

    selectedModule.cascadeIn = { torque: currentTorque, minRpm: currentMinRpm, maxRpm: currentMaxRpm, direction: currentDirection, orientation: currentOrientation };
    
    let canProceedWithCascade = true;

    if (selectedModule.error || (selectedModule.type === GearType.Planetary && !selectedModule.assemblyPossible)) {
      const errorMsg = selectedModule.error || selectedModule.assemblyError || "Ошибка расчета модуля.";
      overallError = overallError ? `${overallError}\nОшибка на ступени ${stage.stageName} (${selectedModule.type}): ${errorMsg}` : `Ошибка на ступени ${stage.stageName} (${selectedModule.type}): ${errorMsg}`;
      canProceedWithCascade = false;
    }

    const etaStr = selectedModule.inputs.eta;
    const eta = parseNumeric(etaStr);

    if (eta === null || isNaN(eta) || eta < 0 || eta > 1) {
        const errorMsg = "КПД должен быть числом от 0.0 до 1.0.";
        selectedModule.error = errorMsg;
        overallError = overallError ? `${overallError}\nОшибка КПД на ступени ${stage.stageName} (${selectedModule.type}): ${errorMsg}` : `Ошибка КПД на ступени ${stage.stageName} (${selectedModule.type}): ${errorMsg}`;
        canProceedWithCascade = false;
    }

    if (selectedModule.u === 0 && !selectedModule.error) { 
        const errorMsg = "Передаточное отношение равно 0. Проверьте параметры.";
        selectedModule.error = errorMsg;
        overallError = overallError ? `${overallError}\nОшибка u=0 на ступени ${stage.stageName} (${selectedModule.type}): ${errorMsg}` : `Ошибка u=0 на ступени ${stage.stageName} (${selectedModule.type}): ${errorMsg}`;
        canProceedWithCascade = false;
    }
    
    if (canProceedWithCascade) {
        const uModule = Math.abs(selectedModule.u!); 
        currentTorque *= uModule * eta!;
        currentMinRpm /= uModule;
        currentMaxRpm /= uModule;
        totalGearRatio *= selectedModule.u!; 
        totalEfficiency *= eta!;
        currentDirection = selectedModule.moduleOutDirection!;
        currentOrientation = selectedModule.moduleOutOrientation!; 
        selectedModule.cascadeOut = { torque: currentTorque, minRpm: currentMinRpm, maxRpm: currentMaxRpm, direction: currentDirection, orientation: currentOrientation };
    } else {
        selectedModule.cascadeOut = undefined;
    }
  }

  if (overallError) {
    return { results: null, updatedCalculationData: updatedData, error: overallError };
  }
  
  const hasSelectedModules = updatedData.some(stage => stage.modules.some(m => m.isSelected));
  if (!hasSelectedModules && updatedData.length > 0) {
      // No modules selected at all, this is not an error state, just no final results.
      return { results: null, updatedCalculationData: updatedData };
  }

  const finalResults: FinalCalculationResults = {
    totalGearRatio,
    finalTorque: currentTorque,
    finalMinRpm: currentMinRpm,
    finalMaxRpm: currentMaxRpm,
    finalDirection: currentDirection,
    finalOrientation: currentOrientation, 
    totalEfficiency,
  };

  return { results: finalResults, updatedCalculationData: updatedData };
};