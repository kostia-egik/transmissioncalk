

export enum AppStep {
  Workbench,
  SchemeDrawing, 
}

export enum RotationDirection {
  Clockwise = "По часовой",
  CounterClockwise = "Против часовой",
}

export enum ShaftOrientation {
  Horizontal = "horizontal",
  Vertical = "vertical",
}

// Новый enum для управления компоновкой параллельных передач
export enum ParallelLayoutType {
  Standard = 'standard', // Стандартное смещение (вниз для гор., влево для верт.)
  Inverted = 'inverted', // Инвертированное смещение (вверх для гор., вправо для верт.)
}

export interface EngineParams {
  initialTorque: number;
  initialMinRpm: number;
  initialMaxRpm: number;
  initialDirection: RotationDirection;
  initialOrientation: ShaftOrientation; 
}

export interface StageSetup {
  numGears: number;
}

export enum GearType {
  Gear = "Шестерня",
  Chain = "Цепь",
  Planetary = "Планетарная передача",
  ToothedBelt = "Зубчато-ременная передача",
  Belt = "Ременная передача",
  Bevel = "Коническая передача",
  Worm = "Червячная передача",
}

export const AVAILABLE_GEAR_TYPES: GearType[] = [
  GearType.Gear,
  GearType.Chain,
  GearType.Planetary,
  GearType.ToothedBelt,
  GearType.Belt,
  GearType.Bevel,
  GearType.Worm,
];

export enum PlanetaryShaftType {
  Sun = "Солнце",
  Carrier = "Водило",
  Ring = "Корона",
}
export const PLANETARY_SHAFT_OPTIONS = [PlanetaryShaftType.Sun, PlanetaryShaftType.Carrier, PlanetaryShaftType.Ring];

export enum PlanetaryConfig {
  SunToRing = "Солнце → Корона",
  RingToSun = "Корона → Солнце",
  SunToCarrier = "Солнце → Водило",
  CarrierToSun = "Водило → Солнце",
  CarrierToRing = "Водило → Корона",
  RingToCarrier = "Корона → Водило",
}

export const PLANETARY_CONFIG_MAP: Record<PlanetaryConfig, { in: PlanetaryShaftType; out: PlanetaryShaftType }> = {
  [PlanetaryConfig.SunToRing]: { in: PlanetaryShaftType.Sun, out: PlanetaryShaftType.Ring },
  [PlanetaryConfig.RingToSun]: { in: PlanetaryShaftType.Ring, out: PlanetaryShaftType.Sun },
  [PlanetaryConfig.SunToCarrier]: { in: PlanetaryShaftType.Sun, out: PlanetaryShaftType.Carrier },
  [PlanetaryConfig.CarrierToSun]: { in: PlanetaryShaftType.Carrier, out: PlanetaryShaftType.Sun },
  [PlanetaryConfig.CarrierToRing]: { in: PlanetaryShaftType.Carrier, out: PlanetaryShaftType.Ring },
  [PlanetaryConfig.RingToCarrier]: { in: PlanetaryShaftType.Ring, out: PlanetaryShaftType.Carrier },
};

export const PLANETARY_CONFIG_OPTIONS = Object.values(PlanetaryConfig);

// Тип конфигурации для УГО планетарной передачи
export enum PlanetaryGearConfigType {
  FixedRing = 'fixed-ring',
  FixedCarrier = 'fixed-carrier',
  FixedSun = 'fixed-sun',
}

// Обновленные типы для конических передач
export enum BevelGearConfigType {
  Config1 = "Инверсия (Схема 1)", 
  Config2 = "Сохранение (Схема 2)", 
  Config3 = "Сохранение (Схема 3)", 
}

// Новый enum для пространственного расположения УГО конической передачи
export enum BevelGearPlacement {
  LeftBottom = 'left-bottom',   // Вход слева, выход снизу
  LeftTop = 'left-top',         // Вход слева, выход сверху
  RightBottom = 'right-bottom', // Вход справа, выход снизу
  RightTop = 'right-top',       // Вход справа, выход сверху
}

// Новый enum для УГО источника мощности
export enum PowerSourceDirection {
  Right = 'right',
  Left = 'left',
  Up = 'up',
  Down = 'down',
}

export interface BevelGearConfigOption {
  value: BevelGearConfigType;
  label: string;
}

export const BEVEL_GEAR_CONFIG_OPTIONS: BevelGearConfigOption[] = [
    { value: BevelGearConfigType.Config1, label: BevelGearConfigType.Config1 },
    { value: BevelGearConfigType.Config2, label: BevelGearConfigType.Config2 },
    { value: BevelGearConfigType.Config3, label: BevelGearConfigType.Config3 },
];

export enum WormGearConfigType {
    TopApproach = 'worm-top',
    BottomApproach = 'worm-bottom',
}

export interface WormGearConfigOption {
    value: WormGearConfigType;
    label: string;
}

export const WORM_GEAR_CONFIG_OPTIONS: WormGearConfigOption[] = [
    { value: WormGearConfigType.TopApproach, label: 'Червяк сверху' },
    { value: WormGearConfigType.BottomApproach, label: 'Червяк снизу' },
];

export interface StageGearConfiguration {
    stageName: string;
    gearTypes: (GearType | null)[];
}

export interface BaseModuleInputParams {
    eta?: string;
}

export interface GearInputParams extends BaseModuleInputParams {
    z1: string;
    z2: string;
    m: string;
}

