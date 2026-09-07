import { restBaseUrl, openmrsFetch, fhirBaseUrl } from '@openmrs/esm-framework';
import useSWR, { type KeyedMutator } from 'swr';

export async function getCondition(patientUuid: string, code: string) {
  const conditionsUrl = `${fhirBaseUrl}/Condition?patient=${patientUuid}&code=${code}&clinical-status=active`;
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const response = await openmrsFetch(conditionsUrl);

  const data = await response.json();

  return data;
}

export async function getObs(patientUuid: string, code: string) {
  const url =
    `${fhirBaseUrl}/Observation?patient=${patientUuid}` + `&code=5085AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA` + `&_sort=-date`;

  const response = await openmrsFetch(url);

  const data = await response.json();

  return data;
}
