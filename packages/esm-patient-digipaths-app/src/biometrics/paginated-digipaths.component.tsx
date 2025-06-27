import React, { useMemo, useState } from 'react';
import {
  DataTable,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableExpandedRow,
  TableExpandHeader,
  TableExpandRow,
  TableHead,
  TableHeader,
  TableRow,
} from '@carbon/react';
import { useLayoutType, usePagination } from '@openmrs/esm-framework';
import { PatientChartPagination } from '@openmrs/esm-patient-common-lib';
import styles from './paginated-digipaths.scss';
import type { DigipathsTableHeader, DigipathsTableRow, DigipathsExpandedTableRow } from './types';

interface PaginatedDigipathsProps {
  tableRows: DigipathsTableRow[];
  expandedTableRows: DigipathsExpandedTableRow[];
  pageSize: number;
  pageUrl: string;
  urlLabel: string;
  tableHeaders: DigipathsTableHeader[];
}

const PaginatedDigipaths: React.FC<PaginatedDigipathsProps> = ({
                                                                 tableRows,
                                                                 expandedTableRows,
                                                                 pageSize,
                                                                 pageUrl,
                                                                 urlLabel,
                                                                 tableHeaders,
                                                               }) => {
  const isTablet = useLayoutType() === 'tablet';

  const [sortParams, setSortParams] = useState<{ key: string; sortDirection: 'ASC' | 'DESC' | 'NONE' }>({
    key: '',
    sortDirection: 'NONE',
  });

  const handleSorting = (_a, _b, { key, sortDirection }) => {
    setSortParams({ key: sortDirection === 'NONE' ? '' : key, sortDirection });
  };

  const sortedData = useMemo(() => {
    if (sortParams.sortDirection === 'NONE') return tableRows;
    const header = tableHeaders.find((h) => h.key === sortParams.key);
    if (!header) return tableRows;
    return [...tableRows].sort((a, b) =>
      sortParams.sortDirection === 'DESC' ? header.sortFunc(a, b) : -header.sortFunc(a, b),
    );
  }, [sortParams, tableRows, tableHeaders]);

  const { results: paginatedRows, goTo, currentPage } = usePagination(sortedData, pageSize);

  const getExpandedContent = (rowId: string) => {
    const matched = expandedTableRows.find(row => row.id === rowId);
    return matched?.descriptionRender || 'No additional details available';
  };

  return (
    <>
      <DataTable
        rows={paginatedRows}
        headers={tableHeaders}
        size={isTablet ? 'lg' : 'sm'}
        useZebraStyles
        sortRow={handleSorting}
        isSortable
      >
        {({ rows, headers, getHeaderProps, getRowProps, getTableProps }) => (
          <TableContainer className={styles.tableContainer}>
            <Table {...getTableProps()} className={styles.table}>
              <TableHead>
                <TableRow>
                  <TableExpandHeader />
                  {headers.map(header => (
                    <TableHeader key={header.key} {...getHeaderProps({ header, isSortable: header.isSortable })}>
                      {header.header?.content ?? header.header}
                    </TableHeader>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map(row => (
                  <React.Fragment key={row.id}>
                    <TableExpandRow {...getRowProps({ row })}>
                      {row.cells.map(cell => (
                        <TableCell key={cell.id}>{cell.value?.content ?? cell.value}</TableCell>
                      ))}
                    </TableExpandRow>
                    <TableExpandedRow colSpan={headers.length + 1}>
                      <div className={styles.expandedCard}>
                        <div className="expandedItem">
                          <strong>Description:</strong>
                          <div>{getExpandedContent(row.id)}</div>
                        </div>
                      </div>
                    </TableExpandedRow>
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DataTable>

      <PatientChartPagination
        pageNumber={currentPage}
        totalItems={tableRows.length}
        currentItems={paginatedRows.length}
        pageSize={pageSize}
        onPageNumberChange={({ page }) => goTo(page)}
        dashboardLinkUrl={pageUrl}
        dashboardLinkLabel={urlLabel}
      />
    </>
  );
};

export default PaginatedDigipaths;
