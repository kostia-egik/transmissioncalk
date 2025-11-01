import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
    ModuleCalculationData, GearType, GearInputParams, ChainInputParams, PlanetaryInputParams, CascadeValues, RotationDirection,
    ToothedBeltInputParams, BeltInputParams, BevelGearInputParams, WormGearInputParams, ShaftOrientation, PlanetaryConfig, PlanetaryGearConfigType,
    AVAILABLE_GEAR_TYPES, PLANETARY_CONFIG_MAP, PLANETARY_SHAFT_OPTIONS, PLANETARY_CONFIG_OPTIONS, BEVEL_GEAR_CONFIG_OPTIONS, WORM_GEAR_CONFIG_OPTIONS,
    ModuleSpecificInputs, ValidationMessage
} from '../../types';
import Select from '../Select';
import Button from '../Button';
import {
    ERROR_TEXT_COLOR, getRotationIconPath, PLANETARY_SHAFT_INPUT_BG, GEAR_MODULES, CHAIN_PITCHES,
    TOOTHED_BELT_PITCHES, WORM_DIAMETER_COEFFICIENTS, EFFICIENCY_DATABASE
} from '../../constants';
import { BevelGearUGO } from '../../ugo-components/BevelGearUGO';
import { WormDriveUGO } from '../../ugo-components/WormDriveUGO';
import { PlanetaryGearUGO } from '../../ugo-components/PlanetaryGearUGO';
import InputWithControls from '../InputWithControls';
import { SelectOrInput } from '../SelectOrInput';
import { CustomSelect } from '../CustomSelect';
import { TooltipContent, TOOLTIP_DATA } from '../../tooltip-data';
import { useLanguage } from '../../contexts/LanguageContext';

// --- Local Components & Helpers ---

const CrossIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>);
const ChevronIcon = ({ isExpanded }: { isExpanded: boolean }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
);
const KebabMenuIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 16 16">
        <path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0"/>
    </svg>
);

const InfoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 inline-block ml-1 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

// FIX: Create a helper function to resolve ValidationMessage objects into strings.
const resolveValidationMessage = (message: ValidationMessage | undefined, t: (key: any, replacements?: any) => string): string | undefined => {
    if (!message) return undefined;
    if (typeof message === 'string') return message;
    return t(message.key as any, message.replacements);
};

const CalculatedParamsDisplay: React.FC<{ params: Record<string, string | number | undefined | boolean>, warnings?: Record<string, ValidationMessage>, onParamClick: (content: TooltipContent, target: HTMLElement) => void }> = ({ params, warnings, onParamClick }) => {
    const { t } = useLanguage();
    return (
        <div className="mt-2 pt-2 border-t border-gray-400 font-semibold text-xs leading-snug">
            <h5 className="text-gray-600 mb-1">{t('module_calculated_params_title')}</h5>
            {Object.entries(params).map(([dataKey, value]) => {
                if (value === undefined || value === '' || value === null) return null;
                
                const hasTooltip = dataKey && TOOLTIP_DATA[dataKey];
                const label = t(`calc_param_${dataKey}` as any);
                const warningMessage = warnings ? resolveValidationMessage(warnings[dataKey], t) : undefined;

                const content = (
                    <p className="text-gray-700">
                        {label}: {typeof value === 'number' ? value.toFixed(value % 1 === 0 ? 0 : 4) : String(value)}
                        {warningMessage && <span className="ml-1 text-orange-600 font-bold" title={warningMessage}>(i)</span>}
                    </p>
                );

                if (hasTooltip) {
                    return (
                        <div key={dataKey} onClick={(e) => {
                            e.stopPropagation();
                            const contentKeys = TOOLTIP_DATA[dataKey];
                            if (contentKeys) {
                                onParamClick({
                                    title: t(contentKeys.titleKey as any),
                                    description: t(contentKeys.descriptionKey as any),
                                    unit: contentKeys.unit
                                }, e.currentTarget);
                            }
                        }} className="p-0.5 -m-0.5 rounded hover:bg-gray-100 cursor-pointer transition-colors duration-150">
                            {content}
                        </div>
                    );
                }
                return <div key={dataKey}>{content}</div>;
            })}
        </div>
    );
};

const handleNumericInputWithControls = (
    currentValue: string | number,
    delta: number,
    setter: (value: string | number) => void,
    min: number = -Infinity
) => {
    const numValue = parseFloat(String(currentValue).replace(',', '.')) || 0;
    const newValue = numValue + delta;
    setter(Math.max(newValue, min));
};

const StageCharacteristicsDisplay: React.FC<{ cascade?: CascadeValues, title: string, dir?: RotationDirection, orientation?: ShaftOrientation }> = ({ cascade, title, dir, orientation }) => { 
    const { t } = useLanguage();
    if (!cascade) return null; 
    let iconElement = null; 
    if (dir && orientation) { 
        const iconPath = getRotationIconPath(dir, orientation); 
        const altText = `${t('module_cascade_direction')}: ${dir}, ${t('module_cascade_orientation')}: ${orientation === ShaftOrientation.Horizontal ? t('orientation_horizontal') : t('orientation_vertical')}`; 
        iconElement = (<img src={iconPath} alt={altText} title={altText} className="w-8 h-8 inline-block ml-1 align-middle" />); 
    } 
    return (
        <div className="mt-2 pt-2 border-t border-gray-300 text-xs leading-snug">
            <h5 className="font-semibold text-gray-600 mb-0.5">{title}:</h5>
            <p className="text-gray-800">{t('module_cascade_torque')} {cascade.torque.toFixed(2)} Нм</p>
            <p className="text-gray-800">{t('module_cascade_min_rpm')} {cascade.minRpm.toFixed(0)}</p>
            <p className="text-gray-800">{t('module_cascade_max_rpm')} {cascade.maxRpm.toFixed(0)}</p> 
            {iconElement ? (<div className="text-gray-800 flex items-center">{t('module_cascade_direction')} {iconElement}</div>) : dir ? (<p className="text-gray-800">{t('module_cascade_direction')} {dir} ({t('orientation_not_applicable')})</p>) : null}
        </div>
    ); 
};

// --- Module Display Components ---

interface ModuleDisplayProps {
    moduleData: ModuleCalculationData;
    stageIndex: number;
    moduleIndex: number;
    onInputChange: (stageIdx: number, moduleIdx: number, field: string, value: string | number) => void;
    onSelectChange?: (stageIdx: number, moduleIdx: number, field: string, value: any) => void;
    isExpanded: boolean;
    onParamClick: (content: TooltipContent, target: HTMLElement) => void;
    isFieldSuccessful: (field: string) => boolean;
}

