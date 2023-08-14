import express from 'express';
import cors from "cors";
import axios from "axios";
import yaml from "js-yaml";
import dotenv from 'dotenv';
import pinecone from "../../database/pinecone.js";
import openai from "../openai.js";
import { get_encoding, encoding_for_model } from "@dqbd/tiktoken";
import bodyParser from "body-parser";
import { PineconeClient } from "@pinecone-database/pinecone";
import { User, Conversation, Message, Request, App as App_sql, UserApp, Documentation } from '../../database/models.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import url from 'url';
import qs from 'qs';
import App from "./app.js"

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (process.env.NODE_ENV === 'production') {
  dotenv.config({ path: path.resolve(__dirname, '../.env.prod') });
} else {
  dotenv.config({ path: path.resolve(__dirname, '../.env') });
}

class Salesforce extends App {
    constructor(app) {
        super(app)   
    }
      
    // Methods for auth and API documentation management
    async createDocumentation(documentationUrl, appName, userApp) {

        const domainUrl = await this.getDomainUrl(userApp.userInputs);

        const headers = {
            "Authorization": `Bearer ${userApp.accessToken}`,
            "Content-Type": "application/json",
            "Accept": "*/*",
            "Connection": "keep-alive"
        };

        try {
            const docUrl = await axios({
                method: 'post',
                url: `${domainUrl}/services/data/v58.0/async/specifications/oas3`,
                data: { "resources": ["*"] },
                headers: headers
            });

            console.log(docUrl);

            const docs = await axios({
                method: 'get',
                url: `${domainUrl}services/data${docUrl.data.href}`,
                headers: headers
            });

            console.log(docs.data);

            const documentation = docs.data;
      
            const { paths } = documentation;
          
            console.log(Object.keys(paths).length);
          
            for (let path in paths) {
              const methods = paths[path];
              
              for (let method in methods) {
                const methodData = methods[method];
                const description = methodData.description;
                const summary = methodData.summary;
          
                // Create a string that includes the path, method, and description
                const inputString = `Path:${path} 
                                     Method: ${method.toUpperCase()} 
                                     Summary: ${summary}
                                     Description: ${description}`;
          
                // Replace with class
                const embedding = await openai.createEmbedding(inputString);
          
                // Construct metadata
                const metadata = {
                  path,
                  method,
                  description,
                  summary,
                  app: appName
                };
          
                // Upload the vector embedding to Pinecone
                const upsertResponse = await pinecone.upsertSingle({
                  id: `${path}-${method}`,
                  embedding,
                  metadata,
                });
                
                console.log(upsertResponse);
              }
            }
          
            return documentation;

        } catch (error) {
            console.log(error.response);
        }
      
      };

      async getApiUrl(userApp) {

        let apiUrl = await this.getDomainUrl(userApp.userInputs);

        apiUrl = `${apiUrl}/services/data/v58.0`

        return apiUrl;
    
      }

      async loadDocumentation() {

        let documentation = await Documentation.findOne({
            where: {
              appId: this.id,
            }
          });
    
          documentation = documentation.specification;

          return documentation;
      }


}


export default Salesforce;