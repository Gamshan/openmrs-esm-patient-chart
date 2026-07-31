import { type Digipaths } from '../common/types';

export interface DigipathsTableHeader {
  key: 'dateRender' | 'recommendationRender' | 'messageRender';
  header: string;
  isSortable?: boolean;
  sortFunc: (valueA: DigipathsTableRow, valueB: DigipathsTableRow) => number;
}

export interface DigipathsTableRow extends Digipaths {
  id: string;
  dateRender: string;
  recommendationRender: string | number;
  messageRender: string;
}
