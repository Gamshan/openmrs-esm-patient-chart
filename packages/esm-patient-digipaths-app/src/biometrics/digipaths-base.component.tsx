import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, ContentSwitcher, DataTableSkeleton, IconSwitch, InlineLoading } from '@carbon/react';
import { formatDatetime, parseDate, useConfig, useLayoutType } from '@openmrs/esm-framework';
import { CardHeader, EmptyState, ErrorState, useVisitOrOfflineVisit } from '@openmrs/esm-patient-common-lib';

import { type ConfigObject } from '../config-schema';
import PaginatedDigipaths from './paginated-digipaths.component';
import type { DigipathsTableHeader, DigipathsTableRow } from './types';
import styles from './digipaths-base.scss';
import { useDigipathData } from '../common/data.resource';

interface DigiPathBaseProps {
  pageSize: number;
  pageUrl: string;
  patientUuid: string;
  urlLabel: string;
}

const DigipathsBase: React.FC<DigiPathBaseProps> = ({ patientUuid, pageSize, urlLabel, pageUrl }) => {
  const { t } = useTranslation();
  const displayText = t('digipaths_lower', 'digipaths');
  const headerTitle = t('digipaths', 'Digipath Recommendations');
  const [chartView, setChartView] = useState(false);
  const isTablet = useLayoutType() === 'tablet';

  const config = useConfig<ConfigObject>();
  const { bmiUnit } = config.biometrics;
  // const { data: biometrics, isValidating } = useVitalsAndBiometrics(patientUuid, 'biometrics');
  const { currentVisit } = useVisitOrOfflineVisit(patientUuid);

  const { isLoading, data: digipathData, error } = useDigipathData(patientUuid);

  const tableHeaders: Array<DigipathsTableHeader> = [
    {
      key: 'dateRender',
      header: t('date', 'Date'),
      isSortable: true,
      sortFunc: (valueA, valueB) => new Date(valueA.dateRender).getTime() - new Date(valueB.dateRender).getTime(),
    },
    {
      key: 'messageRender',
      header: t('message', 'Message'),
      isSortable: true,
      sortFunc: (valueA, valueB) => (valueA.weight && valueB.weight ? valueA.weight - valueB.weight : 0),
    },

    {
      key: 'recommendationRender',
      header: 'Recommendation',
      isSortable: false,
      sortFunc: () => 0,
    },
  ];

  const tableRows: Array<DigipathsTableRow> = useMemo(
    () =>
      digipathData?.map((digipath, index) => {
        return {
          ...digipath,
          id: `${index}`,
          dateRender: digipath.date
            ? new Date(digipath.date.toString())
                .toLocaleDateString('en-US', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })
                .replace(/^(\d{2}) ([A-Za-z]+) (\d{4})$/, '$1, $2, $3')
            : '--',
          messageRender: digipath.message,
          recommendationRender: digipath.recommendation,
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
  return <EmptyState displayText={displayText} headerTitle={headerTitle} />;
};

export default DigipathsBase;