const GearModuleDisplay: React.FC<ModuleDisplayProps> = ({ moduleData, stageIndex, moduleIndex, onInputChange, isExpanded, onParamClick, isFieldSuccessful }) => { 
    const { t } = useLanguage();
    const inputs = moduleData.inputs as GearInputParams; 
    const { errors = {}, warnings = {} } = moduleData.validationState || {}; 
    const calculated = { a: moduleData.a, d1: moduleData.d1, d2: moduleData.d2, da1: moduleData.da1, da2: moduleData.da2, df1: moduleData.df1, df2: moduleData.df2, epsilonAlpha: moduleData.epsilonAlpha }; 
    
    const onBlurHandler = (field: 'z1' | 'z2') => (e: React.FocusEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const numValue = parseFloat(String(value).replace(',', '.'));
        if (isNaN(numValue) || String(value).trim() === '') return;
        const roundedValue = Math.round(numValue);
        if (roundedValue !== numValue) {
            onInputChange(stageIndex, moduleIndex, field, roundedValue);
        }
    };

    const etaData = EFFICIENCY_DATABASE[moduleData.type];
    const typicalEta = etaData.typical;
    const etaOptions = [...new Set([Number((typicalEta - 0.02).toFixed(2)), Number((typicalEta - 0.01).toFixed(2)), typicalEta, Number((typicalEta + 0.01).toFixed(2))].filter(v => v > 0 && v <= 1))];
    const etaLabel = (<span className="group flex items-center">{t('module_input_efficiency_eta')} <InfoIcon /></span>);
    
    // FIX: Create a handler that translates tooltip keys before calling onParamClick.
    const handleLabelClick = (key: string) => (target: HTMLElement) => {
        const contentKeys = TOOLTIP_DATA[key];
        if (contentKeys) {
            onParamClick({
                title: t(contentKeys.titleKey as any),
                description: t(contentKeys.descriptionKey as any),
                unit: contentKeys.unit
            }, target);
        }
    };

    return (<div onClick={e => e.stopPropagation()}><div className="grid grid-cols-2 gap-2"><InputWithControls id={`${moduleData.id}-z1`} isSuccess={isFieldSuccessful('z1')} onBlur={onBlurHandler('z1')} error={resolveValidationMessage(errors.z1, t)} warning={resolveValidationMessage(warnings.z1, t)} onLabelClick={handleLabelClick('z1')} label={t('module_input_z1_leading')} value={inputs.z1} onChange={(e) => onInputChange(stageIndex, moduleIndex, 'z1', e.target.value)} onIncrement={() => handleNumericInputWithControls(inputs.z1, 1, (v) => onInputChange(stageIndex, moduleIndex, 'z1', v))} onDecrement={() => handleNumericInputWithControls(inputs.z1, -1, (v) => onInputChange(stageIndex, moduleIndex, 'z1', v), 0)} inputClassName={`text-gray-800`}/> <InputWithControls id={`${moduleData.id}-z2`} isSuccess={isFieldSuccessful('z2')} onBlur={onBlurHandler('z2')} error={resolveValidationMessage(errors.z2, t)} warning={resolveValidationMessage(warnings.z2, t)} onLabelClick={handleLabelClick('z2')} label={t('module_input_z2_driven')} value={inputs.z2} onChange={(e) => onInputChange(stageIndex, moduleIndex, 'z2', e.target.value)} onIncrement={() => handleNumericInputWithControls(inputs.z2, 1, (v) => onInputChange(stageIndex, moduleIndex, 'z2', v))} onDecrement={() => handleNumericInputWithControls(inputs.z2, -1, (v) => onInputChange(stageIndex, moduleIndex, 'z2', v), 0)} inputClassName={`text-gray-800`}/></div> {isExpanded && <div className="pt-2 border-t mt-2 space-y-1"><div className="max-w-24"><SelectOrInput id={`${moduleData.id}-m`} isSuccess={isFieldSuccessful('m')} min={0} onLabelClick={handleLabelClick('m')} label={t('module_input_module_m')} options={GEAR_MODULES} value={inputs.m} onChange={(v) => onInputChange(stageIndex, moduleIndex, 'm', v)} inputClassName={`text-gray-800`} selectClassName={`text-gray-800`} /></div> <div className="max-w-32"><SelectOrInput id={`${moduleData.id}-eta`} label={etaLabel} options={etaOptions} value={inputs.eta ?? ''} onChange={v => onInputChange(stageIndex, moduleIndex, 'eta', v)} onLabelClick={target => { const contentKeys = TOOLTIP_DATA['eta']; if(!contentKeys) return; const dynamicTooltipContent: TooltipContent = { title: t(contentKeys.titleKey as any), description: `${t(contentKeys.descriptionKey as any)} \n\n${t('efficiency_for_type_label', {type: t(`gear_type_${moduleData.type}`)})}: ${t(etaData.descriptionKey as any)} ${t('efficiency_typical_range_label')}: ${etaData.range}.`, unit: contentKeys.unit }; onParamClick(dynamicTooltipContent, target); }} error={resolveValidationMessage(errors.eta, t)} isSuccess={isFieldSuccessful('eta')} /></div> <CalculatedParamsDisplay params={calculated} warnings={warnings} onParamClick={onParamClick}/></div>}</div>);};
const ChainModuleDisplay: React.FC<ModuleDisplayProps> = ({ moduleData, stageIndex, moduleIndex, onInputChange, isExpanded, onParamClick, isFieldSuccessful }) => { 
    const { t } = useLanguage();
    const inputs = moduleData.inputs as ChainInputParams; 
    const { errors = {}, warnings = {} } = moduleData.validationState || {}; 
    const calculated = { chain_d1: moduleData.chain_d1, chain_d2: moduleData.chain_d2, chain_da1: moduleData.chain_da1, chain_da2: moduleData.chain_da2, chain_amin: moduleData.chain_amin, }; 
    const paramWarnings = { chain_amin: { key: 'calc_param_warning_amin' } as ValidationMessage }; 
    
    const onBlurHandler = (field: 'z1' | 'z2') => (e: React.FocusEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const numValue = parseFloat(String(value).replace(',', '.'));
        if (isNaN(numValue) || String(value).trim() === '') return;
        const roundedValue = Math.round(numValue);
        if (roundedValue !== numValue) {
            onInputChange(stageIndex, moduleIndex, field, roundedValue);
        }
    };

    const etaData = EFFICIENCY_DATABASE[moduleData.type];
    const typicalEta = etaData.typical;
    const etaOptions = [...new Set([Number((typicalEta - 0.02).toFixed(2)), Number((typicalEta - 0.01).toFixed(2)), typicalEta, Number((typicalEta + 0.01).toFixed(2))].filter(v => v > 0 && v <= 1))];
    const etaLabel = (<span className="group flex items-center">{t('module_input_efficiency_eta')} <InfoIcon /></span>);
    
    // FIX: Create a handler that translates tooltip keys before calling onParamClick.
    const handleLabelClick = (key: string) => (target: HTMLElement) => {
        const contentKeys = TOOLTIP_DATA[key];
        if (contentKeys) {
            onParamClick({
                title: t(contentKeys.titleKey as any),
                description: t(contentKeys.descriptionKey as any),
                unit: contentKeys.unit
            }, target);
        }
    };
    
    return (<div onClick={e => e.stopPropagation()}><div className="grid grid-cols-2 gap-2"><InputWithControls id={`${moduleData.id}-z1`} isSuccess={isFieldSuccessful('z1')} onBlur={onBlurHandler('z1')} error={resolveValidationMessage(errors.z1, t)} warning={resolveValidationMessage(warnings.z1, t)} onLabelClick={handleLabelClick('z1')} label={t('module_input_z1_leading')} value={inputs.z1} onChange={(e) => onInputChange(stageIndex, moduleIndex, 'z1', e.target.value)} onIncrement={() => handleNumericInputWithControls(inputs.z1, 1, (v) => onInputChange(stageIndex, moduleIndex, 'z1', v))} onDecrement={() => handleNumericInputWithControls(inputs.z1, -1, (v) => onInputChange(stageIndex, moduleIndex, 'z1', v), 0)} inputClassName={`text-gray-800`} /> <InputWithControls id={`${moduleData.id}-z2`} isSuccess={isFieldSuccessful('z2')} onBlur={onBlurHandler('z2')} error={resolveValidationMessage(errors.z2, t)} warning={resolveValidationMessage(warnings.z2, t)} onLabelClick={handleLabelClick('z2')} label={t('module_input_z2_driven')} value={inputs.z2} onChange={(e) => onInputChange(stageIndex, moduleIndex, 'z2', e.target.value)} onIncrement={() => handleNumericInputWithControls(inputs.z2, 1, (v) => onInputChange(stageIndex, moduleIndex, 'z2', v))} onDecrement={() => handleNumericInputWithControls(inputs.z2, -1, (v) => onInputChange(stageIndex, moduleIndex, 'z2', v), 0)} inputClassName={`text-gray-800`} /></div> {isExpanded && <div className="pt-2 border-t mt-2 space-y-1"><div className="max-w-24"><SelectOrInput id={`${moduleData.id}-p`} isSuccess={isFieldSuccessful('p')} min={0} onLabelClick={handleLabelClick('p')} label={t('module_input_chain_pitch_p')} options={CHAIN_PITCHES} value={inputs.p} onChange={(v) => onInputChange(stageIndex, moduleIndex, 'p', v)} inputClassName={`text-gray-800`} selectClassName={`text-gray-800`} /></div> <div className="max-w-32"><SelectOrInput id={`${moduleData.id}-eta`} label={etaLabel} options={etaOptions} value={inputs.eta ?? ''} onChange={v => onInputChange(stageIndex, moduleIndex, 'eta', v)} onLabelClick={target => { const contentKeys = TOOLTIP_DATA['eta']; if(!contentKeys) return; const dynamicTooltipContent: TooltipContent = { title: t(contentKeys.titleKey as any), description: `${t(contentKeys.descriptionKey as any)} \n\n${t('efficiency_for_type_label', {type: t(`gear_type_${moduleData.type}`)})}: ${t(etaData.descriptionKey as any)} ${t('efficiency_typical_range_label')}: ${etaData.range}.`, unit: contentKeys.unit }; onParamClick(dynamicTooltipContent, target); }} error={resolveValidationMessage(errors.eta, t)} isSuccess={isFieldSuccessful('eta')} /></div> <CalculatedParamsDisplay params={calculated} warnings={paramWarnings} onParamClick={onParamClick}/></div>}</div>);};
