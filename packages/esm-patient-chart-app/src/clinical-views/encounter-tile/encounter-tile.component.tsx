import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { CodeSnippetSkeleton, Tile, Layer, Grid, Column } from '@carbon/react';
import { isNil } from 'lodash-es';
import { NumericObservation, useLayoutType } from '@openmrs/esm-framework';
import { useLastEncounter } from '../hooks';
import type { EncounterTileColumn, EncounterTileProps } from '../types';
import { withUnit, getConceptUnitsFromEncounter } from '../utils/concept-utils';
import styles from './tile.scss';

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
              {Array.from({ length: effectiveMax }).map((_, index) => {
                const column = rowColumns[index];
                return (
                  <Column
                    key={column ? `${column.encounterTypeUuid}-${column.title}-${index}` : `empty-${rowIndex}-${index}`}
                    sm={columnSpan}
                    md={columnSpan}
                    lg={columnSpan}
                    span={columnSpan}
                  >
                    {column ? (
                      <div className={styles.tileColumn}>
                        <EncounterData patientUuid={patientUuid} column={column} />
                      </div>
                    ) : (
                      <div className={styles.tileColumnEmpty} />
                    )}
                  </Column>
                );
              })}
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
          {column.isColoredTag && column.statusColorMappings && obsValue !== '--'
            ? (() => {
                const colorValue = column.statusColorMappings[obsValue] ?? '#888888';
                const c = colorValue.replace('#', '');
                const r = parseInt(c.substring(0, 2), 16);
                const g = parseInt(c.substring(2, 4), 16);
                const b = parseInt(c.substring(4, 6), 16);
                const bgColor = `rgba(${r}, ${g}, ${b}, 0.15)`;
                return (
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '2px 10px',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      backgroundColor: bgColor,
                      color: colorValue,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {obsValue}
                  </span>
                );
              })()
            : withUnit(obsValue, units)}
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
