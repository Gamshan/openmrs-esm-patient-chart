import { type Digipaths } from '../common/types';

export interface DigipathsTableHeader {
  key: 'dateRender' | 'messageRender' | 'titleRender' | 'recommendationRender';
  header: string;
  isSortable?: boolean;
  sortFunc: (valueA: DigipathsTableRow, valueB: DigipathsTableRow) => number;
}

export interface DigipathsTableRow extends Digipaths {
  id: string;
  dateRender: string;
  messageRender: string;
  titleRender: string;
  recommendationRender: string;
}
