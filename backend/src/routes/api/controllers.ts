//import express from 'express';
//import { config } from './config/env.js';

import { Router } from "express";

import { streamAnswer } from '../../rag/raglib.js';
import { type ChatTurn } from '../../../../shared/raq/types.js';
import { RagDocument } from "../../rag/types.js";

export const apiRouter = Router();

apiRouter.post("/chat", async (req, res) => {
  const { message, history = [] } = req.body as {
    message?: string;
    history?: ChatTurn[];
  };

  if (!message?.trim()) {
    return res.status(400).json({ error: "message is required" });
  }

  res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");

  try {
    await streamAnswer(message.trim(), history, res);
  } catch (error) {
    console.error("Error in /api/chat:", error);

    res.write(
      JSON.stringify({
        type: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      }) + "\n"
    );

    res.end();
  }
});

function displayTypeFromMimeType(mimeType: string | undefined): string {
  switch (mimeType) {
    case "text/plain":
      return "TXT";
    case "text/markdown":
      return "MD";
    case "application/pdf":
      return "PDF";
    default:
      return mimeType ?? "FILE";
  }
}

apiRouter.get("/documents", async (_req, res, next) => {
  try {
    //console.log("YYYYY");
    const documents = await RagDocument.find()
      .select({
        id: 1,
        title: 1,
        "media.mimeType": 1,
        "media.data": 1,
        authors: 1,
        _id: 0,
      })
      .sort({ title: 1 })

      //.lean();

      //console.log("ZZZZZ");

    const items = documents.map((doc) => ({
      id: doc.id,
      title: doc.title,
      authors: doc.authors,
      type: displayTypeFromMimeType(doc.media.mimeType),
      //hasMedia: ((doc.media?.data as Buffer | undefined)?.length ?? 0) > 0,
      hasMedia: (doc.media?.data?.length ?? 0) > 0,
    }));

    //for(const doc of documents) {
    //  console.log(doc.id," -- ",doc.media.data.length);
    //}

    //console.log(items);

    res.json(items);
  } catch (error) {
    next(error);
  }
});

apiRouter.get("/documents/:id/media", async (req, res, next) => {
  try {
    const document = await RagDocument.findOne({ id: req.params.id })
      .select({
        id: 1,
        media: 1,
        _id: 0,
      });


    if (!document) {
      res.status(404).json({ message: "Document not found" });
      return;
    }

    //console.log(document)


    if (!document.media?.data || document.media.data.length === 0) {

      res.status(404).json({ message: "No media file for this document " });
      return;
    }

    const mimeType = document.media.mimeType || "application/octet-stream";
    const fileName =  `${document.id}-media`;

    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);

    /*
    console.log("mime:", document.media.mimeType);
    console.log("isBuffer:", Buffer.isBuffer(document.media.data));
    console.log("data:", document.media.data);
    console.log("typeof:", typeof document.media.data);
   */

    res.send(document.media.data);
  } catch (error) {
    next(error);
  }
});


apiRouter.get("/documents/:id/txt", async (req, res, next) => {
  try {
    const document = await RagDocument.findOne({ id: req.params.id })
      .select({
        id: 1,
        extractedText: 1,
        _id: 0,
      });


    if (!document) {
      res.status(404).json({ message: "Document not found" });
      return;
    }

    //console.log(document)


    if (!document.extractedText || document.extractedText.length === 0) {

      res.status(404).json({ message: "No txt file for this document - internal error " });
      return;
    }

    const mimeType = "text/plain";
    const fileName =  `${document.id}-txt`;

    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);

    res.send(document.extractedText);
  } catch (error) {
    next(error);
  }
});