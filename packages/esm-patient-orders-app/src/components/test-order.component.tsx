import React, { useMemo } from 'react';
import {
  DataTable,
  DataTableSkeleton,
  SkeletonText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from '@carbon/react';
import { useTranslation } from 'react-i18next';
import { useLayoutType } from '@openmrs/esm-framework';
import { type Order } from '@openmrs/esm-patient-common-lib';
import { useLabEncounter, useOrderConceptByUuid } from '../lab-results/lab-results.resource';
import { getObservationDisplayValue } from '../utils';
import styles from './test-order.scss';

interface TestOrderProps {
  testOrder: Order;
}

const TestOrder: React.FC<TestOrderProps> = ({ testOrder }) => {
  const { t } = useTranslation();
  const isTablet = useLayoutType() === 'tablet';
  const { concept, isLoading: isLoadingTestConcepts } = useOrderConceptByUuid(testOrder.concept.uuid);
  const { encounter, isLoading: isLoadingResult } = useLabEncounter(testOrder.encounter.uuid);

  const tableHeaders: Array<{ key: string; header: string }> = [
    {
      key: 'testType',
      header: testOrder.orderType.display,
    },
    {
      key: 'result',
      header: t('result', 'Result'),
    },
    {
      key: 'normalRange',
      header: t('normalRange', 'Normal range'),
    },
  ];

  const testResultObs = useMemo(() => {
    if (encounter && concept) {
      return encounter.obs?.find((obs) => obs.concept.uuid === concept.uuid);
    }
  }, [concept, encounter]);

  const testRows = useMemo(() => {
    if (concept && concept.setMembers.length > 0) {
      return concept?.setMembers.map((memberConcept) => ({
        id: memberConcept.uuid,
        testType: <div className={styles.testType}>{memberConcept.display}</div>,
        result: isLoadingResult ? (
          <SkeletonText />
        ) : (
          getObservationDisplayValue(
            testResultObs?.groupMembers?.find((obs) => obs.concept.uuid === memberConcept.uuid)?.value,
          )
        ),
        normalRange:
          memberConcept.hiNormal && memberConcept.lowNormal
            ? `${memberConcept.lowNormal} - ${memberConcept.hiNormal}`
            : 'N/A',
      }));
    } else if (concept && concept.setMembers.length === 0) {
      return [
        {
          id: concept.uuid,
          testType: <div className={styles.testType}>{concept.display}</div>,
          result: isLoadingResult ? <SkeletonText /> : getObservationDisplayValue(testResultObs?.value),
          normalRange: concept.hiNormal && concept.lowNormal ? `${concept.lowNormal} - ${concept.hiNormal}` : 'N/A',
        },
      ];
    } else {
      return [];
    }
  }, [concept, isLoadingResult, testResultObs?.groupMembers, testResultObs?.value]);

  return (
    <div className={styles.testOrder}>
      {isLoadingTestConcepts ? (
        <DataTableSkeleton role="progressbar" compact={isTablet} zebra />
      ) : (
        <DataTable rows={testRows} headers={tableHeaders} size={isTablet ? 'lg' : 'sm'} useZebraStyles>
          {({ rows, headers, getHeaderProps, getRowProps, getTableProps, getTableContainerProps }) => (
            <TableContainer {...getTableContainerProps()}>
              <Table {...getTableProps()} aria-label="testorders">
                <TableHead>
                  <TableRow>
                    {headers.map((header) => (
                      <TableHeader {...getHeaderProps({ header })}>{header.header}</TableHeader>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow {...getRowProps({ row })}>
                      {row.cells.map((cell) => (
                        <TableCell key={cell.id} className={styles.testCell}>
                          {cell.value}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DataTable>
      )}
    </div>
  );
};

export default TestOrder;
