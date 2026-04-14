import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
//import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
//import { MongoClient } from 'mongodb';
//import { getEmbedding } from './get-embeddings.js';
import * as fs from 'fs';

import { writeFile } from "node:fs/promises";
import { writeFileSync } from "node:fs";

async function run() {
    //const client = new MongoClient(process.env.MONGODB_URI);

    const loader = new PDFLoader(`investor-report.pdf`);
        const data = await loader.load();

        //console.log(data);
        for (let i = 0; i < data.length; i++) {
            writeFileSync(`datei_${i}.txt`,data[i].pageContent, "utf8");
        }
        //for (const d of data) {
        //    console.log(d.pageContent);
       // }

    //writeFileSync("output.txt", data[0].pageContent, "utf8");


}
run().catch(console.dir);
