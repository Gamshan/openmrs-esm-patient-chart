import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, Tab, TabList, TabPanels, TabPanel } from '@carbon/react';
import { useConfig } from '@openmrs/esm-framework';
import { EncounterList } from './encounter-list.component';
import { getMenuItemTabsConfiguration } from '../utils/encounter-list-config-builder';
import styles from './encounter-list-tabs.scss';
import { filter } from '../utils/helpers';
import { type Encounter } from '../types';
import { usePatientChartStore } from '@openmrs/esm-patient-common-lib/src';
import { useHasAnyCondition } from '../hooks/useCondition';

const CLINICAL_VIEW_CONDITION_UUIDS = ['119481AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', '117399AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'];

interface EncounterListTabsComponentProps {
  patientUuid: string;
  patient: fhir.Patient;
}

/**
 * This extension is not used in the refapp.
 * This extension uses the patient chart store and SHOULD only be mounted within the patient chart
 */
const EncounterListTabsExtension: React.FC<EncounterListTabsComponentProps> = ({ patientUuid, patient }) => {
  const { t } = useTranslation();
  const { visitContext } = usePatientChartStore(patientUuid);

  const config = useConfig();
  const { hasCondition, isLoading: conditionLoading } = useHasAnyCondition(patientUuid, CLINICAL_VIEW_CONDITION_UUIDS);

  const { tabDefinitions = [] } = config;

  const configConcepts = {
    trueConceptUuid: config.trueConceptUuid,
    falseConceptUuid: config.falseConceptUuid,
    otherConceptUuid: config.otherConceptUuid,
  };

  const tabsConfig = getMenuItemTabsConfiguration(tabDefinitions, configConcepts, t);

  const tabFilters = useMemo(() => {
    return tabsConfig.reduce((result, tab) => {
      if (tab.hasFilter) {
        result[tab.name] = (encounter: Encounter) => filter(encounter, tab.formList?.[0]?.uuid);
      }
      return result;
    }, {});
  }, [tabsConfig]);

  const isDead = patient.deceasedBoolean ?? Boolean(patient.deceasedDateTime);

  if (conditionLoading) return null;
  if (!hasCondition) return null;

  return (
    <div className={styles.tabContainer}>
      <Tabs>
        <TabList contained>
          {tabsConfig.map((tab) => (
            <Tab key={tab.name}>{t(tab.name)}</Tab>
          ))}
        </TabList>
        <TabPanels>
          {tabsConfig.map((tab) => (
            <TabPanel key={tab.name}>
              <EncounterList
                filter={tabFilters[tab.name]}
                patientUuid={patientUuid}
                formList={tab.formList}
                columns={tab.columns}
                encounterType={tab.encounterType}
                launchOptions={tab.launchOptions}
                headerTitle={tab.headerTitle}
                description={tab.description}
                visit={visitContext}
                deathStatus={isDead}
              />
            </TabPanel>
          ))}
        </TabPanels>
      </Tabs>
    </div>
  );
};

export default EncounterListTabsExtension;
