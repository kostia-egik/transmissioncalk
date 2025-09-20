import { GearType } from '../types';

export const getGearCategory = (type: GearType): 'parallel' | 'square' => {
    const PARALLEL_TYPES = [GearType.Gear, GearType.Chain, GearType.ToothedBelt, GearType.Belt];
    if (PARALLEL_TYPES.includes(type)) {
        return 'parallel';
    }
    return 'square'; // Covers Bevel, Worm, Planetary
};