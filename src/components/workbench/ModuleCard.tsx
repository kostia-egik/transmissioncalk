import React, { useEffect, useRef, useState } from 'react';
import {
    ModuleCalculationData, GearType, GearInputParams, ChainInputParams, PlanetaryInputParams, CascadeValues, RotationDirection,
    ToothedBeltInputParams, BeltInputParams, BevelGearInputParams, WormGearInputParams, ShaftOrientation, PlanetaryConfig, PlanetaryGearConfigType,
    AVAILABLE_GEAR_TYPES, PLANETARY_CONFIG_MAP, PLANETARY_SHAFT_OPTIONS, PLANETARY_CONFIG_OPTIONS, BEVEL_GEAR_CONFIG_OPTIONS, WORM_GEAR_CONFIG_OPTIONS,
    ModuleSpecificInputs
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

const CalculatedParamsDisplay: React.FC<{ params: Record<string, string | number | undefined | boolean>, warnings?: Record<string, string>, onParamClick: (content: TooltipContent, target: HTMLElement) => void, renderToDataKeyMap: Record<string, string> }> = ({ params, warnings, onParamClick, renderToDataKeyMap }) => (
    <div className="mt-2 pt-2 border-t border-gray-400 font-semibold text-xs leading-snug">
        <h5 className="text-gray-600 mb-1">Расчетные параметры модуля:</h5>
        {Object.entries(params).map(([key, value]) => {
            if (value === undefined || value === '' || value === null) return null;
            const dataKey = renderToDataKeyMap[key];
            const hasTooltip = dataKey && TOOLTIP_DATA[dataKey];
            const content = (<p className="text-gray-700">{key}: {typeof value === 'number' ? value.toFixed(value % 1 === 0 ? 0 : 4) : String(value)} {warnings && warnings[key] && <span className="ml-1 text-orange-600 font-bold" title={warnings[key]}>(i)</span>}</p>);

            if (hasTooltip) {
                return (
                    <div key={key} onClick={(e) => { e.stopPropagation(); onParamClick(TOOLTIP_DATA[dataKey], e.currentTarget); }} className="p-0.5 -m-0.5 rounded hover:bg-gray-100 cursor-pointer transition-colors duration-150">
                        {content}
                    </div>
                );
            }
            return <div key={key}>{content}</div>;
        })}
    </div>
);

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

const StageCharacteristicsDisplay: React.FC<{ cascade?: CascadeValues, title: string, dir?: RotationDirection, orientation?: ShaftOrientation }> = ({ cascade, title, dir, orientation }) => { if (!cascade) return null; let iconElement = null; if (dir && orientation) { const iconPath = getRotationIconPath(dir, orientation); const altText = `Направление: ${dir}, Ориентация: ${orientation === ShaftOrientation.Horizontal ? "Горизонтальный" : "Вертикальный"}`; iconElement = (<img src={iconPath} alt={altText} title={altText} className="w-8 h-8 inline-block ml-1 align-middle" />); } return (<div className="mt-2 pt-2 border-t border-gray-300 text-xs leading-snug"><h5 className="font-semibold text-gray-600 mb-0.5">{title}:</h5><p className="text-gray-800">Момент: {cascade.torque.toFixed(2)} Нм</p><p className="text-gray-800">Мин. об/мин: {cascade.minRpm.toFixed(0)}</p><p className="text-gray-800">Макс. об/мин: {cascade.maxRpm.toFixed(0)}</p> {iconElement ? (<div className="text-gray-800 flex items-center">Направление: {iconElement}</div>) : dir ? (<p className="text-gray-800">Направление: {dir} (нет ориентации)</p>) : null}</div>); };

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
    const inputs = moduleData.inputs as GearInputParams; 
    const { errors = {}, warnings = {} } = moduleData.validationState || {}; 
    const calculated = { "Межосевое a, мм": moduleData.a, "Диаметр d₁, мм": moduleData.d1, "Диаметр d₂, мм": moduleData.d2, "d вершин dₐ₁, мм": moduleData.da1, "d вершин dₐ₂, мм": moduleData.da2, "d впадин d𝒻₁, мм": moduleData.df1, "d впадин d𝒻₂, мм": moduleData.df2, "Перекрытие εα": moduleData.epsilonAlpha }; 
    const renderToDataKeyMap = { "Межосевое a, мм": "a", "Диаметр d₁, мм": "d1", "Диаметр d₂, мм": "d2", "d вершин dₐ₁, мм": "da1", "d вершин dₐ₂, мм": "da2", "d впадин d𝒻₁, мм": "df1", "d впадин d𝒻₂, мм": "df2", "Перекрытие εα": "epsilonAlpha" }; 
    
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
    const etaLabel = (<span className="group flex items-center">КПД (η) <InfoIcon /></span>);
    
    return (<div onClick={e => e.stopPropagation()}><div className="grid grid-cols-2 gap-2"><InputWithControls id={`${moduleData.id}-z1`} isSuccess={isFieldSuccessful('z1')} onBlur={onBlurHandler('z1')} error={errors.z1} warning={warnings.z1} onLabelClick={(t) => onParamClick(TOOLTIP_DATA['z1'], t)} label="z₁ (ведущая)" value={inputs.z1} onChange={(e) => onInputChange(stageIndex, moduleIndex, 'z1', e.target.value)} onIncrement={() => handleNumericInputWithControls(inputs.z1, 1, (v) => onInputChange(stageIndex, moduleIndex, 'z1', v))} onDecrement={() => handleNumericInputWithControls(inputs.z1, -1, (v) => onInputChange(stageIndex, moduleIndex, 'z1', v), 0)} inputClassName={`text-gray-800`}/> <InputWithControls id={`${moduleData.id}-z2`} isSuccess={isFieldSuccessful('z2')} onBlur={onBlurHandler('z2')} error={errors.z2} warning={warnings.z2} onLabelClick={(t) => onParamClick(TOOLTIP_DATA['z2'], t)} label="z₂ (ведомая)" value={inputs.z2} onChange={(e) => onInputChange(stageIndex, moduleIndex, 'z2', e.target.value)} onIncrement={() => handleNumericInputWithControls(inputs.z2, 1, (v) => onInputChange(stageIndex, moduleIndex, 'z2', v))} onDecrement={() => handleNumericInputWithControls(inputs.z2, -1, (v) => onInputChange(stageIndex, moduleIndex, 'z2', v), 0)} inputClassName={`text-gray-800`}/></div> {isExpanded && <div className="pt-2 border-t mt-2 space-y-1"><div className="max-w-24"><SelectOrInput id={`${moduleData.id}-m`} isSuccess={isFieldSuccessful('m')} min={0} onLabelClick={(t) => onParamClick(TOOLTIP_DATA['m'], t)} label="Модуль, m (мм)" options={GEAR_MODULES} value={inputs.m} onChange={(v) => onInputChange(stageIndex, moduleIndex, 'm', v)} inputClassName={`text-gray-800`} selectClassName={`text-gray-800`} /></div> <div className="max-w-32"><SelectOrInput id={`${moduleData.id}-eta`} label={etaLabel} options={etaOptions} value={inputs.eta ?? ''} onChange={v => onInputChange(stageIndex, moduleIndex, 'eta', v)} onLabelClick={target => { const dynamicTooltipContent: TooltipContent = { ...TOOLTIP_DATA['eta'], description: `${TOOLTIP_DATA['eta'].description} \n\nДля "${moduleData.type}": ${etaData.description} Типичный диапазон: ${etaData.range}.` }; onParamClick(dynamicTooltipContent, target); }} error={errors.eta} isSuccess={isFieldSuccessful('eta')} /></div> <CalculatedParamsDisplay params={calculated} onParamClick={onParamClick} renderToDataKeyMap={renderToDataKeyMap}/></div>}</div>);};
