import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { CodeSnippetSkeleton, Tile, Layer, Grid, Column, Tag } from '@carbon/react';
import { isNil } from 'lodash-es';
import { useLayoutType } from '@openmrs/esm-framework';
import { useLastEncounter } from '../hooks';
import type { EncounterTileColumn, EncounterTileProps } from '../types';
import { withUnit, getConceptUnitsFromEncounter } from '../utils/concept-utils';
import styles from './tile.scss';

type TagType =
  | 'gray'
  | 'red'
  | 'magenta'
  | 'purple'
  | 'blue'
  | 'cyan'
  | 'teal'
  | 'green'
  | 'cool-gray'
  | 'warm-gray'
  | 'high-contrast'
  | 'outline';

export const EncounterTile = memo(({ patientUuid, columns, headerTitle, maxColumnsPerRow }: EncounterTileProps) => {
  const isTablet = useLayoutType() === 'tablet';
  const effectiveMax = maxColumnsPerRow || columns.length;
  const columnSpan = Math.floor(16 / effectiveMax);
  const rows = [];
  for (let i = 0; i < columns.length; i += effectiveMax) {
    rows.push(columns.slice(i, i + effectiveMax));
  }

  return (
    <Layer className={styles.layer}>
      <Tile className={styles.tile}>
        <div className={styles.tileHeader}>
          <div className={isTablet ? styles.tabletHeading : styles.desktopHeading}>
            <h4 className={styles.title}>{headerTitle}</h4>
          </div>
        </div>
        <div className={styles.tileBody}>
          {rows.map((rowColumns, rowIndex) => (
            <Grid key={rowIndex} fullWidth>
              {rowColumns.map((column, index) => (
                <Column
                  key={`${column.encounterTypeUuid}-${column.title}-${index}`}
                  sm={columnSpan}
                  md={columnSpan}
                  lg={columnSpan}
                  span={columnSpan}
                >
                  <div className={styles.tileColumn}>
                    <EncounterData patientUuid={patientUuid} column={column} />
                  </div>
                </Column>
              ))}
            </Grid>
          ))}
        </div>
      </Tile>
    </Layer>
  );
});

const EncounterData: React.FC<{
  patientUuid: string;
  column: EncounterTileColumn;
}> = ({ patientUuid, column }) => {
  const { t } = useTranslation();
  const { lastEncounter, isLoading, error, isValidating } = useLastEncounter(patientUuid, column.encounterTypeUuid);
  const units = getConceptUnitsFromEncounter(lastEncounter, column.concept);
  const summaryUnits = column.summaryConcept?.primaryConcept
    ? getConceptUnitsFromEncounter(lastEncounter, column.summaryConcept.primaryConcept)
    : null;
  const obsValue = column.getObsValue(lastEncounter);
  const summaryValue =
    column.hasSummary === true && column.getSummaryObsValue && typeof column.getSummaryObsValue === 'function'
      ? column.getSummaryObsValue(lastEncounter)
      : null;

  if (isLoading || isValidating) {
    return <CodeSnippetSkeleton type="multi" className="skeleton" />;
  }

  if (error || lastEncounter === undefined) {
    return (
      <>
        <span className={styles.tileTitle}>{t(column.title)}</span>
        <span className={styles.tileValue}>{error?.message}</span>
      </>
    );
  }

  return (
    <>
      <span className={styles.tileTitle}>{t(column.header)}</span>
      {!(obsValue === '--' && summaryValue !== '--' && !isNil(summaryValue)) && (
        <div className={styles.tileValue}>
          {column.isColoredTag && column.statusColorMappings && obsValue !== '--' ? (
            <Tag type={(column.statusColorMappings[obsValue] ?? 'gray') as TagType} size="md">
              {obsValue}
            </Tag>
          ) : (
            withUnit(obsValue, units)
          )}
        </div>
      )}
      {!isNil(summaryValue) && summaryValue !== '--' && (
        <div className={styles.tileValue} style={{ marginTop: '4px' }}>
          {withUnit(summaryValue, summaryUnits)}
        </div>
      )}
    </>
  );
};
