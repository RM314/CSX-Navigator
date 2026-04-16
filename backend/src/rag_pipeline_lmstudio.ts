import { buildIndex, answer, listModels, disconnectDb} from "./rag/raglib.js";

import path from "node:path";


async function main() {
  try {
    const [command, ...rest] = process.argv.slice(2);

    switch (command) {
      case "index":
        await buildIndex();
        break;

      case "ask": {
        const question = rest.join(" ").trim();
        if (!question) {
          throw new Error('Usage: npx tsx rag-pipeline-lmstudio.ts ask "Your question here"');
        }
        await answer(question);
        break;
      }

      case "models": {
        await listModels();
        break;
      }

      /*
      // extracts txt from pdf
      case "extract": {

        const inputFile = rest[0];
        if (!inputFile) {
          throw new Error('Usage: npx tsx script.ts pdf "datei.pdf"');
        }

        if (path.extname(inputFile).toLowerCase() !== ".pdf") {
          throw new Error(`Input file must be a PDF: "${inputFile}"`);
        }

        const outputFile = inputFile.replace(/\.pdf$/i, ".txt");
        const text = await extractPDF(inputFile, outputFile);

        console.log(`Converted "${inputFile}" -> "${outputFile}"`);
        console.log(text);
        break;
      } */

      default:
        console.log("Usage:");
        console.log("  npx tsx rag-pipeline-lmstudio.ts models");
        console.log("  npx tsx rag-pipeline-lmstudio.ts index");
        console.log('  npx tsx rag-pipeline-lmstudio.ts ask "What is CSX?"');
        //console.log("  npx tsx rag-pipeline-lmstudio.ts extract $pdfFile");
    }
  } finally {
    disconnectDb();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
