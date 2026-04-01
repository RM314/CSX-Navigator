import { buildIndex, answer, listModels } from "./rag/raglib.js";



async function main() {
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

    case "models":
      await listModels();
      break;

    default:
      console.log("Usage:");
      console.log("  npx tsx rag-pipeline-lmstudio.ts models");
      console.log("  npx tsx rag-pipeline-lmstudio.ts index");
      console.log('  npx tsx rag-pipeline-lmstudio.ts ask "What is CSX?"');
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
