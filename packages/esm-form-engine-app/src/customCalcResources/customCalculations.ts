import { getCondition } from './data.resource';
import data from './who-south-asia-cvd.json';
import { southEastAsiaCvdRiskTables, southEastAsiaCvdRiskTablesLaboratory } from './risk-dataset-table';

async function calcHtnGrade(systolic, diastolic) {
  let sbp = await systolic;
  let dbp = await diastolic;

  if (sbp >= 180 || dbp >= 110) return 'Severe hypertension';
  else if (sbp >= 160 || dbp >= 100) return 'Grade 2';
  else if (sbp >= 140 || dbp >= 90) return 'Grade 1';
  else if (sbp < 60 || dbp < 40) return 'Abnormal';
  else return 'Normal';
}

async function calcBpControl(age, systolic, diastolic) {
  let sbp = await systolic;
  let dbp = await diastolic;
  let targetSBP;

  if (age < 65) {
    targetSBP = sbp >= 120 && sbp <= 129;
  } else {
    targetSBP = sbp >= 130 && sbp <= 139;
  }

  const targetDBP = dbp < 80 && dbp >= 70;

  if (targetSBP && targetDBP) {
    return 'Controlled';
  } else {
    return 'Uncontrolled';
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

function getAgeGroup(age) {
  if (age <= 44) return '40-44';
  if (age <= 49) return '45-49';
  if (age <= 54) return '50-54';
  if (age <= 59) return '55-59';
  if (age <= 64) return '60-64';
  if (age <= 69) return '65-69';
  return '70-74';
}

function getBPIndex(bp) {
  if (bp < 120) return 0;
  if (bp < 140) return 1;
  if (bp < 160) return 2;
  if (bp < 180) return 3;
  return 4;
}

function getCholIndex(chol) {
  if (chol < 5) return 0;
  if (chol < 6) return 1;
  if (chol < 7) return 2;
  return 3;
}

function calcFootCare(
  Featuresofactivediabeticfootdisease,
  Amputation,
  Dialysis,
  deformity,
  Reflexes,
  SensationUsingMonofilament,
  DorsalisPedisPosteriorTibialPulses,
) {
  if (Featuresofactivediabeticfootdisease === '3225ad6e-387c-465e-b2e1-ac6d85ed77a2')
    return 'Active diabetic foot disease';

  if (Amputation === '3498f1da-1bca-4405-9e06-0fb3b79871da' || Dialysis === 'a9f0dbd9-7b7e-480a-97b8-47926e55aac3')
    return 'High risk';

  let moderateScore = 0;
  if (deformity === 'f958313b-b1f8-4b16-8a4e-3f552d4e40a4') moderateScore = +1;
  if (Reflexes === '0e01f0f3-d563-4500-afa6-d220f9ad0ce3') moderateScore = +1;
  if (SensationUsingMonofilament === '6ad23b03-9f2d-4841-af32-ed9ba0ac0005') moderateScore = +1;
  if (DorsalisPedisPosteriorTibialPulses === 'e0bb89bd-0310-4054-a0b3-562e96aec078') moderateScore = +1;

  if (moderateScore >= 2) return 'High risk';
  else if (moderateScore > 0) return 'Moderate risk';
  else return 'Low risk';
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
  if (score < 5) return '1dc89a9b-76d6-40b7-b398-2b6355edba92';
  else if (score < 10) return '1498AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
  else if (score < 15) return '1499AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
  else if (score < 20) return 'e00d166a-5d05-49eb-8882-6ef9043df4b3';
  else if (score < 28) return '1500AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
}

async function getTest(value) {
  return await value;
}

function calcEGFR(gender, age, scr) {
  const isFemale = gender === 'F';

  const k = isFemale ? 0.7 : 0.9;
  const a = isFemale ? -0.241 : -0.302;
  const sexFactor = isFemale ? 1.012 : 1.0;

  const ratio = scr / k;

  const minPart = Math.pow(Math.min(ratio, 1), a);
  const maxPart = Math.pow(Math.max(ratio, 1), -1.2);

  return 142 * minPart * maxPart * Math.pow(0.9938, age) * sexFactor;
}

function calcEGFR_Stage(gender, age, scr) {
  const eGFR = calcEGFR(gender, age, scr);

  if (!scr || !eGFR) return '';

  if (eGFR >= 90) return 'G1';
  else if (eGFR >= 60) return 'G2';
  else if (eGFR >= 45) return 'G3a';
  else if (eGFR >= 30) return 'G3b';
  else if (eGFR >= 15) return 'G4';
  else return 'G5';
}

function calcUACR_Category(uACR) {
  if (!uACR) return '';

  if (uACR < 30) return 'A1';
  if (uACR < 300) return 'A2';
  else return 'A3';
}

function calcCDK_Risk(gender, age, scr, uACR) {
  if (!uACR || !scr) return '';
  return calcEGFR_Stage(gender, age, scr) + calcUACR_Category(uACR);
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
  const getAgeBin = (age) => Math.floor((Math.min(Math.max(40, age), 74) - 40) / 5);
  const getSbpBin = (sbp) => Math.max(0, Math.floor((Math.min(sbp, 180) - 120) / 20) + 1);
  const getBmiBin = (bmi) => Math.max(0, Math.floor((Math.min(bmi, 35) - 20) / 5) + 1);

  // Variables
  const sexIdx = sex === 'M' ? 0 : 1;
  const smokerIdx = smoker ? 1 : 0;
  const ageIdx = 6 - getAgeBin(age);
  const bmiIdx = getBmiBin(bmi);
  const sbpIdx = 4 - getSbpBin(sbp);

  return southEastAsiaCvdRiskTables[sexIdx][smokerIdx][ageIdx][sbpIdx][bmiIdx];
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

  if (riskScore < 10) return 'Low (<10%)';
  else if (riskScore <= 20) return 'Moderate (10-20 %)';
  else if (riskScore < 30) return 'High (21-30 %)';
  else return 'Very High (>30%)';
}

async function calcTest(val) {
  return 19;
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

  // Bin functions
  const getAgeBin = (age) => Math.floor((Math.min(Math.max(40, age), 74) - 40) / 5);
  const getSbpBin = (sbp) => Math.max(0, Math.floor((Math.min(sbp, 180) - 120) / 20) + 1);
  const getCholBin = (chol) => Math.max(0, Math.min(4, Math.floor(chol - 3)));

  const sexIdx = sex === 'M' ? 0 : 1;
  const smokerIdx = smoker ? 1 : 0;
  const diabetesIdx = isActiveDiabetes ? 1 : 0;
  const ageIdx = 6 - getAgeBin(age);
  const sbpIdx = 4 - getSbpBin(sbp);
  const cholIdx = getCholBin(chol);

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
};
