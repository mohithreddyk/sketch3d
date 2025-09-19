
import React from 'react';
import type { PipelineStatus } from '../types';
import { PipelineStage } from '../types';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { LoaderIcon } from './icons/LoaderIcon';
import { CircleIcon } from './icons/CircleIcon';

interface PipelineStatusDisplayProps {
  status: PipelineStatus;
}

const STAGES_ORDER = [
  PipelineStage.SKETCH_PREP,
  PipelineStage.MESH_PREP,
  PipelineStage.PAIRING,
  PipelineStage.TRAINING,
  PipelineStage.OUTPUT,
];

export const PipelineStatusDisplay: React.FC<PipelineStatusDisplayProps> = ({ status }) => {
  const { currentStage, completedStages } = status;

  const getStageStatus = (stage: PipelineStage) => {
    if (completedStages.has(stage)) {
      return 'completed';
    }
    if (currentStage === stage) {
      return 'in_progress';
    }
    return 'pending';
  };

  const getIcon = (stageStatus: 'completed' | 'in_progress' | 'pending') => {
    switch (stageStatus) {
      case 'completed':
        return <CheckCircleIcon className="w-5 h-5 text-green-400" />;
      case 'in_progress':
        return <LoaderIcon className="w-5 h-5 text-brand-primary animate-spin" />;
      case 'pending':
        return <CircleIcon className="w-5 h-5 text-gray-500" />;
    }
  };
  
  const getTextColor = (stageStatus: 'completed' | 'in_progress' | 'pending') => {
    switch (stageStatus) {
      case 'completed':
        return 'text-green-400';
      case 'in_progress':
        return 'text-brand-primary';
      case 'pending':
        return 'text-gray-400';
    }
  };

  return (
    <div className="p-4 bg-base-100 rounded-lg border border-base-300">
      <ul className="space-y-3">
        {STAGES_ORDER.map(stage => {
          const stageStatus = getStageStatus(stage);
          return (
            <li key={stage} className={`flex items-center text-sm font-medium transition-colors duration-300 ${getTextColor(stageStatus)}`}>
              {getIcon(stageStatus)}
              <span className="ml-3">{stage}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
