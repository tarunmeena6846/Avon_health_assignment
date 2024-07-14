import categorizePatient from "./categorizer";
import {
  BreakdownResults,
  CategorizationResults,
  PatientData,
  SummaryResults,
} from "./types";

/**
 * Processes a list of patient data, categorizing them based on various demographics
 * and calculating summary statistics for eligibility and proper screening.
 *
 * @param {PatientData[]} patientsData - Array of patient data to process.
 * @returns {BreakdownResults & SummaryResults} - An object containing categorized results
 *                                                and summary statistics.
 */
function processPatients(
  patientsData: PatientData[]
): BreakdownResults & SummaryResults {
  const measurementPeriodStart = new Date("2022-01-01T00:00:00Z");
  const measurementPeriodEnd = new Date("2022-12-31T23:59:59Z");

  // Initialize result objects for different demographic breakdowns
  const resultsByRace: Record<string, CategorizationResults> = {};
  const resultsByEthnicity: Record<string, CategorizationResults> = {};
  const resultsByPayer: Record<string, CategorizationResults> = {};
  const resultsBySex: Record<string, CategorizationResults> = {};

  let eligible = 0;
  let properlyScreened = 0;

  patientsData.forEach((data) => {
    // Categorize the patient data for the measurement period
    const categorizationResults = categorizePatient(
      data,
      measurementPeriodStart,
      measurementPeriodEnd
    );

    // Update summary statistics
    if (categorizationResults.DENOM.length > 0) eligible++;
    if (categorizationResults.NUMER.length > 0) properlyScreened++;

    // Extract patient demographic information with fallback to "Unknown"
    const race = data.patient.race || "Unknown";
    const ethnicity = data.patient.ethnicity || "Unknown";
    const payer = data.patient.insurance_providers || "Unknown";
    const sex = data.patient.sex || "Unknown";

    // Initialize categorization results for each demographic if not already present
    [race, ethnicity, payer, sex].forEach((demographic, index) => {
      const resultsMap = [
        resultsByRace,
        resultsByEthnicity,
        resultsByPayer,
        resultsBySex,
      ][index];
      if (!resultsMap[demographic]) {
        resultsMap[demographic] = {
          IPOP: [],
          DENOM: [],
          DENEX: [],
          NUMER: [],
          DENEXCEP: [],
        };
      }
    });

    // Aggregate categorization results by demographics
    Object.keys(categorizationResults).forEach((key) => {
      const categoryKey = key as keyof CategorizationResults;
      [race, ethnicity, payer, sex].forEach((demographic, index) => {
        const resultsMap = [
          resultsByRace,
          resultsByEthnicity,
          resultsByPayer,
          resultsBySex,
        ][index];
        resultsMap[demographic][categoryKey].push(
          ...categorizationResults[categoryKey]
        );
      });
    });
  });

  // Return the aggregated breakdown results and summary statistics
  return {
    race: resultsByRace,
    ethnicity: resultsByEthnicity,
    payer: resultsByPayer,
    sex: resultsBySex,
    eligible,
    properlyScreened,
  };
}

export default processPatients;
