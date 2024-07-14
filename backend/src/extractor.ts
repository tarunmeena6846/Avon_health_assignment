import * as fs from "fs-extra";
import * as path from "path";
import * as cheerio from "cheerio";
import { ExtractedData, Assessment } from "./types";

/**
 * Extracts patient and assessment information from the provided HTML content.
 *
 * @param {string} htmlContent - The HTML content to extract information from.
 * @returns {ExtractedData} - The extracted data including patient details and assessments.
 */
export const extractInformation = (htmlContent: string): ExtractedData => {
  const $ = cheerio.load(htmlContent);
  const data: ExtractedData = {
    patient: {
      name: "",
      sex: "",
      date_of_birth: "",
      date_of_expiration: "",
      race: "",
      ethnicity: "",
      insurance_providers: "",
      patient_ids: "",
      address: {
        line1: "",
        city: "",
        state: "",
        zip: "",
        country: "",
      },
      telecom: {
        phone: "",
        email: "",
      },
    },
    assessments: {},
  };

  // Extract patient details
  $(".div-head-row.patient_narr_tr").each((_, elem) => {
    const patientDetails = $(elem);
    const heads = patientDetails.find(".div-table-head");

    // Iterate through the headers and find corresponding values
    for (let i = 0; i < heads.length; i += 2) {
      const label = $(heads[i]).find(".td_label").text().trim();
      const value = $(heads[i + 1])
        .text()
        .trim();

      switch (label) {
        case "Patient":
          data.patient.name = value;
          break;
        case "Sex":
          data.patient.sex = value.split(" - ")[1];
          break;
        case "Date of birth":
          data.patient.date_of_birth = value;
          break;
        case "Date of expiration":
          data.patient.date_of_expiration = value;
          break;
        case "Race":
          data.patient.race = value.split(" - ")[0].trim();
          break;
        case "Ethnicity":
          data.patient.ethnicity = value.split(" - ")[0].trim();
          break;
        case "Insurance Providers":
          data.patient.insurance_providers = value.split(" - ")[0].trim();
          break;
        case "Patient IDs":
          data.patient.patient_ids = value;
          break;
        case "Address":
          const addressElement = $(heads[i + 1]).find("address");
          const addressHtml = addressElement.html() || "";
          const addressLines = addressHtml.split("<br>");

          data.patient.address.line1 = addressLines[0];
          const cityStateZip = addressLines[1].split(" ");
          data.patient.address.city = cityStateZip
            .slice(0, -2)
            .join(" ")
            .trim();
          data.patient.address.state =
            cityStateZip[cityStateZip.length - 2].trim();
          data.patient.address.zip =
            cityStateZip[cityStateZip.length - 1].trim();

          if (addressLines[2]) {
            data.patient.address.country = addressLines[2].trim();
          }
          break;
        case "Telecom":
          const telecomInfo = value.split("(HP)");
          data.patient.telecom.phone = telecomInfo[1];
          data.patient.telecom.email = telecomInfo[2];
          break;
      }
    }
  });

  // Extract assessment details
  $(".panel.panel-default.patient-details").each((_, elem) => {
    const assessmentTitle = $(elem).find(".panel-title").text().trim();

    if (assessmentTitle) {
      $(elem)
        .find(".div-table-body .div-table-row.narr_tr")
        .each((_, rowElem) => {
          const assessment = $(rowElem);
          const description = assessment
            .find(".description-heading")
            .text()
            .trim();

          const codes: { [key: string]: string } = {};
          assessment
            .find('.div-table-cell-label:contains("Codes")')
            .siblings(".div-table")
            .find(".div-head-row")
            .each((_, codeElem) => {
              const codeText = $(codeElem).text().trim();
              const [codeKey, ...codeValue] = codeText.split(":");
              codes[codeKey.trim()] = codeValue.join(":").trim();
            });

          const timeElements: { [key: string]: string } = {};
          assessment
            .find('.div-table-cell-label:contains("Time Elements")')
            .siblings(".div-table")
            .find(".div-head-row")
            .each((_, timeElem) => {
              const timeText = $(timeElem).text().trim();
              const [key, value] = timeText.split(": ");
              if (key && value) {
                timeElements[key.trim()] = value.trim();
              }
            });

          const fieldsResults: { [key: string]: string } = {};
          assessment
            .find('.div-table-cell-label:contains("Other Fields")')
            .siblings(".div-table")
            .find(".div-head-row")
            .each((_, resultElem) => {
              const resultText = $(resultElem).text().trim();
              const [key, value] = resultText.split(": ");
              if (key && value) {
                fieldsResults[key.trim()] = value.trim();
              }
            });

          const assessmentData: Assessment = {
            description,
            codes,
            time_elements: timeElements,
            results: fieldsResults,
          };

          if (!data.assessments[assessmentTitle]) {
            data.assessments[assessmentTitle] = [];
          }

          data.assessments[assessmentTitle].push(assessmentData);
        });
    }
  });

  return data;
};

/**
 * Processes a directory of HTML files, extracting information from each file.
 *
 * @param {string} directory - The directory containing HTML files.
 * @returns {Promise<ExtractedData[]>} - A promise that resolves to an array of extracted data.
 */
export const processDirectory = async (
  directory: string
): Promise<ExtractedData[]> => {
  const allData: ExtractedData[] = [];
  const files = await fs.readdir(directory);

  // Filter and process only HTML files
  for (const file of files) {
    if (path.extname(file) === ".html") {
      const filePath = path.join(directory, file);
      const htmlContent = await fs.readFile(filePath, "utf-8");
      const extractedData = extractInformation(htmlContent);
      allData.push(extractedData);
    }
  }

  return allData;
};
