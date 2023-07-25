import express from 'express';
import cors from "cors";
import axios from "axios";
import yaml from "js-yaml";
import dotenv from 'dotenv';
import { Configuration, OpenAIApi } from "openai";
import { get_encoding, encoding_for_model } from "@dqbd/tiktoken";
import bodyParser from "body-parser";
import { PineconeClient } from "@pinecone-database/pinecone";
import { User, Conversation, Message, APIRequest } from '../database/models.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
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



class Platform {
    constructor(platform) {

        this.name = platform.name;
        this.documentation = platform.documentation;
        
    }


    async callPlatformAPI(method, path, body) {

        const apiUrl = `https://api.welcomesoftware.com/v3${path}`
      
        const headers = {
          "Authorization": `Bearer ${process.env.CMP_ACCESS_KEY}`,
          "Accept": "application/json",
          "Connection": "keep-alive"
        };
      
        console.log(JSON.stringify({method, apiUrl, headers, body}));
      
        try {
            const response = await axios({
                method,
                url: apiUrl,
                headers,
                data: body
            });
      
            console.log(response.data);
            
            return response.data;
        } catch (error) {
            console.error(`Error occurred while calling CMP API: ${error}`);
            return null;
        }
      }

}


export default Platform;