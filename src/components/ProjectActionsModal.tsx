

import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { EngineParams, FinalCalculationResults, ModuleCalculationData, SchemeElement, StageCalculationData } from '../types';
import { calculateCascade } from '../services/calculationService';
import Button from './Button';

const downloadFile = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

const handleExportSVG = async (svgContainer: HTMLElement) => {
    const svgElement = svgContainer.querySelector('svg');
    if (!svgElement) {
        alert('Ошибка: SVG элемент не найден.');
        return;
    }
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    downloadFile(blob, 'transmission-scheme.svg');
};

const handleExportPNG = async (svgContainer: HTMLElement) => {
    try {
        const canvas = await html2canvas(svgContainer, {
            backgroundColor: '#ffffff',
            scale: 2, // Increase resolution for better quality
        });
        const dataUrl = canvas.toDataURL('image/png');
        const blob = await (await fetch(dataUrl)).blob();
        downloadFile(blob, 'transmission-scheme.png');
    } catch (error) {
        console.error('Ошибка при экспорте в PNG:', error);
        alert('Не удалось экспортировать в PNG. Подробности в консоли.');
    }
};

const getDynamicHeaders = (allModules: ModuleCalculationData[]) => {
    const headerSet = new Set<string>();
    allModules.forEach(module => {
      Object.keys(module.inputs).forEach(key => {
        if (!['eta', 'config', 'shaftConfig'].includes(key)) {
          headerSet.add(key);
        }
      });
    });
    // A consistent order is good for UX
    return Array.from(headerSet).sort();
};
  
const getExportableRows = (calculationData: StageCalculationData[]) => {
    const rows: any[] = [];
    calculationData.forEach((stage, stageIndex) => {
        stage.modules.forEach(module => {
            rows.push({
                stage: stageIndex + 1,
                status: module.isSelected ? 'Ведущий' : 'Вариант',
                type: module.type,
                u: module.u,
                eta: module.inputs.eta,
                ...module.inputs,
                cascadeIn: module.cascadeIn,
                cascadeOut: module.cascadeOut
            });
        });
    });
    return rows;
};

const handleExportCSV = (calculationData: StageCalculationData[], finalResults: FinalCalculationResults | null) => {
    const exportableRows = getExportableRows(calculationData);
    const allModules = calculationData.flatMap(s => s.modules);
    const dynamicHeaders = getDynamicHeaders(allModules);
    
    const staticHeaders = ['Ступень', 'Статус', 'Тип передачи', 'u', 'η'];
    const cascadeHeaders = ['Вх. Момент (Нм)', 'Вх. об/мин', 'Вых. Момент (Нм)', 'Вых. об/мин'];
    const headers = [...staticHeaders, ...dynamicHeaders, ...cascadeHeaders];

    const rows = exportableRows.map(row => {
        const rowData: (string | number)[] = [
            row.stage,
            row.status,
            row.type,
            row.u?.toFixed(4) || 'N/A',
            row.eta || 'N/A',
        ];
        dynamicHeaders.forEach(headerKey => { rowData.push(row[headerKey] || ''); });
        rowData.push(
            row.cascadeIn?.torque.toFixed(2) || 'N/A',
            `${row.cascadeIn?.minRpm.toFixed(0)}-${row.cascadeIn?.maxRpm.toFixed(0)}`,
            row.cascadeOut?.torque.toFixed(2) || 'N/A',
            `${row.cascadeOut?.minRpm.toFixed(0)}-${row.cascadeOut?.maxRpm.toFixed(0)}`
        );
        return rowData.map(val => `"${String(val).replace(/"/g, '""')}"`).join(';');
    });

    let csvContent = headers.join(';') + '\n' + rows.join('\n');
    if (finalResults) {
        csvContent += '\n\nИтоговые параметры\n';
        csvContent += `Общее передаточное отношение;${finalResults.totalGearRatio.toFixed(4)}\n`;
        csvContent += `Общий КПД;${finalResults.totalEfficiency.toFixed(4)}\n`;
        csvContent += `Выходной момент (Нм);${finalResults.finalTorque.toFixed(2)}\n`;
        csvContent += `Выходные обороты (мин-макс);${finalResults.finalMinRpm.toFixed(0)}-${finalResults.finalMaxRpm.toFixed(0)}\n`;
    }
    
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
    downloadFile(blob, 'transmission-report.csv');
};