const PlanetaryModuleDisplay: React.FC<ModuleDisplayProps> = ({ moduleData, stageIndex, moduleIndex, onInputChange, onSelectChange, isExpanded, onParamClick, isFieldSuccessful }) => { 
    const { t } = useLanguage();
    const inputs = moduleData.inputs as PlanetaryInputParams;
    const { errors = {}, warnings = {} } = moduleData.validationState || {};
    // FIX: Resolve the assemblyError ValidationMessage to a string for display.
    const assemblyText = moduleData.assemblyPossible === false
        ? (resolveValidationMessage(errors.zSun, t) || (moduleData.zPlanet !== undefined ? t('calc_param_assembly_impossible') : ""))
        : t('calc_param_assembly_possible');
    
    // FIX: Ensure all properties of the `calculated` object are valid for the CalculatedParamsDisplay component.
    const calculated: Record<string, string | number | boolean | undefined> = { zPlanet: moduleData.zPlanet, assemblyPossible: assemblyText, planetary_dSun: moduleData.planetary_dSun, planetary_dPlanet: moduleData.planetary_dPlanet, planetary_dRing: moduleData.planetary_dRing, planetary_a: moduleData.planetary_a, fixedShaft: moduleData.fixedShaft, epsilon_sp: moduleData.epsilon_sp, epsilon_pr: moduleData.epsilon_pr }; 
    
    const onBlurHandler = (field: 'zSun' | 'zRing') => (e: React.FocusEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const numValue = parseFloat(String(value).replace(',', '.'));
        if (isNaN(numValue) || String(value).trim() === '') return;
        const roundedValue = Math.round(numValue);
        if (roundedValue !== numValue) {
            onInputChange(stageIndex, moduleIndex, field, roundedValue);
        }
    };

    const customSelectOptions = PLANETARY_CONFIG_OPTIONS.map(configValue => {
        let ugoConfigType: PlanetaryGearConfigType | null = null;
        let isMirrored = false;
        const shaftMap = PLANETARY_CONFIG_MAP[configValue];
        if (shaftMap) {
            const { in: inShaft, out: outShaft } = shaftMap;
            const fixedShaft = PLANETARY_SHAFT_OPTIONS.find(s => s !== inShaft && s !== outShaft);
            switch (fixedShaft) {
                case "Солнце": ugoConfigType = PlanetaryGearConfigType.FixedSun; break;
                case "Водило": ugoConfigType = PlanetaryGearConfigType.FixedCarrier; break;
                case "Корона": ugoConfigType = PlanetaryGearConfigType.FixedRing; break;
            }
        }
        switch (configValue) {
            case PlanetaryConfig.CarrierToSun:
            case PlanetaryConfig.RingToSun:
            case PlanetaryConfig.CarrierToRing:
                isMirrored = true;
                break;
            default:
                isMirrored = false;
        }

        return {
            value: configValue,
            label: t(`planetary_config_${configValue}` as any),
            previewComponent: ugoConfigType ? (
                <div className="w-[100px] h-[100px] flex items-center justify-center">
                    <PlanetaryGearUGO
                        width={100}
                        height={100}
                        zSun={Number(inputs.zSun) || 20}
                        zPlanet={moduleData.zPlanet || 20}
                        configType={ugoConfigType}
                        mirrored={isMirrored}
                    />
                </div>
            ) : null,
        };
    });

    const etaData = EFFICIENCY_DATABASE[moduleData.type];
    const typicalEta = etaData.typical;
    const etaOptions = [...new Set([Number((typicalEta - 0.02).toFixed(2)), Number((typicalEta - 0.01).toFixed(2)), typicalEta, Number((typicalEta + 0.01).toFixed(2))].filter(v => v > 0 && v <= 1))];
    const etaLabel = (<span className="group flex items-center">{t('module_input_efficiency_eta')} <InfoIcon /></span>);

    // FIX: Create a handler that translates tooltip keys before calling onParamClick.
    const handleLabelClick = (key: string) => (target: HTMLElement) => {
        const contentKeys = TOOLTIP_DATA[key];
        if (contentKeys) {
            onParamClick({
                title: t(contentKeys.titleKey as any),
                description: t(contentKeys.descriptionKey as any),
                unit: contentKeys.unit
            }, target);
        }
    };

    return (<div onClick={e => e.stopPropagation()}><div className="grid grid-cols-2 gap-2"><InputWithControls id={`${moduleData.id}-zSun`} isSuccess={isFieldSuccessful('zSun')} onBlur={onBlurHandler('zSun')} error={resolveValidationMessage(errors.zSun, t)} warning={resolveValidationMessage(warnings.zSun, t)} onLabelClick={handleLabelClick('zSun')} label={t('module_input_z_sun')} value={inputs.zSun} onChange={(e) => onInputChange(stageIndex, moduleIndex, 'zSun', e.target.value)} onIncrement={() => handleNumericInputWithControls(inputs.zSun, 1, (v) => onInputChange(stageIndex, moduleIndex, 'zSun', v))} onDecrement={() => handleNumericInputWithControls(inputs.zSun, -1, (v) => onInputChange(stageIndex, moduleIndex, 'zSun', v), 0)} inputClassName={`text-gray-800`} /> <InputWithControls id={`${moduleData.id}-zRing`} isSuccess={isFieldSuccessful('zRing')} onBlur={onBlurHandler('zRing')} error={resolveValidationMessage(errors.zRing, t)} warning={resolveValidationMessage(warnings.zRing, t)} onLabelClick={handleLabelClick('zRing')} label={t('module_input_z_ring')} value={inputs.zRing} onChange={(e) => onInputChange(stageIndex, moduleIndex, 'zRing', e.target.value)} onIncrement={() => handleNumericInputWithControls(inputs.zRing, 1, (v) => onInputChange(stageIndex, moduleIndex, 'zRing', v))} onDecrement={() => handleNumericInputWithControls(inputs.zRing, -1, (v) => onInputChange(stageIndex, moduleIndex, 'zRing', v), 0)} inputClassName={`text-gray-800`} /></div> <CustomSelect id={`${moduleData.id}-shaftConfig`} isSuccess={isFieldSuccessful('shaftConfig')} error={resolveValidationMessage(errors.shaftConfig, t)} onLabelClick={handleLabelClick('shaftConfig')} label={t('module_input_shaft_config')} value={inputs.shaftConfig || ""} onChange={(val) => onSelectChange?.(stageIndex, moduleIndex, 'shaftConfig', val as PlanetaryConfig)} options={customSelectOptions} emptyOptionLabel="-- Выбрать --" className="!mb-1" selectClassName={`${PLANETARY_SHAFT_INPUT_BG} text-gray-800 !py-1 !text-sm`} /> {isExpanded && <div className="pt-2 border-t mt-2 space-y-1"><div className="max-w-24"><SelectOrInput id={`${moduleData.id}-m`} isSuccess={isFieldSuccessful('m')} min={0} onLabelClick={handleLabelClick('m')} label={t('module_input_module_m')} options={GEAR_MODULES} value={inputs.m} onChange={(v) => onInputChange(stageIndex, moduleIndex, 'm', v)} inputClassName={`text-gray-800`} selectClassName={`text-gray-800`} /></div> <div className="max-w-32"><SelectOrInput id={`${moduleData.id}-eta`} label={etaLabel} options={etaOptions} value={inputs.eta ?? ''} onChange={v => onInputChange(stageIndex, moduleIndex, 'eta', v)} onLabelClick={target => { const contentKeys = TOOLTIP_DATA['eta']; if(!contentKeys) return; const dynamicTooltipContent: TooltipContent = { title: t(contentKeys.titleKey as any), description: `${t(contentKeys.descriptionKey as any)} \n\n${t('efficiency_for_type_label', {type: t(`gear_type_${moduleData.type}`)})}: ${t(etaData.descriptionKey as any)} ${t('efficiency_typical_range_label')}: ${etaData.range}.`, unit: contentKeys.unit }; onParamClick(dynamicTooltipContent, target); }} error={resolveValidationMessage(errors.eta, t)} isSuccess={isFieldSuccessful('eta')} /></div> <CalculatedParamsDisplay params={calculated} warnings={warnings} onParamClick={onParamClick}/></div>}</div>);
};
const ToothedBeltModuleDisplay: React.FC<ModuleDisplayProps> = ({ moduleData, stageIndex, moduleIndex, onInputChange, isExpanded, onParamClick, isFieldSuccessful }) => { 
    const { t } = useLanguage();
    const inputs = moduleData.inputs as ToothedBeltInputParams; 
    const { errors = {}, warnings = {} } = moduleData.validationState || {}; 
    const calculated = { tb_d1: moduleData.tb_d1, tb_d2: moduleData.tb_d2, tb_amin: moduleData.tb_amin, }; 
    const paramWarnings = { tb_amin: { key: 'calc_param_warning_tb_amin' } as ValidationMessage }; 
    
    const onBlurHandler = (field: 'z1' | 'z2') => (e: React.FocusEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const numValue = parseFloat(String(value).replace(',', '.'));
        if (isNaN(numValue) || String(value).trim() === '') return;
        const roundedValue = Math.round(numValue);
        if (roundedValue !== numValue) {
            onInputChange(stageIndex, moduleIndex, field, roundedValue);
        }
    };

    const etaData = EFFICIENCY_DATABASE[moduleData.type];
    const typicalEta = etaData.typical;
    const etaOptions = [...new Set([Number((typicalEta - 0.02).toFixed(2)), Number((typicalEta - 0.01).toFixed(2)), typicalEta, Number((typicalEta + 0.01).toFixed(2))].filter(v => v > 0 && v <= 1))];
    const etaLabel = (<span className="group flex items-center">{t('module_input_efficiency_eta')} <InfoIcon /></span>);

    // FIX: Create a handler that translates tooltip keys before calling onParamClick.
    const handleLabelClick = (key: string) => (target: HTMLElement) => {
        const contentKeys = TOOLTIP_DATA[key];
        if (contentKeys) {
            onParamClick({
                title: t(contentKeys.titleKey as any),
                description: t(contentKeys.descriptionKey as any),
                unit: contentKeys.unit
            }, target);
        }
    };

    return (<div onClick={e => e.stopPropagation()}><div className="grid grid-cols-2 gap-2"><InputWithControls id={`${moduleData.id}-z1`} isSuccess={isFieldSuccessful('z1')} onBlur={onBlurHandler('z1')} error={resolveValidationMessage(errors.z1, t)} warning={resolveValidationMessage(warnings.z1, t)} onLabelClick={handleLabelClick('z1')} label={t('module_input_z1_leading')} value={inputs.z1} onChange={(e) => onInputChange(stageIndex, moduleIndex, 'z1', e.target.value)} onIncrement={() => handleNumericInputWithControls(inputs.z1, 1, (v) => onInputChange(stageIndex, moduleIndex, 'z1', v))} onDecrement={() => handleNumericInputWithControls(inputs.z1, -1, (v) => onInputChange(stageIndex, moduleIndex, 'z1', v), 0)} inputClassName={`text-gray-800`} /> <InputWithControls id={`${moduleData.id}-z2`} isSuccess={isFieldSuccessful('z2')} onBlur={onBlurHandler('z2')} error={resolveValidationMessage(errors.z2, t)} warning={resolveValidationMessage(warnings.z2, t)} onLabelClick={handleLabelClick('z2')} label={t('module_input_z2_driven')} value={inputs.z2} onChange={(e) => onInputChange(stageIndex, moduleIndex, 'z2', e.target.value)} onIncrement={() => handleNumericInputWithControls(inputs.z2, 1, (v) => onInputChange(stageIndex, moduleIndex, 'z2', v))} onDecrement={() => handleNumericInputWithControls(inputs.z2, -1, (v) => onInputChange(stageIndex, moduleIndex, 'z2', v), 0)} inputClassName={`text-gray-800`} /></div> {isExpanded && <div className="pt-2 border-t mt-2 space-y-1"><div className="max-w-24"><SelectOrInput id={`${moduleData.id}-p`} isSuccess={isFieldSuccessful('p')} min={0} onLabelClick={handleLabelClick('p')} label={t('module_input_belt_pitch_p')} options={TOOTHED_BELT_PITCHES} value={inputs.p} onChange={(v) => onInputChange(stageIndex, moduleIndex, 'p', v)} inputClassName={`text-gray-800`} selectClassName={`text-gray-800`} /></div> <div className="max-w-32"><SelectOrInput id={`${moduleData.id}-eta`} label={etaLabel} options={etaOptions} value={inputs.eta ?? ''} onChange={v => onInputChange(stageIndex, moduleIndex, 'eta', v)} onLabelClick={target => { const contentKeys = TOOLTIP_DATA['eta']; if(!contentKeys) return; const dynamicTooltipContent: TooltipContent = { title: t(contentKeys.titleKey as any), description: `${t(contentKeys.descriptionKey as any)} \n\n${t('efficiency_for_type_label', {type: t(`gear_type_${moduleData.type}`)})}: ${t(etaData.descriptionKey as any)} ${t('efficiency_typical_range_label')}: ${etaData.range}.`, unit: contentKeys.unit }; onParamClick(dynamicTooltipContent, target); }} error={resolveValidationMessage(errors.eta, t)} isSuccess={isFieldSuccessful('eta')} /></div> <CalculatedParamsDisplay params={calculated} warnings={paramWarnings} onParamClick={onParamClick}/></div>}</div>);};
