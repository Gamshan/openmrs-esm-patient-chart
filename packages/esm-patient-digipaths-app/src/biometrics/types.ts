import { type Digipaths } from '../common/types';

export interface DigipathsTableHeader {
  key: 'dateRender' | 'actionRender' | 'titleRender';
  header: string;
  isSortable?: boolean;
  sortFunc: (valueA: DigipathsTableRow, valueB: DigipathsTableRow) => number;
}

export interface DigipathsTableRow extends Digipaths {
  id: string;
  dateRender: string;
  actionRender: string | number;
  titleRender: string;
}
