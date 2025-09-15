import React, { useState, useRef, useCallback, useEffect } from 'react';
import { EngineParams, StageCalculationData, FinalCalculationResults, GearType, ModuleCalculationData, ModuleSpecificInputs, GearInputParams, ChainInputParams, PlanetaryInputParams, CascadeValues, RotationDirection, ToothedBeltInputParams, BeltInputParams, BevelGearInputParams, BevelGearConfigType, WormGearInputParams, ShaftOrientation, WormGearConfigType, PlanetaryConfig, PlanetaryGearConfigType, AVAILABLE_GEAR_TYPES, BevelGearPlacement, PLANETARY_CONFIG_MAP, PLANETARY_SHAFT_OPTIONS, PLANETARY_CONFIG_OPTIONS, BEVEL_GEAR_CONFIG_OPTIONS, WORM_GEAR_CONFIG_OPTIONS, SchemeElement } from '../types';
import Button from '../components/Button';
import Input from '../components/Input';
import Select from '../components/Select';
import { ERROR_BG_COLOR, ERROR_TEXT_COLOR, getRotationIconPath, PLANETARY_SHAFT_INPUT_BG, GEAR_MODULES, CHAIN_PITCHES, TOOTHED_BELT_PITCHES, WORM_DIAMETER_COEFFICIENTS } from '../constants';
import { BevelGearUGO } from '../ugo-components/BevelGearUGO';
import { WormDriveUGO } from '../ugo-components/WormDriveUGO';
import { PlanetaryGearUGO } from '../ugo-components/PlanetaryGearUGO';
import InputWithControls from '../components/InputWithControls';
import { SelectOrInput } from '../components/SelectOrInput';
import { CustomSelect } from '../components/CustomSelect';
import { Tooltip } from '../components/Tooltip';
import { TOOLTIP_DATA } from '../tooltip-data';

const getGearCategory = (type: GearType): 'parallel' | 'square' => {
    const PARALLEL_TYPES = [GearType.Gear, GearType.Chain, GearType.ToothedBelt, GearType.Belt];
    if (PARALLEL_TYPES.includes(type)) {
        return 'parallel';
    }
    return 'square'; // Covers Bevel, Worm, Planetary
};

// --- Local Components (copied from old pages for encapsulation) ---

const PlusIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>);
const CrossIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>);
const ChevronIcon = ({ isExpanded }: { isExpanded: boolean }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
);


