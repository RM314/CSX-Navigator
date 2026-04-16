/*

import pdf from "pdf-parse"; // irgendwas mit legacy-peers
import fs from "node:fs/promises";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function cleanPdfText(text: string): string {

  return text
    // Zeilenenden normalisieren
    .replace(/\r\n/g, "\n")

    // Silbentrennung über Zeilenende reparieren:
    // "Entwick-\nlung" -> "Entwicklung"
    .replace(/([A-Za-zÄÖÜäöüß])-\n([A-Za-zÄÖÜäöüß])/g, "$1$2")

    // reine Seitenzahlen entfernen
    .replace(/^\s*\d+\s*$/gm, "")

    // Leerzeichen am Zeilenende weg
    .replace(/[ \t]+\n/g, "\n")

    // Absätze erkennen:
    // einzelne \n innerhalb eines Absatzes -> Leerzeichen
    .split(/\n\s*\n/)
    .map((paragraph) =>
      paragraph
        .replace(/\n/g, " ")
        .replace(/[ \t]+/g, " ")
        .trim(),
    )
    .filter(Boolean)

    // Absätze wieder mit Leerzeile zusammensetzen
    .join("\n\n")

    // zu viele Leerzeilen vermeiden
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function extractPDF( inputFile: string, outputFile?: string): Promise<string> {
  try {
    const pdfBuffer = await fs.readFile(inputFile);
    const result = await pdf(pdfBuffer);

    const rawText = result.text ?? "";
    const text=cleanPdfText(rawText);
    if (outputFile) {
      await fs.writeFile(outputFile, text, "utf8");
    }
    return text;
  } catch (error) {
    throw new Error(
      `PDF extraction failed for "${inputFile}": ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

*/