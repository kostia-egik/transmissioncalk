

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

  const errors: Record<string, string> = {};
  const warnings: Record<string, string> = {};

  const baseReturn = {
    u: 0,
    outDirection: inDirection,
    outOrientation: inShaftOrientation,
  };


  switch (moduleType) {
    case GearType.Gear: {
      const { z1: z1Str, z2: z2Str, m: mStr } = inputs as GearInputParams;
      const z1 = parseNumeric(z1Str);
      const z2 = parseNumeric(z2Str);
      const m = parseNumeric(mStr);
      
      if (z1 === null) errors.z1 = "Обязательное поле";
      if (z2 === null) errors.z2 = "Обязательное поле";
      if (m === null) errors.m = "Обязательное поле";
      
      if (z1 !== null) {
          if (!Number.isInteger(z1)) errors.z1 = "Требуется целое число";
          else if (z1 < 3) errors.z1 = "z₁ должно быть ≥ 3";
          else if (z1 < 17) warnings.z1 = "Подрезка зуба (z₁ < 17)";
      }
      if (z2 !== null) {
          if (!Number.isInteger(z2)) errors.z2 = "Требуется целое число";
          else if (z2 < 3) errors.z2 = "z₂ должно быть ≥ 3";
          else if (z2 < 17) warnings.z2 = "Подрезка зуба (z₂ < 17)";
      }
      if (m !== null && m <= 0) errors.m = "m должно быть > 0";

      // --- Contact Ratio (εα) Calculation ---
      if (z1 !== null && z2 !== null && m !== null && m > 0 && Number.isInteger(z1) && Number.isInteger(z2) && z1 >= 3 && z2 >= 3) {
        const alpha = 20 * (Math.PI / 180); // 20 degrees pressure angle in radians
        const cosAlpha = Math.cos(alpha);
        const sinAlpha = Math.sin(alpha);

        const d1 = m * z1;
        const d2 = m * z2;
        
        const r1 = d1 / 2;
        const r2 = d2 / 2;

        const rb1 = r1 * cosAlpha;
        const rb2 = r2 * cosAlpha;

        const ra1 = r1 + m;
        const ra2 = r2 + m;
        
        if (ra1 * ra1 >= rb1 * rb1 && ra2 * ra2 >= rb2 * rb2) {
            const a = (d1 + d2) / 2;
            const ga = Math.sqrt(ra1 * ra1 - rb1 * rb1) + Math.sqrt(ra2 * ra2 - rb2 * rb2) - a * sinAlpha;
            const pb = Math.PI * m * cosAlpha;
            
            if (pb > 0) {
                const epsilonAlpha = ga / pb;
                output.epsilonAlpha = epsilonAlpha;

                if (epsilonAlpha <= 1) {
                    errors.z1 = "Перекрытие ≤ 1, передача неработоспособна";
                    errors.z2 = "Перекрытие ≤ 1, передача неработоспособна";
                } else if (epsilonAlpha <= 1.2) {
                    warnings.z1 = `Малое перекрытие (εα ≈ ${epsilonAlpha.toFixed(2)}), возможен шум`;
                    warnings.z2 = `Малое перекрытие (εα ≈ ${epsilonAlpha.toFixed(2)}), возможен шум`;
                }
            }
        }
      }


      if (Object.keys(errors).length > 0) return { ...baseReturn, validationState: { errors, warnings } };
      
      u = z2! / z1!;
      output.d1 = m! * z1!;
      output.d2 = m! * z2!;
      output.a = (output.d1 + output.d2) / 2;

      output.da1 = output.d1 + 2 * m!;
      output.da2 = output.d2 + 2 * m!;
      output.df1 = output.d1 - 2.5 * m!;
      output.df2 = output.d2 - 2.5 * m!;

      if (inDirection === RotationDirection.Clockwise) output.outDirection = RotationDirection.CounterClockwise;
      else output.outDirection = RotationDirection.Clockwise;
      break;
    }
    case GearType.Chain: {
      const { z1: z1Str, z2: z2Str, p: pStr } = inputs as ChainInputParams;
      const z1 = parseNumeric(z1Str);
      const z2 = parseNumeric(z2Str);
      const p = parseNumeric(pStr);

      if (z1 === null) errors.z1 = "Обязательное поле";
      if (z2 === null) errors.z2 = "Обязательное поле";
      if (p === null) errors.p = "Обязательное поле";

      if (z1 !== null) {
          if (!Number.isInteger(z1)) errors.z1 = "Требуется целое число";
          else if (z1 < 3) errors.z1 = "z₁ должно быть ≥ 3";
          else if (z1 < 17) warnings.z1 = "Малое число зубьев, возможны пульсации скорости";
      }
      if (z2 !== null) {
          if (!Number.isInteger(z2)) errors.z2 = "Требуется целое число";
          else if (z2 < 3) errors.z2 = "z₂ должно быть ≥ 3";
          else if (z2 < 17) warnings.z2 = "Малое число зубьев, возможны пульсации скорости";
      }
      if (p !== null && p <= 0) errors.p = "p должно быть > 0";
      if (Object.keys(errors).length > 0) return { ...baseReturn, validationState: { errors, warnings } };

      const PI = Math.PI;
      u = z2! / z1!;
      output.chain_d1 = p! / Math.sin(PI / z1!);
      output.chain_d2 = p! / Math.sin(PI / z2!);
      output.chain_da1 = p! * (0.6 + 1 / Math.tan(PI / z1!));
      output.chain_da2 = p! * (0.6 + 1 / Math.tan(PI / z2!));
      output.chain_amin = (output.chain_d1 + output.chain_d2) / 2;
      output.outDirection = inDirection; 
      break;
    }
    case GearType.Planetary: {
      const { zSun: zSunStr, zRing: zRingStr, m: mStr, shaftConfig } = inputs as PlanetaryInputParams;
      const zSun = parseNumeric(zSunStr);
      const zRing = parseNumeric(zRingStr);
      const m = parseNumeric(mStr);

      if (zSun === null) errors.zSun = "Обязательное поле";
      if (zRing === null) errors.zRing = "Обязательное поле";
      if (m === null) errors.m = "Обязательное поле";
      if (shaftConfig === "") errors.shaftConfig = "Не выбрана конфигурация";

      if (zSun !== null) {
          if (!Number.isInteger(zSun)) errors.zSun = "Требуется целое число";
          else if (zSun < 3) errors.zSun = "zСолнца ≥ 3";
      }
      if (zRing !== null) {
          if (!Number.isInteger(zRing)) errors.zRing = "Требуется целое число";
          else if (zRing < 3) errors.zRing = "zКороны ≥ 3";
      }
      if (m !== null && m <= 0) errors.m = "m > 0";

      if (Object.keys(errors).length > 0) return { ...baseReturn, validationState: { errors, warnings } };
      
      const shaftMap = PLANETARY_CONFIG_MAP[shaftConfig as PlanetaryConfig];
      if (!shaftMap) {
          errors.shaftConfig = "Неверная конфигурация";
          return { ...baseReturn, validationState: { errors, warnings } };
      }
      const { in: inShaft, out: outShaft } = shaftMap;

      const zPlanet = (zRing! - zSun!) / 2;
      output.zPlanet = zPlanet;
      
      output.planetary_dSun = m! * zSun!;
      output.planetary_dRing = m! * zRing!;

      if (zPlanet < 3 || zPlanet !== Math.floor(zPlanet)) {
        output.assemblyPossible = false;
        errors.zSun = "СБОРКА НЕВОЗМОЖНА (z Сателлита < 3 или не целое)";
        errors.zRing = "СБОРКА НЕВОЗМОЖНА (z Сателлита < 3 или не целое)";
      } else {
        output.planetary_dPlanet = m! * zPlanet;
        output.planetary_a = (output.planetary_dSun + output.planetary_dPlanet) / 2;
        output.assemblyPossible = true;
        const shafts = [PlanetaryShaftType.Sun, PlanetaryShaftType.Carrier, PlanetaryShaftType.Ring];
        output.fixedShaft = shafts.find(s => s !== inShaft && s !== outShaft) || "Не определен";

        // Undercutting and Interference Checks
        if (zSun! < 17) warnings.zSun = "Подрезка зуба (z < 17)";
        if (zPlanet < 17) {
            warnings.zSun = "Подрезка зуба сателлита (z < 17)";
            warnings.zRing = "Подрезка зуба сателлита (z < 17)";
        }
        if ((zRing! - zPlanet) < 10) {
            warnings.zRing = "Малая разница зубьев (zR-zP < 10), возможна интерференция";
            warnings.zSun = "Малая разница зубьев (zR-zP < 10), возможна интерференция";
        }
        
        // Contact Ratio Calculations
        const alpha = 20 * (Math.PI / 180);
        const cosAlpha = Math.cos(alpha);
        const sinAlpha = Math.sin(alpha);
        const pb = Math.PI * m! * cosAlpha;

        // Sun-Planet (external)
        const rSun = output.planetary_dSun / 2;
        const rPlanet = output.planetary_dPlanet / 2;
        const rbSun = rSun * cosAlpha;
        const rbPlanet = rPlanet * cosAlpha;
        const raSun = rSun + m!;
        const raPlanet = rPlanet + m!;
        const a_sp = (output.planetary_dSun + output.planetary_dPlanet) / 2;

        if (raSun * raSun >= rbSun * rbSun && raPlanet * raPlanet >= rbPlanet * rbPlanet && pb > 0) {
            const ga_sp = Math.sqrt(raSun * raSun - rbSun * rbSun) + Math.sqrt(raPlanet * raPlanet - rbPlanet * rbPlanet) - a_sp * sinAlpha;
            const epsilon_sp = ga_sp / pb;
            output.epsilon_sp = epsilon_sp;

            if (epsilon_sp <= 1) {
                errors.zSun = `Перекрытие S-P ≤ 1 (${epsilon_sp.toFixed(2)}), неработоспособно`;
            } else if (epsilon_sp <= 1.2) {
                warnings.zSun = `Малое перекрытие S-P (εα ≈ ${epsilon_sp.toFixed(2)}), возможен шум`;
            }
        }

        // Planet-Ring (internal)
        const rRing = output.planetary_dRing / 2;
        const rbRing = rRing * cosAlpha;
        const raRing = rRing - m!;
        const a_pr = (output.planetary_dRing - output.planetary_dPlanet) / 2;

        if (raPlanet * raPlanet >= rbPlanet * rbPlanet && raRing * raRing >= rbRing * rbRing && raRing > rbRing && pb > 0) {
            const ga_pr = Math.sqrt(raPlanet * raPlanet - rbPlanet * rbPlanet) + Math.sqrt(raRing * raRing - rbRing * rbRing) - a_pr * sinAlpha;
            const epsilon_pr = ga_pr / pb;
            output.epsilon_pr = epsilon_pr;
            
            if (epsilon_pr <= 1) {
                errors.zRing = `Перекрытие P-R ≤ 1 (${epsilon_pr.toFixed(2)}), неработоспособно`;
            } else if (epsilon_pr <= 1.2) {
                warnings.zRing = `Малое перекрытие P-R (εα ≈ ${epsilon_pr.toFixed(2)}), возможен шум`;
            }
        }

        if (inShaft === PlanetaryShaftType.Sun && outShaft === PlanetaryShaftType.Carrier) u = 1 + zRing! / zSun!;
        else if (inShaft === PlanetaryShaftType.Carrier && outShaft === PlanetaryShaftType.Sun) u = 1 / (1 + zRing! / zSun!);
        else if (inShaft === PlanetaryShaftType.Ring && outShaft === PlanetaryShaftType.Carrier) u = 1 / (1 + zSun! / zRing!);
        else if (inShaft === PlanetaryShaftType.Carrier && outShaft === PlanetaryShaftType.Ring) u = 1 + zSun! / zRing!;
        else if (inShaft === PlanetaryShaftType.Sun && outShaft === PlanetaryShaftType.Ring) u = -zRing! / zSun!;
        else if (inShaft === PlanetaryShaftType.Ring && outShaft === PlanetaryShaftType.Sun) u = -zSun! / zRing!;
        else u = 0; 
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
      
      if (z1 === null) errors.z1 = "Обязательное поле";
      if (z2 === null) errors.z2 = "Обязательное поле";
      if (p === null) errors.p = "Обязательное поле";

      if (z1 !== null) {
          if (!Number.isInteger(z1)) errors.z1 = "Требуется целое число";
          else if (z1 < 3) errors.z1 = "z₁ должно быть ≥ 3";
          else if (z1 < 12) warnings.z1 = "z₁ < 12, возможен пропуск зуба/износ";
      }
      if (z2 !== null) {
          if (!Number.isInteger(z2)) errors.z2 = "Требуется целое число";
          else if (z2 < 3) errors.z2 = "z₂ должно быть ≥ 3";
          else if (z2 < 12) warnings.z2 = "z₂ < 12, возможен пропуск зуба/износ";
      }
      if (p !== null && p <= 0) errors.p = "p > 0";

      if (Object.keys(errors).length > 0) return { ...baseReturn, validationState: { errors, warnings } };
      
      const PI = Math.PI;
      u = z2! / z1!;
      output.tb_d1 = (p! * z1!) / PI;
      output.tb_d2 = (p! * z2!) / PI;
      output.tb_amin = (output.tb_d1 + output.tb_d2) / 2;
      output.outDirection = inDirection; 
      break;
    }
    case GearType.Belt: {
      const { d1: d1Str, d2: d2Str } = inputs as BeltInputParams;
      const d1 = parseNumeric(d1Str);
      const d2 = parseNumeric(d2Str);

      if (d1 === null) errors.d1 = "Обязательное поле";
      if (d2 === null) errors.d2 = "Обязательное поле";
      if (d1 !== null && d1 <= 0) errors.d1 = "d₁ > 0";
      if (d2 !== null && d2 <= 0) errors.d2 = "d₂ > 0";

      if (Object.keys(errors).length > 0) return { ...baseReturn, validationState: { errors, warnings } };
      
      u = d2! / d1!;
      output.actual_d1 = d1!;
      output.actual_d2 = d2!;
      output.belt_amin = (d1! + d2!) / 2;
      output.outDirection = inDirection; 
      break;
    }
    case GearType.Bevel: {
      const { z1: z1Str, z2: z2Str, m: mStr, b: bStr, config } = inputs as BevelGearInputParams;
      const z1 = parseNumeric(z1Str);
      const z2 = parseNumeric(z2Str);
      const m = parseNumeric(mStr);
      const b = parseNumeric(bStr);
      
      if (z1 === null) errors.z1 = "Обязательное поле";
      if (z2 === null) errors.z2 = "Обязательное поле";
      if (m === null) errors.m = "Обязательное поле";
      if (b === null) errors.b = "Обязательное поле";
      if (config === "") errors.config = "Не выбран тип";
      
      if (z1 !== null) {
        if (!Number.isInteger(z1)) errors.z1 = "Требуется целое число";
        else if (z1 < 3) errors.z1 = "z₁ ≥ 3";
      }
      if (z2 !== null) {
        if (!Number.isInteger(z2)) errors.z2 = "Требуется целое число";
        else if (z2 < 3) errors.z2 = "z₂ ≥ 3";
      }
      if (m !== null && m <= 0) errors.m = "m > 0";
      if (b !== null && b <= 0) errors.b = "b > 0";

       // --- Contact Ratio (εα) for equivalent spur gear ---
       if (z1 !== null && z2 !== null && m !== null && m > 0 && Number.isInteger(z1) && Number.isInteger(z2) && z1 >= 3 && z2 >= 3) {
          const delta1_rad_calc = Math.atan(z1 / z2);
          const delta2_rad_calc = Math.atan(z2 / z1);
          const zv1 = z1 / Math.cos(delta1_rad_calc);
          const zv2 = z2 / Math.cos(delta2_rad_calc);

          if (zv1 < 17) {
              warnings.z1 = `Подрезка зуба (эквив. zᵥ₁ ≈ ${zv1.toFixed(1)} < 17)`;
          }
          if (zv2 < 17) {
              warnings.z2 = `Подрезка зуба (эквив. zᵥ₂ ≈ ${zv2.toFixed(1)} < 17)`;
          }

          const alpha = 20 * (Math.PI / 180);
          const cosAlpha = Math.cos(alpha);
          const sinAlpha = Math.sin(alpha);

          const dv1 = m * zv1;
          const dv2 = m * zv2;
          const rv1 = dv1 / 2;
          const rv2 = dv2 / 2;
          const rbv1 = rv1 * cosAlpha;
          const rbv2 = rv2 * cosAlpha;
          const rav1 = rv1 + m;
          const rav2 = rv2 + m;

          if (rav1 * rav1 >= rbv1 * rbv1 && rav2 * rav2 >= rbv2 * rbv2) {
              const av = (dv1 + dv2) / 2;
              const ga = Math.sqrt(rav1 * rav1 - rbv1 * rbv1) + Math.sqrt(rav2 * rav2 - rbv2 * rbv2) - av * sinAlpha;
              const pb = Math.PI * m * cosAlpha;
              if (pb > 0) {
                  const epsilonAlpha = ga / pb;
                  output.bevel_epsilonAlpha = epsilonAlpha;
                  if (epsilonAlpha <= 1) {
                      errors.z1 = `Перекрытие εα ≤ 1 (${epsilonAlpha.toFixed(2)}), неработоспособно`;
                      errors.z2 = `Перекрытие εα ≤ 1 (${epsilonAlpha.toFixed(2)}), неработоспособно`;
                  } else if (epsilonAlpha <= 1.2) {
                      warnings.z1 = `Малое перекрытие (εα ≈ ${epsilonAlpha.toFixed(2)}), возможен шум`;
                      warnings.z2 = `Малое перекрытие (εα ≈ ${epsilonAlpha.toFixed(2)}), возможен шум`;
                  }
              }
          }
      }

      if (Object.keys(errors).length > 0) return { ...baseReturn, validationState: { errors, warnings } };

      u = z2! / z1!;
      
      const d1 = m! * z1!;
      const d2 = m! * z2!;
      const delta1_rad = Math.atan(z1! / z2!);
      const delta2_rad = Math.atan(z2! / z1!); 

      output.bevel_d1 = d1;
      output.bevel_d2 = d2;
      output.bevel_delta1 = delta1_rad * 180 / Math.PI;
      output.bevel_delta2 = delta2_rad * 180 / Math.PI;
      output.bevel_Re = (m! / 2) * Math.sqrt(z1!**2 + z2!**2);
      
      if (b! > 0.35 * output.bevel_Re) {
         warnings.b = "Ширина венца велика (b > 0.35*Re)";
      }
      output.bevel_dm1 = d1 - b! * Math.sin(delta1_rad);
      output.bevel_dm2 = d2 - b! * Math.sin(delta2_rad);

      switch(config) {
        case BevelGearConfigType.Config1: output.outDirection = (inDirection === RotationDirection.Clockwise) ? RotationDirection.CounterClockwise : RotationDirection.Clockwise; break;
        case BevelGearConfigType.Config2: case BevelGearConfigType.Config3: output.outDirection = inDirection; break;
        default: output.outDirection = (inDirection === RotationDirection.Clockwise) ? RotationDirection.CounterClockwise : RotationDirection.Clockwise; break;
      }
      
      output.outOrientation = (inShaftOrientation === ShaftOrientation.Horizontal) ? ShaftOrientation.Vertical : ShaftOrientation.Horizontal;
      break;
    }
    case GearType.Worm: {
        const { z1: z1Str, z2: z2Str, m: mStr, q: qStr, config: wormConfig } = inputs as WormGearInputParams;
        const z1 = parseNumeric(z1Str); 
        const z2 = parseNumeric(z2Str); 
        const m = parseNumeric(mStr);   
        const q = parseNumeric(qStr);   
        
        if (z1 === null) errors.z1 = "Обязательное поле";
        if (z2 === null) errors.z2 = "Обязательное поле";
        if (m === null) errors.m = "Обязательное поле";
        if (q === null) errors.q = "Обязательное поле";
        if (wormConfig === "") errors.config = "Не выбран тип";

        if (z1 !== null) {
          if (!Number.isInteger(z1)) errors.z1 = "Требуется целое число";
          else if (z1 < 1) errors.z1 = "z₁ (заходы) ≥ 1";
          else if (z1 > 4) warnings.z1 = "z₁ > 4 не рекомендуется";
        }
        if (z2 !== null) {
          if (!Number.isInteger(z2)) errors.z2 = "Требуется целое число";
          else if (z2 < 26) warnings.z2 = "z₂ < 26 не рекомендуется";
        }
        if (m !== null && m <= 0) errors.m = "m > 0";
        if (q !== null && q <= 0) errors.q = "q > 0";
        
        if (Object.keys(errors).length > 0) return { ...baseReturn, validationState: { errors, warnings } };

        u = z2! / z1!;
        output.worm_d1 = m! * q!;
        output.worm_d2 = m! * z2!;
        output.worm_a = m! * (q! + z2!) / 2;
        output.worm_gamma = Math.atan(z1! / q!) * 180 / Math.PI;
        output.worm_da1 = output.worm_d1 + 2 * m!;
        output.worm_da2 = output.worm_d2 + 2 * m!;
        output.worm_df2 = output.worm_d2 - 2.5 * m!;

        output.outOrientation = (inShaftOrientation === ShaftOrientation.Horizontal) ? ShaftOrientation.Vertical : ShaftOrientation.Horizontal;
        
        if (wormConfig === WormGearConfigType.TopApproach) {
            output.outDirection = (inDirection === RotationDirection.Clockwise) ? RotationDirection.CounterClockwise : RotationDirection.Clockwise;
        } else {
            output.outDirection = inDirection;
        }
        break;
    }
    default:
        errors.type = `Неизвестный тип передачи: ${moduleType}`;
        return { ...baseReturn, validationState: { errors, warnings } };
  }

  output.validationState = { errors, warnings };

  return {
    u: Math.abs(u),
    validationState: { errors, warnings },
    // Cylindrical
    a: output.a, d1: output.d1, d2: output.d2, da1: output.da1, da2: output.da2, df1: output.df1, df2: output.df2, epsilonAlpha: output.epsilonAlpha,
    // Chain
    chain_d1: output.chain_d1, chain_d2: output.chain_d2, chain_da1: output.chain_da1, chain_da2: output.chain_da2, chain_amin: output.chain_amin,
    // Planetary
    zPlanet: output.zPlanet, assemblyPossible: output.assemblyPossible, fixedShaft: output.fixedShaft, planetary_a: output.planetary_a, planetary_dPlanet: output.planetary_dPlanet, planetary_dRing: output.planetary_dRing, planetary_dSun: output.planetary_dSun, epsilon_sp: output.epsilon_sp, epsilon_pr: output.epsilon_pr,
    // Toothed Belt
    tb_d1: output.tb_d1, tb_d2: output.tb_d2, tb_amin: output.tb_amin,
    // Belt
    belt_amin: output.belt_amin, actual_d1: output.actual_d1, actual_d2: output.actual_d2,
    // Bevel
    bevel_d1: output.bevel_d1, bevel_d2: output.bevel_d2, bevel_delta1: output.bevel_delta1, bevel_delta2: output.bevel_delta2, bevel_dm1: output.bevel_dm1, bevel_dm2: output.bevel_dm2, bevel_Re: output.bevel_Re, bevel_epsilonAlpha: output.bevel_epsilonAlpha,
    // Worm
    worm_a: output.worm_a, worm_d1: output.worm_d1, worm_d2: output.worm_d2, worm_da1: output.worm_da1, worm_da2: output.worm_da2, worm_df2: output.worm_df2, worm_gamma: output.worm_gamma,
    // Out
    outDirection: output.outDirection!, outOrientation: output.outOrientation!,
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
        
        // Clear previous validation state and legacy errors
        mod.validationState = { errors: {}, warnings: {} };
        mod.error = undefined; 
        mod.assemblyError = undefined;

        const { validationState, outDirection, outOrientation, ...restOfCalc } = calculateSingleModule(mod.type, mod.inputs, currentDirection, currentOrientation);
        
        mod.validationState = validationState;
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
    const errors = selectedModule.validationState?.errors ?? {};

    if (Object.keys(errors).length > 0) {
        const errorMsg = Object.entries(errors).map(([field, msg]) => `${field}: ${msg}`).join(', ');
        overallError = overallError ? `${overallError}\nОшибка на ступени ${stage.stageName} (${selectedModule.type}): ${errorMsg}` : `Ошибка на ступени ${stage.stageName} (${selectedModule.type}): ${errorMsg}`;
        canProceedWithCascade = false;
    }

    const etaStr = selectedModule.inputs.eta;
    const eta = parseNumeric(etaStr);

    if (eta === null || isNaN(eta) || eta < 0 || eta > 1) {
        const errorMsg = "КПД должен быть числом от 0.0 до 1.0.";
        selectedModule.validationState = { ...selectedModule.validationState, errors: { ...errors, eta: errorMsg }};
        overallError = overallError ? `${overallError}\nОшибка КПД на ступени ${stage.stageName} (${selectedModule.type}): ${errorMsg}` : `Ошибка КПД на ступени ${stage.stageName} (${selectedModule.type}): ${errorMsg}`;
        canProceedWithCascade = false;
    }
    
    if (canProceedWithCascade && selectedModule.u === 0 && Object.keys(errors).length === 0) { 
        const errorMsg = "Передаточное отношение равно 0. Проверьте параметры.";
        selectedModule.validationState = { ...selectedModule.validationState, errors: { ...errors, u: errorMsg }};
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