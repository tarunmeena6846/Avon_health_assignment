export interface Address {
  line1: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface Telecom {
  phone: string;
  email: string;
}

export interface Assessment {
  description: string;
  codes: {
    [key: string]: string;
  };
  time_elements: {
    [key: string]: string;
  };
  results: {
    [key: string]: string;
  };
}

export interface Patient {
  date_of_expiration: string;
  name: string;
  sex: string;
  date_of_birth: string;
  race: string;
  ethnicity: string;
  insurance_providers: string;
  patient_ids: string;
  address: Address;
  telecom: Telecom;
}

export interface ExtractedData {
  patient: Patient;
  assessments: { [key: string]: Assessment[] };
}

export type BreakdownResults = {
  race: Record<string, CategorizationResults>;
  ethnicity: Record<string, CategorizationResults>;
  payer: Record<string, CategorizationResults>;
  sex: Record<string, CategorizationResults>;
};

export type SummaryResults = {
  eligible: number;
  properlyScreened: number;
};

export type PatientData = {
  patient: Patient;
  assessments: Record<string, Assessment[]>;
};

export type CategorizationResults = {
  IPOP: PatientData[];
  DENOM: PatientData[];
  DENEX: PatientData[];
  NUMER: PatientData[];
  DENEXCEP: PatientData[];
};

export interface Assessment {
  description: string;
  codes: {
    [key: string]: string;
  };
  time_elements: {
    [key: string]: string;
  };
  results: {
    [key: string]: string;
  };
}
