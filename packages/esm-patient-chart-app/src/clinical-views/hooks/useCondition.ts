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
  return { condition, isLoading, error };
}

export function useHasAnyCondition(
  patientUuid: string,
  conceptUuids: Array<string>,
  swrOptions?: { refreshInterval?: number },
) {
  const url = patientUuid ? `/ws/fhir2/R4/Condition?patient=${patientUuid}&clinical-status=active` : null;

  const { data, error, isLoading } = useSWR<{ data: FHIRConditionBundle }>(url, openmrsFetch, {
    refreshInterval: swrOptions?.refreshInterval ?? 0,
    revalidateOnFocus: true, // re-fetch when user comes back to the tab
    revalidateOnReconnect: true,
  });

  const activeCodes: string[] =
    data?.data?.entry?.flatMap((entry) => entry.resource?.code?.coding?.map((c) => c.code) ?? []) ?? [];

  const hasCondition = activeCodes.some((code) => conceptUuids.includes(code));

  return { hasCondition, isLoading, error };
}
