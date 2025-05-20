import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, ContentSwitcher, DataTableSkeleton, IconSwitch, InlineLoading } from '@carbon/react';
import { Add, Analytics, Table } from '@carbon/react/icons';
import { formatDatetime, parseDate, useConfig, useLayoutType } from '@openmrs/esm-framework';
import { CardHeader, EmptyState, ErrorState, useVisitOrOfflineVisit } from '@openmrs/esm-patient-common-lib';
import { launchVitalsAndBiometricsForm } from '../utils';
import { useVitalsConceptMetadata, useVitalsAndBiometrics, withUnit } from '../common';
import { type ConfigObject } from '../config-schema';
import BiometricsChart from './biometrics-chart.component';
import PaginatedBiometrics from './paginated-biometrics.component';
import PaginatedDigipaths from './paginated-digipaths.component';
import type { DigipathsTableHeader, DigipathsTableRow } from './types';
import styles from './biometrics-base.scss';
import { useDigipathData } from '../common/data.resource';

interface DigiPathBaseProps {
  pageSize: number;
  pageUrl: string;
  patientUuid: string;
  urlLabel: string;
}

const DigipathsBase: React.FC<DigiPathBaseProps> = ({ patientUuid, pageSize, urlLabel, pageUrl }) => {
  const { t } = useTranslation();
  const displayText = t('biometrics_lower', 'biometrics');
  const headerTitle = t('digipaths', 'Digipaths');
  const [chartView, setChartView] = useState(false);
  const isTablet = useLayoutType() === 'tablet';

  const config = useConfig<ConfigObject>();
  const { bmiUnit } = config.biometrics;
  // const { data: biometrics, isValidating } = useVitalsAndBiometrics(patientUuid, 'biometrics');
  const { data: conceptUnits } = useVitalsConceptMetadata();
  const { currentVisit } = useVisitOrOfflineVisit(patientUuid);

  const launchBiometricsForm = useCallback(
    () => launchVitalsAndBiometricsForm(currentVisit, config),
    [config, currentVisit],
  );
  const { isLoading, data: digipathData, error } = useDigipathData();

  const tableHeaders: Array<DigipathsTableHeader> = [
    {
      key: 'dateRender',
      header: t('dateAndTime', 'Date and time'),
      isSortable: true,
      sortFunc: (valueA, valueB) => new Date(valueA.date).getTime() - new Date(valueB.date).getTime(),
    },
    {
      key: 'actionRender',
      header: t('action', 'Action'),
      isSortable: true,
      sortFunc: (valueA, valueB) => (valueA.weight && valueB.weight ? valueA.weight - valueB.weight : 0),
    },
    {
      key: 'dueDateRender',
      header: t('dueDate', 'Due Date'),
      isSortable: true,
      sortFunc: (valueA, valueB) => (valueA.height && valueB.height ? valueA.height - valueB.height : 0),
    },
  ];

  const tableRows: Array<DigipathsTableRow> = useMemo(
    () =>
      digipathData?.map((digipath, index) => {
        return {
          ...digipath,
          id: `${index}`,
          dateRender: digipath.date ? formatDatetime(parseDate(digipath.date.toString()), { mode: 'wide' }) : '--',
          actionRender: digipath.description,
          dueDateRender: digipath.date ? formatDatetime(parseDate(digipath.date.toString()), { mode: 'wide' }) : '--',
        };
      }),
    [digipathData],
  );

  if (isLoading) return <DataTableSkeleton role="progressbar" />;
  if (error) return <ErrorState error={error} headerTitle={headerTitle} />;
  if (digipathData?.length) {
    return (
      <div className={styles.widgetCard}>
        <CardHeader title={headerTitle}>
          <div className={styles.backgroundDataFetchingIndicator}>
            <span>{isLoading ? <InlineLoading /> : null}</span>
          </div>
          {/*<div className={styles.biometricsHeaderActionItems}>*/}
          {/*  <ContentSwitcher onChange={(evt) => setChartView(evt.name === 'chartView')} size={isTablet ? 'md' : 'sm'}>*/}
          {/*    <IconSwitch name="tableView" text="Table view">*/}
          {/*      <Table size={16} />*/}
          {/*    </IconSwitch>*/}
          {/*    <IconSwitch name="chartView" text="Chart view">*/}
          {/*      <Analytics size={16} />*/}
          {/*    </IconSwitch>*/}
          {/*  </ContentSwitcher>*/}
          {/*  <>*/}
          {/*    <span className={styles.divider}>|</span>*/}
          {/*    <Button*/}
          {/*      kind="ghost"*/}
          {/*      renderIcon={(props) => <Add size={16} {...props} />}*/}
          {/*      iconDescription="Add biometrics"*/}
          {/*      onClick={launchBiometricsForm}*/}
          {/*    >*/}
          {/*      {t('add', 'Add')}*/}
          {/*    </Button>*/}
          {/*  </>*/}
          {/*</div>*/}
        </CardHeader>
        <PaginatedDigipaths
          tableRows={tableRows}
          pageSize={pageSize}
          urlLabel={urlLabel}
          pageUrl={pageUrl}
          tableHeaders={tableHeaders}
        />
      </div>
    );
  }
  return <EmptyState displayText={displayText} headerTitle={headerTitle} launchForm={launchBiometricsForm} />;
};

export default DigipathsBase;
