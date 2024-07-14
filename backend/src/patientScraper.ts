import * as fs from "fs-extra";
import { processDirectory } from "./extractor";

/**
 * Main function to extract patient data from HTML files in a directory
 * and save the extracted data to a JSON file.
 */
const main = async () => {
  // Define the directory path containing patient's HTML files
  const directoryPath = "/Users/tarunmeena/Downloads/patientlist"; // Change this to the correct directory path

  try {
    // Process the directory to extract patient data
    const extractedData = await processDirectory(directoryPath);

    // Define the output file path for the JSON data
    const outputFilePath = "avon_data.json";

    // Write the extracted data to a JSON file with formatted spaces
    await fs.writeJson(outputFilePath, extractedData, {
      spaces: 4,
    });

    console.log("Data extraction complete! File saved at:", outputFilePath);
  } catch (error) {
    console.error("Error:", error);
  }
};

// Execute the main function
main();