const handleExportPDF = async (svgContainer: HTMLElement | null, calculationData: StageCalculationData[], finalResults: FinalCalculationResults | null) => {
    const reportContainer = document.createElement('div');
    reportContainer.style.position = 'absolute';
    reportContainer.style.left = '-9999px';
    reportContainer.style.top = '0';
    reportContainer.style.width = '1122px'; // A4 landscape width in pixels for jsPDF
    reportContainer.style.padding = '20px';
    reportContainer.style.backgroundColor = 'white';
    reportContainer.style.fontFamily = 'Arial, sans-serif';

    const exportableRows = getExportableRows(calculationData);
    const allModules = calculationData.flatMap(s => s.modules);
    const dynamicHeaders = getDynamicHeaders(allModules);
    const staticHeaders = ['Ступень', 'Статус', 'Тип', 'u', 'η'];
    const cascadeHeaders = ['Вх. Момент', 'Вх. об/мин', 'Вых. Момент', 'Вых. об/мин'];
    const allTableHeaders = [...staticHeaders, ...dynamicHeaders, ...cascadeHeaders];

    let content = `<h1 style="text-align: center; font-size: 24px; margin-bottom: 20px;">Отчет по расчету трансмиссии</h1>`;
    
    if (svgContainer) {
        content += `<h2 style="font-size: 18px; margin-top: 20px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">Кинематическая схема</h2>`;
        const svgClone = svgContainer.querySelector('svg')?.cloneNode(true) as SVGSVGElement;
        if (svgClone) {
            svgClone.style.width = '100%';
            svgClone.style.height = 'auto';
            content += svgClone.outerHTML;
        }
    } else {
        content += `<p style="text-align: center; color: #555; font-style: italic; margin-top: 20px; padding: 10px; border: 1px dashed #ccc;">Кинематическая схема не была сгенерирована.</p>`;
    }

    if (finalResults) {
        content += `<h2 style="font-size: 18px; margin-top: 20px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">Итоговые параметры</h2><table style="width: 100%; border-collapse: collapse; font-size: 12px;"><tr><td style="padding: 4px; border: 1px solid #ddd;">Общее передаточное отношение:</td><td style="padding: 4px; border: 1px solid #ddd;"><b>${finalResults.totalGearRatio.toFixed(4)}</b></td></tr><tr><td style="padding: 4px; border: 1px solid #ddd;">Общий КПД:</td><td style="padding: 4px; border: 1px solid #ddd;"><b>${finalResults.totalEfficiency.toFixed(4)}</b></td></tr><tr><td style="padding: 4px; border: 1px solid #ddd;">Выходной момент (Нм):</td><td style="padding: 4px; border: 1px solid #ddd;"><b>${finalResults.finalTorque.toFixed(2)}</b></td></tr><tr><td style="padding: 4px; border: 1px solid #ddd;">Выходные обороты (мин-макс):</td><td style="padding: 4px; border: 1px solid #ddd;"><b>${finalResults.finalMinRpm.toFixed(0)} - ${finalResults.finalMaxRpm.toFixed(0)}</b></td></tr></table>`;
    }

    content += `<h2 style="font-size: 18px; margin-top: 20px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">Параметры по ступеням</h2><table style="width: 100%; border-collapse: collapse; font-size: 8px; margin-top: 10px;"><thead style="background-color: #f2f2f2;"><tr>`;
    allTableHeaders.forEach(header => {
        content += `<th style="padding: 2px 4px; border: 1px solid #ddd; text-align: left;">${header}</th>`;
    });
    content += `</tr></thead><tbody>`;

    exportableRows.forEach(row => {
        content += `<tr>`;
        content += `<td style="padding: 2px 4px; border: 1px solid #ddd; text-align: center;">${row.stage}</td>`;
        content += `<td style="padding: 2px 4px; border: 1px solid #ddd;">${row.status}</td>`;
        content += `<td style="padding: 2px 4px; border: 1px solid #ddd;">${row.type}</td>`;
        content += `<td style="padding: 2px 4px; border: 1px solid #ddd; text-align: right;">${row.u?.toFixed(4) || 'N/A'}</td>`;
        content += `<td style="padding: 2px 4px; border: 1px solid #ddd; text-align: right;">${row.eta || 'N/A'}</td>`;
        dynamicHeaders.forEach(headerKey => {
            content += `<td style="padding: 2px 4px; border: 1px solid #ddd; text-align: right;">${row[headerKey] || ''}</td>`;
        });
        content += `<td style="padding: 2px 4px; border: 1px solid #ddd; text-align: right;">${row.cascadeIn?.torque.toFixed(2) || 'N/A'}</td>`;
        content += `<td style="padding: 2px 4px; border: 1px solid #ddd; text-align: right;">${row.cascadeIn ? `${row.cascadeIn.minRpm.toFixed(0)}-${row.cascadeIn.maxRpm.toFixed(0)}` : 'N/A'}</td>`;
        content += `<td style="padding: 2px 4px; border: 1px solid #ddd; text-align: right;">${row.cascadeOut?.torque.toFixed(2) || 'N/A'}</td>`;
        content += `<td style="padding: 2px 4px; border: 1px solid #ddd; text-align: right;">${row.cascadeOut ? `${row.cascadeOut.minRpm.toFixed(0)}-${row.cascadeOut.maxRpm.toFixed(0)}` : 'N/A'}</td>`;
        content += `</tr>`;
    });

    content += `</tbody></table>`;
    reportContainer.innerHTML = content;
    document.body.appendChild(reportContainer);

    try {
        const canvas = await html2canvas(reportContainer, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({ orientation: 'l', unit: 'px', format: 'a4' });
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasHeight / canvasWidth;
        const finalImgHeight = pdfWidth * ratio;
        let heightLeft = finalImgHeight;
        let position = 0;
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, finalImgHeight);
        heightLeft -= pdfHeight;
        while (heightLeft > 0) {
            position -= pdfHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, finalImgHeight);
            heightLeft -= pdfHeight;
        }
        pdf.save('transmission-report.pdf');
    } catch (error) {
        console.error('Ошибка при экспорте в PDF:', error);
        alert('Не удалось экспортировать в PDF. Подробности в консоли.');
    } finally {
        document.body.removeChild(reportContainer);
    }
};

