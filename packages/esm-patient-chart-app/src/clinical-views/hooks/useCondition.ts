import { useEffect, useState } from 'react';
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

let interceptorInstalled = false;

function installInterceptor() {
  if (interceptorInstalled) return;
  interceptorInstalled = true;
  const originalFetch = window.fetch;
  window.fetch = async function (...args: Parameters<typeof fetch>) {
    const input = args[0];
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

    return response;
  };
}

export function useHasAnyCondition(patientUuid: string, conceptUuids: Array<string>) {
  installInterceptor();
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
