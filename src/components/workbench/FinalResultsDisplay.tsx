import React from 'react';
import { FinalCalculationResults, ShaftOrientation } from '../../types';
import { getRotationIconPath } from '../../constants';

interface FinalResultsDisplayProps {
  results: FinalCalculationResults;
}

export const FinalResultsDisplay: React.FC<FinalResultsDisplayProps> = ({ results }) => {
    let finalRotationIcon = null;
    if (results.finalDirection && results.finalOrientation) {
        const iconPath = getRotationIconPath(results.finalDirection, results.finalOrientation);
        const altText = `Направление: ${results.finalDirection}, Ориентация: ${results.finalOrientation === ShaftOrientation.Horizontal ? "Горизонтальный" : "Вертикальный"}`;
        finalRotationIcon = (<img src={iconPath} alt={altText} title={altText} className="w-10 h-10 inline-block ml-2 align-middle" />);
    }

    return (
        <>
            <h2 className="text-2xl font-bold text-slate-800 mb-6 ">Итоговые параметры трансмиссии</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ">
                <p className="text-gray-800"><strong>Общее передаточное отношение (кинематическое):</strong> {results.totalGearRatio.toFixed(4)}</p>
                {results.totalEfficiency !== undefined && <p className="text-gray-800"><strong>Общий КПД:</strong> {results.totalEfficiency.toFixed(4)}</p>}
                <p className="text-gray-800"><strong>Выходной крутящий момент, Нм:</strong> {results.finalTorque.toFixed(2)}</p>
                <p className="text-gray-800"><strong>Выходные мин. обороты, об/мин:</strong> {results.finalMinRpm.toFixed(0)}</p>
                <p className="text-gray-800"><strong>Выходные макс. обороты, об/мин:</strong> {results.finalMaxRpm.toFixed(0)}</p>
                <div className="text-gray-800 flex items-center"><strong>Выходное направление вращения:</strong> {finalRotationIcon ? finalRotationIcon : results.finalDirection}</div>
            </div>
        </>
    );
};