import { GearType } from '../types';

export const getGearCategory = (type: GearType): 'parallel' | 'angular' | 'coaxial' => {
    const PARALLEL_TYPES = [GearType.Gear, GearType.Chain, GearType.ToothedBelt, GearType.Belt];
    if (PARALLEL_TYPES.includes(type)) {
        return 'parallel';
    }

    const ANGULAR_TYPES = [GearType.Bevel, GearType.Worm];
    if (ANGULAR_TYPES.includes(type)) {
        return 'angular';
    }

    if (type === GearType.Planetary) {
        return 'coaxial';
    }
    
    // Fallback for safety, though should not be reached with current enum.
    return 'parallel';
};