const ChainModuleDisplay: React.FC<ModuleDisplayProps> = ({ moduleData, stageIndex, moduleIndex, onInputChange, isExpanded, onParamClick, isFieldSuccessful }) => { 
    const inputs = moduleData.inputs as ChainInputParams; 
    const { errors = {}, warnings = {} } = moduleData.validationState || {}; 
    const calculated = { "Делит. d₁, мм": moduleData.chain_d1, "Делит. d₂, мм": moduleData.chain_d2, "Внешн. da₁, мм": moduleData.chain_da1, "Внешн. da₂, мм": moduleData.chain_da2, "Мин. межосевое aₘᵢₙ, мм": moduleData.chain_amin, }; 
    const paramWarnings = { "Мин. межосевое aₘᵢₙ, мм": "ВНИМАНИЕ: Это теор. расстояние по делит. диаметрам. Реальное (по внешним диаметрам + зазор) будет больше." }; 
    const renderToDataKeyMap = { "Делит. d₁, мм": "chain_d1", "Делит. d₂, мм": "chain_d2", "Внешн. da₁, мм": "chain_da1", "Внешн. da₂, мм": "chain_da2", "Мин. межосевое aₘᵢₙ, мм": "chain_amin" }; 
    
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
    const etaLabel = (<span className="group flex items-center">КПД (η) <InfoIcon /></span>);
    
    return (<div onClick={e => e.stopPropagation()}><div className="grid grid-cols-2 gap-2"><InputWithControls id={`${moduleData.id}-z1`} isSuccess={isFieldSuccessful('z1')} onBlur={onBlurHandler('z1')} error={errors.z1} warning={warnings.z1} onLabelClick={(t) => onParamClick(TOOLTIP_DATA['z1'], t)} label="z₁ (ведущая)" value={inputs.z1} onChange={(e) => onInputChange(stageIndex, moduleIndex, 'z1', e.target.value)} onIncrement={() => handleNumericInputWithControls(inputs.z1, 1, (v) => onInputChange(stageIndex, moduleIndex, 'z1', v))} onDecrement={() => handleNumericInputWithControls(inputs.z1, -1, (v) => onInputChange(stageIndex, moduleIndex, 'z1', v), 0)} inputClassName={`text-gray-800`} /> <InputWithControls id={`${moduleData.id}-z2`} isSuccess={isFieldSuccessful('z2')} onBlur={onBlurHandler('z2')} error={errors.z2} warning={warnings.z2} onLabelClick={(t) => onParamClick(TOOLTIP_DATA['z2'], t)} label="z₂ (ведомая)" value={inputs.z2} onChange={(e) => onInputChange(stageIndex, moduleIndex, 'z2', e.target.value)} onIncrement={() => handleNumericInputWithControls(inputs.z2, 1, (v) => onInputChange(stageIndex, moduleIndex, 'z2', v))} onDecrement={() => handleNumericInputWithControls(inputs.z2, -1, (v) => onInputChange(stageIndex, moduleIndex, 'z2', v), 0)} inputClassName={`text-gray-800`} /></div> {isExpanded && <div className="pt-2 border-t mt-2 space-y-1"><div className="max-w-24"><SelectOrInput id={`${moduleData.id}-p`} isSuccess={isFieldSuccessful('p')} min={0} onLabelClick={(t) => onParamClick(TOOLTIP_DATA['p'], t)} label="Шаг цепи, p (мм)" options={CHAIN_PITCHES} value={inputs.p} onChange={(v) => onInputChange(stageIndex, moduleIndex, 'p', v)} inputClassName={`text-gray-800`} selectClassName={`text-gray-800`} /></div> <div className="max-w-32"><SelectOrInput id={`${moduleData.id}-eta`} label={etaLabel} options={etaOptions} value={inputs.eta ?? ''} onChange={v => onInputChange(stageIndex, moduleIndex, 'eta', v)} onLabelClick={target => { const dynamicTooltipContent: TooltipContent = { ...TOOLTIP_DATA['eta'], description: `${TOOLTIP_DATA['eta'].description} \n\nДля "${moduleData.type}": ${etaData.description} Типичный диапазон: ${etaData.range}.` }; onParamClick(dynamicTooltipContent, target); }} error={errors.eta} isSuccess={isFieldSuccessful('eta')} /></div> <CalculatedParamsDisplay params={calculated} warnings={paramWarnings} onParamClick={onParamClick} renderToDataKeyMap={renderToDataKeyMap}/></div>}</div>);};
