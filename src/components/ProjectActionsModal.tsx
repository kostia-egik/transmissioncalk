import React, { useState, useEffect, useRef } from 'react';
import { EngineParams, FinalCalculationResults, ModuleCalculationData, SchemeElement, StageCalculationData, Project } from '../types';
import { calculateCascade } from '../services/calculationService';
import Button from './Button';
import Input from './Input';
import { EditIcon } from '../assets/icons/EditIcon';

const getTimestamp = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
};

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
    downloadFile(blob, `transmission-scheme_${getTimestamp()}.svg`);
};

const handleExportPNG = async (svgContainer: HTMLElement) => {
    try {
        const { default: html2canvas } = await import('html2canvas');
        const canvas = await html2canvas(svgContainer, {
            backgroundColor: '#ffffff',
            scale: 2, // Increase resolution for better quality
        });
        const dataUrl = canvas.toDataURL('image/png');
        const blob = await (await fetch(dataUrl)).blob();
        downloadFile(blob, `transmission-scheme_${getTimestamp()}.png`);
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
    downloadFile(blob, `transmission-report_${getTimestamp()}.csv`);
};

const createStyledElement = (tag: string, styles: Partial<CSSStyleDeclaration>, text?: string): HTMLElement => {
    const el = document.createElement(tag);
    Object.assign(el.style, styles);
    if (text) el.textContent = text;
    return el;
};

const createTableCell = (text: string | number, isHeader = false, styles: Partial<CSSStyleDeclaration> = {}) => {
    const cell = document.createElement(isHeader ? 'th' : 'td');
    cell.textContent = String(text);
    Object.assign(cell.style, {
        padding: '2px 4px',
        border: '1px solid #ddd',
        textAlign: 'left',
        ...styles,
    });
    return cell;
};

const handleExportPDF = async (
    svgContainer: HTMLElement | null,
    engineParams: EngineParams,
    calculationData: StageCalculationData[],
    finalResults: FinalCalculationResults | null
) => {
    const { jsPDF } = await import('jspdf');
    const { default: html2canvas } = await import('html2canvas');
    const doc = new jsPDF({ orientation: 'l', unit: 'px', format: 'a4' });
    const pdfWidth = doc.internal.pageSize.getWidth();
    const pdfHeight = doc.internal.pageSize.getHeight();
    const margin = 20;

    // --- Page 1: Title and Scheme ---
    doc.setFontSize(24);
    doc.text('Отчет по расчету трансмиссии', pdfWidth / 2, margin + 10, { align: 'center' });
    
    if (svgContainer) {
        const canvas = await html2canvas(svgContainer, { scale: 2, backgroundColor: '#ffffff' });
        const imgData = canvas.toDataURL('image/png');
        
        const pageContentWidth = pdfWidth - margin * 2;
        const pageContentHeight = pdfHeight - margin * 2 - 30; // Extra space for title
        
        const imgRatio = canvas.width / canvas.height;
        
        let finalWidth, finalHeight;
        if (imgRatio > (pageContentWidth / pageContentHeight)) {
            finalWidth = pageContentWidth;
            finalHeight = finalWidth / imgRatio;
        } else {
            finalHeight = pageContentHeight;
            finalWidth = finalHeight * imgRatio;
        }
        
        const imgX = (pdfWidth - finalWidth) / 2;
        const imgY = (pdfHeight - finalHeight) / 2 + 20;
        
        doc.addImage(imgData, 'PNG', imgX, imgY, finalWidth, finalHeight);
    } else {
        doc.setFontSize(12);
        doc.text('Кинематическая схема не была сгенерирована.', pdfWidth / 2, pdfHeight / 2, { align: 'center' });
    }

    // --- Subsequent pages: Data Tables ---
    const tablesContainer = createStyledElement('div', {
        position: 'absolute',
        left: '-9999px',
        top: '0',
        width: '1122px', // A4 landscape width
        padding: '20px',
        backgroundColor: 'white',
        fontFamily: 'Arial, sans-serif',
    });

    const createRow = (label: string, value: string) => {
        const tr = document.createElement('tr');
        tr.appendChild(createTableCell(label));
        const valueCell = createTableCell('');
        valueCell.appendChild(createStyledElement('b', {}, value));
        tr.appendChild(valueCell);
        return tr;
    };
    
    // 1. Engine Params Table
    tablesContainer.appendChild(createStyledElement('h2', { fontSize: '18px', marginTop: '0px', borderBottom: '1px solid #ccc', paddingBottom: '5px' }, 'Параметры источника'));
    const engineTable = createStyledElement('table', { width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginTop: '10px' }) as HTMLTableElement;
    engineTable.appendChild(createRow('Начальный крутящий момент, Нм:', String(engineParams.initialTorque)));
    engineTable.appendChild(createRow('Начальные обороты (мин-макс), об/мин:', `${engineParams.initialMinRpm} - ${engineParams.initialMaxRpm}`));
    engineTable.appendChild(createRow('Начальное направление вращения:', engineParams.initialDirection));
    engineTable.appendChild(createRow('Начальная ориентация вала:', engineParams.initialOrientation === 'horizontal' ? 'Горизонтальный' : 'Вертикальный'));
    tablesContainer.appendChild(engineTable);

    // 2. Final Results Table
    if (finalResults) {
        tablesContainer.appendChild(createStyledElement('h2', { fontSize: '18px', marginTop: '20px', borderBottom: '1px solid #ccc', paddingBottom: '5px' }, 'Итоговые параметры'));
        const finalTable = createStyledElement('table', { width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginTop: '10px' }) as HTMLTableElement;
        finalTable.appendChild(createRow('Общее передаточное отношение:', finalResults.totalGearRatio.toFixed(4)));
        finalTable.appendChild(createRow('Общий КПД:', finalResults.totalEfficiency.toFixed(4)));
        finalTable.appendChild(createRow('Выходной момент (Нм):', finalResults.finalTorque.toFixed(2)));
        finalTable.appendChild(createRow('Выходные обороты (мин-макс):', `${finalResults.finalMinRpm.toFixed(0)} - ${finalResults.finalMaxRpm.toFixed(0)}`));
        tablesContainer.appendChild(finalTable);
    }
    
    // 3. Stage Parameters Table
    tablesContainer.appendChild(createStyledElement('h2', { fontSize: '18px', marginTop: '20px', borderBottom: '1px solid #ccc', paddingBottom: '5px' }, 'Параметры по ступеням'));
    const paramsTable = createStyledElement('table', { width: '100%', borderCollapse: 'collapse', fontSize: '8px', marginTop: '10px' }) as HTMLTableElement;
    const thead = document.createElement('thead');
    thead.style.backgroundColor = '#f2f2f2';
    const headerRow = document.createElement('tr');

    const exportableRows = getExportableRows(calculationData);
    const allModules = calculationData.flatMap(s => s.modules);
    const dynamicHeaders = getDynamicHeaders(allModules);
    const staticHeaders = ['Ступень', 'Статус', 'Тип', 'u', 'η'];
    const cascadeHeaders = ['Вх. Момент', 'Вх. об/мин', 'Вых. Момент', 'Вых. об/мин'];
    const allTableHeaders = [...staticHeaders, ...dynamicHeaders, ...cascadeHeaders];
    
    allTableHeaders.forEach(header => headerRow.appendChild(createTableCell(header, true)));
    thead.appendChild(headerRow);
    paramsTable.appendChild(thead);

    const tbody = document.createElement('tbody');
    exportableRows.forEach(row => {
        const tr = document.createElement('tr');
        tr.appendChild(createTableCell(row.stage, false, { textAlign: 'center' }));
        tr.appendChild(createTableCell(row.status));
        tr.appendChild(createTableCell(row.type));
        tr.appendChild(createTableCell(row.u?.toFixed(4) || 'N/A', false, { textAlign: 'right' }));
        tr.appendChild(createTableCell(row.eta || 'N/A', false, { textAlign: 'right' }));

        dynamicHeaders.forEach(headerKey => {
            tr.appendChild(createTableCell(row[headerKey] || '', false, { textAlign: 'right' }));
        });

        tr.appendChild(createTableCell(row.cascadeIn?.torque.toFixed(2) || 'N/A', false, { textAlign: 'right' }));
        tr.appendChild(createTableCell(row.cascadeIn ? `${row.cascadeIn.minRpm.toFixed(0)}-${row.cascadeIn.maxRpm.toFixed(0)}` : 'N/A', false, { textAlign: 'right' }));
        tr.appendChild(createTableCell(row.cascadeOut?.torque.toFixed(2) || 'N/A', false, { textAlign: 'right' }));
        tr.appendChild(createTableCell(row.cascadeOut ? `${row.cascadeOut.minRpm.toFixed(0)}-${row.cascadeOut.maxRpm.toFixed(0)}` : 'N/A', false, { textAlign: 'right' }));
        tbody.appendChild(tr);
    });
    paramsTable.appendChild(tbody);
    tablesContainer.appendChild(paramsTable);

    document.body.appendChild(tablesContainer);

    try {
        const tablesCanvas = await html2canvas(tablesContainer, { scale: 2 });
        const tablesImgData = tablesCanvas.toDataURL('image/png');
        
        const tablesImgWidth = tablesCanvas.width;
        const tablesImgHeight = tablesCanvas.height;
        const tablesRatio = tablesImgHeight / tablesImgWidth;
        
        const contentWidth = pdfWidth;
        const imgHeightOnPdf = contentWidth * tablesRatio;
        
        let heightLeft = imgHeightOnPdf;
        let position = 0;

        if (imgHeightOnPdf > 0) {
            doc.addPage();
            doc.addImage(tablesImgData, 'PNG', 0, position, contentWidth, imgHeightOnPdf);
            heightLeft -= pdfHeight;

            while (heightLeft > 0) {
                position -= pdfHeight;
                doc.addPage();
                doc.addImage(tablesImgData, 'PNG', 0, position, contentWidth, imgHeightOnPdf);
                heightLeft -= pdfHeight;
            }
        }
        
        doc.save(`transmission-report_${getTimestamp()}.pdf`);
    } catch (error) {
        console.error('Ошибка при экспорте в PDF:', error);
        alert('Не удалось экспортировать в PDF. Подробности в консоли.');
    } finally {
        document.body.removeChild(tablesContainer);
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
  onSaveToFile: () => void;
  onLoadFromFileClick: () => void;
  onSaveLocal: (idToUpdate?: string, newName?: string) => Promise<void>;
  onLoadLocal: (id: string) => Promise<void>;
  onDeleteLocal: (id: string) => Promise<void>;
  onNewProject: () => void;
  currentProject: Project | null;
  localProjects: Project[];
  isDirty: boolean;
  context: 'workbench' | 'scheme';
  svgContainerRef?: React.RefObject<HTMLDivElement>;
  schemeElements: SchemeElement[];
  calculationData: StageCalculationData[];
  engineParams: EngineParams;
}

export const ProjectActionsModal: React.FC<ProjectActionsModalProps> = ({ 
    isOpen, onClose, onSaveToFile, onLoadFromFileClick, onSaveLocal, onLoadLocal, onDeleteLocal, onNewProject,
    currentProject, localProjects, isDirty,
    context, svgContainerRef, schemeElements, calculationData, engineParams 
}) => {
  const [activeTab, setActiveTab] = useState('project');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [projectNameInput, setProjectNameInput] = useState('');
  const [renamingState, setRenamingState] = useState<{ id: string; name: string } | null>(null);

  const backdropRef = useRef<HTMLDivElement>(null);
  const mouseDownOnBackdrop = useRef(false);

  const handleBackdropMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === backdropRef.current) {
        mouseDownOnBackdrop.current = true;
    }
  };

  const handleBackdropMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (mouseDownOnBackdrop.current && e.target === backdropRef.current) {
        onClose();
    }
    mouseDownOnBackdrop.current = false;
  };

  useEffect(() => {
    if (isOpen) {
        setProjectNameInput(currentProject?.name || '');
        // Сброс состояния при открытии
        setActiveTab('project');
        setRenamingState(null);
    }
  }, [isOpen, currentProject]);

  if (!isOpen) return null;

  const handleSaveAsNew = () => { onSaveLocal(undefined, projectNameInput); };
  const handleUpdateCurrent = () => { if (currentProject) { onSaveLocal(currentProject.id, projectNameInput); } };

  const handleStartRename = (project: Project) => { setRenamingState({ id: project.id, name: project.name }); };
  const handleCancelRename = () => { setRenamingState(null); };
  const handleConfirmRename = async () => { if (renamingState) { await onSaveLocal(renamingState.id, renamingState.name); setRenamingState(null); } };

  const onExportClick = async (format: 'svg' | 'png' | 'csv' | 'pdf') => {
    setLoadingMessage(`Генерация ${format.toUpperCase()}...`);
    setIsLoading(true);
    
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
                    alert('Экспорт полного PDF-отчета со схемой доступен только со страницы "Сборщик схем".\n\nДля экспорта только расчетных данных используйте формат CSV.');
                    setIsLoading(false);
                    return;
                } else if (svgContainerRef?.current) {
                    await handleExportPDF(svgContainerRef.current, engineParams, effectiveCalculationData, results);
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
  
  const currentProjectName = currentProject ? `"${currentProject.name}"` : 'Текущий проект';

  return (
    <div 
        ref={backdropRef}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm" 
        onMouseDown={handleBackdropMouseDown}
        onMouseUp={handleBackdropMouseUp}
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="project-modal-title"
    >
      <div className="bg-white rounded-lg shadow-xl m-4 max-w-md w-full animate-fade-in flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 id="project-modal-title" className="text-lg font-bold text-gray-800">Проект и Экспорт</h3>
          <button onClick={onClose} className="p-1 rounded-full text-gray-500 hover:bg-gray-200" aria-label="Закрыть"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        <div className="border-b border-gray-200 px-4"><nav className="-mb-px flex space-x-6" aria-label="Tabs" role="tablist"><TabButton tabId="project">Проект</TabButton><TabButton tabId="export">Экспорт и Файлы</TabButton></nav></div>
        
        <div className="p-6 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-8 space-y-3"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div><p className="text-gray-600">{loadingMessage}</p></div>
          ) : (
            <>
              {activeTab === 'project' && (
                <div className='space-y-6'>
                    <div>
                        <Input id="project-name" name="projectName" label="Имя текущего проекта" value={projectNameInput} onChange={e => setProjectNameInput(e.target.value)} placeholder="Например, 'Редуктор лебедки'" />
                         {currentProject && isDirty && (
                            <p className="text-xs text-amber-600 font-semibold text-center mt-2">В проекте {currentProjectName} есть несохраненные изменения.</p>
                        )}
                        <div className="flex flex-col space-y-2 mt-2">
                             {currentProject && (
                                <Button onClick={handleUpdateCurrent} variant="primary" className="w-full" disabled={!isDirty}>Обновить {currentProjectName}</Button>
                            )}
                            <Button onClick={handleSaveAsNew} variant="primary" className="w-full" disabled={!projectNameInput.trim()}>Сохранить как новый проект</Button>
                        </div>
                    </div>

                    <div className="border-t pt-4">
                        <h4 className="font-semibold text-gray-700 mb-2 text-center">Локальные проекты</h4>
                        <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                            {localProjects.length > 0 ? (
                                localProjects.map(proj => (
                                    <div key={proj.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md border">
                                        {renamingState?.id === proj.id ? (
                                            <div className="flex-grow flex items-center space-x-2">
                                                <Input 
                                                    value={renamingState.name}
                                                    onChange={(e) => setRenamingState(prev => prev ? {...prev, name: e.target.value} : null)}
                                                    onKeyDown={(e) => { if(e.key === 'Enter') handleConfirmRename(); if(e.key === 'Escape') handleCancelRename(); }}
                                                    className="!mb-0" inputClassName="!mt-0 !py-1 text-sm"
                                                />
                                                <Button onClick={handleConfirmRename} variant='primary' className='!px-2 !py-1 text-xs'>✓</Button>
                                                <Button onClick={handleCancelRename} variant='secondary' className='!px-2 !py-1 text-xs'>✕</Button>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex-grow">
                                                    <div className="flex items-center space-x-2">
                                                        <p className="font-semibold text-sm text-gray-800">{proj.name}</p>
                                                        <button onClick={() => handleStartRename(proj)} className='p-1 text-gray-400 rounded-full hover:bg-gray-200 hover:text-gray-700 transition-colors' title="Переименовать">
                                                            <EditIcon />
                                                        </button>
                                                    </div>
                                                    <p className="text-xs text-gray-500">
                                                        {new Date(proj.lastModified).toLocaleString()}
                                                    </p>
                                                </div>
                                                <div className="flex items-center space-x-1.5">
                                                    <Button onClick={() => onLoadLocal(proj.id)} variant='secondary' className='!px-3 !py-1 text-xs'>Загрузить</Button>
                                                    <Button onClick={() => onDeleteLocal(proj.id)} variant='danger' className='!px-2 !py-1 text-xs' title="Удалить">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </Button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-sm text-gray-500 py-4">Нет сохраненных проектов.</p>
                            )}
                        </div>
                    </div>
                     <div className="border-t pt-4">
                        <Button onClick={onNewProject} variant="secondary" className="w-full">Создать пустой проект</Button>
                    </div>
                </div>
              )}
              {activeTab === 'export' && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 mb-2 border-b pb-1">Экспорт отчета</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <Button onClick={() => onExportClick('pdf')} variant="secondary" className="w-full">PDF отчет</Button>
                      <Button onClick={() => onExportClick('csv')} variant="secondary" className="w-full">Данные в CSV</Button>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 mb-2 border-b pb-1">Экспорт схемы</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <Button onClick={() => onExportClick('svg')} variant="secondary" className="w-full" disabled={context !== 'scheme'} title={context !== 'scheme' ? 'Экспорт схемы доступен только со страницы Сборщика схем' : ''}>Схема в SVG</Button>
                      <Button onClick={() => onExportClick('png')} variant="secondary" className="w-full" disabled={context !== 'scheme'} title={context !== 'scheme' ? 'Экспорт схемы доступен только со страницы Сборщика схем' : ''}>Схема в PNG</Button>
                    </div>
                  </div>
                   <div>
                    <h4 className="text-sm font-semibold text-gray-500 mb-2 border-b pb-1">Файлы проекта</h4>
                     <div className="flex flex-col space-y-2">
                        <Button onClick={onSaveToFile} variant="secondary" className="w-full">Сохранить в файл .json</Button>
                        <Button onClick={onLoadFromFileClick} variant="secondary" className="w-full">Загрузить из файла .json</Button>
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