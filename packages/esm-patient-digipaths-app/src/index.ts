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
}

export const digipaths = getSyncLifecycle(digipathsOverviewComponent, options);