const BeltModuleDisplay: React.FC<ModuleDisplayProps> = ({ moduleData, stageIndex, moduleIndex, onInputChange, isExpanded, onParamClick, isFieldSuccessful }) => { 
    const { t } = useLanguage();
    const inputs = moduleData.inputs as BeltInputParams; 
    const { errors = {}, warnings = {} } = moduleData.validationState || {};
    const calculated = { actual_d1: moduleData.actual_d1, actual_d2: moduleData.actual_d2, belt_amin: moduleData.belt_amin, }; 
    const paramWarnings = { belt_amin: { key: 'calc_param_warning_belt_amin' } as ValidationMessage }; 

    const etaData = EFFICIENCY_DATABASE[moduleData.type];
    const typicalEta = etaData.typical;
    const etaOptions = [...new Set([Number((typicalEta - 0.02).toFixed(2)), Number((typicalEta - 0.01).toFixed(2)), typicalEta, Number((typicalEta + 0.01).toFixed(2))].filter(v => v > 0 && v <= 1))];
    const etaLabel = (<span className="group flex items-center">{t('module_input_efficiency_eta')} <InfoIcon /></span>);

    // FIX: Create a handler that translates tooltip keys before calling onParamClick.
    const handleLabelClick = (key: string) => (target: HTMLElement) => {
        const contentKeys = TOOLTIP_DATA[key];
        if (contentKeys) {
            onParamClick({
                title: t(contentKeys.titleKey as any),
                description: t(contentKeys.descriptionKey as any),
                unit: contentKeys.unit
            }, target);
        }
    };

    return (
        <div onClick={e => e.stopPropagation()}>
            <div className="grid grid-cols-2 gap-2">
                <InputWithControls 
                    id={`${moduleData.id}-d1`}
                    isSuccess={isFieldSuccessful('d1')}
                    onLabelClick={handleLabelClick('d1_input')}
                    label={t('module_input_d1_leading')} 
                    value={inputs.d1} 
                    onChange={(e) => onInputChange(stageIndex, moduleIndex, 'd1', e.target.value)} 
                    onIncrement={() => handleNumericInputWithControls(inputs.d1, 1, (v) => onInputChange(stageIndex, moduleIndex, 'd1', v))}
                    onDecrement={() => handleNumericInputWithControls(inputs.d1, -1, (v) => onInputChange(stageIndex, moduleIndex, 'd1', v), 0)}
                    error={resolveValidationMessage(errors.d1, t)} warning={resolveValidationMessage(warnings.d1, t)}
                    inputClassName={`text-gray-800`}
                />
                <InputWithControls 
                    id={`${moduleData.id}-d2`}
                    isSuccess={isFieldSuccessful('d2')}
                    onLabelClick={handleLabelClick('d2_input')}
                    label={t('module_input_d2_driven')} 
                    value={inputs.d2} 
                    onChange={(e) => onInputChange(stageIndex, moduleIndex, 'd2', e.target.value)}
                    onIncrement={() => handleNumericInputWithControls(inputs.d2, 1, (v) => onInputChange(stageIndex, moduleIndex, 'd2', v))}
                    onDecrement={() => handleNumericInputWithControls(inputs.d2, -1, (v) => onInputChange(stageIndex, moduleIndex, 'd2', v), 0)}
                    error={resolveValidationMessage(errors.d2, t)} warning={resolveValidationMessage(warnings.d2, t)}
                    inputClassName={`text-gray-800`}
                />
            </div> 
            {isExpanded && <div className="pt-2 border-t mt-2 space-y-1"><div className="max-w-32"><SelectOrInput id={`${moduleData.id}-eta`} label={etaLabel} options={etaOptions} value={inputs.eta ?? ''} onChange={v => onInputChange(stageIndex, moduleIndex, 'eta', v)} onLabelClick={target => { const contentKeys = TOOLTIP_DATA['eta']; if(!contentKeys) return; const dynamicTooltipContent: TooltipContent = { title: t(contentKeys.titleKey as any), description: `${t(contentKeys.descriptionKey as any)} \n\n${t('efficiency_for_type_label', {type: t(`gear_type_${moduleData.type}`)})}: ${t(etaData.descriptionKey as any)} ${t('efficiency_typical_range_label')}: ${etaData.range}.`, unit: contentKeys.unit }; onParamClick(dynamicTooltipContent, target); }} error={resolveValidationMessage(errors.eta, t)} isSuccess={isFieldSuccessful('eta')} /></div> <CalculatedParamsDisplay params={calculated} warnings={paramWarnings} onParamClick={onParamClick}/></div>}
        </div>
    );
};
const BevelGearModuleDisplay: React.FC<ModuleDisplayProps> = ({ moduleData, stageIndex, moduleIndex, onInputChange, onSelectChange, isExpanded, onParamClick, isFieldSuccessful }) => { 
    const { t } = useLanguage();
    const inputs = moduleData.inputs as BevelGearInputParams; 
    const { errors = {}, warnings = {} } = moduleData.validationState || {};
    const calculated = { bevel_d1: moduleData.bevel_d1, bevel_d2: moduleData.bevel_d2, bevel_delta1: moduleData.bevel_delta1, bevel_delta2: moduleData.bevel_delta2, bevel_Re: moduleData.bevel_Re, bevel_dm1: moduleData.bevel_dm1, bevel_dm2: moduleData.bevel_dm2, bevel_epsilonAlpha: moduleData.bevel_epsilonAlpha, }; 
    
    const onBlurHandler = (field: 'z1' | 'z2') => (e: React.FocusEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const numValue = parseFloat(String(value).replace(',', '.'));
        if (isNaN(numValue) || String(value).trim() === '') return;
        const roundedValue = Math.round(numValue);
        if (roundedValue !== numValue) {
            onInputChange(stageIndex, moduleIndex, field, roundedValue);
        }
    };
    
    // FIX: Correctly map over enum string values to create options.
    const customSelectOptions = BEVEL_GEAR_CONFIG_OPTIONS.map(configValue => ({
        value: configValue,
        label: t(`bevel_config_label_${configValue.replace('config', '')}` as any),
        previewComponent: (
            <div className="w-[100px] h-[100px] flex items-center justify-center">
                <BevelGearUGO
                    width={100}
                    height={100}
                    z1={Number(inputs.z1) || 15}
                    z2={Number(inputs.z2) || 30}
                    config={configValue}
                />
            </div>
        )
    }));

    const etaData = EFFICIENCY_DATABASE[moduleData.type];
    const typicalEta = etaData.typical;
    const etaOptions = [...new Set([Number((typicalEta - 0.02).toFixed(2)), Number((typicalEta - 0.01).toFixed(2)), typicalEta, Number((typicalEta + 0.01).toFixed(2))].filter(v => v > 0 && v <= 1))];
    const etaLabel = (<span className="group flex items-center">{t('module_input_efficiency_eta')} <InfoIcon /></span>);
    
    // FIX: Create a handler that translates tooltip keys before calling onParamClick.
    const handleLabelClick = (key: string) => (target: HTMLElement) => {
        const contentKeys = TOOLTIP_DATA[key];
        if (contentKeys) {
            onParamClick({
                title: t(contentKeys.titleKey as any),
                description: t(contentKeys.descriptionKey as any),
                unit: contentKeys.unit
            }, target);
        }
    };

    return (<div onClick={e => e.stopPropagation()}><div className="grid grid-cols-2 gap-2"><InputWithControls id={`${moduleData.id}-z1`} isSuccess={isFieldSuccessful('z1')} onBlur={onBlurHandler('z1')} error={resolveValidationMessage(errors.z1, t)} warning={resolveValidationMessage(warnings.z1, t)} onLabelClick={handleLabelClick('z1')} label={t('module_input_z1_leading')} value={inputs.z1} onChange={(e) => onInputChange(stageIndex, moduleIndex, 'z1', e.target.value)} onIncrement={() => handleNumericInputWithControls(inputs.z1, 1, (v) => onInputChange(stageIndex, moduleIndex, 'z1', v))} onDecrement={() => handleNumericInputWithControls(inputs.z1, -1, (v) => onInputChange(stageIndex, moduleIndex, 'z1', v), 0)} inputClassName={`text-gray-800`} /> <InputWithControls id={`${moduleData.id}-z2`} isSuccess={isFieldSuccessful('z2')} onBlur={onBlurHandler('z2')} error={resolveValidationMessage(errors.z2, t)} warning={resolveValidationMessage(warnings.z2, t)} onLabelClick={handleLabelClick('z2')} label={t('module_input_z2_driven')} value={inputs.z2} onChange={(e) => onInputChange(stageIndex, moduleIndex, 'z2', e.target.value)} onIncrement={() => handleNumericInputWithControls(inputs.z2, 1, (v) => onInputChange(stageIndex, moduleIndex, 'z2', v))} onDecrement={() => handleNumericInputWithControls(inputs.z2, -1, (v) => onInputChange(stageIndex, moduleIndex, 'z2', v), 0)} inputClassName={`text-gray-800`} /></div> <div className="!mb-1"><CustomSelect id={`${moduleData.id}-config`} isSuccess={isFieldSuccessful('config')} error={resolveValidationMessage(errors.config, t)} onLabelClick={handleLabelClick('config_bevel')} label={t('module_input_type')} value={inputs.config || ""} onChange={(val) => onSelectChange?.(stageIndex, moduleIndex, 'config', val)} options={customSelectOptions} emptyOptionLabel="-- Выбрать --" selectClassName={`text-gray-800 !py-1 !text-sm`} /></div>{isExpanded && <div className="pt-2 border-t mt-2 space-y-1"><div className="max-w-48"><SelectOrInput id={`${moduleData.id}-m`} isSuccess={isFieldSuccessful('m')} min={0} onLabelClick={handleLabelClick('m_te')} label={t('module_input_bevel_module_m_te')} options={GEAR_MODULES} value={inputs.m} onChange={(v) => onInputChange(stageIndex, moduleIndex, 'm', v)} inputClassName={`text-gray-800`} selectClassName={`text-gray-800`} /></div> <InputWithControls id={`${moduleData.id}-b`} isSuccess={isFieldSuccessful('b')} error={resolveValidationMessage(errors.b, t)} warning={resolveValidationMessage(warnings.b, t)} onLabelClick={handleLabelClick('b')} label={t('module_input_bevel_width_b')} value={inputs.b} onChange={(e) => onInputChange(stageIndex, moduleIndex, 'b', e.target.value)} onIncrement={() => handleNumericInputWithControls(inputs.b, 1, (v) => onInputChange(stageIndex, moduleIndex, 'b', v))} onDecrement={() => handleNumericInputWithControls(inputs.b, -1, (v) => onInputChange(stageIndex, moduleIndex, 'b', v), 0)} inputClassName={`text-gray-800`} /> <div className="max-w-32"><SelectOrInput id={`${moduleData.id}-eta`} label={etaLabel} options={etaOptions} value={inputs.eta ?? ''} onChange={v => onInputChange(stageIndex, moduleIndex, 'eta', v)} onLabelClick={target => { const contentKeys = TOOLTIP_DATA['eta']; if(!contentKeys) return; const dynamicTooltipContent: TooltipContent = { title: t(contentKeys.titleKey as any), description: `${t(contentKeys.descriptionKey as any)} \n\n${t('efficiency_for_type_label', {type: t(`gear_type_${moduleData.type}`)})}: ${t(etaData.descriptionKey as any)} ${t('efficiency_typical_range_label')}: ${etaData.range}.`, unit: contentKeys.unit }; onParamClick(dynamicTooltipContent, target); }} error={resolveValidationMessage(errors.eta, t)} isSuccess={isFieldSuccessful('eta')} /></div> <CalculatedParamsDisplay params={calculated} warnings={warnings} onParamClick={onParamClick}/></div>}</div>);
};
const WormGearModuleDisplay: React.FC<ModuleDisplayProps> = ({ moduleData, stageIndex, moduleIndex, onInputChange, onSelectChange, isExpanded, onParamClick, isFieldSuccessful }) => { 
    const { t } = useLanguage();
    const inputs = moduleData.inputs as WormGearInputParams; 
    const { errors = {}, warnings = {} } = moduleData.validationState || {};
    const calculated = { worm_a: moduleData.worm_a, worm_d1: moduleData.worm_d1, worm_d2: moduleData.worm_d2, worm_da1: moduleData.worm_da1, worm_da2: moduleData.worm_da2, worm_df2: moduleData.worm_df2, worm_gamma: moduleData.worm_gamma, }; 
    
    const onBlurHandler = (field: 'z1' | 'z2') => (e: React.FocusEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const numValue = parseFloat(String(value).replace(',', '.'));
        if (isNaN(numValue) || String(value).trim() === '') return;
        const roundedValue = Math.round(numValue);
        if (roundedValue !== numValue) {
            onInputChange(stageIndex, moduleIndex, field, roundedValue);
        }
    };
    
    // FIX: Correctly map over enum string values to create options.
    const customSelectOptions = WORM_GEAR_CONFIG_OPTIONS.map(configValue => ({
        value: configValue,
        label: t(`worm_gear_config_${configValue}` as any),
        previewComponent: (
             <div className="w-[100px] h-[100px] flex items-center justify-center">
                <WormDriveUGO
                    width={100}
                    height={100}
                    z1={Number(inputs.z1) || 2}
                    z2={Number(inputs.z2) || 40}
                    u={(Number(inputs.z2) || 40) / (Number(inputs.z1) || 2)}
                    config={configValue}
                    cuttingDirection="right"
                />
            </div>
        )
    }));

    const etaData = EFFICIENCY_DATABASE[moduleData.type];
    const typicalEta = etaData.typical;
    const etaOptions = [...new Set([Number((typicalEta - 0.1).toFixed(2)), typicalEta, Number((typicalEta + 0.1).toFixed(2))].filter(v => v > 0 && v <= 1))];
    const etaLabel = (<span className="group flex items-center">{t('module_input_efficiency_eta')} <InfoIcon /></span>);
    
    // FIX: Create a handler that translates tooltip keys before calling onParamClick.
    const handleLabelClick = (key: string) => (target: HTMLElement) => {
        const contentKeys = TOOLTIP_DATA[key];
        if (contentKeys) {
            onParamClick({
                title: t(contentKeys.titleKey as any),
                description: t(contentKeys.descriptionKey as any),
                unit: contentKeys.unit
            }, target);
        }
    };

    return (<div onClick={e => e.stopPropagation()}><div className="grid grid-cols-2 gap-2"><InputWithControls id={`${moduleData.id}-z1`} isSuccess={isFieldSuccessful('z1')} onBlur={onBlurHandler('z1')} error={resolveValidationMessage(errors.z1, t)} warning={resolveValidationMessage(warnings.z1, t)} onLabelClick={handleLabelClick('z1')} label={t('module_input_z1_worm')} value={inputs.z1} onChange={(e) => onInputChange(stageIndex, moduleIndex, 'z1', e.target.value)} onIncrement={() => handleNumericInputWithControls(inputs.z1, 1, (v) => onInputChange(stageIndex, moduleIndex, 'z1', v))} onDecrement={() => handleNumericInputWithControls(inputs.z1, -1, (v) => onInputChange(stageIndex, moduleIndex, 'z1', v), 0)} inputClassName={`text-gray-800`} /> <InputWithControls id={`${moduleData.id}-z2`} isSuccess={isFieldSuccessful('z2')} onBlur={onBlurHandler('z2')} error={resolveValidationMessage(errors.z2, t)} warning={resolveValidationMessage(warnings.z2, t)} onLabelClick={handleLabelClick('z2')} label={t('module_input_z2_wheel')} value={inputs.z2} onChange={(e) => onInputChange(stageIndex, moduleIndex, 'z2', e.target.value)} onIncrement={() => handleNumericInputWithControls(inputs.z2, 1, (v) => onInputChange(stageIndex, moduleIndex, 'z2', v))} onDecrement={() => handleNumericInputWithControls(inputs.z2, -1, (v) => onInputChange(stageIndex, moduleIndex, 'z2', v), 0)} inputClassName={`text-gray-800`} /></div> <div className="!mb-1"><CustomSelect id={`${moduleData.id}-config`} isSuccess={isFieldSuccessful('config')} error={resolveValidationMessage(errors.config, t)} onLabelClick={handleLabelClick('config_worm')} label={t('module_input_type')} value={inputs.config || ""} onChange={(val) => onSelectChange?.(stageIndex, moduleIndex, 'config', val)} options={customSelectOptions} emptyOptionLabel="-- Выбрать --" selectClassName={`text-gray-800 !py-1 !text-sm`} /></div>{isExpanded && <div className="pt-2 border-t mt-2 space-y-1"><div className="max-w-24"><SelectOrInput id={`${moduleData.id}-m`} isSuccess={isFieldSuccessful('m')} min={0} onLabelClick={handleLabelClick('m')} label={t('module_input_module_m')} options={GEAR_MODULES} value={inputs.m} onChange={(v) => onInputChange(stageIndex, moduleIndex, 'm', v)} inputClassName={`text-gray-800`} selectClassName={`text-gray-800`} /></div> <div className="max-w-32"><SelectOrInput id={`${moduleData.id}-q`} isSuccess={isFieldSuccessful('q')} min={0} onLabelClick={handleLabelClick('q')} label={t('module_input_worm_q')} options={WORM_DIAMETER_COEFFICIENTS} value={inputs.q} onChange={(v) => onInputChange(stageIndex, moduleIndex, 'q', v)} inputClassName={`text-gray-800`} selectClassName={`text-gray-800`} /></div> <div className="max-w-32"><SelectOrInput id={`${moduleData.id}-eta`} label={etaLabel} options={etaOptions} value={inputs.eta ?? ''} onChange={v => onInputChange(stageIndex, moduleIndex, 'eta', v)} onLabelClick={target => { const contentKeys = TOOLTIP_DATA['eta']; if(!contentKeys) return; const dynamicTooltipContent: TooltipContent = { title: t(contentKeys.titleKey as any), description: `${t(contentKeys.descriptionKey as any)} \n\n${t('efficiency_for_type_label', {type: t(`gear_type_${moduleData.type}`)})}: ${t(etaData.descriptionKey as any)} ${t('efficiency_typical_range_label')}: ${etaData.range}.`, unit: contentKeys.unit }; onParamClick(dynamicTooltipContent, target); }} error={resolveValidationMessage(errors.eta, t)} isSuccess={isFieldSuccessful('eta')} /></div> <CalculatedParamsDisplay params={calculated} onParamClick={onParamClick}/></div>}</div>);
};


