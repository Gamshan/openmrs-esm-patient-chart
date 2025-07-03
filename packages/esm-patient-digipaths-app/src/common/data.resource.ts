import { restBaseUrl, openmrsFetch, useConfig } from '@openmrs/esm-framework';
import useSWR, { type KeyedMutator } from 'swr';

export function useDigipathData(patientUuid) {
  const apiUrl = `${restBaseUrl}/digipaths/list?patientUuid=${patientUuid}`;

  const { data, error, isLoading } = useSWR(apiUrl, openmrsFetch);

  // @ts-ignore
  return { data: data?.data ? [...data?.data] : [], error, isLoading };
}