export interface ChainInputParams extends BaseModuleInputParams {
    z1: string;
    z2: string;
    p: string;
}

export interface PlanetaryInputParams extends BaseModuleInputParams {
    zSun: string;
    zRing: string;
    m: string;
    shaftConfig: PlanetaryConfig | "";
}

export interface ToothedBeltInputParams extends BaseModuleInputParams {
    z1: string;
    z2: string;
    p: string;
}

export interface BeltInputParams extends BaseModuleInputParams {
    d1: string;
    d2: string;
}

export interface BevelGearInputParams extends BaseModuleInputParams {
    z1: string;
    z2: string;
    config: BevelGearConfigType | "";
    m: string;
    b: string;
}

export interface WormGearInputParams extends BaseModuleInputParams {
    z1: string;
    z2: string;
    m: string;
    q: string;
    config: WormGearConfigType | "";
}

export type ModuleSpecificInputs =
    | GearInputParams
    | ChainInputParams
    | PlanetaryInputParams
    | ToothedBeltInputParams
    | BeltInputParams
    | BevelGearInputParams
    | WormGearInputParams;

export interface CascadeValues {
    torque: number;
    minRpm: number;
    maxRpm: number;
    direction: RotationDirection;
    orientation: ShaftOrientation;
}

export interface ModuleCalculationData {
    id: string;
    type: GearType;
    inputs: ModuleSpecificInputs;
    isSelected: boolean;
    layout?: ParallelLayoutType;
    isReversed?: boolean; // Добавлено для разворота на 180 градусов
    u?: number;
    // Cylindrical
    a?: number;
    d1?: number;
    d2?: number;
    da1?: number;
    da2?: number;
    df1?: number;
    df2?: number;
    // Chain
    chain_d1?: number;
    chain_d2?: number;
    chain_da1?: number;
    chain_da2?: number;
    chain_amin?: number;
    // Planetary
    zPlanet?: number;
    assemblyPossible?: boolean;
    fixedShaft?: PlanetaryShaftType | string;
    planetary_dSun?: number;
    planetary_dPlanet?: number;
    planetary_dRing?: number;
    planetary_a?: number;
    // Toothed Belt
    tb_d1?: number;
    tb_d2?: number;
    tb_amin?: number;
    // Belt
    belt_amin?: number;
    actual_d1?: number;
    actual_d2?: number;
    // Bevel
    bevel_d1?: number;
    bevel_d2?: number;
    bevel_delta1?: number;
    bevel_delta2?: number;
    bevel_Re?: number;
    bevel_dm1?: number;
    bevel_dm2?: number;
    // Worm
    worm_a?: number;
    worm_d1?: number;
    worm_d2?: number;
    worm_da1?: number;
    worm_da2?: number;
    worm_df2?: number;
    worm_gamma?: number;
    // Cascade
    cascadeIn?: CascadeValues;
    cascadeOut?: CascadeValues;
    moduleInDirection?: RotationDirection;
    moduleOutDirection?: RotationDirection;
    moduleInOrientation?: ShaftOrientation;
    moduleOutOrientation?: ShaftOrientation;
    error?: string;
    assemblyError?: string;
}

export interface StageCalculationData {
    id: string;
    stageName: string;
    modules: ModuleCalculationData[];
    stageError?: string;
}

export interface FinalCalculationResults {
    totalGearRatio: number;
    finalTorque: number;
    finalMinRpm: number;
    finalMaxRpm: number;
    finalDirection: RotationDirection;
    finalOrientation: ShaftOrientation;
    totalEfficiency: number;
}

export interface CalculationOutput {
    u: number;
    error?: string;
    assemblyError?: string;
    // Cylindrical
    a?: number;
    d1?: number;
    d2?: number;
    da1?: number;
    da2?: number;
    df1?: number;
    df2?: number;
    // Chain
    chain_d1?: number;
    chain_d2?: number;
    chain_da1?: number;
    chain_da2?: number;
    chain_amin?: number;
    // Planetary
    zPlanet?: number;
    assemblyPossible?: boolean;
    fixedShaft?: PlanetaryShaftType | string;
    planetary_dSun?: number;
    planetary_dPlanet?: number;
    planetary_dRing?: number;
    planetary_a?: number;
    // Toothed Belt
    tb_d1?: number;
    tb_d2?: number;
    tb_amin?: number;
    // Belt
    belt_amin?: number;
    actual_d1?: number;
    actual_d2?: number;
    // Bevel
    bevel_d1?: number;
    bevel_d2?: number;
    bevel_delta1?: number;
    bevel_delta2?: number;
    bevel_Re?: number;
    bevel_dm1?: number;
    bevel_dm2?: number;
    // Worm
    worm_a?: number;
    worm_d1?: number;
    worm_d2?: number;
    worm_da1?: number;
    worm_da2?: number;
    worm_df2?: number;
    worm_gamma?: number;
    // Out
    outDirection: RotationDirection;
    outOrientation: ShaftOrientation;
}

export type SpacerStyle = 'solid' | 'dashed' | 'cardan';

export interface SpacerShaft {
  type: 'spacer';
  id: string;
  length: number;
  style: SpacerStyle;
  comment?: string;
}

export type SchemeElement = (Partial<StageCalculationData> & { turn?: 'up' | 'down' | 'left' | 'right', comment?: string }) | SpacerShaft;
