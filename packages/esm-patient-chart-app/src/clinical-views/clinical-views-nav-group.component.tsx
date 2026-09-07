import type React from 'react';
import { useEffect } from 'react';
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

function setClinicalViewsVisibility(visible: boolean) {
  // Find all li.cds--accordion__item that contain 'Clinical Views' text
  const allAccordionItems = document.querySelectorAll('li.cds--accordion__item');
  allAccordionItems.forEach((el: Element) => {
    const button = el.querySelector('button');
    if (button?.textContent?.trim() === 'Clinical Views') {
      (el as HTMLElement).style.display = visible ? '' : 'none';
    }
  });
}

const ClinicalViewsNavGroup: React.FC<ClinicalViewsNavGroupProps> = (props) => {
  const patientUuid = props.patientUuid ?? getPatientUuidFromUrl();
  // const { hasCondition, isLoading } = useHasAnyCondition(patientUuid, CLINICAL_VIEW_CONDITION_UUIDS, {
  //   refreshInterval: 10000,
  // });
  //
  // useEffect(() => {
  //   if (isLoading) return;
  //
  //   setClinicalViewsVisibility(hasCondition);
  //
  //   const timer = setTimeout(() => {
  //     setClinicalViewsVisibility(hasCondition);
  //   }, 1000);
  //
  //   return () => clearTimeout(timer);
  // }, [hasCondition, isLoading]);

  return null;
};

export default ClinicalViewsNavGroup;
