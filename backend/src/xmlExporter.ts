import fs from "fs";
import xmlbuilder from "xmlbuilder";
import {
  BreakdownResults,
  CategorizationResults,
  PatientData,
  SummaryResults,
} from "./types";

/**
 * Sanitizes a string to ensure it is a valid XML element name.
 *
 * @param name - The string to be sanitized.
 * @returns The sanitized string.
 */
function sanitizeXMLName(name: string): string {
  return name
    .replace(/^[^a-zA-Z_]+/, "_") // Ensure the name starts with a letter or underscore
    .replace(/[^a-zA-Z0-9_\-.:]/g, "_"); // Replace invalid characters with underscores
}

/**
 * Exports the breakdown results and summary results to an XML file.
 *
 * @param breakdownResults - The results containing the categorized patient data.
 * @param filePath - The file path to save the XML file.
 * @param measurementPeriodStart - The start date of the measurement period.
 * @param measurementPeriodEnd - The end date of the measurement period.
 */
function exportToXML(
  breakdownResults: BreakdownResults & SummaryResults,
  filePath: string,
  measurementPeriodStart: string,
  measurementPeriodEnd: string
) {
  const root = xmlbuilder.create("root");

  // Add Measurement Period Dates
  root.ele("MeasurementStartDate", measurementPeriodStart);
  root.ele("MeasurementEndDate", measurementPeriodEnd);

  /**
   * Adds categorization results to the parent XML element.
   *
   * @param parent - The parent XML element.
   * @param categorizationResults - The categorization results to add.
   */
  const addCategorizationResults = (
    parent: any,
    categorizationResults: CategorizationResults
  ) => {
    Object.keys(categorizationResults).forEach((key) => {
      const category = parent.ele(sanitizeXMLName(key));
      categorizationResults[key as keyof CategorizationResults].forEach(
        (patientData: PatientData) => {
          const patient = category.ele("Patient");
          patient.ele("Name", patientData.patient.name);
          patient.ele("Sex", patientData.patient.sex);
          patient.ele("DateOfBirth", patientData.patient.date_of_birth);
          patient.ele(
            "DateOfExpiration",
            patientData.patient.date_of_expiration
          );
          patient.ele("Race", patientData.patient.race);
          patient.ele("Ethnicity", patientData.patient.ethnicity);
          patient.ele(
            "InsuranceProviders",
            patientData.patient.insurance_providers
          );
          patient.ele("PatientIDs", patientData.patient.patient_ids);
          const address = patient.ele("Address");
          address.ele("Line1", patientData.patient.address.line1);
          address.ele("City", patientData.patient.address.city);
          address.ele("State", patientData.patient.address.state);
          address.ele("Zip", patientData.patient.address.zip);
          address.ele("Country", patientData.patient.address.country);
          const telecom = patient.ele("Telecom");
          telecom.ele("Phone", patientData.patient.telecom.phone);
          telecom.ele("Email", patientData.patient.telecom.email);
        }
      );
    });
  };

  // Add results by race
  const race = root.ele("Race");
  Object.keys(breakdownResults.race).forEach((key) => {
    const raceCategory = race.ele(sanitizeXMLName(key));
    addCategorizationResults(raceCategory, breakdownResults.race[key]);
  });

  // Add results by ethnicity
  const ethnicity = root.ele("Ethnicity");
  Object.keys(breakdownResults.ethnicity).forEach((key) => {
    const ethnicityCategory = ethnicity.ele(sanitizeXMLName(key));
    addCategorizationResults(
      ethnicityCategory,
      breakdownResults.ethnicity[key]
    );
  });

  // Add results by payer
  const payer = root.ele("Payer");
  Object.keys(breakdownResults.payer).forEach((key) => {
    const payerCategory = payer.ele(sanitizeXMLName(key));
    addCategorizationResults(payerCategory, breakdownResults.payer[key]);
  });

  // Add results by sex
  const sex = root.ele("Sex");
  Object.keys(breakdownResults.sex).forEach((key) => {
    const sexCategory = sex.ele(sanitizeXMLName(key));
    addCategorizationResults(sexCategory, breakdownResults.sex[key]);
  });

  // Add eligible and properly screened patient counts
  root.ele("EligiblePatients", breakdownResults.eligible);
  root.ele("ProperlyScreenedPatients", breakdownResults.properlyScreened);

  // Generate the XML string
  const xml = root.end({ pretty: true });

  // Write the XML string to the specified file
  fs.writeFileSync(filePath, xml);
}

export default exportToXML;
