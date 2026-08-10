import type React from 'react';
import { useEffect } from 'react';
import { attach, detach } from '@openmrs/esm-framework';
import { useHasAnyCondition } from './hooks/useCondition';

const CLINICAL_VIEW_CONDITION_UUIDS = [
  '119481AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', // Diabetes mellitus
  '117399AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', // Hypertension
];

function getPatientUuidFromUrl(): string | undefined {
  const match = window.location.pathname.match(/\/patient\/([a-f0-9-]+)\/chart/);
  return match ? match[1] : undefined;
}

interface ClinicalViewsNavGroupProps {
  patientUuid?: string;
}

const ClinicalViewsNavGroup: React.FC<ClinicalViewsNavGroupProps> = (props) => {
  const patientUuid = props.patientUuid ?? getPatientUuidFromUrl();
  const { hasCondition, isLoading } = useHasAnyCondition(patientUuid, CLINICAL_VIEW_CONDITION_UUIDS);

  useEffect(() => {
    if (isLoading) return;

    if (hasCondition) {
      attach('patient-chart-dashboard-slot', 'nav-group#ClinicalViews');
    } else {
      detach('patient-chart-dashboard-slot', 'nav-group#ClinicalViews');
    }

    return () => {
      detach('patient-chart-dashboard-slot', 'nav-group#ClinicalViews');
    };
  }, [hasCondition, isLoading]);

  return null;
};

export default ClinicalViewsNavGroup;
