import { EngineParams, RotationDirection, StageSetup, GearType, ShaftOrientation } from './types';

export const DEFAULT_ENGINE_PARAMS: EngineParams = {
  initialTorque: 100,
  initialMinRpm: 1000,
  initialMaxRpm: 6000,
  initialDirection: RotationDirection.Clockwise,
  initialOrientation: ShaftOrientation.Horizontal, // Добавлено
};

export const DEFAULT_STAGE_SETUPS: StageSetup[] = [{ numGears: 1 }, { numGears: 0 }];

export const GEAR_TYPE_BORDERS: Record<GearType, string> = {
  [GearType.Gear]: "border-blue-400",
  [GearType.Chain]: "border-purple-400",
  [GearType.Planetary]: "border-orange-400",
  [GearType.ToothedBelt]: "border-teal-400",
  [GearType.Belt]: "border-lime-400",
  [GearType.Bevel]: "border-indigo-400",
  [GearType.Worm]: "border-pink-400",
};

export const OUTPUT_FIELD_BG = "bg-green-200"; // Similar to RGB(146, 208, 80)
export const PLANETARY_SHAFT_INPUT_BG = "bg-amber-100"; // Lighter yellow for specific inputs

// Color constants for UI states
export const ERROR_BG_COLOR = "bg-red-100"; // Light red background for errors
export const ERROR_TEXT_COLOR = "text-red-700"; // Dark red text for error messages

// Стандартные значения для выпадающих списков
export const GEAR_MODULES: number[] = [0.5, 0.6, 0.8, 1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12, 16, 20, 25, 32, 40, 50];
export const CHAIN_PITCHES: number[] = [8.0, 9.525, 12.7, 15.875, 19.05, 25.4, 31.75, 38.1, 44.45, 50.8];
export const TOOTHED_BELT_PITCHES: number[] = [2, 2.5, 3, 5, 8, 10, 14, 20];
export const WORM_DIAMETER_COEFFICIENTS: number[] = [8, 10, 12.5, 16, 20, 25];

// База данных типовых КПД
export interface EfficiencyData {
  typical: number;
  range: string;
  description: string;
}

export const EFFICIENCY_DATABASE: Record<GearType, EfficiencyData> = {
  [GearType.Gear]: {
    typical: 0.98,
    range: '0.96 – 0.99',
    description: 'Для закрытых, хорошо смазываемых цилиндрических передач с качественными подшипниками.',
  },
  [GearType.Chain]: {
    typical: 0.95,
    range: '0.92 – 0.97',
    description: 'Зависит от качества смазки, натяжения и износа цепи.',
  },
  [GearType.Planetary]: {
    typical: 0.98,
    range: '0.97 – 0.99',
    description: 'Высокий КПД за счет распределения нагрузки между сателлитами.',
  },
  [GearType.ToothedBelt]: {
    typical: 0.96,
    range: '0.94 – 0.98',
    description: 'КПД практически не зависит от нагрузки, но чувствителен к натяжению ремня.',
  },
  [GearType.Belt]: {
    typical: 0.95,
    range: '0.94 – 0.96',
    description: 'Для клиноременных передач. КПД может снижаться из-за проскальзывания.',
  },
  [GearType.Bevel]: {
    typical: 0.97,
    range: '0.95 – 0.98',
    description: 'Для конических передач с прямым зубом. Передачи с круговым зубом могут иметь более высокий КПД.',
  },
  [GearType.Worm]: {
    typical: 0.70,
    range: '0.50 – 0.90',
    description: 'Сильно зависит от угла подъема винтовой линии (γ) и коэффициента трения. Низкие передаточные числа (u) и высокий угол подъема (γ) дают больший КПД.',
  },
};


