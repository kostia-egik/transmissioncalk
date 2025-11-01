import React, { useState, useEffect } from 'react';
import { 
    cylindricalGearSVG,
    chainDriveSVG,
    toothedBeltDriveSVG,
    beltDriveSVG,
    bevelGearConfig1SVG,
	bevelGearConfig2SVG,
	bevelGearConfig3SVG,
    wormDriveTopSVG,
	wormDriveBottomSVG,
    planetaryGearFixedRingSVG,
	planetaryGearFixedSunSVG,
	planetaryGearFixedCarrierSVG,
    bearingHorizontalSVG,
    shaftSVG,
	shaftDashedSVG,
	cardanShaftSVG,
} from '../assets/ugo-static/svg-library';
import { useLanguage } from '../contexts/LanguageContext';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab: 'guide' | 'catalog';
  onStartWorkbenchTour: () => void;
  onStartSchemeTour: () => void;
}

type InfoModalTab = 'guide' | 'catalog';

const CatalogItem: React.FC<{ title: string; children: React.ReactNode; description?: string }> = ({ title, children, description }) => (
    <div className="p-4 border border-gray-200 rounded-lg bg-gray-50/50 flex flex-col">
      <div className="relative w-full flex items-center justify-center min-h-[120px]">
        {children}
      </div>
      <div className="mt-2 text-center">
        <h4 className="font-semibold text-gray-800">{title}</h4>
        {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
      </div>
    </div>
);


export const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose, defaultTab, onStartWorkbenchTour, onStartSchemeTour }) => {
  const [activeTab, setActiveTab] = useState<InfoModalTab>(defaultTab);
  const { t } = useLanguage();

  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
    }
  }, [isOpen, defaultTab]);

  if (!isOpen) {
    return null;
  }

  const TabButton: React.FC<{ tabId: InfoModalTab; children: React.ReactNode }> = ({ tabId, children }) => {
    const isActive = activeTab === tabId;
    const activeClasses = 'border-blue-500 text-blue-600';
    const inactiveClasses = 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300';
    return (
        <button
            onClick={() => setActiveTab(tabId)}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${isActive ? activeClasses : inactiveClasses}`}
            aria-current={isActive ? 'page' : undefined}
            role="tab"
        >
            {children}
        </button>
    );
  };


  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="info-modal-title"
    >
      <div 
        className="bg-white rounded-xl shadow-2xl w-11/12 max-w-4xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white/80 backdrop-blur-sm rounded-t-xl flex-shrink-0">
          <h2 id="info-modal-title" className="text-xl font-bold text-gray-800">{t('info_modal_title')}</h2>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full text-gray-500 hover:bg-gray-200 hover:text-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={t('info_modal_close_aria_label')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <main className="flex-grow flex flex-col overflow-hidden">
            <div className="border-b border-gray-200 px-6 flex-shrink-0 overflow-x-auto">
                <nav className="-mb-px flex space-x-8 flex-nowrap" aria-label="Tabs" role="tablist">
                    <TabButton tabId="guide">{t('info_modal_tab_guide')}</TabButton>
                    <TabButton tabId="catalog">{t('info_modal_tab_catalog')}</TabButton>
                </nav>
            </div>

            <div className="p-6 overflow-y-auto space-y-8 flex-grow">
                 {activeTab === 'guide' && (
                    <section>
                        <h3 className="text-lg font-semibold text-gray-700 mb-4">{t('guide_title')}</h3>
                        <div className="mb-8 p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <h4 className="text-base font-semibold text-gray-700 text-center">{t('guide_retake_tour_title')}</h4>
                            <div className="mt-4 flex flex-col sm:flex-row justify-center items-center gap-4">
                                <button 
                                    onClick={onStartWorkbenchTour}
                                    className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition-colors w-full sm:w-auto"
                                >
                                    {t('guide_start_workbench_tour')}
                                </button>
                                <button 
                                    onClick={onStartSchemeTour}
                                    className="px-4 py-2 bg-slate-700 text-white font-semibold rounded-lg shadow-md hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-opacity-75 transition-colors w-full sm:w-auto"
                                >
                                    {t('guide_start_scheme_tour')}
                                </button>
                            </div>
                        </div>
                        <div className="space-y-6 text-sm text-gray-600 leading-relaxed prose prose-sm max-w-none">
                            <div>
                                <h4 dangerouslySetInnerHTML={{ __html: t('guide_intro_title') }} />
                                <p dangerouslySetInnerHTML={{ __html: t('guide_intro_p1') }} />
                                <ol className="list-decimal list-inside pl-4 space-y-1">
                                    <li dangerouslySetInnerHTML={{ __html: t('guide_intro_li1') }} />
                                    <li dangerouslySetInnerHTML={{ __html: t('guide_intro_li2') }} />
                                </ol>
                            </div>

                            <hr className="my-6"/>
                            
                            <div>
                                <h4 dangerouslySetInnerHTML={{ __html: t('guide_general_tips_title') }} />
                                <p dangerouslySetInnerHTML={{ __html: t('guide_general_tips_p1') }} />
                                <ul className="list-disc list-inside pl-4 space-y-2">
                                    <li dangerouslySetInnerHTML={{ __html: t('guide_general_tips_li1') }} />
                                    <li dangerouslySetInnerHTML={{ __html: t('guide_general_tips_li2') }} />
                                    <li dangerouslySetInnerHTML={{ __html: t('guide_general_tips_li3') }} />
                                </ul>
                            </div>

                            <hr className="my-6"/>

                            <div>
                                <h4 dangerouslySetInnerHTML={{ __html: t('guide_workbench_title') }} />
                                <p dangerouslySetInnerHTML={{ __html: t('guide_workbench_p1') }} />
                                <ul className="list-disc list-inside pl-4 space-y-4">
                                    <li>
                                        <strong dangerouslySetInnerHTML={{ __html: t('guide_workbench_source_title') }} />
                                        <p className="pl-4 mt-1" dangerouslySetInnerHTML={{ __html: t('guide_workbench_source_p1') }}/>
                                    </li>
                                    <li>
                                        <strong dangerouslySetInnerHTML={{ __html: t('guide_workbench_stages_title') }} />
                                        <ul className="list-[circle] list-inside ml-4 mt-1 space-y-1">
                                            <li dangerouslySetInnerHTML={{ __html: t('guide_workbench_stages_li1') }} />
                                            <li dangerouslySetInnerHTML={{ __html: t('guide_workbench_stages_li2') }} />
                                            <li dangerouslySetInnerHTML={{ __html: t('guide_workbench_stages_li3') }} />
                                        </ul>
                                    </li>
                                    <li>
                                        <strong dangerouslySetInnerHTML={{ __html: t('guide_workbench_config_title') }} />
                                        <ul className="list-[circle] list-inside ml-4 mt-1 space-y-1">
                                            <li dangerouslySetInnerHTML={{ __html: t('guide_workbench_config_li1') }} />
                                            <li dangerouslySetInnerHTML={{ __html: t('guide_workbench_config_li2') }} />
                                            <li dangerouslySetInnerHTML={{ __html: t('guide_workbench_config_li3') }} />
                                            <li dangerouslySetInnerHTML={{ __html: t('guide_workbench_config_li4') }} />
                                            <li dangerouslySetInnerHTML={{ __html: t('guide_workbench_config_li5') }} />
                                            <li dangerouslySetInnerHTML={{ __html: t('guide_workbench_config_li6') }} />
                                        </ul>
                                    </li>
                                    <li>
                                        <strong dangerouslySetInnerHTML={{ __html: t('guide_workbench_final_title') }} />
                                        <p className="pl-4 mt-1" dangerouslySetInnerHTML={{ __html: t('guide_workbench_final_p1') }} />
                                    </li>
                                </ul>
                                <blockquote className="mt-4 p-3 border-l-4 border-slate-300 bg-slate-50 rounded-r-lg">
                                    <p className="font-semibold text-slate-700" dangerouslySetInnerHTML={{ __html: t('guide_workbench_note_title') }} />
                                    <p dangerouslySetInnerHTML={{ __html: t('guide_workbench_note_p1') }} />
                                </blockquote>
                            </div>
                            
                            <hr className="my-6"/>

                            <div>
                                <h4 dangerouslySetInnerHTML={{ __html: t('guide_scheme_title') }} />
                                <p dangerouslySetInnerHTML={{ __html: t('guide_scheme_p1') }} />
                                 <ul className="list-disc list-inside pl-4 space-y-4">
                                    <li>
                                        <strong dangerouslySetInnerHTML={{ __html: t('guide_scheme_nav_title') }} />
                                        <p className="pl-4 mt-1" dangerouslySetInnerHTML={{ __html: t('guide_scheme_nav_p1') }} />
                                    </li>
                                    <li>
                                        <strong dangerouslySetInnerHTML={{ __html: t('guide_scheme_menu_title') }} />
                                        <p className="pl-4 mt-1" dangerouslySetInnerHTML={{ __html: t('guide_scheme_menu_p1') }} />
                                        <ul className="list-[circle] list-inside ml-8 mt-1 space-y-1">
                                            <li dangerouslySetInnerHTML={{ __html: t('guide_scheme_menu_li1') }} />
                                            <li dangerouslySetInnerHTML={{ __html: t('guide_scheme_menu_li2') }} />
                                            <li dangerouslySetInnerHTML={{ __html: t('guide_scheme_menu_li3') }} />
                                        </ul>
                                    </li>
                                    <li>
                                        <strong dangerouslySetInnerHTML={{ __html: t('guide_scheme_collision_title') }} />
                                        <p className="pl-4 mt-1" dangerouslySetInnerHTML={{ __html: t('guide_scheme_collision_p1') }} />
                                    </li>
                                    <li>
                                        <strong dangerouslySetInnerHTML={{ __html: t('guide_scheme_sync_title') }} />
                                        <p className="pl-4 mt-1" dangerouslySetInnerHTML={{ __html: t('guide_scheme_sync_p1') }} />
                                         <ul className="list-[circle] list-inside ml-4 mt-1 space-y-1">
                                            <li dangerouslySetInnerHTML={{ __html: t('guide_scheme_sync_li1') }} />
                                            <li dangerouslySetInnerHTML={{ __html: t('guide_scheme_sync_li2') }} />
                                            <li dangerouslySetInnerHTML={{ __html: t('guide_scheme_sync_li3') }} />
                                            <li dangerouslySetInnerHTML={{ __html: t('guide_scheme_sync_li4') }} />
                                        </ul>
                                    </li>
                                </ul>
                            </div>

                            <hr className="my-6"/>

                           <div>
                                <h4 dangerouslySetInnerHTML={{ __html: t('guide_export_title') }} />
                                <p dangerouslySetInnerHTML={{ __html: t('guide_export_p1') }} />
                                <ul className="list-disc list-inside pl-4 space-y-4">
                                    <li>
                                        <strong dangerouslySetInnerHTML={{ __html: t('guide_export_management_title') }} />
                                        <ul className="list-[circle] list-inside ml-4 mt-1 space-y-1">
                                            <li dangerouslySetInnerHTML={{ __html: t('guide_export_management_li1') }} />
                                            <li dangerouslySetInnerHTML={{ __html: t('guide_export_management_li2') }} />
                                            <li dangerouslySetInnerHTML={{ __html: t('guide_export_management_li3') }} />
                                            <li dangerouslySetInnerHTML={{ __html: t('guide_export_management_li4') }} />
                                        </ul>
                                    </li>
                                    <li>
                                        <strong dangerouslySetInnerHTML={{ __html: t('guide_export_reports_title') }} />
                                        <ul className="list-[circle] list-inside ml-4 mt-1 space-y-1">
                                            <li dangerouslySetInnerHTML={{ __html: t('guide_export_reports_li1') }} />
                                            <li dangerouslySetInnerHTML={{ __html: t('guide_export_reports_li2') }} />
                                            <li dangerouslySetInnerHTML={{ __html: t('guide_export_reports_li3') }} />
                                        </ul>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </section>
                )}
                {activeTab === 'catalog' && (
                    <section>
                        <h3 className="text-lg font-semibold text-gray-700 mb-4 pb-2 border-b">{t('catalog_title')}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <CatalogItem title={t('catalog_toothed_belt_drive')}>
                                <div dangerouslySetInnerHTML={{ __html: toothedBeltDriveSVG(t as any) }} />
                            </CatalogItem>
                            <CatalogItem title={t('catalog_chain_drive')}>
                                 <div dangerouslySetInnerHTML={{ __html: chainDriveSVG(t as any) }} />
                            </CatalogItem>
                             <CatalogItem title={t('catalog_cylindrical_gear_drive')}>
                                <div dangerouslySetInnerHTML={{ __html: cylindricalGearSVG(t as any) }} />
                            </CatalogItem>
                            <CatalogItem title={t('catalog_belt_drive')}>
                                 <div dangerouslySetInnerHTML={{ __html: beltDriveSVG(t as any) }} />
                            </CatalogItem>
                            <CatalogItem title={t('catalog_bevel_gear_drive')} description={t('catalog_bevel_layout_1')}>
                                <div dangerouslySetInnerHTML={{ __html: bevelGearConfig1SVG(t as any) }} />
                                </CatalogItem>
                            <CatalogItem title={t('catalog_bevel_gear_drive')} description={t('catalog_bevel_layout_2')}>
                                <div dangerouslySetInnerHTML={{ __html: bevelGearConfig2SVG(t as any) }} />
                                </CatalogItem>
                            <CatalogItem title={t('catalog_bevel_gear_drive')} description={t('catalog_bevel_layout_3')}>
                                <div dangerouslySetInnerHTML={{ __html: bevelGearConfig3SVG(t as any) }} />
                            </CatalogItem>
                             <CatalogItem title={t('catalog_worm_drive')} description={t('catalog_worm_top')}>
                                <div dangerouslySetInnerHTML={{ __html: wormDriveTopSVG(t as any) }} />
                                </CatalogItem>
                             <CatalogItem title={t('catalog_worm_drive')} description={t('catalog_worm_bottom')}>
                                <div dangerouslySetInnerHTML={{ __html: wormDriveBottomSVG(t as any) }} />
                            </CatalogItem>
                            <CatalogItem title={t('catalog_planetary_gear')} description={t('catalog_planetary_fixed_ring')}>
                                <div dangerouslySetInnerHTML={{ __html: planetaryGearFixedRingSVG(t as any) }} />
                                </CatalogItem>
                            <CatalogItem title={t('catalog_planetary_gear')} description={t('catalog_planetary_fixed_sun')}>
                                <div dangerouslySetInnerHTML={{ __html: planetaryGearFixedSunSVG(t as any) }} />
                                </CatalogItem>
                            <CatalogItem title={t('catalog_planetary_gear')} description={t('catalog_planetary_fixed_carrier')}>
                                <div dangerouslySetInnerHTML={{ __html: planetaryGearFixedCarrierSVG(t as any) }} />
                                </CatalogItem>
                            <CatalogItem title={t('catalog_shaft')}>
                                <div dangerouslySetInnerHTML={{ __html: shaftSVG }} />
                                </CatalogItem>
                            <CatalogItem title={t('catalog_shaft_dashed')}>
                                <div dangerouslySetInnerHTML={{ __html: shaftDashedSVG }} />
                                </CatalogItem>
                            <CatalogItem title={t('catalog_cardan_shaft')}>
                                <div dangerouslySetInnerHTML={{ __html: cardanShaftSVG }} />
                            </CatalogItem>
                            <CatalogItem title={t('catalog_bearing')}>
                                <div dangerouslySetInnerHTML={{ __html: bearingHorizontalSVG }} />
                            </CatalogItem>
                        </div>
                  </section>
                )}
            </div>
        </main>
      </div>
    </div>
  );
};