const PlanetaryModuleDisplay: React.FC<ModuleDisplayProps> = ({ moduleData, stageIndex, moduleIndex, onInputChange, onSelectChange, isExpanded, onParamClick, isFieldSuccessful }) => { 
    const inputs = moduleData.inputs as PlanetaryInputParams;
    const { errors = {}, warnings = {} } = moduleData.validationState || {};
    const assemblyText = moduleData.assemblyPossible ? "Возможна" : (errors.zSun || (moduleData.zPlanet !== undefined ? "СБОРКА НЕВОЗМОЖНА" : "")); 
    const calculated = { "z Сателлита": moduleData.zPlanet, "Условие сборки": assemblyText, "d Солнца, мм": moduleData.planetary_dSun, "d Сателлита, мм": moduleData.planetary_dPlanet, "d Короны, мм": moduleData.planetary_dRing, "Межосевое a (S-P), мм": moduleData.planetary_a, "Зафиксир. вал": moduleData.fixedShaft, "Перекрытие S-P εα": moduleData.epsilon_sp, "Перекрытие P-R εα": moduleData.epsilon_pr }; 
    const renderToDataKeyMap = { "z Сателлита": "zPlanet", "Условие сборки": "assemblyPossible", "d Солнца, мм": "planetary_dSun", "d Сателлита, мм": "planetary_dPlanet", "d Короны, мм": "planetary_dRing", "Межосевое a (S-P), мм": "planetary_a", "Зафиксир. вал": "fixedShaft", "Перекрытие S-P εα": "epsilon_sp", "Перекрытие P-R εα": "epsilon_pr" }; 
    
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
            label: configValue,
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
    const etaLabel = (<span className="group flex items-center">КПД (η) <InfoIcon /></span>);

    return (<div onClick={e => e.stopPropagation()}><div className="grid grid-cols-2 gap-2"><InputWithControls id={`${moduleData.id}-zSun`} isSuccess={isFieldSuccessful('zSun')} onBlur={onBlurHandler('zSun')} error={errors.zSun} warning={warnings.zSun} onLabelClick={(t) => onParamClick(TOOLTIP_DATA['zSun'], t)} label="z Солнца" value={inputs.zSun} onChange={(e) => onInputChange(stageIndex, moduleIndex, 'zSun', e.target.value)} onIncrement={() => handleNumericInputWithControls(inputs.zSun, 1, (v) => onInputChange(stageIndex, moduleIndex, 'zSun', v))} onDecrement={() => handleNumericInputWithControls(inputs.zSun, -1, (v) => onInputChange(stageIndex, moduleIndex, 'zSun', v), 0)} inputClassName={`text-gray-800`} /> <InputWithControls id={`${moduleData.id}-zRing`} isSuccess={isFieldSuccessful('zRing')} onBlur={onBlurHandler('zRing')} error={errors.zRing} warning={warnings.zRing} onLabelClick={(t) => onParamClick(TOOLTIP_DATA['zRing'], t)} label="z Короны" value={inputs.zRing} onChange={(e) => onInputChange(stageIndex, moduleIndex, 'zRing', e.target.value)} onIncrement={() => handleNumericInputWithControls(inputs.zRing, 1, (v) => onInputChange(stageIndex, moduleIndex, 'zRing', v))} onDecrement={() => handleNumericInputWithControls(inputs.zRing, -1, (v) => onInputChange(stageIndex, moduleIndex, 'zRing', v), 0)} inputClassName={`text-gray-800`} /></div> <CustomSelect id={`${moduleData.id}-shaftConfig`} isSuccess={isFieldSuccessful('shaftConfig')} error={errors.shaftConfig} onLabelClick={(t) => onParamClick(TOOLTIP_DATA['shaftConfig'], t)} label="Вход → Выход" value={inputs.shaftConfig || ""} onChange={(val) => onSelectChange?.(stageIndex, moduleIndex, 'shaftConfig', val as PlanetaryConfig)} options={customSelectOptions} emptyOptionLabel="-- Выбрать --" className="!mb-1" selectClassName={`${PLANETARY_SHAFT_INPUT_BG} text-gray-800 !py-1 !text-sm`} /> {isExpanded && <div className="pt-2 border-t mt-2 space-y-1"><div className="max-w-24"><SelectOrInput id={`${moduleData.id}-m`} isSuccess={isFieldSuccessful('m')} min={0} onLabelClick={(t) => onParamClick(TOOLTIP_DATA['m'], t)} label="Модуль, m (мм)" options={GEAR_MODULES} value={inputs.m} onChange={(v) => onInputChange(stageIndex, moduleIndex, 'm', v)} inputClassName={`text-gray-800`} selectClassName={`text-gray-800`} /></div> <div className="max-w-32"><SelectOrInput id={`${moduleData.id}-eta`} label={etaLabel} options={etaOptions} value={inputs.eta ?? ''} onChange={v => onInputChange(stageIndex, moduleIndex, 'eta', v)} onLabelClick={target => { const dynamicTooltipContent: TooltipContent = { ...TOOLTIP_DATA['eta'], description: `${TOOLTIP_DATA['eta'].description} \n\nДля "${moduleData.type}": ${etaData.description} Типичный диапазон: ${etaData.range}.` }; onParamClick(dynamicTooltipContent, target); }} error={errors.eta} isSuccess={isFieldSuccessful('eta')} /></div> <CalculatedParamsDisplay params={calculated} onParamClick={onParamClick} renderToDataKeyMap={renderToDataKeyMap}/></div>}</div>);
};
const ToothedBeltModuleDisplay: React.FC<ModuleDisplayProps> = ({ moduleData, stageIndex, moduleIndex, onInputChange, isExpanded, onParamClick, isFieldSuccessful }) => { 
    const inputs = moduleData.inputs as ToothedBeltInputParams; 
    const { errors = {}, warnings = {} } = moduleData.validationState || {}; 
    const calculated = { "d₁ (шкив), мм": moduleData.tb_d1, "d₂ (шкив), мм": moduleData.tb_d2, "aₘᵢₙ (теор.), мм": moduleData.tb_amin, }; 
    const paramWarnings = { "aₘᵢₙ (теор.), мм": "ВНИМАНИЕ: Это теоретическое расстояние по делительным диаметрам шкивов. Реальное межосевое расстояние будет зависеть от выбранного ремня и требуемого натяжения." }; 
    const renderToDataKeyMap = { "d₁ (шкив), мм": "tb_d1", "d₂ (шкив), мм": "tb_d2", "aₘᵢₙ (теор.), мм": "tb_amin" }; 
    
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
    const etaLabel = (<span className="group flex items-center">КПД (η) <InfoIcon /></span>);

    return (<div onClick={e => e.stopPropagation()}><div className="grid grid-cols-2 gap-2"><InputWithControls id={`${moduleData.id}-z1`} isSuccess={isFieldSuccessful('z1')} onBlur={onBlurHandler('z1')} error={errors.z1} warning={warnings.z1} onLabelClick={(t) => onParamClick(TOOLTIP_DATA['z1'], t)} label="z₁ (ведущий)" value={inputs.z1} onChange={(e) => onInputChange(stageIndex, moduleIndex, 'z1', e.target.value)} onIncrement={() => handleNumericInputWithControls(inputs.z1, 1, (v) => onInputChange(stageIndex, moduleIndex, 'z1', v))} onDecrement={() => handleNumericInputWithControls(inputs.z1, -1, (v) => onInputChange(stageIndex, moduleIndex, 'z1', v), 0)} inputClassName={`text-gray-800`} /> <InputWithControls id={`${moduleData.id}-z2`} isSuccess={isFieldSuccessful('z2')} onBlur={onBlurHandler('z2')} error={errors.z2} warning={warnings.z2} onLabelClick={(t) => onParamClick(TOOLTIP_DATA['z2'], t)} label="z₂ (ведомый)" value={inputs.z2} onChange={(e) => onInputChange(stageIndex, moduleIndex, 'z2', e.target.value)} onIncrement={() => handleNumericInputWithControls(inputs.z2, 1, (v) => onInputChange(stageIndex, moduleIndex, 'z2', v))} onDecrement={() => handleNumericInputWithControls(inputs.z2, -1, (v) => onInputChange(stageIndex, moduleIndex, 'z2', v), 0)} inputClassName={`text-gray-800`} /></div> {isExpanded && <div className="pt-2 border-t mt-2 space-y-1"><div className="max-w-24"><SelectOrInput id={`${moduleData.id}-p`} isSuccess={isFieldSuccessful('p')} min={0} onLabelClick={(t) => onParamClick(TOOLTIP_DATA['p'], t)} label="Шаг ремня, p (мм)" options={TOOTHED_BELT_PITCHES} value={inputs.p} onChange={(v) => onInputChange(stageIndex, moduleIndex, 'p', v)} inputClassName={`text-gray-800`} selectClassName={`text-gray-800`} /></div> <div className="max-w-32"><SelectOrInput id={`${moduleData.id}-eta`} label={etaLabel} options={etaOptions} value={inputs.eta ?? ''} onChange={v => onInputChange(stageIndex, moduleIndex, 'eta', v)} onLabelClick={target => { const dynamicTooltipContent: TooltipContent = { ...TOOLTIP_DATA['eta'], description: `${TOOLTIP_DATA['eta'].description} \n\nДля "${moduleData.type}": ${etaData.description} Типичный диапазон: ${etaData.range}.` }; onParamClick(dynamicTooltipContent, target); }} error={errors.eta} isSuccess={isFieldSuccessful('eta')} /></div> <CalculatedParamsDisplay params={calculated} warnings={paramWarnings} onParamClick={onParamClick} renderToDataKeyMap={renderToDataKeyMap}/></div>}</div>);};
