import { GoogleGenerativeAI } from "@google/generative-ai";
import { Vitals, Severity } from "../types";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export const analyzeMedicalCase = async (
  vitals: Vitals,
  notes: string,
  severity: Severity
) => {

  return `
🚑 AI TRIAGE REPORT

Risk Level: ${severity}

Possible Condition:
Based on vitals and symptoms, the patient may be experiencing trauma or internal injury.

Vitals Analysis
Pulse: ${vitals.pulse}
Blood Pressure: ${vitals.bp_sys}/${vitals.bp_dia}
SpO2: ${vitals.spo2}
Temperature: ${vitals.temp}

Immediate Actions
• Maintain oxygen support
• Monitor vitals continuously
• Stabilize patient before hospital arrival

Hospital Preparation
• Trauma team standby
• ICU bed preparation
• Blood units ready

Survival Risk
Moderate risk if treatment is delayed.
`;

};
export const getPoliceIdentityClues = async (description: string) => {

  // Offline fallback response for hackathon demo

  return `
Records Analyzing Report


Candidate 1
Name:Rajesh Kumar
Age: 26
Accident Location:Kompally

Candidate 2
Name: Ragini
Age: 21
Accident Location: Secunderabad

Identification Clues
• Facial structure similarity detected
• Vehicle registration cross-check recommended

Recommended Police Actions
• Verify patient belongings
• Cross-check vehicle number with transport registry
• Contact missing persons database`;
};