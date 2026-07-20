import useSWR from 'swr';
import { openmrsFetch } from '@openmrs/esm-framework';

interface FHIRCoding {
  code: string;
  display?: string;
}

export interface FHIRCondition {
  id: string;
  code?: { coding: Array<FHIRCoding>; text?: string };
  clinicalStatus?: { coding: Array<FHIRCoding> };
  verificationStatus?: { coding: Array<FHIRCoding> };
  onsetDateTime?: string;
  recordedDate?: string;
}
interface FHIRConditionBundle {
  entry?: Array<{ resource: FHIRCondition }>;
}

export function useCondition(patientUuid: string, conditionCode: string) {
  const url =
    patientUuid && conditionCode ? `/ws/fhir2/R4/Condition?patient=${patientUuid}&code=${conditionCode}` : null;

  const { data, error, isLoading } = useSWR<{ data: FHIRConditionBundle }>(url, openmrsFetch);

  const condition = data?.data?.entry?.[0]?.resource ?? null;

  return {
    condition,
    isLoading,
    error,
  };
}