// SVG Icon Definitions
const ICON_ROTATION_CW_H_SVG = `<svg version="1.2" baseProfile="tiny" width="210mm" height="297mm" viewBox="6200 3170 3070 1185" preserveAspectRatio="xMidYMid" fill-rule="evenodd" stroke-width="28.222" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve">
 <g visibility="visible" id="MasterSlide_1_Обычный_CW_H">
  <desc>Master slide CW_H</desc>
  <rect fill="none" stroke="none" x="0" y="0" width="21000" height="29700"/>
 </g>
 <g visibility="visible" id="Slide_1_page1_CW_H">
  <g id="DrawingGroup_1_CW_H">
   <g>
    <path fill="rgb(0,0,0)" stroke="none" d="M 8805,3406 L 8869,3474 8929,3534 8984,3584 9035,3626 9083,3662 9129,3692 9152,3706 9174,3718 9196,3729 9218,3739 9218,3784 9169,3810 9121,3839 9073,3871 9026,3906 8977,3948 8924,3998 8866,4057 8804,4125 8727,4125 8775,4030 8799,3987 8823,3947 8848,3910 8873,3876 8898,3844 8924,3816 7329,3816 7329,3715 8924,3715 8859,3630 8836,3598 8818,3571 8801,3543 8781,3506 8729,3406 8805,3406 Z"/>
    <rect fill="none" stroke="none" x="7329" y="3406" width="1890" height="720"/>
   </g>
   <g>
    <path fill="rgb(0,0,0)" stroke="none" d="M 7916,3483 L 7972,3469 8016,3456 8033,3449 8048,3444 8059,3438 8064,3435 8068,3433 8034,3402 8000,3377 7965,3355 7929,3337 7892,3322 7855,3311 7816,3303 7777,3298 7737,3296 7689,3298 7644,3305 7622,3309 7600,3315 7579,3322 7559,3330 7538,3339 7518,3349 7499,3361 7480,3373 7443,3401 7408,3433 7376,3468 7349,3504 7336,3523 7325,3543 7315,3563 7306,3583 7298,3604 7291,3625 7285,3647 7281,3669 7274,3714 7272,3762 7274,3809 7281,3855 7285,3877 7291,3899 7298,3920 7306,3941 7315,3961 7325,3981 7336,4001 7349,4020 7376,4056 7408,4091 7443,4123 7480,4151 7499,4163 7519,4175 7539,4185 7559,4194 7580,4202 7601,4209 7623,4215 7645,4219 7691,4226 7738,4228 7784,4226 7828,4219 7871,4209 7913,4194 7954,4175 7993,4151 8031,4123 8068,4091 8119,4142 8076,4179 8032,4211 7987,4238 7940,4261 7892,4278 7842,4290 7790,4298 7737,4300 7683,4298 7630,4290 7605,4285 7580,4278 7555,4270 7531,4261 7508,4250 7485,4239 7462,4226 7440,4211 7398,4179 7357,4143 7321,4102 7289,4060 7274,4038 7261,4015 7250,3992 7239,3969 7230,3945 7222,3920 7215,3895 7210,3869 7202,3817 7200,3762 7202,3707 7210,3655 7215,3629 7222,3604 7230,3580 7239,3556 7250,3532 7261,3509 7274,3487 7289,3465 7321,3422 7357,3382 7398,3345 7440,3313 7462,3299 7485,3286 7508,3274 7531,3263 7555,3254 7580,3246 7605,3239 7631,3234 7683,3226 7738,3224 7791,3226 7842,3234 7891,3246 7940,3263 7987,3286 8032,3313 8076,3345 8119,3382 8170,3230 8262,3576 7916,3483 Z"/>
    <rect fill="none" stroke="none" x="7200" y="3224" width="1064" height="1078"/>
   </g>
   <g>
    <path fill="rgb(0,0,0)" stroke="none" d="M 6257,3818 L 6257,3709 7128,3709 7128,3818 6257,3818 Z"/>
    <rect fill="none" stroke="none" x="6257" y="3709" width="872" height="111"/>
   </g>
  </g>
 </g>
</svg>`
const ICON_ROTATION_CCW_H_SVG = `<svg version="1.2" baseProfile="tiny" width="210mm" height="297mm" viewBox="4260 3070 2910 1185" preserveAspectRatio="xMidYMid" fill-rule="evenodd" stroke-width="28.222" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve">
 <g visibility="visible" id="MasterSlide_1_Обычный_CCW_H">
  <desc>Master slide CCW_H</desc>
  <rect fill="none" stroke="none" x="0" y="0" width="21000" height="29700"/>
 </g>
 <g visibility="visible" id="Slide_1_page1_CCW_H">
  <g id="DrawingGroup_1_CCW_H">
   <g>
    <path fill="rgb(0,0,0)" stroke="none" d="M 6705,3306 C 6794,3403 6870,3476 6935,3526 7000,3577 7061,3614 7118,3639 L 7118,3684 C 7052,3716 6988,3757 6926,3806 6864,3856 6790,3929 6704,4025 L 6627,4025 C 6690,3891 6755,3788 6824,3716 L 5229,3716 5229,3615 6824,3615 C 6773,3550 6738,3502 6718,3471 6698,3440 6668,3385 6629,3306 L 6705,3306 Z"/>
    <rect fill="none" stroke="none" x="5229" y="3306" width="1891" height="720"/>
   </g>
   <g>
    <path fill="rgb(0,0,0)" stroke="none" d="M 5816,3941 L 6162,3848 6070,4195 6019,4043 C 5907,4148 5780,4200 5638,4200 5489,4200 5362,4148 5257,4043 5152,3938 5100,3811 5100,3662 5100,3514 5152,3387 5257,3282 5362,3177 5489,3124 5637,3124 5780,3124 5908,3177 6019,3282 L 5968,3332 C 5872,3241 5762,3196 5638,3196 5509,3196 5399,3241 5308,3332 5217,3423 5172,3533 5172,3662 5172,3790 5217,3900 5308,3991 5399,4082 5509,4128 5637,4128 5728,4128 5812,4103 5890,4054 5943,4020 5970,3999 5968,3992 L 5816,3941 Z"/>
    <rect fill="none" stroke="none" x="5100" y="3124" width="1064" height="1078"/>
   </g>
   <g>
    <path fill="rgb(0,0,0)" stroke="none" d="M 4313,3718 C 4313,3685 4313,3652 4313,3619 4550,3619 4788,3619 5025,3619 5025,3652 5025,3685 5025,3718 4788,3718 4550,3718 4313,3718 Z"/>
    <rect fill="none" stroke="none" x="4312" y="3619" width="714" height="100"/>
   </g>
  </g>
 </g>
</svg>`;
const ICON_ROTATION_CW_V_SVG = `<svg version="1.2" baseProfile="tiny" width="210mm" height="297mm" viewBox="3760 3340 1595 3530" preserveAspectRatio="xMidYMid" fill-rule="evenodd" stroke-width="28.222" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve">
 <g visibility="visible" id="MasterSlide_1_Обычный_CW_V">
  <desc>Master slide CW_V</desc>
  <rect fill="none" stroke="none" x="0" y="0" width="21000" height="29700"/>
 </g>
 <g visibility="visible" id="Slide_1_page1_CW_V">
  <g id="DrawingGroup_1_CW_V">
   <g>
    <path fill="rgb(0,0,0)" stroke="none" d="M 4089,3969 C 4222,3847 4323,3741 4393,3652 4462,3563 4514,3479 4548,3400 L 4611,3400 C 4654,3491 4710,3579 4778,3665 4847,3750 4947,3852 5080,3970 L 5080,4077 C 4895,3990 4753,3900 4654,3805 L 4654,5836 4515,5836 4515,3805 C 4426,3875 4361,3924 4317,3951 4273,3979 4197,4020 4089,4074 L 4089,3969 Z"/>
    <rect fill="none" stroke="none" x="4088" y="3399" width="993" height="2439"/>
   </g>
   <g>
    <path fill="rgb(0,0,0)" stroke="none" d="M 4175,5014 C 4147,4901 4124,4831 4106,4804 L 4063,4851 C 3966,4975 3917,5111 3917,5261 3917,5437 3980,5588 4106,5713 4231,5838 4382,5901 4559,5901 4736,5901 4888,5838 5013,5713 5139,5588 5201,5437 5201,5259 5201,5089 5139,4937 5013,4804 L 5083,4734 C 5228,4888 5300,5063 5300,5260 5300,5464 5228,5639 5084,5783 4939,5928 4764,6000 4559,6000 4355,6000 4181,5928 4036,5783 3891,5639 3818,5464 3818,5259 3818,5063 3891,4888 4036,4734 L 3826,4664 4303,4537 4175,5014 Z"/>
    <rect fill="none" stroke="none" x="3818" y="4536" width="1484" height="1465"/>
   </g>
   <g>
    <path fill="rgb(0,0,0)" stroke="none" d="M 4508,6819 C 4508,6579 4508,6340 4508,6100 4555,6100 4602,6100 4649,6100 4649,6340 4649,6579 4649,6819 4602,6819 4555,6819 4508,6819 Z"/>
    <rect fill="none" stroke="none" x="4508" y="6100" width="142" height="720"/>
   </g>
  </g>
 </g>
</svg>`;
const ICON_ROTATION_CCW_V_SVG = `<svg version="1.2" baseProfile="tiny" width="210mm" height="297mm" viewBox="2560 2380 1595 3740" preserveAspectRatio="xMidYMid" fill-rule="evenodd" stroke-width="28.222" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve">
 <g visibility="visible" id="MasterSlide_1_Обычный_CCW_V">
  <desc>Master slide CCW_V</desc>
  <rect fill="none" stroke="none" x="0" y="0" width="21000" height="29700"/>
 </g>
 <g visibility="visible" id="Slide_1_page1_CCW_V">
  <g id="DrawingGroup_1_CCW_V">
   <g>
    <path fill="rgb(0,0,0)" stroke="none" d="M 3744,4077 L 3616,3600 4093,3727 3884,3797 C 4028,3951 4100,4126 4100,4322 4100,4527 4028,4702 3884,4846 3739,4991 3564,5063 3359,5063 3155,5063 2981,4991 2836,4846 2691,4702 2618,4527 2618,4323 2618,4126 2691,3951 2836,3797 L 2905,3867 C 2780,4000 2717,4152 2717,4322 2717,4500 2780,4651 2905,4776 3030,4901 3181,4964 3359,4964 3536,4964 3687,4901 3813,4776 3938,4651 4001,4500 4001,4324 4001,4198 3967,4082 3900,3975 3853,3901 3824,3865 3814,3867 L 3744,4077 Z"/>
    <rect fill="none" stroke="none" x="2618" y="3599" width="1484" height="1466"/>
   </g>
   <g>
    <path fill="rgb(0,0,0)" stroke="none" d="M 2861,3006 C 2994,2884 3095,2778 3165,2689 3234,2600 3286,2516 3320,2437 L 3383,2437 C 3426,2528 3482,2616 3550,2702 3619,2787 3719,2889 3852,3007 L 3852,3114 C 3667,3027 3525,2937 3426,2842 L 3426,4873 3287,4873 3287,2842 C 3198,2912 3133,2961 3089,2988 3045,3016 2969,3057 2861,3111 L 2861,3006 Z"/>
    <rect fill="none" stroke="none" x="2860" y="2436" width="993" height="2439"/>
   </g>
   <g>
    <path fill="rgb(0,0,0)" stroke="none" d="M 3279,6063 C 3279,5769 3279,5475 3279,5181 3329,5181 3378,5181 3428,5181 3428,5475 3428,5769 3428,6063 3378,6063 3329,6063 3279,6063 Z"/>
    <rect fill="none" stroke="none" x="3279" y="5181" width="150" height="883"/>
   </g>
  </g>
 </g>
</svg>`;

// Helper function to get icon data URI based on direction and orientation
export const getRotationIconPath = (direction: RotationDirection, orientation: ShaftOrientation): string => {
  let svgString = '';
  if (orientation === ShaftOrientation.Horizontal) {
    svgString = direction === RotationDirection.Clockwise ? ICON_ROTATION_CW_H_SVG : ICON_ROTATION_CCW_H_SVG;
  } else { // ShaftOrientation.Vertical
    svgString = direction === RotationDirection.Clockwise ? ICON_ROTATION_CW_V_SVG : ICON_ROTATION_CCW_V_SVG;
  }
  
  // Encode URI components to handle UTF-8, then unescape to get a string btoa can handle.
  const preparedSvgString = unescape(encodeURIComponent(svgString.trim()));
  return `data:image/svg+xml;base64,${btoa(preparedSvgString)}`;
};