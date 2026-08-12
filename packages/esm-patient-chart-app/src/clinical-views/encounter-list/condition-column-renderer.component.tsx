import React from 'react';
import { useCondition } from '../hooks/useCondition';
import { extractConditionField } from './extractConditionField';

interface ConditionColumnRendererProps {
  patientUuid: string;
  conditionCode: string;
  field: string;
}

const ConditionColumnRenderer: React.FC<ConditionColumnRendererProps> = ({ patientUuid, conditionCode, field }) => {
  const { condition, isLoading } = useCondition(patientUuid, conditionCode);

  if (isLoading) {
    return <span>...</span>;
  }

  return <span>{extractConditionField(condition, field)}</span>;
};

export default ConditionColumnRenderer;
