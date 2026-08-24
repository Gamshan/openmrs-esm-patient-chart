import { useEffect, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
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

interface FHIRConditionEntry {
  resource: FHIRCondition;
}

interface FHIRConditionBundle {
  entry?: Array<FHIRConditionEntry>;
}

export function useCondition(patientUuid: string, conditionCode: string) {
  const url =
    patientUuid && conditionCode ? `/ws/fhir2/R4/Condition?patient=${patientUuid}&code=${conditionCode}` : null;

  const { data, error, isLoading } = useSWR<{ data: FHIRConditionBundle }>(url, openmrsFetch);
  const condition = data?.data?.entry?.[0]?.resource ?? null;
  return { condition, isLoading, error };
}

function isEntryActive(entry: FHIRConditionEntry): boolean {
  const statusCodes = entry.resource?.clinicalStatus?.coding?.map((c) => c.code) ?? [];
  return statusCodes.includes('active');
}

function activeCodesFromBundle(bundle: FHIRConditionBundle | null): string[] {
  return (
    bundle?.entry?.filter(isEntryActive).flatMap((entry) => entry.resource?.code?.coding?.map((c) => c.code) ?? []) ??
    []
  );
}

type Listener = (bundle: FHIRConditionBundle) => void;
const listeners: Record<string, Set<Listener>> = {};

function notify(patientUuid: string, bundle: FHIRConditionBundle) {
  listeners[patientUuid]?.forEach((fn) => fn(bundle));
}

function subscribe(patientUuid: string, fn: Listener) {
  if (!listeners[patientUuid]) listeners[patientUuid] = new Set();
  listeners[patientUuid].add(fn);
  return () => listeners[patientUuid]?.delete(fn);
}

function parseConditionListUrl(rawUrl: string): { patientUuid: string } | null {
  try {
    const u = new URL(rawUrl, window.location.origin);
    if (!u.pathname.includes('/Condition')) return null;
    const patientUuid = u.searchParams.get('patient');
    if (!patientUuid || u.searchParams.has('code')) return null;
    return { patientUuid };
  } catch {
    return null;
  }
}

function isEncounterSaveUrl(rawUrl: string, method: string): boolean {
  if (method !== 'POST' && method !== 'PUT') return false;
  try {
    const u = new URL(rawUrl, window.location.origin);
    return /\/encounter(\/|$|\?)/.test(u.pathname);
  } catch {
    return false;
  }
}

function isFormEngineObs(o: any): boolean {
  return typeof o?.formFieldNamespace === 'string' && o.formFieldNamespace.length > 0;
}

function obsContainsClinicalViewCondition(obsList: any[], conceptUuids: string[]): boolean {
  return (obsList ?? []).some((o) => {
    const val = typeof o?.value === 'string' ? o.value : o?.value?.uuid;
    if (isFormEngineObs(o) && val && conceptUuids.includes(val)) return true;
    return Array.isArray(o?.groupMembers) ? obsContainsClinicalViewCondition(o.groupMembers, conceptUuids) : false;
  });
}

let sharedSwrMutate: ReturnType<typeof useSWRConfig>['mutate'] | null = null;

function refreshSharedConditionsCache(patientUuid: string) {
  sharedSwrMutate?.((key) => typeof key === 'string' && key.includes(`/Condition?patient=${patientUuid}`));
}

let interceptorInstalled = false;
const watchedConceptUuidSet = new Set<string>();

function installInterceptor(watchedConceptUuids: string[] = []) {
  watchedConceptUuids.forEach((uuid) => watchedConceptUuidSet.add(uuid));

  if (interceptorInstalled) return;
  interceptorInstalled = true;
  const originalFetch = window.fetch;
  window.fetch = async function (...args: Parameters<typeof fetch>) {
    const input = args[0];
    const method = (args[1]?.method ?? 'GET').toUpperCase();
    const url = typeof input === 'string' ? input : (input as Request).url ?? '';
    const response = await originalFetch.apply(this, args);

    const parsed = parseConditionListUrl(url);
    if (parsed) {
      response
        .clone()
        .json()
        .then((body: FHIRConditionBundle) => notify(parsed.patientUuid, body))
        .catch(() => {});
    }

    if (isEncounterSaveUrl(url, method) && response.ok) {
      try {
        const rawText = await response.text();
        let body: any = null;
        try {
          body = JSON.parse(rawText);
        } catch {
          // not JSON, ignore
        }

        if (body) {
          const patientUuid = typeof body?.patient === 'string' ? body.patient : body?.patient?.uuid;

          if (patientUuid) {
            const matched = obsContainsClinicalViewCondition(body?.obs, Array.from(watchedConceptUuidSet));

            if (matched) {
              openmrsFetch(`/ws/fhir2/R4/Condition?patient=${patientUuid}`)
                .then(({ data }) => {
                  notify(patientUuid, data);
                })
                .catch(() => {});
              refreshSharedConditionsCache(patientUuid);
            }
          }
        }

        return new Response(rawText, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        });
      } catch (err) {
        return response;
      }
    }

    return response;
  };
}

export function useHasAnyCondition(patientUuid: string, conceptUuids: Array<string>) {
  installInterceptor(conceptUuids);

  const { mutate: swrMutate } = useSWRConfig();
  useEffect(() => {
    sharedSwrMutate = swrMutate;
  }, [swrMutate]);

  const [bundle, setBundle] = useState<FHIRConditionBundle | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!patientUuid) return;
    let cancelled = false;

    const unsubscribe = subscribe(patientUuid, (freshBundle) => {
      if (!cancelled) {
        setBundle(freshBundle);
        setIsLoading(false);
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [patientUuid]);

  const activeCodes = activeCodesFromBundle(bundle);
  const hasCondition = activeCodes.some((code) => conceptUuids.includes(code));

  return { hasCondition, isLoading, error: null };
}
