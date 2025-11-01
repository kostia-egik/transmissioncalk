import React from 'react';
import { FinalCalculationResults, ShaftOrientation } from '../../types';
import { getRotationIconPath } from '../../constants';
import { useLanguage } from '../../contexts/LanguageContext';

interface FinalResultsDisplayProps {
  results: FinalCalculationResults;
}

export const FinalResultsDisplay: React.FC<FinalResultsDisplayProps> = ({ results }) => {
    const { t } = useLanguage();
    let finalRotationIcon = null;
    if (results.finalDirection && results.finalOrientation) {
        const iconPath = getRotationIconPath(results.finalDirection, results.finalOrientation);
        const altText = `${t('module_cascade_direction')}: ${results.finalDirection}, ${t('module_cascade_orientation')}: ${results.finalOrientation === ShaftOrientation.Horizontal ? t('orientation_horizontal') : t('orientation_vertical')}`;
        finalRotationIcon = (<img src={iconPath} alt={altText} title={altText} className="w-10 h-10 inline-block ml-2 align-middle" />);
    }

    return (
        <>
            <h2 className="text-2xl font-bold text-slate-800 mb-6 ">{t('workbench_final_results_title')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ">
                <p className="text-gray-800"><strong>{t('workbench_total_gear_ratio')}</strong> {results.totalGearRatio.toFixed(4)}</p>
                {results.totalEfficiency !== undefined && <p className="text-gray-800"><strong>{t('workbench_total_efficiency')}</strong> {results.totalEfficiency.toFixed(4)}</p>}
                <p className="text-gray-800"><strong>{t('workbench_final_torque')}</strong> {results.finalTorque.toFixed(2)}</p>
                <p className="text-gray-800"><strong>{t('workbench_final_min_rpm')}</strong> {results.finalMinRpm.toFixed(0)}</p>
                <p className="text-gray-800"><strong>{t('workbench_final_max_rpm')}</strong> {results.finalMaxRpm.toFixed(0)}</p>
                <div className="text-gray-800 flex items-center"><strong>{t('workbench_final_direction')}</strong> {finalRotationIcon ? finalRotationIcon : results.finalDirection}</div>
            </div>
        </>
    );
};