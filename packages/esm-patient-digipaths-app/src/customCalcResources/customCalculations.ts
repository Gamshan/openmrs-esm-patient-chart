import { getCondition } from './data.resource';
import data from './who-south-asia-cvd.json';
import { southEastAsiaCvdRiskTables, southEastAsiaCvdRiskTablesLaboratory } from './risk-dataset-table';
import { conceptCodes } from './concept-codes';

function convertCholMgdlToMmol(chol) {
  if (chol == null) return null;
  return parseFloat((chol / 38.67).toFixed(2));
}

async function calcHtnGrade(systolic, diastolic) {
  let sbp = await systolic;
  let dbp = await diastolic;

  if (sbp < 60 || dbp < 40) return conceptCodes['LowBP'];
  else if (sbp >= 180 || dbp >= 110) return conceptCodes['Severe'];
  else if (sbp >= 160 || dbp >= 100) return conceptCodes['Moderate'];
  else if (sbp >= 140 || dbp >= 90) return conceptCodes['Mild'];
  else if ((sbp >= 120 && sbp <= 139) || (dbp >= 80 && dbp <= 89)) return conceptCodes['PreHypertension'];
  else return conceptCodes['Normotension'];
}

async function calcBpControl(age, systolic, diastolic) {
  let sbp = await systolic;
  let dbp = await diastolic;
  let targetSBP;

  if (age < 65) {
    targetSBP = sbp >= 60 && sbp <= 129;
  } else {
    targetSBP = sbp >= 100 && sbp <= 139;
  }

  if (targetSBP) {
    return conceptCodes['BloodPressureControl'];
  } else {
    return conceptCodes['PoorHypertensionControl'];
  }
}

