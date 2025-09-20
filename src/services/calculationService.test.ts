import { describe, it, expect } from 'vitest';
import { calculateSingleModule } from './calculationService';
import { GearType, RotationDirection, ShaftOrientation, type GearInputParams } from '../types';

describe('calculationService', () => {
  describe('calculateSingleModule', () => {
    it('должен правильно рассчитать цилиндрическую передачу', () => {
      const inputs: GearInputParams = {
        z1: '20',
        z2: '40',
        m: '2',
      };
      const result = calculateSingleModule(
        GearType.Gear,
        inputs,
        RotationDirection.Clockwise,
        ShaftOrientation.Horizontal
      );

      expect(result.u).toBe(2);
      expect(result.a).toBe(60); // (20*2 + 40*2) / 2
      expect(result.outDirection).toBe(RotationDirection.CounterClockwise);
      expect(result.validationState?.errors).toEqual({});
    });

    it('должен вернуть ошибку, если число зубьев некорректно', () => {
      const inputs: GearInputParams = {
        z1: '2', // Меньше 3
        z2: '40',
        m: '2',
      };
      const result = calculateSingleModule(
        GearType.Gear,
        inputs,
        RotationDirection.Clockwise,
        ShaftOrientation.Horizontal
      );
      
      expect(result.u).toBe(0); // Расчет не должен пройти
      expect(result.validationState?.errors?.z1).toBe('z₁ должно быть ≥ 3');
    });

    it('должен вернуть предупреждение о подрезке зуба', () => {
        const inputs: GearInputParams = {
            z1: '16', // Меньше 17
            z2: '40',
            m: '2',
        };
        const result = calculateSingleModule(
            GearType.Gear,
            inputs,
            RotationDirection.Clockwise,
            ShaftOrientation.Horizontal
        );
        
        expect(result.u).toBe(2.5);
        expect(result.validationState?.warnings?.z1).toBe('Подрезка зуба (z₁ < 17)');
    });
  });
});
