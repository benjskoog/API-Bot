import express from 'express';
import cors from "cors";
import axios from "axios";
import yaml from "js-yaml";
import dotenv from 'dotenv';
import { Configuration, OpenAIApi } from "openai";
import { get_encoding, encoding_for_model } from "@dqbd/tiktoken";
import bodyParser from "body-parser";
import { PineconeClient } from "@pinecone-database/pinecone";
import { User, Conversation, Message, APIRequest } from './models.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path'
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (process.env.NODE_ENV === 'production') {
  dotenv.config({ path: path.resolve(__dirname, '../.env.prod') });
  console.log("prod")
} else {
  dotenv.config({ path: path.resolve(__dirname, '../.env') });
  console.log("dev")
}

const pinecone = new PineconeClient();

const init = await pinecone.init({
    environment: "us-west4-gcp",
    apiKey: process.env.PINECONE_API_KEY,
});

const index = pinecone.Index("cmpbot");

const indexDescription = await pinecone.describeIndex({
  indexName: "cmpbot",
});

class Pinecone {
    constructor(){

        this.client = init;
        this.index = index;
        this.indexDescription = indexDescription;

    }

    async upsertSingle({ id, embedding, metadata }) {
      const upsertResponse = await index.upsert({
        upsertRequest: {
          vectors: [
            {
              id,
              values: embedding,
              metadata,
            }
          ]
        }
      });

      return upsertResponse;
    }

    async upsertBatch(vectors) {
        const upsertResponse = await index.upsert({
            upsertRequest: {
            vectors
            }
        });

        return upsertResponse;
    }

    async similaritySearch(embedding, topK){
      
        const queryRequest = {
          vector: embedding,
          topK: topK,
          includeValues: true,
          includeMetadata: true,
        };
        const queryResponse = await index.query({ queryRequest });
      
        console.log(queryResponse);
      
        return queryResponse;
      
    }


}

export default Pinecone