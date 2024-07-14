// main.ts

import * as fs from "fs";
import processPatients from "./dataProcessor";
import exportToXML from "./xmlExporter";
import { PatientData } from "./types";

/**
 * Main function to process patient data and export the results to XML.
 */
const main = () => {
  // Define the file path for the JSON data
  const dataFilePath = "avon_data.json";
  const outputFilePath = "breakdown_results.xml";

  // Define the measurement period
  const measurementPeriodStart = "2022-01-01T00:00:00Z";
  const measurementPeriodEnd = "2022-12-31T23:59:59Z";

  try {
    // Read raw data from the JSON file
    const rawData = fs.readFileSync(dataFilePath, "utf8");

    // Parse the raw data into PatientData array
    const patientsData: PatientData[] = JSON.parse(rawData);

    // Process the patients data to get breakdown results
    const breakdownResults = processPatients(patientsData);

    // Export the processed results to an XML file
    exportToXML(
      breakdownResults,
      outputFilePath,
      measurementPeriodStart,
      measurementPeriodEnd
    );

    console.log(`Results successfully exported to ${outputFilePath}`);
  } catch (error) {
    console.error("An error occurred:", error);
  }
};

// Execute the main function
main();
