import { useState } from 'react';
import type { DigipathsTableRow } from './types';

let mockData: DigipathsTableRow[] = [
  {
    id: '1',
    date: '2024-06-25 10:00:00',
    title: 'Hba1c overdue',
    description: 'Patient Hba1c test result is 8 months old.',
    details: 'Last test taken in Oct 2023.',
  },
  {
    id: '2',
    date: '2024-06-24 11:45:00',
    title: 'BP monitoring',
    description: 'Patient has high BP readings.',
    details: '3 readings above 140/90 in last 2 weeks.',
  },
  {
    id: '3',
    date: '2024-06-23 09:15:00',
    title: 'Cholesterol check',
    description: 'Cholesterol test needed based on risk factors.',
    details: 'No cholesterol test done in past 12 months.',
  },
  {
    id: '4',
    date: '2024-06-22 14:30:00',
    title: 'Diabetic foot exam',
    description: 'Annual foot exam due for diabetic patient.',
    details: 'Last exam performed in May 2023.',
  },
  {
    id: '5',
    date: '2024-06-21 16:20:00',
    title: 'Retinopathy screening',
    description: 'Eye screening overdue for diabetic retinopathy.',
    details: 'Patient last screened in Jan 2023.',
  },
];

export function useDigipathData(patientUuid: string): {
  data: DigipathsTableRow[];
  error: null;
  isLoading: boolean;
} {
  return {
    data: mockData,
    error: null,
    isLoading: false,
  };
}

// export function deleteDigipath(id: string): Promise<void> {
//   return new Promise((resolve) => {
//     mockData = mockData.filter(item => item.id !== id);
//     resolve();
//   });
// }
