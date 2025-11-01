import React, { useLayoutEffect, useRef, useState, useCallback, useEffect } from 'react';
import { EngineParams, GearType, ModuleCalculationData, ParallelLayoutType, RotationDirection, ShaftOrientation } from '../types';
import Button from './Button';
import { getRotationIconPath } from '../constants';
import { Tooltip } from './Tooltip';
import { TOOLTIP_DATA, TooltipContent } from '../tooltip-data';
import { useLanguage } from '../contexts/LanguageContext';


interface UgoContextMenuProps {
  moduleData: Omit<Partial<ModuleCalculationData>, 'type' | 'inputs'> & { type: GearType | 'Источник'; inputs?: any; };
  position: { x: number; y: number };
  onClose: () => void;
  onUpdateLayout?: (newLayout: ParallelLayoutType) => void;
  onUpdateReversed?: (isReversed: boolean) => void;
  onUpdateTurnDirection?: (newDirection: 'up' | 'down' | 'left' | 'right') => void;
  inputDirection?: 'up' | 'down' | 'left' | 'right';
  currentTurnDirection?: 'up' | 'down' | 'left' | 'right';
  onAddSpacer: (position: 'before' | 'after') => void;
  currentIndex: number | null;
  totalItems: number;
  onNavigate: (direction: 'next' | 'prev') => void;
  isMobileView: boolean;
  isMultiModuleStage?: boolean;
  isCurrentActive?: boolean;
  onMakeActive?: () => void;
  onGoToWorkbench?: () => void;
  moduleInDirection?: RotationDirection;
  moduleOutDirection?: RotationDirection;
  moduleInOrientation?: ShaftOrientation;
  moduleOutOrientation?: ShaftOrientation;
  engineParams?: EngineParams;
}

const InfoItem: React.FC<{ 
    label: string; 
    value: string | number | undefined; 
    dataKey?: string; 
    onLabelClick?: (key: string, target: HTMLElement) => void;
}> = ({ label, value, dataKey, onLabelClick }) => {
    if (value === undefined || value === null || String(value).trim() === '') {
        return null;
    }

    const hasTooltip = dataKey && onLabelClick && TOOLTIP_DATA[dataKey];

    return (
        <div className="flex justify-between text-xs items-center">
            <span
                className={`text-gray-500 ${hasTooltip ? 'cursor-pointer hover:text-blue-600 transition-colors' : ''}`}
                onClick={hasTooltip ? (e) => { e.stopPropagation(); onLabelClick(dataKey, e.currentTarget as HTMLElement); } : undefined}
            >
                {label}
            </span>
            <span className="font-mono font-semibold text-gray-700">{value}</span>
        </div>
    );
};