const isStageCalculationData = (el: SchemeElement): el is StageCalculationData => {
    if (!el || typeof el !== 'object' || 'type' in el) return false;
    const potentialStage = el as Partial<StageCalculationData>;
    return potentialStage.id !== undefined && potentialStage.stageName !== undefined && potentialStage.modules !== undefined && Array.isArray(potentialStage.modules);
};

interface ProjectActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  onLoadClick: () => void;
  context: 'workbench' | 'scheme';
  svgContainerRef?: React.RefObject<HTMLDivElement>;
  schemeElements: SchemeElement[];
  calculationData: StageCalculationData[];
  engineParams: EngineParams;
}

export const ProjectActionsModal: React.FC<ProjectActionsModalProps> = ({ isOpen, onClose, onSave, onLoadClick, context, svgContainerRef, schemeElements, calculationData, engineParams }) => {
  const [activeTab, setActiveTab] = useState('project');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  if (!isOpen) return null;

  const onExportClick = async (format: 'svg' | 'png' | 'csv' | 'pdf') => {
    setLoadingMessage(`Генерация ${format.toUpperCase()}...`);
    setIsLoading(true);
    
    // Используем актуальные данные в зависимости от контекста вызова
    const effectiveCalculationData = context === 'workbench' 
        ? calculationData 
        : schemeElements.filter(isStageCalculationData);

    const { results } = calculateCascade(engineParams, effectiveCalculationData);

    await new Promise(resolve => setTimeout(resolve, 50));

    try {
        switch (format) {
            case 'svg':
            case 'png':
                if (context === 'scheme' && svgContainerRef?.current) {
                    if (format === 'svg') await handleExportSVG(svgContainerRef.current);
                    else await handleExportPNG(svgContainerRef.current);
                }
                break;
            case 'csv':
                handleExportCSV(effectiveCalculationData, results);
                break;
            case 'pdf':
                if (context === 'workbench') {
                    if (!window.confirm('Кинематическая схема не построена. Отчет будет содержать только расчетные таблицы. Продолжить?')) {
                        setIsLoading(false);
                        return;
                    }
                    await handleExportPDF(null, effectiveCalculationData, results);
                } else if (svgContainerRef?.current) {
                    await handleExportPDF(svgContainerRef.current, effectiveCalculationData, results);
                }
                break;
        }
    } finally {
        setIsLoading(false);
        setLoadingMessage('');
    }
  };

  const TabButton: React.FC<{ tabId: string; children: React.ReactNode }> = ({ tabId, children }) => {
    const isActive = activeTab === tabId;
    const activeClasses = 'border-blue-500 text-blue-600';
    const inactiveClasses = 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300';
    return (
      <button onClick={() => setActiveTab(tabId)} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${isActive ? activeClasses : inactiveClasses}`} aria-current={isActive ? 'page' : undefined} role="tab">
        {children}
      </button>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="project-modal-title">
      <div className="bg-white rounded-lg shadow-xl m-4 max-w-sm w-full animate-fade-in flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b">
          <h3 id="project-modal-title" className="text-lg font-bold text-gray-800">Проект и Экспорт</h3>
          <button onClick={onClose} className="p-1 rounded-full text-gray-500 hover:bg-gray-200" aria-label="Закрыть"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        <div className="border-b border-gray-200 px-4"><nav className="-mb-px flex space-x-6" aria-label="Tabs" role="tablist"><TabButton tabId="project">Проект</TabButton><TabButton tabId="export">Экспорт</TabButton></nav></div>
        
        <div className="p-6 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-8 space-y-3"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div><p className="text-gray-600">{loadingMessage}</p></div>
          ) : (
            <>
              {activeTab === 'project' && (
                <div className="flex flex-col space-y-3">
                    <p className="text-sm text-gray-500 text-center">Сохраните текущее состояние проекта в файл или загрузите ранее сохраненный.</p>
                    <Button onClick={onSave} variant="primary" className="w-full">Сохранить проект</Button>
                    <Button onClick={onLoadClick} variant="secondary" className="w-full">Загрузить проект</Button>
                </div>
              )}
              {activeTab === 'export' && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 mb-2 border-b pb-1">Полный отчет</h4>
                    <Button onClick={() => onExportClick('pdf')} variant="secondary" className="w-full">Создать PDF отчет</Button>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 mb-2 border-b pb-1">Только данные</h4>
                    <Button onClick={() => onExportClick('csv')} variant="secondary" className="w-full">Экспорт в CSV</Button>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 mb-2 border-b pb-1">Только схема</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <Button onClick={() => onExportClick('svg')} variant="secondary" className="w-full" disabled={context !== 'scheme'} title={context !== 'scheme' ? 'Доступно только в сборщике схем' : ''}>Экспорт в SVG</Button>
                      <Button onClick={() => onExportClick('png')} variant="secondary" className="w-full" disabled={context !== 'scheme'} title={context !== 'scheme' ? 'Доступно только в сборщике схем' : ''}>Экспорт в PNG</Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};