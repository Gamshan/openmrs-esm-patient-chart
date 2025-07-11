import React, { type ComponentProps, useCallback, useMemo } from 'react';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import {
  Button,
  DataTable,
  DataTableSkeleton,
  InlineLoading,
  InlineNotification,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from '@carbon/react';
import {
  AddIcon,
  type ConfigObject,
  formatDate,
  formatDatetime,
  useConfig,
  useLayoutType,
  isDesktop as desktopLayout,
  launchWorkspace,
} from '@openmrs/esm-framework';
import { CardHeader, EmptyState, ErrorState } from '@openmrs/esm-patient-common-lib';
import { findLastState, usePrograms } from './programs.resource';
import { ProgramsActionMenu } from './programs-action-menu.component';
import styles from './programs-detailed-summary.scss';

interface ProgramsDetailedSummaryProps {
  patientUuid: string;
}

const ProgramsDetailedSummary: React.FC<ProgramsDetailedSummaryProps> = ({ patientUuid }) => {
  const { t } = useTranslation();
  const { hideAddProgramButton, showProgramStatusField } = useConfig<ConfigObject>();
  const layout = useLayoutType();
  const isTablet = layout === 'tablet';
  const isDesktop = desktopLayout(layout);
  const displayText = t('programEnrollments', 'Program enrollments');
  const headerTitle = t('carePrograms', 'Care Programs');

  const { enrollments, isLoading, error, isValidating, availablePrograms } = usePrograms(patientUuid);

  const tableHeaders = useMemo(() => {
    const headers = [
      {
        key: 'display',
        header: t('activePrograms', 'Active programs'),
      },
      {
        key: 'location',
        header: t('location', 'Location'),
      },
      {
        key: 'dateEnrolled',
        header: t('dateEnrolled', 'Date enrolled'),
      },
      {
        key: 'status',
        header: t('status', 'Status'),
      },
    ];
    if (showProgramStatusField) {
      headers.push({
        key: 'state',
        header: t('programStatus', 'Program status'),
      });
    }
    return headers;
  }, [t, showProgramStatusField]);

  const tableRows = useMemo(
    () =>
      enrollments?.map((program) => {
        const state = program ? findLastState(program.states) : null;
        return {
          id: program.uuid,
          display: program.display,
          location: program.location?.display ?? '--',
          dateEnrolled: formatDatetime(new Date(program.dateEnrolled)),
          status: program.dateCompleted
            ? `${t('completedOn', 'Completed On')} ${formatDate(new Date(program.dateCompleted))}`
            : t('active', 'Active'),
          state: state ? state.state.concept.display : '--',
        };
      }),
    [enrollments, t],
  );

  const launchProgramsForm = useCallback(() => launchWorkspace('programs-form-workspace'), []);

  const isEnrolledInAllPrograms = useMemo(() => {
    if (!availablePrograms?.length || !enrollments?.length) {
      return false;
    }

    const activeEnrollments = enrollments.filter((enrollment) => !enrollment.dateCompleted);
    return activeEnrollments.length === availablePrograms.length;
  }, [availablePrograms, enrollments]);

  if (isLoading) {
    return <DataTableSkeleton role="progressbar" compact={isDesktop} zebra />;
  }

  if (error) {
    return <ErrorState error={error} headerTitle={headerTitle} />;
  }

  if (enrollments?.length) {
    return (
      <div className={styles.widgetCard}>
        <CardHeader title={headerTitle}>
          <span>{isValidating ? <InlineLoading /> : null}</span>
          {hideAddProgramButton ? null : (
            <Button
              disabled={isEnrolledInAllPrograms}
              kind="ghost"
              renderIcon={(props: ComponentProps<typeof AddIcon>) => <AddIcon size={16} {...props} />}
              iconDescription={t('addPrograms', 'Add programs')}
              onClick={launchProgramsForm}
            >
              {t('add', 'Add')}
            </Button>
          )}
        </CardHeader>
        {isEnrolledInAllPrograms && (
          <InlineNotification
            style={{ minWidth: '100%', margin: '0', padding: '0' }}
            lowContrast
            subtitle={t('noEligibleEnrollments', 'There are no more programs left to enroll this patient in')}
            title={t('fullyEnrolled', 'Enrolled in all programs')}
          />
        )}
        <DataTable rows={tableRows} headers={tableHeaders} isSortable size={isTablet ? 'lg' : 'sm'} useZebraStyles>
          {({ rows, headers, getHeaderProps, getTableProps, getRowProps }) => (
            <TableContainer>
              <Table aria-label="program enrollments" {...getTableProps()}>
                <TableHead>
                  <TableRow>
                    {headers.map((header) => (
                      <TableHeader
                        className={classNames(styles.productiveHeading01, styles.text02)}
                        {...getHeaderProps({
                          header,
                        })}
                      >
                        {header.header}
                      </TableHeader>
                    ))}
                    <TableHeader />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row, i) => (
                    <TableRow key={row.id} {...getRowProps({ row })}>
                      {row.cells.map((cell) => (
                        <TableCell key={cell.id}>{cell.value?.content ?? cell.value}</TableCell>
                      ))}
                      <TableCell className="cds--table-column-menu">
                        <ProgramsActionMenu patientUuid={patientUuid} programEnrollmentId={enrollments[i]?.uuid} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DataTable>
      </div>
    );
  }
  return <EmptyState displayText={displayText} headerTitle={headerTitle} launchForm={launchProgramsForm} />;
};

export default ProgramsDetailedSummary;