const ModuleInfo: React.FC<{ 
    moduleData: UgoContextMenuProps['moduleData'];
    onParamClick: (key: string, target: HTMLElement) => void;
}> = ({ moduleData, onParamClick }) => {
    const { t } = useLanguage();
    const { type, u, inputs, fixedShaft } = moduleData;

    if (type === 'Источник' || !inputs) return null;

    const uDisplay = u !== undefined ? u.toFixed(2) : '-';

    let params: React.ReactNode = null;

    switch (type) {
        case GearType.Gear:
            params = <>
                <InfoItem label="z₁" value={inputs.z1} dataKey="z1" onLabelClick={onParamClick} />
                <InfoItem label="z₂" value={inputs.z2} dataKey="z2" onLabelClick={onParamClick} />
                <InfoItem label="m, мм" value={inputs.m} dataKey="m" onLabelClick={onParamClick} />
            </>;
            break;
        case GearType.Chain:
        case GearType.ToothedBelt:
            params = <>
                <InfoItem label="z₁" value={inputs.z1} dataKey="z1" onLabelClick={onParamClick} />
                <InfoItem label="z₂" value={inputs.z2} dataKey="z2" onLabelClick={onParamClick} />
                <InfoItem label="p, мм" value={inputs.p} dataKey="p" onLabelClick={onParamClick} />
            </>;
            break;
        case GearType.Belt:
            params = <>
                <InfoItem label="d₁, мм" value={inputs.d1} dataKey="d1_input" onLabelClick={onParamClick} />
                <InfoItem label="d₂, мм" value={inputs.d2} dataKey="d2_input" onLabelClick={onParamClick} />
            </>;
            break;
        case GearType.Bevel:
             params = (
                <>
                    <InfoItem label="z₁" value={inputs.z1} dataKey="z1" onLabelClick={onParamClick} />
                    <InfoItem label="z₂" value={inputs.z2} dataKey="z2" onLabelClick={onParamClick} />
                    <InfoItem label="mₜₑ, мм" value={inputs.m} dataKey="m_te" onLabelClick={onParamClick} />
                    <InfoItem label="b, мм" value={inputs.b} dataKey="b" onLabelClick={onParamClick} />
                </>
            );
            break;
        case GearType.Worm:
            params = (
                <>
                    <InfoItem label={t('module_input_z1_worm')} value={inputs.z1} dataKey="z1" onLabelClick={onParamClick} />
                    <InfoItem label={t('module_input_z2_wheel')} value={inputs.z2} dataKey="z2" onLabelClick={onParamClick} />
                    <InfoItem label="q" value={inputs.q} dataKey="q" onLabelClick={onParamClick} />
                </>
            );
            break;
        case GearType.Planetary:
            params = <>
                <InfoItem label={t('module_input_z_sun')} value={inputs.zSun} dataKey="zSun" onLabelClick={onParamClick} />
                <InfoItem label={t('module_input_z_ring')} value={inputs.zRing} dataKey="zRing" onLabelClick={onParamClick} />
                <InfoItem label="Фикс." value={fixedShaft} dataKey="fixedShaft" onLabelClick={onParamClick} />
            </>;
            break;
        default:
            return null;
    }
    
    return (
        <div className="p-3 border-b border-gray-200">
            <h4 className="text-xs font-bold uppercase text-gray-400 mb-2 text-center">{t('workbench_module_parameters')}</h4>
            <div className="space-y-1">
                <InfoItem label={t('module_input_gear_ratio_u')} value={uDisplay} dataKey="u" onLabelClick={onParamClick} />
                {params}
            </div>
        </div>
    );
};