async function customCalculator(condition) {
  // const response = await fetch(
  //   `/ws/rest/v1/condition?patient=${'7281e4a2-27c7-4844-a636-d2117886ceb3'}&v=full`,
  //   {
  //     method: "GET",
  //     headers: {
  //       "Content-Type": "application/json"
  //     },
  //     credentials: "include" // important for OpenMRS session
  //   }
  // );

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const conditionData = await getCondition(
    '7281e4a2-27c7-4844-a636-d2117886ceb3',
    '119481AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  );

  let isActiveDiabetes = conditionData && conditionData.total > 0 ? 1 : 0;

  return isActiveDiabetes;
}

// export function calcSouthEastAsiaNonLabCVDRisk2( age, sex, bp,diabetes, smoker, chol ) {
//
//   const ageGroup = getAgeGroup(age);
//   const bpIndex = getBPIndex(bp);
//   const cholIndex = getCholIndex(chol);
//
//   let risk = data[sex][ageGroup][cholIndex]
//
//
//   // 🔥 Improved BP effect (non-linear)
//   const bpEffect = [0, 2, 4, 7, 10];
//   risk += bpEffect[bpIndex];
//
//   // 🚬 Smoking effect (age dependent)
//   if (smoker) {
//     risk += age >= 50 ? 6 : 4;
//   }
//
//   // 🩸 Diabetes effect (stronger + interacts with BP)
//   if (diabetes) {
//     risk += age >= 50 ? 8 : 6;
//
//     // interaction: diabetes + high BP
//     if (bp >= 140) risk += 2;
//     if (bp >= 160) risk += 2;
//   }
//
//   // 🔥 interaction: smoking + older age
//   if (smoker && age >= 60) {
//     risk += 2;
//   }
//
//   // 🔒 cap realistic maximum
//   if (risk > 60) risk = 60;
//
//
//
//   if (risk >= 30) return `Very High: ${risk}%`;
//   if (risk >= 20) return `High: ${risk}%`;
//   if (risk >= 10) return `Moderate: ${risk}%`;
//   if (risk >= 5) return `Mild: ${risk}%`;
//   return `Low: ${risk}%`;
// }
//

function calcFootCare(
  Featuresofactivediabeticfootdisease,
  Amputation,
  Dialysis,
  deformity,
  Reflexes,
  SensationUsingMonofilament,
  DorsalisPedisPosteriorTibialPulses,
) {
  if (Featuresofactivediabeticfootdisease === '1065AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA')
    return '142452AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

  if (Amputation === '1065AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' || Dialysis === '1065AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA')
    return '166674AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

  let moderateScore = 0;
  if (deformity === '1065AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA') moderateScore = moderateScore + 1;
  if (Reflexes === '1116AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA') moderateScore = moderateScore + 1;
  if (SensationUsingMonofilament === '1116AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA') moderateScore = moderateScore + 1;
  if (DorsalisPedisPosteriorTibialPulses === '1116AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA') moderateScore = moderateScore + 1;

  if (moderateScore >= 2) return '166674AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
  else if (moderateScore > 0) return 'd29f46f5-6511-5b4a-86b0-997cdc995045';
  else return '166675AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
}

function getRange(value, ranges) {
  for (let r of ranges) {
    if (r.includes('+')) {
      if (value >= parseFloat(r)) return r;
    } else {
      const [mn, mx] = r.split('-').map(Number);
      if (value >= mn && value <= mx) return r;
    }
  }
  return null;
}

function calcSouthEastAsiaNonLabCVDRisk2(age, gender, sbp, diabetes, smoker, chol) {
  const ageGroup = getRange(age, ['40-49', '50-59', '60-69', '70-79']);
  const bpGroup = getRange(sbp, ['120-139', '140-159', '160-179', '180+']);
  const cholGroup = getRange(chol, ['4-5', '5-6', '6-7', '7+']);
  const smokeKey = smoker ? 'smoker' : 'non_smoker';
  const diabKey = diabetes ? 'diabetes' : 'no_diabetes';

  if (!ageGroup || !bpGroup || !cholGroup) return null;

  try {
    return getCategory(data[gender][ageGroup][diabKey][smokeKey][bpGroup][cholGroup]) + '%';
  } catch (e) {
    return 'Invalid Data';
  }
}

function getCategory(risk) {
  if (risk < 5) return `Low - ${risk}% `;
  if (risk < 10) return `Mild - ${risk}% `;
  if (risk < 20) return `Moderate - ${risk}% `;
  if (risk < 30) return `High - ${risk}% `;
  return `Very High - ${risk}% `;
}

async function calcPhq9(param1, param2, param3, param4, param5, param6, param7, param8, param9) {
  let score = 0;
  let valuesArray = [
    await param1,
    await param2,
    await param3,
    await param4,
    await param5,
    await param6,
    await param7,
    await param8,
    await param9,
  ];

  valuesArray.forEach((value, index) => {
    if (value === '167000AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA') score = score + 1;
    else if (value === '167001AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA') score = score + 2;
    else if (value === '167002AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA') score = score + 3;
  });

  return score;
}

async function calcPhq9Grade(param1, param2, param3, param4, param5, param6, param7, param8, param9, tee) {
  const score = await calcPhq9(param1, param2, param3, param4, param5, param6, param7, param8, param9);
  if (score < 5) return conceptCodes['MinimalDepression'];
  else if (score < 10) return conceptCodes['MildDepression'];
  else if (score < 15) return conceptCodes['MildToModerateDepression'];
  else if (score < 20) return conceptCodes['ModeratelySevereDepression'];
  else return conceptCodes['SevereDepression'];
}

async function getTest(value) {
  return await value;
}

async function calcEGFR(gender, age, scr) {
  const isFemale = gender === 'F';

  const k = isFemale ? 0.7 : 0.9;
  const a = isFemale ? -0.241 : -0.302;
  const sexFactor = isFemale ? 1.012 : 1.0;

  const ratio = (await scr) / k;

  const minPart = Math.pow(Math.min(ratio, 1), a);
  const maxPart = Math.pow(Math.max(ratio, 1), -1.2);

  const result = 142 * minPart * maxPart * Math.pow(0.9938, age) * sexFactor;
  return Math.round(+result.toFixed(2));
}

async function calcEGFR_Stage(gender, age, scr) {
  const eGFR = await calcEGFR(gender, age, scr);

  if (!scr || !eGFR) return '';

  if (eGFR >= 90)
    return conceptCodes['G1']; //G1
  else if (eGFR >= 60)
    return conceptCodes['G2']; // G2
  else if (eGFR >= 45)
    return conceptCodes['G3a']; // G3a
  else if (eGFR >= 30)
    return conceptCodes['G3b']; // G3b
  else if (eGFR >= 15)
    return conceptCodes['G4']; // G4
  else return conceptCodes['G5']; // G5
}

function calcUACR_Category(uACR) {
  if (!uACR) return '';

  if (uACR < 30) return conceptCodes['A1']; // A1
  if (uACR < 300)
    return conceptCodes['A2']; // A2
  else return conceptCodes['A3']; // A3
}

async function calcCDK_Risk(gender, age, scr, uACR) {
  if (!uACR || !scr) return '';
  const ckdRisk = (await calcEGFR_Stage(gender, age, scr)) + calcUACR_Category(uACR);

  switch (ckdRisk) {
    case conceptCodes['G1'] + conceptCodes['A1']:
      return 'a7b3aa06-223c-52b2-84b5-a495dffd81fd';
    case conceptCodes['G2'] + conceptCodes['A1']:
      return 'bae75281-7a46-59b2-9ba8-f77d471cb832';
    case conceptCodes['G3a'] + conceptCodes['A1']:
      return '60063d49-cff2-51ff-a9f6-de8a48cc5a68';
    case conceptCodes['G3b'] + conceptCodes['A1']:
      return '4ee3092d-da29-5ab0-8562-4670bb3317ee';
    case conceptCodes['G4'] + conceptCodes['A1']:
      return '119fe70c-44b0-519e-9880-ae25d0b0052e';
    case conceptCodes['G5'] + conceptCodes['A1']:
      return '8f1214c9-1dfb-5ee4-aab3-4692afa5da27';
    case conceptCodes['G1'] + conceptCodes['A2']:
      return 'd8d11f0c-787c-5e2a-a759-72afd58e87a4';
    case conceptCodes['G2'] + conceptCodes['A2']:
      return '0ce38575-eda1-5dfa-9bfc-9940750bb0bf';
    case conceptCodes['G3a'] + conceptCodes['A2']:
      return 'c4fac37c-0bff-5d03-bf8d-893ca9f801b3';
    case conceptCodes['G3b'] + conceptCodes['A2']:
      return 'a371154a-ee8c-5375-9144-3086a9c6d065';
    case conceptCodes['G4'] + conceptCodes['A2']:
      return 'c46d38a0-b953-5f4e-9eca-f3f9b77f8c31';
    case conceptCodes['G5'] + conceptCodes['A2']:
      return '1c874a66-dea1-5cde-a552-491757e8fb63';
    case conceptCodes['G1'] + conceptCodes['A3']:
      return 'ebd839ff-d386-5fa9-8769-bfcb66a7b4c6';
    case conceptCodes['G2'] + conceptCodes['A3']:
      return '36650ce0-9a16-5bda-827b-563b5282b4cc';
    case conceptCodes['G3a'] + conceptCodes['A3']:
      return 'bf929d5b-2964-5b4d-9301-4933d5b1b1b0';
    case conceptCodes['G3b'] + conceptCodes['A3']:
      return 'b9c4e776-4d2d-5c59-a5b9-ff3c4d0e9e5c';
    case conceptCodes['G4'] + conceptCodes['A3']:
      return '1972734a-30ea-5c15-bf9a-3843b86e0d03';
    case conceptCodes['G5'] + conceptCodes['A3']:
      return '9a22772e-1f9c-5fcb-ab66-9fa5b1c77b38';
    default:
      return '';
  }
}

async function calcSouthEastAsiaNonLabCVDRiskScore(
  sex: 'M' | 'F',
  smoker?: boolean,
  age?: number,
  sbpPromise?,
  bmiPromise?,
) {
  const sbp = await sbpPromise;
  const bmi = await bmiPromise;

  const hasValidValues =
    typeof sex === 'string' &&
    typeof smoker === 'boolean' &&
    typeof age === 'number' &&
    typeof sbp === 'number' &&
    typeof bmi === 'number';

  if (!hasValidValues) {
    return null;
  }
  // Bin functions
  const getAgeBin = (age) => Math.floor((Math.min(Math.max(age, 40), 74) - 40) / 5);
  const getSbpBin = (sbp) => Math.max(0, Math.floor((Math.min(sbp, 180) - 120) / 20) + 1);
  const getBmiBin = (bmi) => Math.max(0, Math.floor((Math.min(bmi, 35) - 20) / 5) + 1);

  // Variables
  const sexIdx = sex === 'M' ? 0 : 1;
  const smokerIdx = smoker ? 1 : 0;
  const ageIdx = getAgeIndex(age);
  const bmiIdx = getBmiBin(bmi);
  const sbpIdx = getSBPIndex(sbp);

  return southEastAsiaCvdRiskTables[sexIdx][smokerIdx][ageIdx][sbpIdx][bmiIdx];
}

function getAgeIndex(age) {
  if (age >= 70) return 0;
  if (age >= 65) return 1;
  if (age >= 60) return 2;
  if (age >= 55) return 3;
  if (age >= 50) return 4;
  if (age >= 45) return 5;
  return 6;
}

function getSBPIndex(sbp) {
  if (sbp >= 180) return 0;
  if (sbp >= 160) return 1;
  if (sbp >= 140) return 2;
  if (sbp >= 120) return 3;
  return 4;
}

function getCholIndex(chol) {
  const cholMmol = convertCholMgdlToMmol(chol); // ← convert
  if (cholMmol < 4) return 0;
  if (cholMmol < 5) return 1;
  if (cholMmol < 6) return 2;
  if (cholMmol < 7) return 3;
  return 4;
}

async function calcSouthEastAsiaNonLabCVDRisk(
  sex: 'M' | 'F',
  smoker?: boolean,
  age?: number,
  sbpPromise?,
  bmiPromise?,
) {
  const risk = await calcSouthEastAsiaNonLabCVDRiskScore(sex, smoker, age, sbpPromise, bmiPromise);
  return risk + '%';
}

async function calcCVDRiskCategory(
  patientId,
  sex: 'M' | 'F',
  smoker?: boolean,
  age?: number,
  sbpPromise?,
  cholPromise?,
  bmiPromise?,
) {
  const riskScore = await calcSouthEastAsiaCVDRiskScore(
    patientId,
    sex,
    smoker,
    age,
    sbpPromise,
    cholPromise,
    bmiPromise,
  );

  if (riskScore < 5) return '7d5a45c0-eb6b-508a-a1b7-185637ebdb0b';
  else if (riskScore < 10) return '8892e750-b84e-5156-bb4d-31f4c6f2fc7e';
  else if (riskScore <= 20) return '6ed15378-5a9f-5b8f-807b-9b5d8dea104b';
  else if (riskScore < 30) return 'bd4efb2a-cf82-5a43-bb6e-46287f5f6097';
  else return '47c35b6d-2bd5-5eb6-952e-aff7a7043dc1';
}

async function calcTest(val) {
  return val;
}

async function calcSouthEastAsiaLabCVDRiskScore(
  patientId,
  sex: 'M' | 'F',
  smoker?: boolean,
  age?: number,
  sbpPromise?,
  cholPromise?,
) {
  const conditionData = await getCondition(patientId, '119481AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');
  const chol = await cholPromise;
  const sbp = await sbpPromise;

  let isActiveDiabetes = conditionData && conditionData.total > 0;

  const hasValidValues =
    typeof sex === 'string' &&
    typeof smoker === 'boolean' &&
    typeof age === 'number' &&
    typeof sbp === 'number' &&
    typeof chol === 'number';

  if (!hasValidValues) {
    return null;
  }
  //
  // // Bin functions
  // const getAgeBin = (age) => Math.floor((Math.min(Math.max(40, age), 74) - 40) / 5);
  // const getSbpBin = (sbp) => Math.max(0, Math.min(4, 4 - Math.floor((Math.min(sbp, 180) - 120) / 20)));
  // const getCholBin = (chol) => Math.max(0, Math.min(4, Math.floor(chol - 3)));

  const sexIdx = sex === 'M' ? 0 : 1;
  const smokerIdx = smoker ? 1 : 0;
  const diabetesIdx = isActiveDiabetes ? 1 : 0;
  const ageIdx = getAgeIndex(age);
  const sbpIdx = getSBPIndex(sbp);
  const cholIdx = getCholIndex(chol);

  return southEastAsiaCvdRiskTablesLaboratory[diabetesIdx][sexIdx][smokerIdx][ageIdx][sbpIdx][cholIdx];
}

async function calcSouthEastAsiaLabCVDRisk(
  patientId,
  sex: 'M' | 'F',
  smoker?: boolean,
  age?: number,
  sbpPromise?,
  cholPromise?,
) {
  const risk = await calcSouthEastAsiaLabCVDRiskScore(patientId, sex, smoker, age, sbpPromise, cholPromise);
  return risk + '%';
}

async function calcSouthEastAsiaCVDRiskScore(
  patientId,
  sex: 'M' | 'F',
  smoker?: boolean,
  age?: number,
  sbpPromise?,
  cholPromise?,
  bmiPromise?,
) {
  const chol = await cholPromise;

  if (chol && chol.valueQuantity && chol.valueQuantity.value && chol.issued && !isOneYearAgo(chol.issued)) {
    return await calcSouthEastAsiaLabCVDRiskScore(patientId, sex, smoker, age, sbpPromise, chol.valueQuantity.value);
  } else return await calcSouthEastAsiaNonLabCVDRiskScore(sex, smoker, age, sbpPromise, bmiPromise);
}

async function calcSouthEastAsiaCVDRisk(
  patientId,
  sex: 'M' | 'F',
  smoker?: boolean,
  age?: number,
  sbpPromise?,
  cholPromise?,
  bmiPromise?,
) {
  const risk = await calcSouthEastAsiaCVDRiskScore(patientId, sex, smoker, age, sbpPromise, cholPromise, bmiPromise);
  return risk + '%';
}

function isOneYearAgo(date: string) {
  const oldDate = new Date(date);
  const todayDate = new Date();
  const oneYear = 1000 * 60 * 60 * 24 * 365;

  // @ts-ignore
  return todayDate - oldDate > oneYear;
}

function calcSuicideRisk(
  gender,
  ageRisk,
  depression,
  previousSuicideAttempts,
  severealcoholusedisorder,
  lossRationalThinking,
  civilStatus,
  organisedPlan,
  lacksocialsupport,
  sicknessMLTCs,
) {
  let score = 0;

  if (gender === 'M') score = score + 1;

  if (ageRisk === conceptCodes['Yes']) score = score + 1;

  if (depression === conceptCodes['Yes']) score = score + 1;

  if (previousSuicideAttempts === conceptCodes['Yes']) score = score + 1;

  if (severealcoholusedisorder === conceptCodes['Yes']) score = score + 1;

  if (lossRationalThinking === conceptCodes['Yes']) score = score + 1;

  if (
    civilStatus === conceptCodes['Separated'] ||
    civilStatus === conceptCodes['NeverMarried'] ||
    civilStatus === conceptCodes['Widowed']
  )
    score = score + 1;

  if (organisedPlan === conceptCodes['Yes']) score = score + 1;

  if (lacksocialsupport === conceptCodes['Yes']) score = score + 1;

  if (sicknessMLTCs === conceptCodes['Yes']) score = score + 1;

  if (score <= 4) return conceptCodes['LowRisk'];
  else if (score <= 6) return conceptCodes['MediumRisk'];
  else return conceptCodes['HighRisk'];
}

export {
  calcHtnGrade,
  calcBpControl,
  customCalculator,
  calcSouthEastAsiaNonLabCVDRisk2,
  calcFootCare,
  calcPhq9,
  calcPhq9Grade,
  calcSouthEastAsiaNonLabCVDRisk,
  calcEGFR,
  calcEGFR_Stage,
  calcUACR_Category,
  calcCDK_Risk,
  calcCVDRiskCategory,
  calcTest,
  calcSouthEastAsiaLabCVDRisk,
  calcSouthEastAsiaCVDRisk,
  calcSuicideRisk,
};
