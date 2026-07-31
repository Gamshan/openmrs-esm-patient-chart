import {
  defineConfigSchema,
  fhirBaseUrl,
  getAsyncLifecycle,
  getSyncLifecycle,
  messageOmrsServiceWorker,
  restBaseUrl,
} from '@openmrs/esm-framework';
import { createDashboardLink } from '@openmrs/esm-patient-common-lib';
import { configSchema } from './config-schema';
import digipathsOverviewComponent from './biometrics/digipaths-overview.component';
import { registerExpressionHelper } from '@openmrs/esm-form-engine-lib';
import {
  calcBpControl,
  calcCDK_Risk,
  calcCVDRiskCategory,
  calcEGFR,
  calcEGFR_Stage,
  calcFootCare,
  calcHtnGrade,
  calcPhq9,
  calcPhq9Grade,
  calcSouthEastAsiaCVDRisk,
  calcSouthEastAsiaLabCVDRisk,
  calcSouthEastAsiaNonLabCVDRisk,
  calcSouthEastAsiaNonLabCVDRisk2,
  calcTest,
  calcUACR_Category,
  calcSuicideRisk,
} from './customCalcResources/customCalculations';

const moduleName = '@openmrs/esm-patient-digipaths-app';

const options = {
  featureName: 'patient-digipaths',
  moduleName,
};

export const importTranslation = require.context('../translations', false, /.json$/, 'lazy');

export function startupApp() {
  messageOmrsServiceWorker({
    type: 'registerDynamicRoute',
    pattern: `${fhirBaseUrl}/Observation.+`,
  });

  messageOmrsServiceWorker({
    type: 'registerDynamicRoute',
    pattern: `.+${restBaseUrl}/concept.+`,
  });

  defineConfigSchema(moduleName, configSchema);

  registerExpressionHelper('calcHtnGrade', calcHtnGrade);
  registerExpressionHelper('calcBpControl', calcBpControl);
  registerExpressionHelper('calcSouthEastAsiaNonLabCVDRisk2', calcSouthEastAsiaNonLabCVDRisk2);
  registerExpressionHelper('calcFootCare', calcFootCare);
  registerExpressionHelper('calcPhq9', calcPhq9);
  registerExpressionHelper('calcPhq9Grade', calcPhq9Grade);
  registerExpressionHelper('calcEGFR', calcEGFR);
  registerExpressionHelper('calcEGFR_Stage', calcEGFR_Stage);
  registerExpressionHelper('calcUACR_Category', calcUACR_Category);
  registerExpressionHelper('calcCDK_Risk', calcCDK_Risk);
  registerExpressionHelper('calcSouthEastAsiaNonLabCVDRisk', calcSouthEastAsiaNonLabCVDRisk);
  registerExpressionHelper('calcCVDRiskCategory', calcCVDRiskCategory);
  registerExpressionHelper('calcTest', calcTest);
  registerExpressionHelper('calcSouthEastAsiaLabCVDRisk', calcSouthEastAsiaLabCVDRisk);
  registerExpressionHelper('calcSouthEastAsiaCVDRisk', calcSouthEastAsiaCVDRisk);
  registerExpressionHelper('calcSuicideRisk', calcSuicideRisk);
}

export const digipaths = getSyncLifecycle(digipathsOverviewComponent, options);
