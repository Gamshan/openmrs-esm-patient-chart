import React, { useMemo, useState } from 'react';
import { Close } from '@carbon/icons-react';
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
  Button,
} from '@carbon/react';
import { useLayoutType, usePagination, showSnackbar } from '@openmrs/esm-framework';
import { PatientChartPagination } from '@openmrs/esm-patient-common-lib';
import ConfirmCloseModal from './ConfirmCloseModal';
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

  const [rowsData, setRowsData] = useState(tableRows);
  const [sortParams, setSortParams] = useState<{ key: string; sortDirection: 'ASC' | 'DESC' | 'NONE' }>({
    key: '',
    sortDirection: 'NONE',
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rowToDelete, setRowToDelete] = useState<string | null>(null);

  const handleSorting = (_a, _b, { key, sortDirection }) => {
    setSortParams({ key: sortDirection === 'NONE' ? '' : key, sortDirection });
  };

  const confirmClose = () => {
    if (rowToDelete) {
      const updatedRows = rowsData.filter((row) => row.id !== rowToDelete);
      setRowsData(updatedRows);

      showSnackbar({
        kind: 'success',
        title: 'Item closed',
      });

      setRowToDelete(null);
      setIsModalOpen(false);
    }
  };

  const cancelClose = () => {
    setRowToDelete(null);
    setIsModalOpen(false);
  };

  const sortedData = useMemo(() => {
    if (sortParams.sortDirection === 'NONE') return rowsData;
    const header = tableHeaders.find((h) => h.key === sortParams.key);
    if (!header) return rowsData;
    return [...rowsData].sort((a, b) =>
        sortParams.sortDirection === 'DESC' ? header.sortFunc(a, b) : -header.sortFunc(a, b),
    );
  }, [sortParams, rowsData, tableHeaders]);

  const { results: paginatedRows, goTo, currentPage } = usePagination(sortedData, pageSize);

  const getExpandedContent = (rowId: string) => {
    const matched = expandedTableRows.find((row) => row.id === rowId);
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
                      {headers.map((header) => (
                          <TableHeader
                              key={header.key}
                              {...getHeaderProps({
                                header,
                                isSortable: header.isSortable,
                              })}
                          >
                            {header.header?.content ?? header.header}
                          </TableHeader>
                      ))}
                      <TableHeader>Action</TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((row) => (
                        <React.Fragment key={row.id}>
                          <TableExpandRow {...getRowProps({ row })}>
                            {row.cells.map((cell) => (
                                <TableCell key={cell.id}>{cell.value?.content ?? cell.value}</TableCell>
                            ))}
                            <TableCell>
                              <Button
                                  kind="ghost"
                                  size="sm"
                                  hasIconOnly
                                  renderIcon={Close}
                                  iconDescription="Delete"
                                  tooltipAlignment="center"
                                  tooltipPosition="left"
                                  onClick={() => {
                                    setRowToDelete(row.id);
                                    setIsModalOpen(true);
                                  }}
                              />
                            </TableCell>
                          </TableExpandRow>
                          <TableExpandedRow colSpan={headers.length + 2}>
                            <div className={styles.expandedCard}>
                              <div className={styles.expandedItem}>
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
            totalItems={rowsData.length}
            currentItems={paginatedRows.length}
            pageSize={pageSize}
            onPageNumberChange={({ page }) => goTo(page)}
            dashboardLinkUrl={pageUrl}
            dashboardLinkLabel={urlLabel}
        />

        <ConfirmCloseModal
            open={isModalOpen}
            onCancel={cancelClose}
            onConfirm={confirmClose}
        />
      </>
  );
};

export default PaginatedDigipaths;