export const UgoContextMenu: React.FC<UgoContextMenuProps> = ({ 
    moduleData, position, onClose, onUpdateLayout, onUpdateReversed, 
    onUpdateTurnDirection, inputDirection, currentTurnDirection, 
    onAddSpacer, currentIndex, totalItems, onNavigate, isMobileView,
    isMultiModuleStage, isCurrentActive, onMakeActive, onGoToWorkbench,
    moduleInDirection, moduleOutDirection, moduleInOrientation, moduleOutOrientation,
    engineParams
}) => {
  const { t } = useLanguage();
  const isParallel = [GearType.Gear, GearType.Chain, GearType.ToothedBelt, GearType.Belt].includes(moduleData.type as GearType);
  const isTurning = [GearType.Bevel, GearType.Worm].includes(moduleData.type as GearType);
  const isHorizontalInput = inputDirection === 'left' || inputDirection === 'right';
  const isVerticalInput = inputDirection === 'up' || inputDirection === 'down';
  const menuRef = useRef<HTMLDivElement>(null);
  const isReversed = moduleData.isReversed ?? false;
  
  const [activeTooltip, setActiveTooltip] = useState<{ content: TooltipContent; targetRect: DOMRect } | null>(null);

  const handleParamClick = useCallback((contentKey: string, target: HTMLElement) => {
    // FIX: Translate TooltipContentKeys to a TooltipContent object before setting state.
    const contentKeys = TOOLTIP_DATA[contentKey];
    if (!contentKeys) return;
      
    const content: TooltipContent = {
        title: t(contentKeys.titleKey as any),
        description: t(contentKeys.descriptionKey as any),
        unit: contentKeys.unit
    };

      const currentTargetRect = target.getBoundingClientRect();
      setActiveTooltip(prev => {
          if (prev && prev.content.title === content.title) {
              return null;
          }
          return { content, targetRect: currentTargetRect };
      });
  }, [t]);

  const handleCloseTooltip = useCallback(() => {
      setActiveTooltip(null);
  }, []);
  
  useEffect(() => {
    if (activeTooltip) {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                handleCloseTooltip();
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }
  }, [activeTooltip, handleCloseTooltip]);

  useLayoutEffect(() => {
    if (isMobileView || !menuRef.current) return;

    const menu = menuRef.current;
    const { innerWidth, innerHeight } = window;
    const { width, height } = menu.getBoundingClientRect();
    let left = position.x;
    let top = position.y;
    if (left + width > innerWidth - 10) { left = position.x - width - 20; }
    if (top + height > innerHeight - 10) { top = position.y - height - 20; }
    menu.style.left = `${Math.max(5, left)}px`;
    menu.style.top = `${Math.max(5, top)}px`;
  }, [position, isMobileView]);

  const mobileClasses = "bottom-4 left-4 right-4 w-auto animate-slide-up";
  const desktopClasses = "w-64";

  const moduleTypeDisplay = moduleData.type === 'Источник' 
        ? t('gear_type_source') 
        : t(`gear_type_${moduleData.type}` as any);

  return (
    <>
      {activeTooltip && (
          <Tooltip 
              content={activeTooltip.content} 
              targetRect={activeTooltip.targetRect}
              onClose={handleCloseTooltip}
          />
      )}
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose}></div>
      <div
        id="ugo-context-menu"
        ref={menuRef}
        className={`fixed bg-white rounded-xl shadow-2xl shadow-slate-900/95 z-50 border border-gray-200 ${isMobileView ? mobileClasses : desktopClasses}`}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-2 border-b border-gray-200 bg-gray-50 rounded-t-lg shadow-md shadow-slate-900/10">
          <div className="flex items-center space-x-2 ">
            <button onClick={() => onNavigate('prev')} title={t('common_previous_element')} className="p-1 rounded-full hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <span className="text-xs font-mono text-gray-500 tabular-nums">
              {currentIndex !== null ? `${currentIndex + 1} / ${totalItems}` : '-/-'}
            </span>
            <button onClick={() => onNavigate('next')} title={t('common_next_element')} className="p-1 rounded-full hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
          <button onClick={onClose} title={t('common_close_esc')} className="p-1 rounded-full hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <div className="p-3 border-b border-gray-200">
          <h3 className="font-bold text-gray-800 text-center">{moduleTypeDisplay}</h3>
        </div>

        {moduleData.type === 'Источник' && engineParams ? (
            <div className="p-3 border-b border-gray-200">
                <h4 className="text-xs font-bold uppercase text-gray-400 mb-2 text-center">{t('workbench_source_characteristics')}</h4>
                <div className="space-y-1">
                    <InfoItem label={t('workbench_initial_torque')} value={engineParams.initialTorque} dataKey="initialTorque" onLabelClick={handleParamClick} />
                    <InfoItem label={t('workbench_initial_min_rpm')} value={engineParams.initialMinRpm} dataKey="initialMinRpm" onLabelClick={handleParamClick} />
                    <InfoItem label={t('workbench_initial_max_rpm')} value={engineParams.initialMaxRpm} dataKey="initialMaxRpm" onLabelClick={handleParamClick} />
                </div>
            </div>
        ) : (
          <ModuleInfo moduleData={moduleData} onParamClick={handleParamClick} />
        )}


        {moduleInDirection && moduleInOrientation && moduleOutDirection && moduleOutOrientation && moduleData.type !== 'Источник' && (
          <div className="p-3 border-b border-gray-200">
            <h4 className="text-xs font-bold uppercase text-gray-400 mb-2 text-center">{t('ugo_menu_rotation_title')}</h4>
            <div className="flex justify-around items-center text-center">
              <div>
                <p className="text-sm text-gray-500 mb-1">{t('ugo_menu_rotation_in')}</p>
                <img src={getRotationIconPath(moduleInDirection, moduleInOrientation)} alt={`${t('module_cascade_direction')}: ${moduleInDirection}, ${t('module_cascade_orientation')}: ${moduleInOrientation === ShaftOrientation.Horizontal ? t('orientation_horizontal') : t('orientation_vertical')}`} title={`${t('module_cascade_direction')}: ${moduleInDirection}, ${t('module_cascade_orientation')}: ${moduleInOrientation === ShaftOrientation.Horizontal ? t('orientation_horizontal') : t('orientation_vertical')}`} className="w-12 h-12" />
              </div>
              <div className="text-2xl text-gray-300 font-light">→</div>
              <div>
                <p className="text-sm text-gray-500 mb-1">{t('ugo_menu_rotation_out')}</p>
                <img src={getRotationIconPath(moduleOutDirection, moduleOutOrientation)} alt={`${t('module_cascade_direction')}: ${moduleOutDirection}, ${t('module_cascade_orientation')}: ${moduleOutOrientation === ShaftOrientation.Horizontal ? t('orientation_horizontal') : t('orientation_vertical')}`} title={`${t('module_cascade_direction')}: ${moduleOutDirection}, ${t('module_cascade_orientation')}: ${moduleOutOrientation === ShaftOrientation.Horizontal ? t('orientation_horizontal') : t('orientation_vertical')}`} className="w-12 h-12" />
              </div>
            </div>
          </div>
        )}

        <div className="p-3">
            <h4 className="text-xs font-bold uppercase text-gray-400 mb-2">{t('ugo_menu_scheme_control')}</h4>
            <div className="space-y-2">
              {isMultiModuleStage && onMakeActive && (
                  isCurrentActive ? (
                    <Button onClick={onMakeActive} variant="primary" className="!w-full !px-2 !py-1.5 text-sm shadow-md shadow-slate-900/40">
                        {t('module_card_set_leading')}
                    </Button>
                  ) : (
                    <Button variant="secondary" disabled className="!w-full !px-2 !py-1.5 text-sm">
                        {t('module_card_is_leading')}
                    </Button>
                  )
              )}
               {onGoToWorkbench && (
                <Button onClick={onGoToWorkbench} variant="secondary" className="!w-full !px-2 !py-1.5 text-sm flex items-center justify-center space-x-2 shadow-md shadow-slate-900/40">
                    <span>{t('ugo_menu_to_parameters')}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </Button>
              )}
              {isParallel && onUpdateLayout && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{t('ugo_menu_invert_layout')}</span>
                  <button 
                    onClick={() => onUpdateLayout(moduleData.layout === ParallelLayoutType.Inverted ? ParallelLayoutType.Standard : ParallelLayoutType.Inverted)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${moduleData.layout === ParallelLayoutType.Inverted ? 'bg-blue-600' : 'bg-gray-300'}`}
                    aria-label={t('ugo_menu_invert_layout') as string}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${moduleData.layout === ParallelLayoutType.Inverted ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              )}
               {isParallel && onUpdateReversed && (
                <div>
                  <p className="text-sm text-gray-600 mb-1.5">{t('ugo_menu_flow_direction')}</p>
                  <div className="grid grid-cols-2 gap-1.5">
                      {isHorizontalInput ? (
                        <>
                          <Button 
                            onClick={() => onUpdateReversed(inputDirection === 'left' ? false : true)} 
                            variant={(inputDirection === 'left' ? !isReversed : isReversed) ? 'primary' : 'secondary'} 
                            className="!px-2 !py-1 text-xs shadow-md shadow-slate-900/40"
                          >
                            {t('ugo_menu_direction_left')}
                          </Button>
                          <Button 
                            onClick={() => onUpdateReversed(inputDirection === 'right' ? false : true)} 
                            variant={(inputDirection === 'right' ? !isReversed : isReversed) ? 'primary' : 'secondary'} 
                            className="!px-2 !py-1 text-xs shadow-md shadow-slate-900/40"
                          >
                            {t('ugo_menu_direction_right')}
                          </Button>
                        </>
                      ) : ( // isVerticalInput
                        <>
                          <Button 
                            onClick={() => onUpdateReversed(inputDirection === 'up' ? false : true)} 
                            variant={(inputDirection === 'up' ? !isReversed : isReversed) ? 'primary' : 'secondary'} 
                            className="!px-2 !py-1 text-xs shadow-md shadow-slate-900/40"
                          >
                            {t('ugo_menu_direction_up')}
                          </Button>
                          <Button 
                            onClick={() => onUpdateReversed(inputDirection === 'down' ? false : true)} 
                            variant={(inputDirection === 'down' ? !isReversed : isReversed) ? 'primary' : 'secondary'} 
                            className="!px-2 !py-1 text-xs shadow-md shadow-slate-900/40"
                          >
                            {t('ugo_menu_direction_down')}
                          </Button>
                        </>
                      )}
                  </div>
                </div>
              )}
              {isTurning && onUpdateTurnDirection && (
                <div>
                  <p className="text-sm text-gray-600 mb-1.5">{t('ugo_menu_output_direction')}</p>
                  <div className="grid grid-cols-2 gap-1.5">
                      {isVerticalInput && (
                        <>
                          <Button onClick={() => onUpdateTurnDirection('left')} variant={currentTurnDirection === 'left' ? 'primary' : 'secondary'} className="!px-2 !py-1 text-xs shadow-md shadow-slate-900/40">{t('ugo_menu_direction_left')}</Button>
                          <Button onClick={() => onUpdateTurnDirection('right')} variant={currentTurnDirection === 'right' ? 'primary' : 'secondary'} className="!px-2 !py-1 text-xs shadow-md shadow-slate-900/40">{t('ugo_menu_direction_right')}</Button>
                        </>
                      )}
                      {isHorizontalInput && (
                        <>
                          <Button onClick={() => onUpdateTurnDirection('up')} variant={currentTurnDirection === 'up' ? 'primary' : 'secondary'} className="!px-2 !py-1 text-xs shadow-md shadow-slate-900/40">{t('ugo_menu_direction_up')}</Button>
                          <Button onClick={() => onUpdateTurnDirection('down')} variant={currentTurnDirection === 'down' ? 'primary' : 'secondary'} className="!px-2 !py-1 text-xs shadow-md shadow-slate-900/40">{t('ugo_menu_direction_down')}</Button>
                        </>
                      )}
                  </div>
                </div>
              )}
              {moduleData.type !== 'Источник' ? (
                <div>
                    <p className="text-sm text-gray-600 mb-1.5 pt-2 border-t mt-2">{t('ugo_menu_spacer_shaft')}</p>
                    <div className="grid grid-cols-2 gap-1.5">
                        <Button onClick={() => onAddSpacer('before')} variant="secondary" className="!px-2 !py-1 text-xs shadow-md shadow-slate-900/40">{t('ugo_menu_add_before')}</Button>
                        <Button onClick={() => onAddSpacer('after')} variant="secondary" className="!px-2 !py-1 text-xs shadow-md shadow-slate-900/40">{t('ugo_menu_add_after')}</Button>
                    </div>
                </div>
              ) : (
                <div>
                    <p className="text-sm text-gray-600 mb-1.5 pt-2 border-t mt-2">{t('ugo_menu_spacer_shaft')}</p>
                    <Button onClick={() => onAddSpacer('after')} variant="secondary" className="w-full !px-2 !py-1 text-xs shadow-md shadow-slate-900/40">{t('ugo_menu_add_after')}</Button>
                </div>
              )}
            </div>
          </div>
      </div>
    </>
  );
};