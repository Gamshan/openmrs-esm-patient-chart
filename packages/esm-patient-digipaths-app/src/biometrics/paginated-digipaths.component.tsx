import React, { useMemo, useState } from 'react';
import {
  DataTable,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
  TableExpandRow,
  TableExpandedRow,
  TableExpandHeader,
} from '@carbon/react';
import { useLayoutType, usePagination } from '@openmrs/esm-framework';
import { PatientChartPagination } from '@openmrs/esm-patient-common-lib';
import styles from './paginated-digipaths.scss';
import type { DigipathsTableHeader, DigipathsTableRow } from './types';

interface PaginatedDigipathsProps {
  tableRows: Array<DigipathsTableRow>;
  pageSize: number;
  pageUrl: string;
  urlLabel: string;
  tableHeaders: Array<DigipathsTableHeader>;
}

const PaginatedDigipaths: React.FC<PaginatedDigipathsProps> = ({
  tableRows,
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

  const sortedData = useMemo(() => {
    if (sortParams.sortDirection === 'NONE' || !sortParams.key) return tableRows;

    const header = tableHeaders.find((h) => h.key === sortParams.key);
    if (!header) return tableRows;

    return [...tableRows].sort((a, b) => {
      const sortResult = header.sortFunc(a, b);
      return sortParams.sortDirection === 'DESC' ? sortResult : -sortResult;
    });
  }, [tableRows, tableHeaders, sortParams]);

  const { results: paginatedBiometrics, goTo, currentPage } = usePagination(sortedData, pageSize);

  const onHeaderClick = (headerKey: string) => {
    setSortParams((prev) => {
      if (prev.key === headerKey) {
        if (prev.sortDirection === 'ASC') return { key: headerKey, sortDirection: 'DESC' };
        if (prev.sortDirection === 'DESC') return { key: '', sortDirection: 'NONE' };
      }
      return { key: headerKey, sortDirection: 'ASC' };
    });
  };

  return (
    <>
      <DataTable headers={tableHeaders} rows={paginatedBiometrics} size={isTablet ? 'lg' : 'sm'} useZebraStyles>
        {({ rows, headers, getHeaderProps, getRowProps, getTableProps }) => (
          <TableContainer className={styles.tableContainer}>
            <Table {...getTableProps()} className={styles.table}>
              <TableHead>
                <TableRow>
                  <TableExpandHeader />
                  {headers
                    .filter((header) => header.key !== 'recommendationRender')
                    .map((header) => (
                      <TableHeader
                        key={header.key}
                        {...getHeaderProps({ header })}
                        onClick={() => onHeaderClick(header.key)}
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                      >
                        {header.header}
                        {sortParams.key === header.key && sortParams.sortDirection !== 'NONE' && (
                          <span>{sortParams.sortDirection === 'ASC' ? ' 🔼' : ' 🔽'}</span>
                        )}
                      </TableHeader>
                    ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => (
                  <React.Fragment key={row.id}>
                    <TableExpandRow {...getRowProps({ row })}>
                      {row.cells
                        .filter((cell, index) => headers[index]?.key !== 'recommendationRender')
                        .map((cell) => (
                          <TableCell key={cell.id}>{cell.value?.content ?? cell.value ?? 'N/A'}</TableCell>
                        ))}
                    </TableExpandRow>
                    <TableExpandedRow colSpan={headers.length + 1}>
                      <div style={{ padding: '0.5rem 1rem', backgroundColor: '#f4f4f4' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>Recommendation:</div>
                        {(() => {
                          const recommendationIndex = headers.findIndex((h) => h.key === 'recommendationRender');
                          const recCell = row.cells[recommendationIndex];
                          return recCell ? <div dangerouslySetInnerHTML={{ __html: recCell.value ?? 'N/A' }} /> : 'N/A';
                        })()}
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
        currentItems={paginatedBiometrics.length}
        pageSize={pageSize}
        onPageNumberChange={({ page }) => goTo(page)}
        dashboardLinkUrl={pageUrl}
        dashboardLinkLabel={urlLabel}
      />
    </>
  );
};

export default PaginatedDigipaths;
