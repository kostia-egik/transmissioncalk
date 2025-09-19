
import React from 'react';
import { EngineParams, RotationDirection } from '../../types';
import Input from '../Input';
import Select from '../Select';
import Button from '../Button';

interface EngineParamsEditorProps {
  id?: string;
  engineParams: EngineParams;
  handleParamChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  resetEngineParams: () => void;
  rotationIconPath: string;
  rotationIconAltText: string;
  errors: Record<string, string>;
}

export const EngineParamsEditor: React.FC<EngineParamsEditorProps> = ({
  id,
  engineParams,
  handleParamChange,
  resetEngineParams,
  rotationIconPath,
  rotationIconAltText,
  errors,
}) => (
    <div id={id} className="bg-white p-4 sm:p-6 rounded-lg shadow-xl shadow-slate-900/60">
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
            <Button onClick={resetEngineParams} 
            variant="secondary" 
            className="text-sm px-3 py-1 shadow-md shadow-slate-900/40">
            Сбросить
            </Button>
        </div>
    </div>
);
