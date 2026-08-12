import { type FHIRCondition } from '../hooks/useCondition';
export function extractConditionField(condition: FHIRCondition | null, field: string): string {
  if (!condition) {
    return '—';
  }

  switch (field) {
    case 'code':
      return condition.code?.text ?? condition.code?.coding?.[0]?.display ?? '—';
    case 'clinicalStatus':
      return condition.clinicalStatus?.coding?.[0]?.display ?? condition.clinicalStatus?.coding?.[0]?.code ?? '—';
    case 'verificationStatus':
      return (
        condition.verificationStatus?.coding?.[0]?.display ?? condition.verificationStatus?.coding?.[0]?.code ?? '—'
      );
    case 'onsetDateTime':
      return condition.onsetDateTime ?? '—';
    case 'recordedDate':
      return condition.recordedDate ?? '—';
    default:
      return '—';
  }
}