interface ModuleCardProps {
    moduleData: ModuleCalculationData;
    stageIndex: number;
    moduleIndex: number;
    canBeSelected: boolean;
    isExpanded: boolean;
    isHighlighted: boolean;
    highlightPriority: boolean;
    isGlowingGreen: boolean;
    onToggleExpansion: () => void;
    onInputChange: (stageIdx: number, moduleIdx: number, field: string, value: string | number) => void;
    onSelectChange: (stageIdx: number, moduleIdx: number, field: string, value: any) => void;
    onModuleSelect: () => void;
    onRemove: () => void;
    onParamClick: (content: TooltipContent, target: HTMLElement) => void;
    isFieldSuccessful: (moduleId: string, field: string) => boolean;
    showNotification: (message: string, type: 'success' | 'error' | 'warning') => void;
    onPasteModule: (pastedData: { type: GearType, inputs: ModuleSpecificInputs }) => void;
}

export const ModuleCard: React.FC<ModuleCardProps> = React.memo(({
    moduleData, stageIndex, moduleIndex, canBeSelected, isExpanded, isHighlighted, highlightPriority, isGlowingGreen,
    onToggleExpansion, onInputChange, onSelectChange, onModuleSelect, onRemove, onParamClick,
    isFieldSuccessful, showNotification, onPasteModule
}) => {
    const { t } = useLanguage();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [canPaste, setCanPaste] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => { document.removeEventListener("mousedown", handleClickOutside); };
    }, [menuRef]);

    const handleMenuToggle = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const nextMenuState = !isMenuOpen;
        setIsMenuOpen(nextMenuState);
    
        if (nextMenuState) { // If opening, check paste ability
            try {
                const text = await navigator.clipboard.readText();
                const parsed = JSON.parse(text);
                if (parsed.appIdentifier === 'transmission-calculator-module' && parsed.data) {
                    setCanPaste(true);
                } else {
                    setCanPaste(false);
                }
            } catch (err) {
                setCanPaste(false); // If anything fails, disable paste
            }
        }
    };

    const handleCopy = async () => {
        const dataToCopy = {
          appIdentifier: 'transmission-calculator-module',
          data: { type: moduleData.type, inputs: moduleData.inputs, },
        };
        try {
          await navigator.clipboard.writeText(JSON.stringify(dataToCopy, null, 2));
          showNotification(t('notification_params_copied'), 'success');
        } catch (err) {
          showNotification(t('notification_copy_error'), 'error');
        }
        setIsMenuOpen(false);
    };

    const handlePaste = async () => {
        try {
          const text = await navigator.clipboard.readText();
          const parsed = JSON.parse(text);
          if (parsed.appIdentifier === 'transmission-calculator-module' && parsed.data) {
            onPasteModule(parsed.data);
            showNotification(t('notification_params_pasted'), 'success');
          } else {
            throw new Error('Invalid data format');
          }
        } catch (err) {
          showNotification(t('notification_paste_error'), 'error');
        }
        setIsMenuOpen(false);
    };

    const singleOnlyTypes: GearType[] = [GearType.Planetary, GearType.Bevel, GearType.Worm];
    
    const getGearTypeTranslation = useCallback((type: GearType): string => {
        const key = `gear_type_${type.replace(/ /g, '_')}` as any;
        return t(key);
    }, [t]);

    const availableTypes = (canBeSelected && !singleOnlyTypes.includes(moduleData.type))
        ? AVAILABLE_GEAR_TYPES.filter(t => !singleOnlyTypes.includes(t))
        : AVAILABLE_GEAR_TYPES;

    const gearTypeOptions = availableTypes.map(gt => ({ value: gt, label: getGearTypeTranslation(gt) }));
    
    const { errors, warnings } = moduleData.validationState || {};
    const hasErrors = errors && Object.keys(errors).length > 0;
    const hasWarnings = warnings && Object.keys(warnings).length > 0;

    const baseClasses = `p-2 rounded-lg w-48 sm:w-52 md:w-56 flex-shrink-0 flex flex-col justify-between focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 transition-all duration-300 bg-white`;
                                    
    const isSelected = !canBeSelected || moduleData.isSelected;
    const borderClass = isSelected ? 'ring-2 ring-inset ring-slate-700/60' : 'border-slate-200 border';

    let shadowClass = 'shadow-md shadow-slate-900/60';
    let animationClass = '';

    if (isHighlighted && highlightPriority) {
        animationClass = 'animate-pulse-shadow';
    } else if (hasErrors) {
        shadowClass = 'shadow-md shadow-rose-500/80';
    } else if (hasWarnings) {
        shadowClass = 'shadow-md shadow-amber-500/80';
    } else if (isGlowingGreen) {
        shadowClass = 'shadow-md shadow-emerald-500/80';
    }

    const commonProps: ModuleDisplayProps = {
        moduleData, stageIndex, moduleIndex, onInputChange, onSelectChange, isExpanded, onParamClick,
        isFieldSuccessful: (field) => isFieldSuccessful(moduleData.id, field)
    };

    return (
        <div
            id={moduleData.id}
            tabIndex={0}
            role="button"
            aria-label={`${t('module_card_variant_label', { type: moduleData.type })}. ${moduleData.isSelected ? t('module_card_is_leading') : t('module_card_set_leading')}.`}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onModuleSelect(); }}}
            className={`${baseClasses} ${borderClass} ${shadowClass} ${animationClass}`}
            onClick={canBeSelected ? onModuleSelect : undefined}
            style={canBeSelected ? { cursor: 'pointer' } : {}}
        >
            <div>
                <div className="flex justify-between items-center mb-2 relative">
                    <div onClick={e => e.stopPropagation()} className="flex-grow">
                        <Select id={`${moduleData.id}-type`} value={moduleData.type} onChange={(e) => onSelectChange(stageIndex, moduleIndex, 'type', e.target.value as GearType)} options={gearTypeOptions} selectClassName={`w-full text-sm font-semibold p-1.5 rounded-md text-slate-700 bg-slate-50`} className="!mb-0" />
                    </div>
                    <div className="flex items-center ml-2">
                        <div ref={menuRef} className="relative">
                            <Button onClick={handleMenuToggle} variant="secondary" className="!p-1.5 text-xs leading-none" title={t('common_actions')}><KebabMenuIcon/></Button>
                            {isMenuOpen && (
                                <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-md shadow-lg border z-20 py-1">
                                    <button onClick={handleCopy} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">{t('common_copy_parameters')}</button>
                                    <button onClick={handlePaste} disabled={!canPaste} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed">{t('common_paste_parameters')}</button>
                                </div>
                            )}
                        </div>
                        <Button onClick={(e) => { e.stopPropagation(); onRemove(); }} variant="secondary" className="!p-1.5 ml-1 text-xs leading-none" title={t('common_delete_variant')}><CrossIcon/></Button>
                    </div>
                </div>

                {canBeSelected && (
                    <div className="flex items-center space-x-2 p-2 mb-2 rounded-md bg-slate-50 cursor-pointer hover:bg-slate-200 transition-colors" onClick={(e) => { e.stopPropagation(); onModuleSelect(); }} >
                        <input type="radio" name={`stage-select-${stageIndex}`} id={`module-select-${moduleData.id}`} checked={moduleData.isSelected} onChange={onModuleSelect} className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer" />
                        <label htmlFor={`module-select-${moduleData.id}`} className={`text-sm font-semibold cursor-pointer ${moduleData.isSelected ? 'text-blue-700' : 'text-gray-700'}`} >
                            {moduleData.isSelected ? t('module_card_is_leading') : t('module_card_set_leading')}
                        </label>
                    </div>
                )}

                {moduleData.type === GearType.Gear && <GearModuleDisplay {...commonProps} />}
                {moduleData.type === GearType.Chain && <ChainModuleDisplay {...commonProps} />}
                {moduleData.type === GearType.Planetary && <PlanetaryModuleDisplay {...commonProps} />}
                {moduleData.type === GearType.ToothedBelt && <ToothedBeltModuleDisplay {...commonProps} />}
                {moduleData.type === GearType.Belt && <BeltModuleDisplay {...commonProps} />}
                {moduleData.type === GearType.Bevel && <BevelGearModuleDisplay {...commonProps} />}
                {moduleData.type === GearType.Worm && <WormGearModuleDisplay {...commonProps} />}

                <div className="mt-2 pt-2 border-t border-gray-200 flex justify-between items-center font-semibold text-sm rounded hover:bg-gray-100 cursor-pointer p-1 -m-1" onClick={(e) => { 
                    e.stopPropagation(); 
                    const contentKeys = TOOLTIP_DATA['u']; 
                    if(contentKeys) onParamClick({ title: t(contentKeys.titleKey as any), description: t(contentKeys.descriptionKey as any), unit: contentKeys.unit }, e.currentTarget as HTMLElement);
                }}>
                    <span className="text-gray-600">{t('module_input_gear_ratio_u')}</span>
                    <span className="text-gray-800 text-base">{moduleData.u?.toFixed(4) ?? '-'}</span>
                </div>

                <div
                  id={`module-details-content-${moduleData.id}`}
                  className={`transition-[max-height,opacity] duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-50'}`}
                >
                    <div className="pt-2">
                        <StageCharacteristicsDisplay cascade={moduleData.cascadeIn} title={t('module_cascade_in_title')} dir={moduleData.moduleInDirection} orientation={moduleData.moduleInOrientation} />
                        <StageCharacteristicsDisplay cascade={moduleData.cascadeOut} title={t('module_cascade_out_title')} dir={moduleData.moduleOutDirection} orientation={moduleData.moduleOutOrientation}/>
                        {moduleData.error && <p className={`mt-1 text-xs ${ERROR_TEXT_COLOR} font-semibold`}>{resolveValidationMessage(moduleData.error as ValidationMessage, t)}</p>}
                        {moduleData.assemblyError && moduleData.type === GearType.Planetary && <p className={`mt-1 text-xs ${ERROR_TEXT_COLOR} font-semibold`}>{resolveValidationMessage(moduleData.assemblyError as ValidationMessage, t)}</p>}
                    </div>
                </div>
            </div>
            <button
                id={`module-details-btn-${moduleData.id}`}
                onClick={(e) => { e.stopPropagation(); onToggleExpansion(); }}
                className="w-full mt-2 p-1.5 flex justify-center items-center text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
                <span>{t('common_details')}</span>
                <ChevronIcon isExpanded={isExpanded} />
            </button>
        </div>
    );
});