import { type PatientVitalsAndBiometrics } from '../common';

export interface BiometricsTableRow extends PatientVitalsAndBiometrics {
  id: string;
  dateRender: string;
  weightRender: string | number;
  heightRender: string | number;
  bmiRender: string | number;
  muacRender: string | number;
}

export interface BiometricsTableHeader {
  key: 'dateRender' | 'weightRender' | 'heightRender' | 'bmiRender' | 'muacRender';
  header: string;
  isSortable?: boolean;
  sortFunc: (valueA: BiometricsTableRow, valueB: BiometricsTableRow) => number;
}

export interface DigipathsTableHeader {
  key: 'dateRender' | 'actionRender' | 'dueDateRender';
  header: string;
  isSortable?: boolean;
  sortFunc: (valueA: DigipathsTableRow, valueB: DigipathsTableRow) => number;
}

export interface DigipathsTableRow extends PatientVitalsAndBiometrics {
  id: string;
  dateRender: string;
  actionRender: string | number;
  dueDateRender: string | number;
}