interface ModuleProps { moduleData: ModuleCalculationData; stageIndex: number; moduleIndex: number; onInputChange: (stageIdx: number, moduleIdx: number, field: string, value: string | number) => void; onSelectChange?: (stageIdx: number, moduleIdx: number, field: string, value: any) => void; onModuleSelect: (stageIdx: number, moduleIdx: number) => void; canBeSelected: boolean; isExpanded: boolean; onToggleExpansion: () => void; onParamClick: (key: string, target: HTMLElement) => void; }
const CalculatedParamsDisplay: React.FC<{ params: Record<string, string | number | undefined | boolean>, warnings?: Record<string, string>, onParamClick: (key: string, target: HTMLElement) => void, renderToDataKeyMap: Record<string, string> }> = ({ params, warnings, onParamClick, renderToDataKeyMap }) => (
    <div className="mt-2 pt-2 border-t border-gray-400 font-semibold text-xs leading-snug">
        <h5 className="text-gray-600 mb-1">Расчетные параметры модуля:</h5>
        {Object.entries(params).map(([key, value]) => {
            if (value === undefined || value === '' || value === null) return null;
            const dataKey = renderToDataKeyMap[key];
            const hasTooltip = dataKey && TOOLTIP_DATA[dataKey];
            const content = (<p className="text-gray-700">{key}: {typeof value === 'number' ? value.toFixed(value % 1 === 0 ? 0 : 4) : String(value)} {warnings && warnings[key] && <span className="ml-1 text-orange-600 font-bold" title={warnings[key]}>(i)</span>}</p>);

            if (hasTooltip) {
                return (
                    <div key={key} onClick={(e) => { e.stopPropagation(); onParamClick(dataKey, e.currentTarget); }} className="p-0.5 -m-0.5 rounded hover:bg-gray-100 cursor-pointer transition-colors duration-150">
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

// --- Module Display Components ---
const GearModuleDisplay: React.FC<Pick<ModuleProps, 'moduleData' | 'stageIndex' | 'moduleIndex' | 'onInputChange' | 'isExpanded' | 'onParamClick'> & { isFieldSuccessful: (field: string) => boolean }> = ({ moduleData, stageIndex, moduleIndex, onInputChange, isExpanded, onParamClick, isFieldSuccessful }) => { 
    const inputs = moduleData.inputs as GearInputParams; 
    const { errors = {}, warnings = {} } = moduleData.validationState || {}; 
    const calculated = { "Межосевое a": moduleData.a, "Диаметр d₁": moduleData.d1, "Диаметр d₂": moduleData.d2, "d вершин dₐ₁": moduleData.da1, "d вершин dₐ₂": moduleData.da2, "d впадин d𝒻₁": moduleData.df1, "d впадин d𝒻₂": moduleData.df2, "Перекрытие εα": moduleData.epsilonAlpha }; 
    const renderToDataKeyMap = { "Межосевое a": "a", "Диаметр d₁": "d1", "Диаметр d₂": "d2", "d вершин dₐ₁": "da1", "d вершин dₐ₂": "da2", "d впадин d𝒻₁": "df1", "d впадин d𝒻₂": "df2", "Перекрытие εα": "epsilonAlpha" }; 
    
    const onBlurHandler = (field: 'z1' | 'z2') => (e: React.FocusEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const numValue = parseFloat(String(value).replace(',', '.'));
        if (isNaN(numValue) || String(value).trim() === '') return;
        const roundedValue = Math.round(numValue);
        if (roundedValue !== numValue) {
            onInputChange(stageIndex, moduleIndex, field, roundedValue);
        }
    };
    
    return (<div onClick={e => e.stopPropagation()}><div className="grid grid-cols-2 gap-2"><InputWithControls isSuccess={isFieldSuccessful('z1')} onBlur={onBlurHandler('z1')} error={errors.z1} warning={warnings.z1} onLabelClick={(t) => onParamClick('z1', t)} label="z₁ (ведущая)" value={inputs.z1} onChange={(e) => onInputChange(stageIndex, moduleIndex, 'z1', e.target.value)} onIncrement={() => handleNumericInputWithControls(inputs.z1, 1, (v) => onInputChange(stageIndex, moduleIndex, 'z1', v))} onDecrement={() => handleNumericInputWithControls(inputs.z1, -1, (v) => onInputChange(stageIndex, moduleIndex, 'z1', v), 0)} inputClassName={`text-gray-800`}/> <InputWithControls isSuccess={isFieldSuccessful('z2')} onBlur={onBlurHandler('z2')} error={errors.z2} warning={warnings.z2} onLabelClick={(t) => onParamClick('z2', t)} label="z₂ (ведомая)" value={inputs.z2} onChange={(e) => onInputChange(stageIndex, moduleIndex, 'z2', e.target.value)} onIncrement={() => handleNumericInputWithControls(inputs.z2, 1, (v) => onInputChange(stageIndex, moduleIndex, 'z2', v))} onDecrement={() => handleNumericInputWithControls(inputs.z2, -1, (v) => onInputChange(stageIndex, moduleIndex, 'z2', v), 0)} inputClassName={`text-gray-800`}/></div> {isExpanded && <div className="pt-2 border-t mt-2 space-y-1"><div className="max-w-24"><SelectOrInput isSuccess={isFieldSuccessful('m')} min={0} onLabelClick={(t) => onParamClick('m', t)} label="Модуль, m" options={GEAR_MODULES} value={inputs.m} onChange={(v) => onInputChange(stageIndex, moduleIndex, 'm', v)} inputClassName={`text-gray-800`} selectClassName={`text-gray-800`} /></div> <Input isSuccess={isFieldSuccessful('eta')} onLabelClick={(t) => onParamClick('eta', t)} label="КПД (0.0-1.0)" value={inputs.eta ?? '0.98'} onChange={(e) => onInputChange(stageIndex, moduleIndex, 'eta', e.target.value)} type="number" min={0} max={1} step={0.01} placeholder="0.98" error={errors.eta} inputClassName={`text-gray-800`} className="!mb-1 max-w-24" /><CalculatedParamsDisplay params={calculated} onParamClick={onParamClick} renderToDataKeyMap={renderToDataKeyMap}/></div>}</div>);};
const ChainModuleDisplay: React.FC<Pick<ModuleProps, 'moduleData' | 'stageIndex' | 'moduleIndex' | 'onInputChange' | 'isExpanded' | 'onParamClick'> & { isFieldSuccessful: (field: string) => boolean }> = ({ moduleData, stageIndex, moduleIndex, onInputChange, isExpanded, onParamClick, isFieldSuccessful }) => { 
    const inputs = moduleData.inputs as ChainInputParams; 
    const { errors = {}, warnings = {} } = moduleData.validationState || {}; 
    const calculated = { "Делит. d₁": moduleData.chain_d1, "Делит. d₂": moduleData.chain_d2, "Внешн. da₁": moduleData.chain_da1, "Внешн. da₂": moduleData.chain_da2, "Мин. межосевое aₘᵢₙ": moduleData.chain_amin, }; 
    const paramWarnings = { "Мин. межосевое aₘᵢₙ": "ВНИМАНИЕ: Это теор. расстояние по делит. диаметрам. Реальное (по внешним диаметрам + зазор) будет больше." }; 
    const renderToDataKeyMap = { "Делит. d₁": "chain_d1", "Делит. d₂": "chain_d2", "Внешн. da₁": "chain_da1", "Внешн. da₂": "chain_da2", "Мин. межосевое aₘᵢₙ": "chain_amin" }; 
    
    const onBlurHandler = (field: 'z1' | 'z2') => (e: React.FocusEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const numValue = parseFloat(String(value).replace(',', '.'));
        if (isNaN(numValue) || String(value).trim() === '') return;
        const roundedValue = Math.round(numValue);
        if (roundedValue !== numValue) {
            onInputChange(stageIndex, moduleIndex, field, roundedValue);
        }
    };
    
    return (<div onClick={e => e.stopPropagation()}><div className="grid grid-cols-2 gap-2"><InputWithControls isSuccess={isFieldSuccessful('z1')} onBlur={onBlurHandler('z1')} error={errors.z1} warning={warnings.z1} onLabelClick={(t) => onParamClick('z1', t)} label="z₁ (ведущая)" value={inputs.z1} onChange={(e) => onInputChange(stageIndex, moduleIndex, 'z1', e.target.value)} onIncrement={() => handleNumericInputWithControls(inputs.z1, 1, (v) => onInputChange(stageIndex, moduleIndex, 'z1', v))} onDecrement={() => handleNumericInputWithControls(inputs.z1, -1, (v) => onInputChange(stageIndex, moduleIndex, 'z1', v), 0)} inputClassName={`text-gray-800`} /> <InputWithControls isSuccess={isFieldSuccessful('z2')} onBlur={onBlurHandler('z2')} error={errors.z2} warning={warnings.z2} onLabelClick={(t) => onParamClick('z2', t)} label="z₂ (ведомая)" value={inputs.z2} onChange={(e) => onInputChange(stageIndex, moduleIndex, 'z2', e.target.value)} onIncrement={() => handleNumericInputWithControls(inputs.z2, 1, (v) => onInputChange(stageIndex, moduleIndex, 'z2', v))} onDecrement={() => handleNumericInputWithControls(inputs.z2, -1, (v) => onInputChange(stageIndex, moduleIndex, 'z2', v), 0)} inputClassName={`text-gray-800`} /></div> {isExpanded && <div className="pt-2 border-t mt-2 space-y-1"><div className="max-w-24"><SelectOrInput isSuccess={isFieldSuccessful('p')} min={0} onLabelClick={(t) => onParamClick('p', t)} label="Шаг цепи, p (мм)" options={CHAIN_PITCHES} value={inputs.p} onChange={(v) => onInputChange(stageIndex, moduleIndex, 'p', v)} inputClassName={`text-gray-800`} selectClassName={`text-gray-800`} /></div> <Input isSuccess={isFieldSuccessful('eta')} onLabelClick={(t) => onParamClick('eta', t)} label="КПД (0.0-1.0)" value={inputs.eta ?? '0.95'} onChange={(e) => onInputChange(stageIndex, moduleIndex, 'eta', e.target.value)} type="number" min={0} max={1} step={0.01} placeholder="0.95" error={errors.eta} inputClassName={`text-gray-800`} className="!mb-1 max-w-24" /><CalculatedParamsDisplay params={calculated} warnings={paramWarnings} onParamClick={onParamClick} renderToDataKeyMap={renderToDataKeyMap}/></div>}</div>);};
const PlanetaryModuleDisplay: React.FC<Pick<ModuleProps, 'moduleData' | 'stageIndex' | 'moduleIndex' | 'onInputChange' | 'onSelectChange' | 'isExpanded' | 'onParamClick'> & { isFieldSuccessful: (field: string) => boolean }> = ({ moduleData, stageIndex, moduleIndex, onInputChange, onSelectChange, isExpanded, onParamClick, isFieldSuccessful }) => { 
    const inputs = moduleData.inputs as PlanetaryInputParams;
    const { errors = {}, warnings = {} } = moduleData.validationState || {};
    const assemblyText = moduleData.assemblyPossible ? "Возможна" : (errors.zSun || (moduleData.zPlanet !== undefined ? "СБОРКА НЕВОЗМОЖНА" : "")); 
    const calculated = { "z Сателлита": moduleData.zPlanet, "Условие сборки": assemblyText, "d Солнца": moduleData.planetary_dSun, "d Сателлита": moduleData.planetary_dPlanet, "d Короны": moduleData.planetary_dRing, "Межосевое a (S-P)": moduleData.planetary_a, "Зафиксир. вал": moduleData.fixedShaft, "Перекрытие S-P εα": moduleData.epsilon_sp, "Перекрытие P-R εα": moduleData.epsilon_pr }; 
    const renderToDataKeyMap = { "z Сателлита": "zPlanet", "Условие сборки": "assemblyPossible", "d Солнца": "planetary_dSun", "d Сателлита": "planetary_dPlanet", "d Короны": "planetary_dRing", "Межосевое a (S-P)": "planetary_a", "Зафиксир. вал": "fixedShaft", "Перекрытие S-P εα": "epsilon_sp", "Перекрытие P-R εα": "epsilon_pr" };
    
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

    return (<div onClick={e => e.stopPropagation()}><div className="grid grid-cols-2 gap-2"><InputWithControls isSuccess={isFieldSuccessful('zSun')} onBlur={onBlurHandler('zSun')} error={errors.zSun} warning={warnings.zSun} onLabelClick={(t) => onParamClick('zSun', t)} label="z Солнца" value={inputs.zSun} onChange={(e) => onInputChange(stageIndex, moduleIndex, 'zSun', e.target.value)} onIncrement={() => handleNumericInputWithControls(inputs.zSun, 1, (v) => onInputChange(stageIndex, moduleIndex, 'zSun', v))} onDecrement={() => handleNumericInputWithControls(inputs.zSun, -1, (v) => onInputChange(stageIndex, moduleIndex, 'zSun', v), 0)} inputClassName={`text-gray-800`} /> <InputWithControls isSuccess={isFieldSuccessful('zRing')} onBlur={onBlurHandler('zRing')} error={errors.zRing} warning={warnings.zRing} onLabelClick={(t) => onParamClick('zRing', t)} label="z Короны" value={inputs.zRing} onChange={(e) => onInputChange(stageIndex, moduleIndex, 'zRing', e.target.value)} onIncrement={() => handleNumericInputWithControls(inputs.zRing, 1, (v) => onInputChange(stageIndex, moduleIndex, 'zRing', v))} onDecrement={() => handleNumericInputWithControls(inputs.zRing, -1, (v) => onInputChange(stageIndex, moduleIndex, 'zRing', v), 0)} inputClassName={`text-gray-800`} /></div> <CustomSelect isSuccess={isFieldSuccessful('shaftConfig')} error={errors.shaftConfig} onLabelClick={(t) => onParamClick('shaftConfig', t)} label="Вход → Выход" value={inputs.shaftConfig || ""} onChange={(val) => onSelectChange?.(stageIndex, moduleIndex, 'shaftConfig', val as PlanetaryConfig)} options={customSelectOptions} emptyOptionLabel="-- Выбрать --" className="!mb-1" selectClassName={`${PLANETARY_SHAFT_INPUT_BG} text-gray-800 !py-1 !text-sm`} /> {isExpanded && <div className="pt-2 border-t mt-2 space-y-1"><div className="max-w-24"><SelectOrInput isSuccess={isFieldSuccessful('m')} min={0} onLabelClick={(t) => onParamClick('m', t)} label="Модуль, m" options={GEAR_MODULES} value={inputs.m} onChange={(v) => onInputChange(stageIndex, moduleIndex, 'm', v)} inputClassName={`text-gray-800`} selectClassName={`text-gray-800`} /></div> <Input isSuccess={isFieldSuccessful('eta')} onLabelClick={(t) => onParamClick('eta', t)} label="КПД (0.0-1.0)" value={inputs.eta ?? '0.98'} onChange={(e) => onInputChange(stageIndex, moduleIndex, 'eta', e.target.value)} type="number" min={0} max={1} step={0.01} placeholder="0.98" error={errors.eta} inputClassName={`text-gray-800`} className="!mb-1 max-w-24" /><CalculatedParamsDisplay params={calculated} onParamClick={onParamClick} renderToDataKeyMap={renderToDataKeyMap}/></div>}</div>);
};
const ToothedBeltModuleDisplay: React.FC<Pick<ModuleProps, 'moduleData' | 'stageIndex' | 'moduleIndex' | 'onInputChange' | 'isExpanded' | 'onParamClick'> & { isFieldSuccessful: (field: string) => boolean }> = ({ moduleData, stageIndex, moduleIndex, onInputChange, isExpanded, onParamClick, isFieldSuccessful }) => { 
    const inputs = moduleData.inputs as ToothedBeltInputParams; 
    const { errors = {}, warnings = {} } = moduleData.validationState || {}; 
    const calculated = { "d₁ (шкив)": moduleData.tb_d1, "d₂ (шкив)": moduleData.tb_d2, "aₘᵢₙ (теор.)": moduleData.tb_amin, }; 
    const paramWarnings = { "aₘᵢₙ (теор.)": "ВНИМАНИЕ: Это теоретическое расстояние по делительным диаметрам шкивов. Реальное межосевое расстояние будет зависеть от выбранного ремня и требуемого натяжения." }; 
    const renderToDataKeyMap = { "d₁ (шкив)": "tb_d1", "d₂ (шкив)": "tb_d2", "aₘᵢₙ (теор.)": "tb_amin" }; 
    
    const onBlurHandler = (field: 'z1' | 'z2') => (e: React.FocusEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const numValue = parseFloat(String(value).replace(',', '.'));
        if (isNaN(numValue) || String(value).trim() === '') return;
        const roundedValue = Math.round(numValue);
        if (roundedValue !== numValue) {
            onInputChange(stageIndex, moduleIndex, field, roundedValue);
        }
    };

    return (<div onClick={e => e.stopPropagation()}><div className="grid grid-cols-2 gap-2"><InputWithControls isSuccess={isFieldSuccessful('z1')} onBlur={onBlurHandler('z1')} error={errors.z1} warning={warnings.z1} onLabelClick={(t) => onParamClick('z1', t)} label="z₁ (ведущий)" value={inputs.z1} onChange={(e) => onInputChange(stageIndex, moduleIndex, 'z1', e.target.value)} onIncrement={() => handleNumericInputWithControls(inputs.z1, 1, (v) => onInputChange(stageIndex, moduleIndex, 'z1', v))} onDecrement={() => handleNumericInputWithControls(inputs.z1, -1, (v) => onInputChange(stageIndex, moduleIndex, 'z1', v), 0)} inputClassName={`text-gray-800`} /> <InputWithControls isSuccess={isFieldSuccessful('z2')} onBlur={onBlurHandler('z2')} error={errors.z2} warning={warnings.z2} onLabelClick={(t) => onParamClick('z2', t)} label="z₂ (ведомый)" value={inputs.z2} onChange={(e) => onInputChange(stageIndex, moduleIndex, 'z2', e.target.value)} onIncrement={() => handleNumericInputWithControls(inputs.z2, 1, (v) => onInputChange(stageIndex, moduleIndex, 'z2', v))} onDecrement={() => handleNumericInputWithControls(inputs.z2, -1, (v) => onInputChange(stageIndex, moduleIndex, 'z2', v), 0)} inputClassName={`text-gray-800`} /></div> {isExpanded && <div className="pt-2 border-t mt-2 space-y-1"><div className="max-w-24"><SelectOrInput isSuccess={isFieldSuccessful('p')} min={0} onLabelClick={(t) => onParamClick('p', t)} label="Шаг ремня, p (мм)" options={TOOTHED_BELT_PITCHES} value={inputs.p} onChange={(v) => onInputChange(stageIndex, moduleIndex, 'p', v)} inputClassName={`text-gray-800`} selectClassName={`text-gray-800`} /></div> <Input isSuccess={isFieldSuccessful('eta')} onLabelClick={(t) => onParamClick('eta', t)} label="КПД (0.0-1.0)" value={inputs.eta ?? '0.95'} onChange={(e) => onInputChange(stageIndex, moduleIndex, 'eta', e.target.value)} type="number" min={0} max={1} step={0.01} placeholder="0.95" error={errors.eta} inputClassName={`text-gray-800`} className="!mb-1 max-w-24" /><CalculatedParamsDisplay params={calculated} warnings={paramWarnings} onParamClick={onParamClick} renderToDataKeyMap={renderToDataKeyMap}/></div>}</div>);};
const BeltModuleDisplay: React.FC<Pick<ModuleProps, 'moduleData' | 'stageIndex' | 'moduleIndex' | 'onInputChange' | 'isExpanded' | 'onParamClick'> & { isFieldSuccessful: (field: string) => boolean }> = ({ moduleData, stageIndex, moduleIndex, onInputChange, isExpanded, onParamClick, isFieldSuccessful }) => { 
    const inputs = moduleData.inputs as BeltInputParams; 
    const { errors = {}, warnings = {} } = moduleData.validationState || {};
    const calculated = { "d₁ (расч.)": moduleData.actual_d1, "d₂ (расч.)": moduleData.actual_d2, "aₘᵢₙ (теор.)": moduleData.belt_amin, }; 
    const paramWarnings = { "aₘᵢₙ (теор.)": "ВНИМАНИЕ: Это теоретическое расстояние по расчетным диаметрам шкивов. Реальное межосевое расстояние будет зависеть от типа ремня, его длины и требуемого натяжения." }; 
    const renderToDataKeyMap = { "d₁ (расч.)": "actual_d1", "d₂ (расч.)": "actual_d2", "aₘᵢₙ (теор.)": "belt_amin" };
    return (
        <div onClick={e => e.stopPropagation()}>
            <div className="grid grid-cols-2 gap-2">
                <InputWithControls 
                    isSuccess={isFieldSuccessful('d1')}
                    onLabelClick={(t) => onParamClick('d1_input', t)}
                    label="d₁ (ведущий, мм)" 
                    value={inputs.d1} 
                    onChange={(e) => onInputChange(stageIndex, moduleIndex, 'd1', e.target.value)} 
                    onIncrement={() => handleNumericInputWithControls(inputs.d1, 1, (v) => onInputChange(stageIndex, moduleIndex, 'd1', v))}
                    onDecrement={() => handleNumericInputWithControls(inputs.d1, -1, (v) => onInputChange(stageIndex, moduleIndex, 'd1', v), 0)}
                    error={errors.d1} warning={warnings.d1}
                    inputClassName={`text-gray-800`}
                />
                <InputWithControls 
                    isSuccess={isFieldSuccessful('d2')}
                    onLabelClick={(t) => onParamClick('d2_input', t)}
                    label="d₂ (ведомый, мм)" 
                    value={inputs.d2} 
                    onChange={(e) => onInputChange(stageIndex, moduleIndex, 'd2', e.target.value)}
                    onIncrement={() => handleNumericInputWithControls(inputs.d2, 1, (v) => onInputChange(stageIndex, moduleIndex, 'd2', v))}
                    onDecrement={() => handleNumericInputWithControls(inputs.d2, -1, (v) => onInputChange(stageIndex, moduleIndex, 'd2', v), 0)}
                    error={errors.d2} warning={warnings.d2}
                    inputClassName={`text-gray-800`}
                />
            </div> 
            {isExpanded && <div className="pt-2 border-t mt-2 space-y-1"><Input isSuccess={isFieldSuccessful('eta')} onLabelClick={(t) => onParamClick('eta', t)} label="КПД (0.0-1.0)" value={inputs.eta ?? '0.95'} onChange={(e) => onInputChange(stageIndex, moduleIndex, 'eta', e.target.value)} type="number" min={0} max={1} step={0.01} placeholder="0.95" error={errors.eta} inputClassName={`text-gray-800`} className="!mb-1 max-w-24" /><CalculatedParamsDisplay params={calculated} warnings={paramWarnings} onParamClick={onParamClick} renderToDataKeyMap={renderToDataKeyMap}/></div>}
        </div>
    );
};
const BevelGearModuleDisplay: React.FC<Pick<ModuleProps, 'moduleData' | 'stageIndex' | 'moduleIndex' | 'onInputChange' | 'onSelectChange' | 'isExpanded' | 'onParamClick'> & { isFieldSuccessful: (field: string) => boolean }> = ({ moduleData, stageIndex, moduleIndex, onInputChange, onSelectChange, isExpanded, onParamClick, isFieldSuccessful }) => { 
    const inputs = moduleData.inputs as BevelGearInputParams; 
    const { errors = {}, warnings = {} } = moduleData.validationState || {};
    const calculated = { "Делит. d₁": moduleData.bevel_d1, "Делит. d₂": moduleData.bevel_d2, "Угол δ₁ (°)": moduleData.bevel_delta1, "Угол δ₂ (°)": moduleData.bevel_delta2, "Внеш. конус. расст. Re": moduleData.bevel_Re, "Средний dₘ₁": moduleData.bevel_dm1, "Средний dₘ₂": moduleData.bevel_dm2, "Перекрытие εα": moduleData.bevel_epsilonAlpha, }; 
    const renderToDataKeyMap = { "Делит. d₁": "bevel_d1", "Делит. d₂": "bevel_d2", "Угол δ₁ (°)": "bevel_delta1", "Угол δ₂ (°)": "bevel_delta2", "Внеш. конус. расст. Re": "bevel_Re", "Средний dₘ₁": "bevel_dm1", "Средний dₘ₂": "bevel_dm2", "Перекрытие εα": "bevel_epsilonAlpha" };
    
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
                    placement={BevelGearPlacement.LeftBottom}
                />
            </div>
        )
    }));

    return (<div onClick={e => e.stopPropagation()}><div className="grid grid-cols-2 gap-2"><InputWithControls isSuccess={isFieldSuccessful('z1')} onBlur={onBlurHandler('z1')} error={errors.z1} warning={warnings.z1} onLabelClick={(t) => onParamClick('z1', t)} label="z₁ (ведущая)" value={inputs.z1} onChange={(e) => onInputChange(stageIndex, moduleIndex, 'z1', e.target.value)} onIncrement={() => handleNumericInputWithControls(inputs.z1, 1, (v) => onInputChange(stageIndex, moduleIndex, 'z1', v))} onDecrement={() => handleNumericInputWithControls(inputs.z1, -1, (v) => onInputChange(stageIndex, moduleIndex, 'z1', v), 0)} inputClassName={`text-gray-800`} /> <InputWithControls isSuccess={isFieldSuccessful('z2')} onBlur={onBlurHandler('z2')} error={errors.z2} warning={warnings.z2} onLabelClick={(t) => onParamClick('z2', t)} label="z₂ (ведомая)" value={inputs.z2} onChange={(e) => onInputChange(stageIndex, moduleIndex, 'z2', e.target.value)} onIncrement={() => handleNumericInputWithControls(inputs.z2, 1, (v) => onInputChange(stageIndex, moduleIndex, 'z2', v))} onDecrement={() => handleNumericInputWithControls(inputs.z2, -1, (v) => onInputChange(stageIndex, moduleIndex, 'z2', v), 0)} inputClassName={`text-gray-800`} /></div> <div className="!mb-1"><CustomSelect isSuccess={isFieldSuccessful('config')} error={errors.config} onLabelClick={(t) => onParamClick('config_bevel', t)} label="Тип" value={inputs.config || ""} onChange={(val) => onSelectChange?.(stageIndex, moduleIndex, 'config', val as BevelGearConfigType)} options={customSelectOptions} emptyOptionLabel="-- Выбрать --" selectClassName={`text-gray-800 !py-1 !text-sm`} /></div>{isExpanded && <div className="pt-2 border-t mt-2 space-y-1"><div className="max-w-48"><SelectOrInput isSuccess={isFieldSuccessful('m')} min={0} onLabelClick={(t) => onParamClick('m_te', t)} label="Внешний делит. модуль, mₜₑ" options={GEAR_MODULES} value={inputs.m} onChange={(v) => onInputChange(stageIndex, moduleIndex, 'm', v)} inputClassName={`text-gray-800`} selectClassName={`text-gray-800`} /></div> <InputWithControls isSuccess={isFieldSuccessful('b')} error={errors.b} warning={warnings.b} onLabelClick={(t) => onParamClick('b', t)} label="Ширина венца, b" value={inputs.b} onChange={(e) => onInputChange(stageIndex, moduleIndex, 'b', e.target.value)} onIncrement={() => handleNumericInputWithControls(inputs.b, 1, (v) => onInputChange(stageIndex, moduleIndex, 'b', v))} onDecrement={() => handleNumericInputWithControls(inputs.b, -1, (v) => onInputChange(stageIndex, moduleIndex, 'b', v), 0)} inputClassName={`text-gray-800`} /> <Input isSuccess={isFieldSuccessful('eta')} onLabelClick={(t) => onParamClick('eta', t)} label="КПД (0.0-1.0)" value={inputs.eta ?? '0.98'} onChange={(e) => onInputChange(stageIndex, moduleIndex, 'eta', e.target.value)} type="number" min={0} max={1} step={0.01} placeholder="0.98" error={errors.eta} inputClassName={`text-gray-800`} className="!mb-1 max-w-24" /><CalculatedParamsDisplay params={calculated} onParamClick={onParamClick} renderToDataKeyMap={renderToDataKeyMap}/></div>}</div>);
};
const WormGearModuleDisplay: React.FC<Pick<ModuleProps, 'moduleData' | 'stageIndex' | 'moduleIndex' | 'onInputChange' | 'onSelectChange' | 'isExpanded' | 'onParamClick'> & { isFieldSuccessful: (field: string) => boolean }> = ({ moduleData, stageIndex, moduleIndex, onInputChange, onSelectChange, isExpanded, onParamClick, isFieldSuccessful }) => { 
    const inputs = moduleData.inputs as WormGearInputParams; 
    const { errors = {}, warnings = {} } = moduleData.validationState || {};
    const calculated = { "Межосевое a": moduleData.worm_a, "d₁ червяка": moduleData.worm_d1, "d₂ колеса": moduleData.worm_d2, "dₐ₁ червяка": moduleData.worm_da1, "dₐ₂ колеса": moduleData.worm_da2, "d𝒻₂ колеса": moduleData.worm_df2, "Угол подъема γ (°)": moduleData.worm_gamma, }; 
    const renderToDataKeyMap = { "Межосевое a": "worm_a", "d₁ червяка": "worm_d1", "d₂ колеса": "worm_d2", "dₐ₁ червяка": "worm_da1", "dₐ₂ колеса": "worm_da2", "d𝒻₂ колеса": "worm_df2", "Угол подъема γ (°)": "worm_gamma" };
    
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

    return (<div onClick={e => e.stopPropagation()}><div className="grid grid-cols-2 gap-2"><InputWithControls isSuccess={isFieldSuccessful('z1')} onBlur={onBlurHandler('z1')} error={errors.z1} warning={warnings.z1} onLabelClick={(t) => onParamClick('z1', t)} label="z₁ (червяк)" value={inputs.z1} onChange={(e) => onInputChange(stageIndex, moduleIndex, 'z1', e.target.value)} onIncrement={() => handleNumericInputWithControls(inputs.z1, 1, (v) => onInputChange(stageIndex, moduleIndex, 'z1', v))} onDecrement={() => handleNumericInputWithControls(inputs.z1, -1, (v) => onInputChange(stageIndex, moduleIndex, 'z1', v), 0)} inputClassName={`text-gray-800`} /> <InputWithControls isSuccess={isFieldSuccessful('z2')} onBlur={onBlurHandler('z2')} error={errors.z2} warning={warnings.z2} onLabelClick={(t) => onParamClick('z2', t)} label="z₂ (колесо)" value={inputs.z2} onChange={(e) => onInputChange(stageIndex, moduleIndex, 'z2', e.target.value)} onIncrement={() => handleNumericInputWithControls(inputs.z2, 1, (v) => onInputChange(stageIndex, moduleIndex, 'z2', v))} onDecrement={() => handleNumericInputWithControls(inputs.z2, -1, (v) => onInputChange(stageIndex, moduleIndex, 'z2', v), 0)} inputClassName={`text-gray-800`} /></div> <div className="!mb-1"><CustomSelect isSuccess={isFieldSuccessful('config')} error={errors.config} onLabelClick={(t) => onParamClick('config_worm', t)} label="Тип" value={inputs.config || ""} onChange={(val) => onSelectChange?.(stageIndex, moduleIndex, 'config', val as WormGearConfigType)} options={customSelectOptions} emptyOptionLabel="-- Выбрать --" selectClassName={`text-gray-800 !py-1 !text-sm`} /></div>{isExpanded && <div className="pt-2 border-t mt-2 space-y-1"><div className="max-w-24"><SelectOrInput isSuccess={isFieldSuccessful('m')} min={0} onLabelClick={(t) => onParamClick('m', t)} label="Модуль, m" options={GEAR_MODULES} value={inputs.m} onChange={(v) => onInputChange(stageIndex, moduleIndex, 'm', v)} inputClassName={`text-gray-800`} selectClassName={`text-gray-800`} /></div> <div className="max-w-32"><SelectOrInput isSuccess={isFieldSuccessful('q')} min={0} onLabelClick={(t) => onParamClick('q', t)} label="Коэф. диам. q" options={WORM_DIAMETER_COEFFICIENTS} value={inputs.q} onChange={(v) => onInputChange(stageIndex, moduleIndex, 'q', v)} inputClassName={`text-gray-800`} selectClassName={`text-gray-800`} /></div> <Input isSuccess={isFieldSuccessful('eta')} onLabelClick={(t) => onParamClick('eta', t)} label="КПД (0.3-0.9)" value={inputs.eta ?? '0.7'} onChange={(e) => onInputChange(stageIndex, moduleIndex, 'eta', e.target.value)} type="number" min={0} max={1} step={0.01} placeholder="0.7" error={errors.eta} inputClassName={`text-gray-800`} className="!mb-1 max-w-24" /><CalculatedParamsDisplay params={calculated} onParamClick={onParamClick} renderToDataKeyMap={renderToDataKeyMap}/></div>}</div>);
};
const StageCharacteristicsDisplay: React.FC<{ cascade?: CascadeValues, title: string, dir?: RotationDirection, orientation?: ShaftOrientation }> = ({ cascade, title, dir, orientation }) => { if (!cascade) return null; let iconElement = null; if (dir && orientation) { const iconPath = getRotationIconPath(dir, orientation); const altText = `Направление: ${dir}, Ориентация: ${orientation === ShaftOrientation.Horizontal ? "Горизонтальный" : "Вертикальный"}`; iconElement = (<img src={iconPath} alt={altText} title={altText} className="w-8 h-8 inline-block ml-1 align-middle" />); } return (<div className="mt-2 pt-2 border-t border-gray-300 text-xs leading-snug"><h5 className="font-semibold text-gray-600 mb-0.5">{title}:</h5><p className="text-gray-800">Момент: {cascade.torque.toFixed(2)} Нм</p><p className="text-gray-800">Мин. об/мин: {cascade.minRpm.toFixed(0)}</p><p className="text-gray-800">Макс. об/мин: {cascade.maxRpm.toFixed(0)}</p> {iconElement ? (<div className="text-gray-800 flex items-center">Направление: {iconElement}</div>) : dir ? (<p className="text-gray-800">Направление: {dir} (нет ориентации)</p>) : null}</div>); };
const FinalResultsDisplay: React.FC<{ results: FinalCalculationResults, refProp: React.Ref<HTMLDivElement> }> = ({ results, refProp }) => { let finalRotationIcon = null; if (results.finalDirection && results.finalOrientation) { const iconPath = getRotationIconPath(results.finalDirection, results.finalOrientation); const altText = `Направление: ${results.finalDirection}, Ориентация: ${results.finalOrientation === ShaftOrientation.Horizontal ? "Горизонтальный" : "Вертикальный"}`; finalRotationIcon = (<img src={iconPath} alt={altText} title={altText} className="w-10 h-10 inline-block ml-2 align-middle" />); } return (<div className="mt-8 bg-white p-4 sm:p-6 rounded-lg shadow-xl shadow-slate-900/80" ref={refProp}><h2 className="text-2xl font-bold text-slate-800 mb-6 ">Итоговые параметры трансмиссии</h2><div className="grid grid-cols-1 md:grid-cols-2 gap-4 "><p className="text-gray-800"><strong>Общее передаточное отношение (кинематическое):</strong> {results.totalGearRatio.toFixed(4)}</p> {results.totalEfficiency !== undefined && <p className="text-gray-800"><strong>Общий КПД:</strong> {results.totalEfficiency.toFixed(4)}</p>} <p className="text-gray-800"><strong>Выходной крутящий момент, Нм:</strong> {results.finalTorque.toFixed(2)}</p><p className="text-gray-800"><strong>Выходные мин. обороты, об/мин:</strong> {results.finalMinRpm.toFixed(0)}</p><p className="text-gray-800"><strong>Выходные макс. обороты, об/мин:</strong> {results.finalMaxRpm.toFixed(0)}</p><div className="text-gray-800 flex items-center"><strong>Выходное направление вращения:</strong> {finalRotationIcon ? finalRotationIcon : results.finalDirection}</div></div></div>); };
const AddStageSeparator: React.FC<{ onClick: () => void }> = ({ onClick }) => (
    <div className="relative h-8 my-4">
        <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t-2 border-dashed border-gray-300"></div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
            <button
                onClick={onClick}
                className="flex items-center justify-center w-8 h-8 bg-gray-100 text-gray-500 rounded-full border-2 border-dashed border-gray-300 hover:bg-blue-100 hover:text-blue-600 hover:border-blue-500 transition-all transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500"
                title="Добавить ступень здесь"
                aria-label="Добавить новую ступень в этом месте"
            >
                <PlusIcon />
            </button>
        </div>
    </div>
);
// --- Main Workbench Page Component ---

interface WorkbenchPageProps {
  engineParams: EngineParams;
  setEngineParams: (params: EngineParams) => void;
  resetEngineParams: () => void;
  calculationData: StageCalculationData[];
  onCalculationDataChange: (data: StageCalculationData[]) => void;
  onResetConfiguration: () => void;
  finalResults: FinalCalculationResults | null;
  showFinalResults: boolean;
  isSchemeBuilt: boolean;
  onBuildNewScheme: () => void;
  onGoToSchemeView: (options?: { refresh?: boolean }) => void;
  calculationDataSnapshot: string | null;
  showNotification: (message: string, type: 'success' | 'error' | 'warning') => void;
  finalResultsRef: React.Ref<HTMLDivElement>;
  setGlobalError: (error: string | null) => void;
  scrollToModuleId: string | null;
  onScrollComplete: () => void;
}

const WorkbenchPage: React.FC<WorkbenchPageProps> = ({
  engineParams, setEngineParams, resetEngineParams, calculationData, onCalculationDataChange,
  onResetConfiguration, finalResults, showFinalResults, isSchemeBuilt, onBuildNewScheme, onGoToSchemeView, 
  calculationDataSnapshot, showNotification, finalResultsRef, setGlobalError, scrollToModuleId, onScrollComplete
}) => {
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [expandedStages, setExpandedStages] = useState<Record<string, boolean>>({});
    const [showChangesDialog, setShowChangesDialog] = useState(false);
    
    const stagesContainerRef = useRef<HTMLDivElement>(null);
    const moduleRefs = useRef<Map<string, HTMLDivElement>>(new Map());
    const [activeTooltip, setActiveTooltip] = useState<{ contentKey: string; targetRect: DOMRect } | null>(null);
    const [highlightedModuleId, setHighlightedModuleId] = useState<string | null>(null);
    
    const [lastEditedField, setLastEditedField] = useState<{ moduleId: string; field: string } | null>(null);
    const [successfulFields, setSuccessfulFields] = useState<Set<string>>(new Set());
    const [glowingModules, setGlowingModules] = useState<Set<string>>(new Set());
    
    const successTimersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());
    const glowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        // Cleanup timers on unmount
        return () => {
            successTimersRef.current.forEach(timer => clearTimeout(timer));
            if (glowTimerRef.current) clearTimeout(glowTimerRef.current);
        };
    }, []);

    useEffect(() => {
        if (!lastEditedField) return;
    
        let editedModule: ModuleCalculationData | undefined;
        for (const stage of calculationData) {
            editedModule = stage.modules.find(m => m.id === lastEditedField.moduleId);
            if (editedModule) break;
        }
    
        if (editedModule) {
            const { moduleId, field } = lastEditedField;
            const fieldKey = `${moduleId}-${field}`;
    
            // --- Field Success Logic ---
            const fieldHasError = editedModule.validationState?.errors?.[field];
            
            const clearFieldSuccessTimer = () => {
                if (successTimersRef.current.has(fieldKey)) {
                    clearTimeout(successTimersRef.current.get(fieldKey)!);
                    successTimersRef.current.delete(fieldKey);
                }
            };
    
            if (!fieldHasError) {
                // It's a success, add it and set timer.
                clearFieldSuccessTimer();
                setSuccessfulFields(prev => new Set(prev).add(fieldKey));
                
                const newTimer = setTimeout(() => {
                    setSuccessfulFields(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(fieldKey);
                        return newSet;
                    });
                    successTimersRef.current.delete(fieldKey);
                }, 4000);
                successTimersRef.current.set(fieldKey, newTimer);
            } else {
                // Field has an error, ensure it's not highlighted.
                clearFieldSuccessTimer();
                setSuccessfulFields(prev => {
                    if (!prev.has(fieldKey)) return prev;
                    const newSet = new Set(prev);
                    newSet.delete(fieldKey);
                    return newSet;
                });
            }
    
            // --- Card Glow Logic ---
            const moduleHasErrors = editedModule.validationState?.errors && Object.keys(editedModule.validationState.errors).length > 0;
    
            if (!moduleHasErrors) {
                // The whole module is valid, trigger glow.
                if (glowTimerRef.current) clearTimeout(glowTimerRef.current);
                setGlowingModules(new Set([moduleId]));
                
                glowTimerRef.current = setTimeout(() => {
                    setGlowingModules(new Set());
                    glowTimerRef.current = null;
                }, 4000);
            }
        }
        
        // Reset after processing
        setLastEditedField(null);
    
    }, [calculationData]);

    useEffect(() => {
        if (scrollToModuleId) {
            const element = document.getElementById(scrollToModuleId);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setHighlightedModuleId(scrollToModuleId);
                const timer = setTimeout(() => {
                    setHighlightedModuleId(null);
                }, 2000);
                onScrollComplete();
                return () => clearTimeout(timer);
            } else {
                onScrollComplete();
            }
        }
    }, [scrollToModuleId, onScrollComplete]);


    const handleParamClick = useCallback((contentKey: string, target: HTMLElement) => {
        const currentTargetRect = target.getBoundingClientRect();
        setActiveTooltip(prev => {
            if (prev && prev.contentKey === contentKey) {
                return null;
            }
            return { contentKey, targetRect: currentTargetRect };
        });
    }, []);

    const handleCloseTooltip = useCallback(() => {
        setActiveTooltip(null);
    }, []);

    const toggleStageExpansion = (stageId: string) => {
        setExpandedStages(prev => ({ ...prev, [stageId]: !prev[stageId] }));
    };

    const singleOnlyTypes: GearType[] = [GearType.Planetary, GearType.Bevel, GearType.Worm];

    const handleParamChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const newParams = { ...engineParams, [name]: name.includes("Rpm") || name.includes("Torque") ? parseFloat(value) || 0 : value };
        setEngineParams(newParams);
        onCalculationDataChange(calculationData); // Trigger recalculation
        setErrors(prev => ({ ...prev, [name]: '' }));
        setGlobalError(null);
    };

    const addStage = (index?: number) => {
        const stageId = `stage-${Date.now()}-${Math.random()}`;
        const newStage: StageCalculationData = {
            id: stageId,
            stageName: '', // Will be recalculated
            modules: [{
                id: `${stageId}-module-0`,
                type: GearType.Gear,
                inputs: { z1: '', z2: '', m: '1', eta: '0.98' },
                isSelected: true,
            }]
        };
    
        const newData = [...calculationData];
        if (index !== undefined) {
            newData.splice(index, 0, newStage);
        } else {
            newData.push(newStage);
        }
    
        const finalData = newData.map((stage, i) => ({
            ...stage,
            stageName: `Валы ${i + 1} → ${i + 2}`
        }));
        onCalculationDataChange(finalData);
    };

    const removeStage = (stageIndex: number) => {
        const newData = calculationData.filter((_, i) => i !== stageIndex)
            .map((stage, i) => ({ ...stage, stageName: `Валы ${i + 1} → ${i + 2}` }));
        onCalculationDataChange(newData);
    };

    const addGearVariant = (stageIndex: number) => {
        const stage = calculationData[stageIndex];
        const newModule: ModuleCalculationData = {
            id: `stage-${stageIndex}-module-${stage.modules.length}`,
            type: GearType.Gear,
            inputs: { z1: '', z2: '', m: '1', eta: '0.98' },
            isSelected: stage.modules.length === 0,
        };
        const newData = [...calculationData];
        newData[stageIndex].modules.push(newModule);
        onCalculationDataChange(newData);
    };
    
    const removeGearVariant = (stageIndex: number, moduleIndex: number) => {
        const newData = [...calculationData];
        newData[stageIndex].modules = newData[stageIndex].modules.filter((_, i) => i !== moduleIndex);
        if (newData[stageIndex].modules.length > 0 && !newData[stageIndex].modules.some(m => m.isSelected)) {
            newData[stageIndex].modules[0].isSelected = true;
        }
        onCalculationDataChange(newData);
    };

    const handleGearTypeChange = (stageIndex: number, moduleIndex: number, newType: GearType) => {
        const newData = [...calculationData];
        const module = newData[stageIndex].modules[moduleIndex];
        setLastEditedField({ moduleId: module.id, field: 'type' });
        module.type = newType;
        let defaultInputs: ModuleSpecificInputs;
        switch (newType) {
            case GearType.Gear: defaultInputs = { z1: '', z2: '', m: '1', eta: '0.98' }; break;
            case GearType.Chain: defaultInputs = { z1: '', z2: '', p: '12.7', eta: '0.95' }; break;
            case GearType.Planetary: defaultInputs = { zSun: '', zRing: '', m: '1', shaftConfig: PLANETARY_CONFIG_OPTIONS[0], eta: '0.98' }; break;
            case GearType.ToothedBelt: defaultInputs = { z1: '', z2: '', p: '5', eta: '0.95' }; break;
            case GearType.Belt: defaultInputs = { d1: '', d2: '', eta: '0.95' }; break;
            case GearType.Bevel: defaultInputs = { z1: '', z2: '', m: '1', b: '1', config: BEVEL_GEAR_CONFIG_OPTIONS[0].value, eta: '0.98' }; break;
            case GearType.Worm: defaultInputs = { z1: '', z2: '', m: '1', q: '10', config: WORM_GEAR_CONFIG_OPTIONS[0].value, eta: '0.7' }; break;
            default: const exhaustiveCheck: never = newType; throw new Error(`Необработанный тип передачи: ${exhaustiveCheck}`);
        }
        module.inputs = defaultInputs;
        onCalculationDataChange(newData);
    };

    const handleInputChange = (stageIndex: number, moduleIndex: number, field: string, value: string | number) => {
        const updatedData = [...calculationData];
        const module = updatedData[stageIndex].modules[moduleIndex];
        setLastEditedField({ moduleId: module.id, field });
        (module.inputs as any)[field] = value;
        onCalculationDataChange(updatedData);
    };

    const handleSelectChange = (stageIndex: number, moduleIndex: number, field: string, value: any) => {
        const updatedData = [...calculationData];
        const module = updatedData[stageIndex].modules[moduleIndex];
        setLastEditedField({ moduleId: module.id, field });
        (module.inputs as any)[field] = value;
        onCalculationDataChange(updatedData);
    };

    const handleModuleSelect = (stageIndex: number, moduleIndex: number) => {
        const updatedData = [...calculationData];
        updatedData[stageIndex].modules.forEach((mod, idx) => { mod.isSelected = (idx === moduleIndex); });
        onCalculationDataChange(updatedData);
    };
    
    const handleContainerKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
        const activeElement = document.activeElement as HTMLElement;
        if (!activeElement?.dataset.stageIndex) return;

        const stageIndex = parseInt(activeElement.dataset.stageIndex, 10);
        const moduleIndex = parseInt(activeElement.dataset.moduleIndex, 10);

        if (isNaN(stageIndex) || isNaN(moduleIndex)) return;

        let nextStageIndex = stageIndex;
        let nextModuleIndex = moduleIndex;

        switch(e.key) {
            case 'ArrowUp':
                nextStageIndex = Math.max(0, stageIndex - 1);
                nextModuleIndex = 0; // Focus first module of the stage above
                break;
            case 'ArrowDown':
                nextStageIndex = Math.min(calculationData.length - 1, stageIndex + 1);
                nextModuleIndex = 0; // Focus first module of the stage below
                break;
            case 'ArrowLeft':
                nextModuleIndex = Math.max(0, moduleIndex - 1);
                break;
            case 'ArrowRight':
                nextModuleIndex = Math.min(calculationData[stageIndex].modules.length - 1, moduleIndex + 1);
                break;
            default:
                return;
        }

        e.preventDefault();
        const nextModuleKey = `s${nextStageIndex}-m${nextModuleIndex}`;
        const nextModule = moduleRefs.current.get(nextModuleKey);
        nextModule?.focus();
    }, [calculationData]);

    const rotationIconPath = getRotationIconPath(engineParams.initialDirection, engineParams.initialOrientation);
    const rotationIconAltText = `Направление: ${engineParams.initialDirection}, Ориетация: ${engineParams.initialOrientation === ShaftOrientation.Horizontal ? 'Горизонтальный' : 'Вертикальный'}`;

    const handleBuildSchemeClick = () => {
        if (isSchemeBuilt) {
            if (window.confirm('Вы уверены, что хотите перестроить схему? Все ваши предыдущие изменения в компоновке будут потеряны.')) {
                onBuildNewScheme();
            }
        } else {
            onBuildNewScheme();
        }
    };
    
    const handleReturnClick = () => {
        if (!calculationDataSnapshot) {
            onGoToSchemeView();
            return;
        }
        const createDataSnapshot = (data: StageCalculationData[]): string => {
            return JSON.stringify(data.map(s => s.modules.map(m => getGearCategory(m.type))));
        };
        const currentSnapshot = createDataSnapshot(calculationData);
        if (currentSnapshot === calculationDataSnapshot) {
            // Структура не изменилась, просто обновляем данные
            onGoToSchemeView({ refresh: true });
        } else {
            // Структура изменилась, показываем диалог
            setShowChangesDialog(true);
        }
    };

    const isFieldSuccessful = (moduleId: string, field: string): boolean => {
        return successfulFields.has(`${moduleId}-${field}`);
    };


    return (
        <div className="space-y-8 py-8">
            {activeTooltip && TOOLTIP_DATA[activeTooltip.contentKey] && (
                <Tooltip
                    content={TOOLTIP_DATA[activeTooltip.contentKey]}
                    targetRect={activeTooltip.targetRect}
                    onClose={handleCloseTooltip}
                />
            )}

            {/* --- Блок параметров источника --- */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-xl shadow-slate-900/60">
                <h2 className="text-2xl font-bold text-slate-800 mb-6">Параметры источника</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <Input id="initialTorque" name="initialTorque" label="Начальный крутящий момент, Нм" type="number" value={engineParams.initialTorque} onChange={handleParamChange} error={errors.initialTorque} inputClassName={`text-gray-800`} min={0} className="!mb-1 md:max-w-48"/>
                    <Input id="initialMinRpm" name="initialMinRpm" label="Начальные мин. обороты, об/мин" type="number" value={engineParams.initialMinRpm} onChange={handleParamChange} error={errors.initialMinRpm} inputClassName={`text-gray-800`} min={0} className="!mb-1 md:max-w-48"/>
                    <Input id="initialMaxRpm" name="initialMaxRpm" label="Начальные макс. обороты, об/мин" type="number" value={engineParams.initialMaxRpm} onChange={handleParamChange} error={errors.initialMaxRpm} inputClassName={`text-gray-800`} min={0} className="!mb-1 md:max-w-48"/>
                    <div className="flex items-end gap-x-4">
                        <Select id="initialDirection" name="initialDirection" label="Начальное направление вращения" value={engineParams.initialDirection} onChange={handleParamChange} options={[{ value: RotationDirection.Clockwise, label: "По часовой" }, { value: RotationDirection.CounterClockwise, label: "Против часовой" },]} selectClassName={`text-gray-800`} className="!mb-0" />
                        <img src={rotationIconPath} alt={rotationIconAltText} title={rotationIconAltText} className="w-12 h-12" />
                    </div>
                </div>
                <div className="mt-4 flex justify-start">
                    <Button onClick={() => { resetEngineParams(); setGlobalError(null); setErrors({}); }} 
					variant="secondary" 
					className="text-sm px-3 py-1 shadow-md shadow-slate-900/40">
					Сбросить
					</Button>
                </div>
            </div>

            {/* --- Блок ступеней трансмиссии --- */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-xl shadow-slate-900/60">
                <h2 className="text-2xl font-bold text-slate-800 mb-6">Ступени трансмиссии</h2>
                <div 
                    className=""
                    ref={stagesContainerRef}
                    onKeyDown={handleContainerKeyDown}
                >
                    {calculationData.map((stage, stageIndex) => {
                        const hasSingleTypeModuleInStage = stage.modules.some(m => singleOnlyTypes.includes(m.type));
                        const isAddVariantDisabled = stage.modules.length > 0 && hasSingleTypeModuleInStage;
                        const isStageExpanded = !!expandedStages[stage.id];

                        return (
                        <div key={stage.id}>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-slate-700">{stage.stageName}</h3>
                                {calculationData.length > 1 && <Button onClick={() => removeStage(stageIndex)} 
								variant="secondary" 
								className="!p-2 text-sm leading-none shadow-md shadow-slate-900/40" 
								title={`Удалить ступень ${stageIndex + 1}`}>
								<CrossIcon />
								</Button>}
                            </div>
                            {stage.stageError && <p className={`mb-2 p-2 rounded-md ${ERROR_BG_COLOR} ${ERROR_TEXT_COLOR} text-sm`}>{stage.stageError}</p>}
                            <div className="overflow-x-auto -mx-4 sm:-mx-6">
                                <div className="flex space-x-4 px-4 sm:px-6 py-2">
                                {stage.modules.map((moduleData, moduleIndex) => {
                                    const canSelect = stage.modules.length > 1;
                                    const availableTypes = (stage.modules.length > 1 && !singleOnlyTypes.includes(moduleData.type)) ? AVAILABLE_GEAR_TYPES.filter(t => !singleOnlyTypes.includes(t)) : AVAILABLE_GEAR_TYPES;
                                    const gearTypeOptions = availableTypes.map(gt => ({ value: gt, label: gt }));
                                    const moduleKey = `s${stageIndex}-m${moduleIndex}`;
                                    
                                    const hasErrors = moduleData.validationState?.errors && Object.keys(moduleData.validationState.errors).length > 0;
                                    const hasWarnings = moduleData.validationState?.warnings && Object.keys(moduleData.validationState.warnings).length > 0;
                                    const isGlowingGreen = glowingModules.has(moduleData.id);

                                    const baseClasses = `p-2 rounded-lg w-48 sm:w-52 md:w-56 flex-shrink-0 flex flex-col justify-between focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 transition-all duration-300 bg-white`;
                                    
                                    const isSelected = stage.modules.length === 1 || moduleData.isSelected;
                                    const borderClass = isSelected ? 'ring-2 ring-inset ring-slate-700/60' : 'border-slate-200 border';

                                   let shadowClass = 'shadow-md shadow-slate-900/60';

									if (moduleData.id === highlightedModuleId) {
									// Выделение
									shadowClass = 'shadow-md shadow-sky-500/80';
									} else if (hasErrors) {
									// Ошибка
									shadowClass = 'shadow-md shadow-rose-500/80';
									} else if (hasWarnings) {
									// Предупреждение
									shadowClass = 'shadow-md shadow-amber-500/80';
									} else if (isGlowingGreen) {
									// Успех/зелёное свечение
									shadowClass = 'shadow-md shadow-emerald-500/80';
									}

                                    return (
                                        <div 
                                            id={moduleData.id}
                                            key={moduleData.id} 
                                            ref={el => { if (el) moduleRefs.current.set(moduleKey, el); else moduleRefs.current.delete(moduleKey); }}
                                            data-stage-index={stageIndex}
                                            data-module-index={moduleIndex}
                                            tabIndex={0}
                                            role="button"
                                            aria-label={`Вариант: ${moduleData.type}. ${moduleData.isSelected ? 'Выбран как ведущий.' : 'Нажмите Enter, чтобы выбрать.'}`}
                                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleModuleSelect(stageIndex, moduleIndex); }}}
                                            className={`${baseClasses} ${borderClass} ${shadowClass}`} 
                                            onClick={canSelect ? () => handleModuleSelect(stageIndex, moduleIndex) : undefined} 
                                            style={canSelect ? { cursor: 'pointer' } : {}}
                                        >
                                        <div>
                                            <div className="flex justify-between items-center mb-2">
                                                <div onClick={e => e.stopPropagation()} className="flex-grow">
                                                    <Select value={moduleData.type} onChange={(e) => handleGearTypeChange(stageIndex, moduleIndex, e.target.value as GearType)} options={gearTypeOptions} selectClassName={`w-full text-sm font-semibold p-1.5 rounded-md text-slate-700 bg-slate-50`} className="!mb-0" />
                                                </div>
                                                <Button onClick={(e) => { e.stopPropagation(); removeGearVariant(stageIndex, moduleIndex); }} variant="secondary" className="!p-1.5 !ml-2 text-xs leading-none" title="Удалить вариант"><CrossIcon/></Button>
                                            </div>
                                            
                                            {canSelect && ( <div className="flex items-center space-x-2 p-2 mb-2 rounded-md bg-slate-50 cursor-pointer hover:bg-slate-200 transition-colors" onClick={(e) => { e.stopPropagation(); handleModuleSelect(stageIndex, moduleIndex); }} > <input type="radio" name={`stage-select-${stageIndex}`} id={`module-select-${moduleData.id}`} checked={moduleData.isSelected} onChange={() => handleModuleSelect(stageIndex, moduleIndex)} className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer" /> <label htmlFor={`module-select-${moduleData.id}`} className={`text-sm font-semibold cursor-pointer ${moduleData.isSelected ? 'text-blue-700' : 'text-gray-700'}`} > {moduleData.isSelected ? '✓ Ведущий' : 'Сделать ведущим'} </label> </div> )}

                                            {moduleData.type === GearType.Gear && <GearModuleDisplay onParamClick={handleParamClick} moduleData={moduleData} stageIndex={stageIndex} moduleIndex={moduleIndex} onInputChange={handleInputChange} isExpanded={isStageExpanded} isFieldSuccessful={(field) => isFieldSuccessful(moduleData.id, field)}/>}
                                            {moduleData.type === GearType.Chain && <ChainModuleDisplay onParamClick={handleParamClick} moduleData={moduleData} stageIndex={stageIndex} moduleIndex={moduleIndex} onInputChange={handleInputChange} isExpanded={isStageExpanded} isFieldSuccessful={(field) => isFieldSuccessful(moduleData.id, field)}/>}
                                            {moduleData.type === GearType.Planetary && <PlanetaryModuleDisplay onParamClick={handleParamClick} moduleData={moduleData} stageIndex={stageIndex} moduleIndex={moduleIndex} onInputChange={handleInputChange} onSelectChange={handleSelectChange} isExpanded={isStageExpanded} isFieldSuccessful={(field) => isFieldSuccessful(moduleData.id, field)}/>}
                                            {moduleData.type === GearType.ToothedBelt && <ToothedBeltModuleDisplay onParamClick={handleParamClick} moduleData={moduleData} stageIndex={stageIndex} moduleIndex={moduleIndex} onInputChange={handleInputChange} isExpanded={isStageExpanded} isFieldSuccessful={(field) => isFieldSuccessful(moduleData.id, field)}/>}
                                            {moduleData.type === GearType.Belt && <BeltModuleDisplay onParamClick={handleParamClick} moduleData={moduleData} stageIndex={stageIndex} moduleIndex={moduleIndex} onInputChange={handleInputChange} isExpanded={isStageExpanded} isFieldSuccessful={(field) => isFieldSuccessful(moduleData.id, field)}/>}
                                            {moduleData.type === GearType.Bevel && <BevelGearModuleDisplay onParamClick={handleParamClick} moduleData={moduleData} stageIndex={stageIndex} moduleIndex={moduleIndex} onInputChange={handleInputChange} onSelectChange={handleSelectChange} isExpanded={isStageExpanded} isFieldSuccessful={(field) => isFieldSuccessful(moduleData.id, field)}/>}
                                            {moduleData.type === GearType.Worm && <WormGearModuleDisplay onParamClick={handleParamClick} moduleData={moduleData} stageIndex={stageIndex} moduleIndex={moduleIndex} onInputChange={handleInputChange} onSelectChange={handleSelectChange} isExpanded={isStageExpanded} isFieldSuccessful={(field) => isFieldSuccessful(moduleData.id, field)}/>}

                                            <div className="mt-2 pt-2 border-t border-gray-200 flex justify-between items-center font-semibold text-sm rounded hover:bg-gray-100 cursor-pointer p-1 -m-1" onClick={(e) => {e.stopPropagation(); handleParamClick('u', e.currentTarget as HTMLElement)}}>
                                                <span className="text-gray-600">Передача (u):</span>
                                                <span className="text-gray-800 text-base">{moduleData.u?.toFixed(4) ?? '-'}</span>
                                            </div>

                                            <div className={`transition-[max-height,opacity] duration-300 ease-in-out overflow-hidden ${isStageExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-50'}`}>
                                                <div className="pt-2">
                                                    <StageCharacteristicsDisplay cascade={moduleData.cascadeIn} title="Входные х-ки ступени" dir={moduleData.moduleInDirection} orientation={moduleData.moduleInOrientation} />
                                                    <StageCharacteristicsDisplay cascade={moduleData.cascadeOut} title="Выходные х-ки ступени" dir={moduleData.moduleOutDirection} orientation={moduleData.moduleOutOrientation}/>
                                                    {moduleData.error && <p className={`mt-1 text-xs ${ERROR_TEXT_COLOR} font-semibold`}>{moduleData.error}</p>}
                                                    {moduleData.assemblyError && moduleData.type === GearType.Planetary && <p className={`mt-1 text-xs ${ERROR_TEXT_COLOR} font-semibold`}>{moduleData.assemblyError}</p>}
                                                </div>
                                            </div>
                                        </div>
                                        <button onClick={(e) => { e.stopPropagation(); toggleStageExpansion(stage.id); }} className="w-full mt-2 p-1.5 flex justify-center items-center text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors" >
                                            <span>Детали</span>
                                            <ChevronIcon isExpanded={isStageExpanded} />
                                        </button>
                                    </div>
                                    );
                                })}
                                <div className="flex-shrink-0 flex items-center justify-center min-w-[120px]">
                                    <Button 
									onClick={() => addGearVariant(stageIndex)} 
									variant="secondary" 
									className="text-sm px-3 py-1.5 flex items-center h-full shadow-md shadow-slate-900/40" 
									disabled={isAddVariantDisabled} title={isAddVariantDisabled ? "Планетарная, коническая или червячная передача должна быть единственной на ступени." : "Добавить вариант передачи"}>
									<PlusIcon />
									Добавить
									</Button>
                                </div>
                                </div>
                            </div>
                            <AddStageSeparator onClick={() => addStage(stageIndex + 1)} />
                        </div>
                        )
                    })}
                </div>
                 <div className="mt-4 flex justify-end">
                    <Button 
					onClick={onResetConfiguration} 
					variant="secondary" 
					className="text-sm shadow-md shadow-slate-900/40">
                        Сбросить все
                    </Button>
                </div>
            </div>

            {/* --- Блок действий и результатов --- */}
            <div className={`mt-6 flex flex-col md:flex-row md:flex-wrap ${isSchemeBuilt ? 'justify-between' : 'justify-end'} items-center gap-3`}>
                {isSchemeBuilt && (
                    <Button 
                        onClick={handleReturnClick} 
                        variant="primary"
                        className="flex-grow w-full md:w-auto md:flex-grow-0 order-2 md:order-1 shadow-xl shadow-slate-900/80"
                        title="Вернуться к редактированию существующей схемы"
                    >
                        Вернуться к Схеме
                    </Button>
                )}
                <Button 
                    onClick={handleBuildSchemeClick} 
                    variant="primary" 
                    className="flex-grow w-full md:w-auto md:flex-grow-0 order-1 md:order-2 shadow-xl shadow-slate-900/80"
                    title={isSchemeBuilt ? "Пересоздать схему с нуля на основе текущих параметров" : "Собрать кинематическую схему на основе выбранных типов передач"}
                >
                    {isSchemeBuilt ? 'Перестроить Схему (Сброс)' : 'Построить Схему'}
                </Button>
            </div>

            {showFinalResults && finalResults && <FinalResultsDisplay results={finalResults} refProp={finalResultsRef} />}

            {showChangesDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm" onClick={() => setShowChangesDialog(false)}>
                    <div className="bg-white rounded-lg shadow-xl p-6 m-4 max-w-md w-full animate-fade-in" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-gray-800">Обнаружены изменения в конфигурации</h3>
                        <p className="mt-2 text-sm text-gray-600">
                            Вы внесли структурные изменения на рабочем столе. Существующая компоновка схемы больше не актуальна. Что вы хотите сделать?
                        </p>
                        <div className="mt-6 flex flex-col space-y-3">
                            <Button variant="primary" onClick={() => { onBuildNewScheme(); setShowChangesDialog(false); }}>
                                Обновить схему и отбросить компоновку
                            </Button>
                            <Button variant="secondary" onClick={() => { onGoToSchemeView(); showNotification('Внимание: компоновка схемы может не соответствовать текущим расчетам.', 'warning'); setShowChangesDialog(false); }}>
                                Вернуться к старой компоновке
                            </Button>
                            <Button variant="secondary" onClick={() => setShowChangesDialog(false)}>
                                Отмена
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WorkbenchPage;