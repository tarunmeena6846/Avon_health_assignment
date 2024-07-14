import { CategorizationResults, PatientData } from "./types";
/**
 * Categorizes patient data based on specified criteria within a measurement period.
 *
 * This function assesses whether a patient falls into various categories (Initial Population,
 * Denominator, Exclusions, Numerator, and Exclusion Exceptions) based on age, encounters,
 * diagnoses, and assessment results related to adolescent depression screenings.
 *
 * @param {PatientData} data - The patient data to categorize.
 * @param {Date} measurementPeriodStart - The start date of the measurement period.
 * @param {Date} measurementPeriodEnd - The end date of the measurement period.
 * @returns {CategorizationResults} - An object containing arrays of patients in each category.
 */
function categorizePatient(
  data: PatientData,
  measurementPeriodStart: Date,
  measurementPeriodEnd: Date
): CategorizationResults {
  // Helper function to calculate age based on birth date and reference date
  const getAge = (birthDate: Date, referenceDate: Date) => {
    return Math.floor(
      (referenceDate.getTime() - birthDate.getTime()) /
        (1000 * 3600 * 24 * 365.25)
    );
  };

  // Helper function to check if a date is within the measurement period
  const isWithinPeriod = (date: Date) =>
    date >= measurementPeriodStart && date <= measurementPeriodEnd;

  // Helper function to check for qualifying encounters
  const hasEncounter = (type: string) =>
    data.assessments[type]?.some((encounter) =>
      isWithinPeriod(new Date(encounter.time_elements["Relevant Period Start"]))
    ) || false;

  // Helper function to check if a diagnosis occurred before a specific encounter
  const hasDiagnosisBeforeEncounter = (
    diagnosisCode: string,
    encounterStart: Date
  ) =>
    data.assessments["QDM::Diagnosis"]?.some((diagnosis) => {
      const diagnosisStart = new Date(
        diagnosis.time_elements["Prevalence Period Start"]
      );
      return (
        diagnosisStart < encounterStart &&
        diagnosis.codes["ICD10CM"].split(" - ")[0].trim() === diagnosisCode
      );
    }) || false;

  // Helper function to check for recent screenings with specific codes and results
  const hasRecentScreening = (
    codes: string[],
    resultCode: string,
    positive = false
  ) =>
    data.assessments["QDM::AssessmentPerformed"]?.some((assessment) => {
      const performedCode = assessment.codes["LOINC"].split(" - ")[0].trim();
      return (
        codes.includes(performedCode) &&
        assessment.results["Result"]?.split(" ")[0] === resultCode
      );
    }) || false;

  // Helper function to check for performed interventions
  const hasIntervention = (codes: string[]) =>
    data.assessments["QDM::InterventionPerformed"]?.some((intervention) =>
      codes.includes(intervention.codes["SNOMEDCT"]?.split(" ")[0])
    ) || false;

  // Extract birth date and calculate age
  const birthDate = new Date(data.patient.date_of_birth);
  const age = getAge(birthDate, measurementPeriodStart);

  // Initialize categorization arrays
  const IPOP: PatientData[] = [];
  const DENOM: PatientData[] = [];
  const DENEX: PatientData[] = [];
  const NUMER: PatientData[] = [];
  const DENEXCEP: PatientData[] = [];

  console.log("Processing patient:", data.patient.name);

  // Categorization logic
  if (age >= 12 && hasEncounter("QDM::EncounterPerformed")) {
    IPOP.push(data); // Include in Initial Population
    DENOM.push(data); // Include in Denominator

    // Get the start date of the first qualifying encounter
    const encounterStart = new Date(
      data.assessments["QDM::EncounterPerformed"][0].time_elements[
        "Relevant Period Start"
      ]
    );

    // Check for bipolar diagnosis before the encounter
    if (hasDiagnosisBeforeEncounter("F31.9", encounterStart)) {
      DENEX.push(data); // Exclude from Denominator
    } else {
      // Check for negative adolescent screening
      const hasNegativeScreening = hasRecentScreening(
        ["73831-0", "73832-8"],
        "428171000124102"
      );

      // Check for positive adolescent screening with follow-up
      const hasPositiveScreeningWithFollowUp = hasRecentScreening(
        ["73831-0", "73832-8"],
        "428181000124104"
      );

      // Determine if patient is eligible for numerator
      if (
        hasNegativeScreening ||
        (hasPositiveScreeningWithFollowUp &&
          hasIntervention(["18512000", "10197000", "385726000", "108313002"]))
      ) {
        NUMER.push(data); // Include in Numerator
      } else if (
        hasRecentScreening(["73831-0", "73832-8"], "183932001", true)
      ) {
        DENEXCEP.push(data); // Exclude due to medical/patient reasons
      }
    }
  }

  // Return the categorization results
  return {
    IPOP,
    DENOM,
    DENEX,
    NUMER,
    DENEXCEP,
  };
}

export default categorizePatient;