const BeltModuleDisplay: React.FC<ModuleDisplayProps> = ({ moduleData, stageIndex, moduleIndex, onInputChange, isExpanded, onParamClick, isFieldSuccessful }) => { 
    const inputs = moduleData.inputs as BeltInputParams; 
    const { errors = {}, warnings = {} } = moduleData.validationState || {};
    const calculated = { "d₁ (расч.), мм": moduleData.actual_d1, "d₂ (расч.), мм": moduleData.actual_d2, "aₘᵢₙ (теор.), мм": moduleData.belt_amin, }; 
    const paramWarnings = { "aₘᵢₙ (теор.), мм": "ВНИМАНИЕ: Это теоретическое расстояние по расчетным диаметрам шкивов. Реальное межосевое расстояние будет зависеть от типа ремня, его длины и требуемого натяжения." }; 
    const renderToDataKeyMap = { "d₁ (расч.), мм": "actual_d1", "d₂ (расч.), мм": "actual_d2", "aₘᵢₙ (теор.), мм": "belt_amin" };

    const etaData = EFFICIENCY_DATABASE[moduleData.type];
    const typicalEta = etaData.typical;
    const etaOptions = [...new Set([Number((typicalEta - 0.02).toFixed(2)), Number((typicalEta - 0.01).toFixed(2)), typicalEta, Number((typicalEta + 0.01).toFixed(2))].filter(v => v > 0 && v <= 1))];
    const etaLabel = (<span className="group flex items-center">КПД (η) <InfoIcon /></span>);

    return (
        <div onClick={e => e.stopPropagation()}>
            <div className="grid grid-cols-2 gap-2">
                <InputWithControls 
                    id={`${moduleData.id}-d1`}
                    isSuccess={isFieldSuccessful('d1')}
                    onLabelClick={(t) => onParamClick(TOOLTIP_DATA['d1_input'], t)}
                    label="d₁ (ведущий, мм)" 
                    value={inputs.d1} 
                    onChange={(e) => onInputChange(stageIndex, moduleIndex, 'd1', e.target.value)} 
                    onIncrement={() => handleNumericInputWithControls(inputs.d1, 1, (v) => onInputChange(stageIndex, moduleIndex, 'd1', v))}
                    onDecrement={() => handleNumericInputWithControls(inputs.d1, -1, (v) => onInputChange(stageIndex, moduleIndex, 'd1', v), 0)}
                    error={errors.d1} warning={warnings.d1}
                    inputClassName={`text-gray-800`}
                />
                <InputWithControls 
                    id={`${moduleData.id}-d2`}
                    isSuccess={isFieldSuccessful('d2')}
                    onLabelClick={(t) => onParamClick(TOOLTIP_DATA['d2_input'], t)}
                    label="d₂ (ведомый, мм)" 
                    value={inputs.d2} 
                    onChange={(e) => onInputChange(stageIndex, moduleIndex, 'd2', e.target.value)}
                    onIncrement={() => handleNumericInputWithControls(inputs.d2, 1, (v) => onInputChange(stageIndex, moduleIndex, 'd2', v))}
                    onDecrement={() => handleNumericInputWithControls(inputs.d2, -1, (v) => onInputChange(stageIndex, moduleIndex, 'd2', v), 0)}
                    error={errors.d2} warning={warnings.d2}
                    inputClassName={`text-gray-800`}
                />
            </div> 
            {isExpanded && <div className="pt-2 border-t mt-2 space-y-1"><div className="max-w-32"><SelectOrInput id={`${moduleData.id}-eta`} label={etaLabel} options={etaOptions} value={inputs.eta ?? ''} onChange={v => onInputChange(stageIndex, moduleIndex, 'eta', v)} onLabelClick={target => { const dynamicTooltipContent: TooltipContent = { ...TOOLTIP_DATA['eta'], description: `${TOOLTIP_DATA['eta'].description} \n\nДля "${moduleData.type}": ${etaData.description} Типичный диапазон: ${etaData.range}.` }; onParamClick(dynamicTooltipContent, target); }} error={errors.eta} isSuccess={isFieldSuccessful('eta')} /></div> <CalculatedParamsDisplay params={calculated} warnings={paramWarnings} onParamClick={onParamClick} renderToDataKeyMap={renderToDataKeyMap}/></div>}
        </div>
    );
};
const BevelGearModuleDisplay: React.FC<ModuleDisplayProps> = ({ moduleData, stageIndex, moduleIndex, onInputChange, onSelectChange, isExpanded, onParamClick, isFieldSuccessful }) => { 
    const inputs = moduleData.inputs as BevelGearInputParams; 
    const { errors = {}, warnings = {} } = moduleData.validationState || {};
    const calculated = { "Делит. d₁, мм": moduleData.bevel_d1, "Делит. d₂, мм": moduleData.bevel_d2, "Угол δ₁ (°)": moduleData.bevel_delta1, "Угол δ₂ (°)": moduleData.bevel_delta2, "Внеш. конус. расст. Re, мм": moduleData.bevel_Re, "Средний dₘ₁, мм": moduleData.bevel_dm1, "Средний dₘ₂, мм": moduleData.bevel_dm2, "Перекрытие εα": moduleData.bevel_epsilonAlpha, }; 
    const renderToDataKeyMap = { "Делит. d₁, мм": "bevel_d1", "Делит. d₂, мм": "bevel_d2", "Угол δ₁ (°)": "bevel_delta1", "Угол δ₂ (°)": "bevel_delta2", "Внеш. конус. расст. Re, мм": "bevel_Re", "Средний dₘ₁, мм": "bevel_dm1", "Средний dₘ₂, мм": "bevel_dm2", "Перекрытие εα": "bevel_epsilonAlpha" };
    
    const onBlurHandler = (field: 'z1' | 'z2') => (e: React.FocusEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const numValue = parseFloat(String(value).replace(',', '.'));
        if (isNaN(numValue) || String(value).trim() === '') return;
        const roundedValue = Math.round(numValue);
        if (roundedValue !== numValue) {
            onInputChange(stageIndex, moduleIndex, field, roundedValue);
        }
    };
    
    const customSelectOptions = BEVEL_GEAR_CONFIG_OPTIONS.map(opt => ({
        value: opt.value,
        label: opt.label,
        previewComponent: (
            <div className="w-[100px] h-[100px] flex items-center justify-center">
                <BevelGearUGO
                    width={100}
                    height={100}
                    z1={Number(inputs.z1) || 15}
                    z2={Number(inputs.z2) || 30}
                    config={opt.value}
                />
            </div>
        )
    }));

    const etaData = EFFICIENCY_DATABASE[moduleData.type];
    const typicalEta = etaData.typical;
    const etaOptions = [...new Set([Number((typicalEta - 0.02).toFixed(2)), Number((typicalEta - 0.01).toFixed(2)), typicalEta, Number((typicalEta + 0.01).toFixed(2))].filter(v => v > 0 && v <= 1))];
    const etaLabel = (<span className="group flex items-center">КПД (η) <InfoIcon /></span>);

    return (<div onClick={e => e.stopPropagation()}><div className="grid grid-cols-2 gap-2"><InputWithControls id={`${moduleData.id}-z1`} isSuccess={isFieldSuccessful('z1')} onBlur={onBlurHandler('z1')} error={errors.z1} warning={warnings.z1} onLabelClick={(t) => onParamClick(TOOLTIP_DATA['z1'], t)} label="z₁ (ведущая)" value={inputs.z1} onChange={(e) => onInputChange(stageIndex, moduleIndex, 'z1', e.target.value)} onIncrement={() => handleNumericInputWithControls(inputs.z1, 1, (v) => onInputChange(stageIndex, moduleIndex, 'z1', v))} onDecrement={() => handleNumericInputWithControls(inputs.z1, -1, (v) => onInputChange(stageIndex, moduleIndex, 'z1', v), 0)} inputClassName={`text-gray-800`} /> <InputWithControls id={`${moduleData.id}-z2`} isSuccess={isFieldSuccessful('z2')} onBlur={onBlurHandler('z2')} error={errors.z2} warning={warnings.z2} onLabelClick={(t) => onParamClick(TOOLTIP_DATA['z2'], t)} label="z₂ (ведомая)" value={inputs.z2} onChange={(e) => onInputChange(stageIndex, moduleIndex, 'z2', e.target.value)} onIncrement={() => handleNumericInputWithControls(inputs.z2, 1, (v) => onInputChange(stageIndex, moduleIndex, 'z2', v))} onDecrement={() => handleNumericInputWithControls(inputs.z2, -1, (v) => onInputChange(stageIndex, moduleIndex, 'z2', v), 0)} inputClassName={`text-gray-800`} /></div> <div className="!mb-1"><CustomSelect id={`${moduleData.id}-config`} isSuccess={isFieldSuccessful('config')} error={errors.config} onLabelClick={(t) => onParamClick(TOOLTIP_DATA['config_bevel'], t)} label="Тип" value={inputs.config || ""} onChange={(val) => onSelectChange?.(stageIndex, moduleIndex, 'config', val)} options={customSelectOptions} emptyOptionLabel="-- Выбрать --" selectClassName={`text-gray-800 !py-1 !text-sm`} /></div>{isExpanded && <div className="pt-2 border-t mt-2 space-y-1"><div className="max-w-48"><SelectOrInput id={`${moduleData.id}-m`} isSuccess={isFieldSuccessful('m')} min={0} onLabelClick={(t) => onParamClick(TOOLTIP_DATA['m_te'], t)} label="Внешний делит. модуль, mₜₑ (мм)" options={GEAR_MODULES} value={inputs.m} onChange={(v) => onInputChange(stageIndex, moduleIndex, 'm', v)} inputClassName={`text-gray-800`} selectClassName={`text-gray-800`} /></div> <InputWithControls id={`${moduleData.id}-b`} isSuccess={isFieldSuccessful('b')} error={errors.b} warning={warnings.b} onLabelClick={(t) => onParamClick(TOOLTIP_DATA['b'], t)} label="Ширина венца, b (мм)" value={inputs.b} onChange={(e) => onInputChange(stageIndex, moduleIndex, 'b', e.target.value)} onIncrement={() => handleNumericInputWithControls(inputs.b, 1, (v) => onInputChange(stageIndex, moduleIndex, 'b', v))} onDecrement={() => handleNumericInputWithControls(inputs.b, -1, (v) => onInputChange(stageIndex, moduleIndex, 'b', v), 0)} inputClassName={`text-gray-800`} /> <div className="max-w-32"><SelectOrInput id={`${moduleData.id}-eta`} label={etaLabel} options={etaOptions} value={inputs.eta ?? ''} onChange={v => onInputChange(stageIndex, moduleIndex, 'eta', v)} onLabelClick={target => { const dynamicTooltipContent: TooltipContent = { ...TOOLTIP_DATA['eta'], description: `${TOOLTIP_DATA['eta'].description} \n\nДля "${moduleData.type}": ${etaData.description} Типичный диапазон: ${etaData.range}.` }; onParamClick(dynamicTooltipContent, target); }} error={errors.eta} isSuccess={isFieldSuccessful('eta')} /></div> <CalculatedParamsDisplay params={calculated} onParamClick={onParamClick} renderToDataKeyMap={renderToDataKeyMap}/></div>}</div>);
};
const WormGearModuleDisplay: React.FC<ModuleDisplayProps> = ({ moduleData, stageIndex, moduleIndex, onInputChange, onSelectChange, isExpanded, onParamClick, isFieldSuccessful }) => { 
    const inputs = moduleData.inputs as WormGearInputParams; 
    const { errors = {}, warnings = {} } = moduleData.validationState || {};
    const calculated = { "Межосевое a, мм": moduleData.worm_a, "d₁ червяка, мм": moduleData.worm_d1, "d₂ колеса, мм": moduleData.worm_d2, "dₐ₁ червяка, мм": moduleData.worm_da1, "dₐ₂ колеса, мм": moduleData.worm_da2, "d𝒻₂ колеса, мм": moduleData.worm_df2, "Угол подъема γ (°)": moduleData.worm_gamma, }; 
    const renderToDataKeyMap = { "Межосевое a, мм": "worm_a", "d₁ червяка, мм": "worm_d1", "d₂ колеса, мм": "worm_d2", "dₐ₁ червяка, мм": "worm_da1", "dₐ₂ колеса, мм": "worm_da2", "d𝒻₂ колеса, мм": "worm_df2", "Угол подъема γ (°)": "worm_gamma" };
    
    const onBlurHandler = (field: 'z1' | 'z2') => (e: React.FocusEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const numValue = parseFloat(String(value).replace(',', '.'));
        if (isNaN(numValue) || String(value).trim() === '') return;
        const roundedValue = Math.round(numValue);
        if (roundedValue !== numValue) {
            onInputChange(stageIndex, moduleIndex, field, roundedValue);
        }
    };
    
    const customSelectOptions = WORM_GEAR_CONFIG_OPTIONS.map(opt => ({
        value: opt.value,
        label: opt.label,
        previewComponent: (
             <div className="w-[100px] h-[100px] flex items-center justify-center">
                <WormDriveUGO
                    width={100}
                    height={100}
                    z1={Number(inputs.z1) || 2}
                    z2={Number(inputs.z2) || 40}
                    u={(Number(inputs.z2) || 40) / (Number(inputs.z1) || 2)}
                    config={opt.value}
                    cuttingDirection="right"
                />
            </div>
        )
    }));

    const etaData = EFFICIENCY_DATABASE[moduleData.type];
    const typicalEta = etaData.typical;
    const etaOptions = [...new Set([Number((typicalEta - 0.1).toFixed(2)), typicalEta, Number((typicalEta + 0.1).toFixed(2))].filter(v => v > 0 && v <= 1))];
    const etaLabel = (<span className="group flex items-center">КПД (η) <InfoIcon /></span>);

    return (<div onClick={e => e.stopPropagation()}><div className="grid grid-cols-2 gap-2"><InputWithControls id={`${moduleData.id}-z1`} isSuccess={isFieldSuccessful('z1')} onBlur={onBlurHandler('z1')} error={errors.z1} warning={warnings.z1} onLabelClick={(t) => onParamClick(TOOLTIP_DATA['z1'], t)} label="z₁ (червяк)" value={inputs.z1} onChange={(e) => onInputChange(stageIndex, moduleIndex, 'z1', e.target.value)} onIncrement={() => handleNumericInputWithControls(inputs.z1, 1, (v) => onInputChange(stageIndex, moduleIndex, 'z1', v))} onDecrement={() => handleNumericInputWithControls(inputs.z1, -1, (v) => onInputChange(stageIndex, moduleIndex, 'z1', v), 0)} inputClassName={`text-gray-800`} /> <InputWithControls id={`${moduleData.id}-z2`} isSuccess={isFieldSuccessful('z2')} onBlur={onBlurHandler('z2')} error={errors.z2} warning={warnings.z2} onLabelClick={(t) => onParamClick(TOOLTIP_DATA['z2'], t)} label="z₂ (колесо)" value={inputs.z2} onChange={(e) => onInputChange(stageIndex, moduleIndex, 'z2', e.target.value)} onIncrement={() => handleNumericInputWithControls(inputs.z2, 1, (v) => onInputChange(stageIndex, moduleIndex, 'z2', v))} onDecrement={() => handleNumericInputWithControls(inputs.z2, -1, (v) => onInputChange(stageIndex, moduleIndex, 'z2', v), 0)} inputClassName={`text-gray-800`} /></div> <div className="!mb-1"><CustomSelect id={`${moduleData.id}-config`} isSuccess={isFieldSuccessful('config')} error={errors.config} onLabelClick={(t) => onParamClick(TOOLTIP_DATA['config_worm'], t)} label="Тип" value={inputs.config || ""} onChange={(val) => onSelectChange?.(stageIndex, moduleIndex, 'config', val)} options={customSelectOptions} emptyOptionLabel="-- Выбрать --" selectClassName={`text-gray-800 !py-1 !text-sm`} /></div>{isExpanded && <div className="pt-2 border-t mt-2 space-y-1"><div className="max-w-24"><SelectOrInput id={`${moduleData.id}-m`} isSuccess={isFieldSuccessful('m')} min={0} onLabelClick={(t) => onParamClick(TOOLTIP_DATA['m'], t)} label="Модуль, m (мм)" options={GEAR_MODULES} value={inputs.m} onChange={(v) => onInputChange(stageIndex, moduleIndex, 'm', v)} inputClassName={`text-gray-800`} selectClassName={`text-gray-800`} /></div> <div className="max-w-32"><SelectOrInput id={`${moduleData.id}-q`} isSuccess={isFieldSuccessful('q')} min={0} onLabelClick={(t) => onParamClick(TOOLTIP_DATA['q'], t)} label="Коэф. диам. q" options={WORM_DIAMETER_COEFFICIENTS} value={inputs.q} onChange={(v) => onInputChange(stageIndex, moduleIndex, 'q', v)} inputClassName={`text-gray-800`} selectClassName={`text-gray-800`} /></div> <div className="max-w-32"><SelectOrInput id={`${moduleData.id}-eta`} label={etaLabel} options={etaOptions} value={inputs.eta ?? ''} onChange={v => onInputChange(stageIndex, moduleIndex, 'eta', v)} onLabelClick={target => { const dynamicTooltipContent: TooltipContent = { ...TOOLTIP_DATA['eta'], description: `${TOOLTIP_DATA['eta'].description} \n\nДля "${moduleData.type}": ${etaData.description} Типичный диапазон: ${etaData.range}.` }; onParamClick(dynamicTooltipContent, target); }} error={errors.eta} isSuccess={isFieldSuccessful('eta')} /></div> <CalculatedParamsDisplay params={calculated} onParamClick={onParamClick} renderToDataKeyMap={renderToDataKeyMap}/></div>}</div>);
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
          showNotification('Параметры скопированы!', 'success');
        } catch (err) {
          showNotification('Ошибка копирования. Убедитесь, что ваш браузер разрешает доступ к буферу обмена.', 'error');
        }
        setIsMenuOpen(false);
    };

    const handlePaste = async () => {
        try {
          const text = await navigator.clipboard.readText();
          const parsed = JSON.parse(text);
          if (parsed.appIdentifier === 'transmission-calculator-module' && parsed.data) {
            onPasteModule(parsed.data);
            showNotification('Параметры вставлены!', 'success');
          } else {
            throw new Error('Invalid data format');
          }
        } catch (err) {
          showNotification('Буфер обмена не содержит данных для вставки или произошла ошибка.', 'error');
        }
        setIsMenuOpen(false);
    };

    const singleOnlyTypes: GearType[] = [GearType.Planetary, GearType.Bevel, GearType.Worm];
    
    const availableTypes = (canBeSelected && !singleOnlyTypes.includes(moduleData.type))
        ? AVAILABLE_GEAR_TYPES.filter(t => !singleOnlyTypes.includes(t))
        : AVAILABLE_GEAR_TYPES;
    const gearTypeOptions = availableTypes.map(gt => ({ value: gt, label: gt }));
    
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
            aria-label={`Вариант: ${moduleData.type}. ${moduleData.isSelected ? 'Выбран как ведущий.' : 'Нажмите Enter, чтобы выбрать.'}`}
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
                            <Button onClick={handleMenuToggle} variant="secondary" className="!p-1.5 text-xs leading-none" title="Действия"><KebabMenuIcon/></Button>
                            {isMenuOpen && (
                                <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-md shadow-lg border z-20 py-1">
                                    <button onClick={handleCopy} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Копировать параметры</button>
                                    <button onClick={handlePaste} disabled={!canPaste} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed">Вставить параметры</button>
                                </div>
                            )}
                        </div>
                        <Button onClick={(e) => { e.stopPropagation(); onRemove(); }} variant="secondary" className="!p-1.5 ml-1 text-xs leading-none" title="Удалить вариант"><CrossIcon/></Button>
                    </div>
                </div>

                {canBeSelected && (
                    <div className="flex items-center space-x-2 p-2 mb-2 rounded-md bg-slate-50 cursor-pointer hover:bg-slate-200 transition-colors" onClick={(e) => { e.stopPropagation(); onModuleSelect(); }} >
                        <input type="radio" name={`stage-select-${stageIndex}`} id={`module-select-${moduleData.id}`} checked={moduleData.isSelected} onChange={onModuleSelect} className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer" />
                        <label htmlFor={`module-select-${moduleData.id}`} className={`text-sm font-semibold cursor-pointer ${moduleData.isSelected ? 'text-blue-700' : 'text-gray-700'}`} >
                            {moduleData.isSelected ? '✓ Ведущий' : 'Сделать ведущим'}
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

                <div className="mt-2 pt-2 border-t border-gray-200 flex justify-between items-center font-semibold text-sm rounded hover:bg-gray-100 cursor-pointer p-1 -m-1" onClick={(e) => { e.stopPropagation(); onParamClick(TOOLTIP_DATA['u'], e.currentTarget as HTMLElement) }}>
                    <span className="text-gray-600">Передача (u):</span>
                    <span className="text-gray-800 text-base">{moduleData.u?.toFixed(4) ?? '-'}</span>
                </div>

                <div
                  id={`module-details-content-${moduleData.id}`}
                  className={`transition-[max-height,opacity] duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-50'}`}
                >
                    <div className="pt-2">
                        <StageCharacteristicsDisplay cascade={moduleData.cascadeIn} title="Входные х-ки ступени" dir={moduleData.moduleInDirection} orientation={moduleData.moduleInOrientation} />
                        <StageCharacteristicsDisplay cascade={moduleData.cascadeOut} title="Выходные х-ки ступени" dir={moduleData.moduleOutDirection} orientation={moduleData.moduleOutOrientation}/>
                        {moduleData.error && <p className={`mt-1 text-xs ${ERROR_TEXT_COLOR} font-semibold`}>{moduleData.error}</p>}
                        {moduleData.assemblyError && moduleData.type === GearType.Planetary && <p className={`mt-1 text-xs ${ERROR_TEXT_COLOR} font-semibold`}>{moduleData.assemblyError}</p>}
                    </div>
                </div>
            </div>
            <button
                id={`module-details-btn-${moduleData.id}`}
                onClick={(e) => { e.stopPropagation(); onToggleExpansion(); }}
                className="w-full mt-2 p-1.5 flex justify-center items-center text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
                <span>Детали</span>
                <ChevronIcon isExpanded={isExpanded} />
            </button>
        </div>
    );
});
