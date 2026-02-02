import { restBaseUrl, openmrsFetch, useConfig } from '@openmrs/esm-framework';
import useSWR, { type KeyedMutator } from 'swr';

export function useDigipathData(patientUuid) {
  const apiUrl = `${restBaseUrl}/digipath-connector/get-recommendations?patientUuid=${patientUuid}`;

  const { data, error, isLoading } = useSWR(apiUrl, openmrsFetch);

  // @ts-ignore
  return { data: data?.data ? [...data?.data] : [], error, isLoading };
}
