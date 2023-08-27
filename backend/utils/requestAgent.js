import express from 'express';
import cors from "cors";
import axios from "axios";
import yaml from "js-yaml";
import dotenv from 'dotenv';
import pinecone from "../database/pinecone.js";
import openai from "./openai.js";
import { get_encoding, encoding_for_model } from "@dqbd/tiktoken";
import bodyParser from "body-parser";
import { v4 as uuidv4 } from 'uuid'; // Add this import at the top
import { PineconeClient } from "@pinecone-database/pinecone";
import { User, Conversation, Message, Request, App as App_sql, UserApp, Documentation } from '../database/models.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import url from 'url';
import qs from 'qs';

// Utils
import appManager from "../utils/apps/index.js"


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (process.env.NODE_ENV === 'production') {
  dotenv.config({ path: path.resolve(__dirname, '../.env.prod') });
} else {
  dotenv.config({ path: path.resolve(__dirname, '../.env') });
}

function extractKeysAndTypes(obj) {
  let keysList = [];
  for (let key in obj) {
      const dataType = Array.isArray(obj[key]) ? 'array' : typeof obj[key];
      keysList.push({ key: key, type: dataType });
  }
  return keysList;
}

function getValueFromPath(obj, path) {
  const keys = path.split('.');
  let currentValue = obj;

  for (let key of keys) {
    if (currentValue[key] !== undefined) {
      currentValue = currentValue[key];
    } else {
      return null; // If any key in the path isn't found, return null.
    }
  }

  return currentValue;
}

function getUserData(data, userFields, linkFields) {
  const keys = linkFields ? [...userFields, ...linkFields] : userFields;

  const userData = [];

  for (let item of data) {
    let newItem = {};
    for (let key of Object.keys(item)) {
      if (keys.includes(key)) {
        newItem[key] = item[key];
      }
    }
    userData.push(newItem);
  }

  return userData;

}



class RequestAgent {
    constructor(request) {

      this.id = request.id;
      this.request;
      this.app = request.app;
      this.conversation = request.conversation;
      this.tasks;
      this.userId = request.userId;
      this.currentMessage = request.userMessage;
      this.optimizedRequest = request.optimizedRequest;
      this.docString = request.docString;

    }

  async init() {

    // Get request if it exists
    let userRequest;

    if (this.id) {
      userRequest = await Request.findByPk(this.id);
    }

    if (!userRequest) {
      userRequest = await Request.create({
        userRequest: this.currentMessage,
        conversationId: this.conversation.id,
        userId: this.userId
      });

      // Create request and set ID
      this.request = userRequest;
      this.id = userRequest.id;
    }

    const handleApp = appManager.getApp(this.app);

    // Get API documentation and tasks if they exist
    try {
 
      const apiDocumentation = await handleApp.searchAPI(this.optimizedRequest, this.userId)

      if (apiDocumentation.docs) {
        
        userRequest.documentationId = apiDocumentation.docs.id;

        userRequest.docString = this.docString = apiDocumentation.requestedDocs;

      }

      if (apiDocumentation.docs.next) {
        
        userRequest.tasks = this.tasks = apiDocumentation.docs.next;

      }

      await userRequest.save();

      return await this.fulfill();

    } catch (e) {
      console.error(e);
    }
    
  }
  
  async fulfill() {

    const handleApp = appManager.getApp(this.app);

    const userRequest = await Request.findByPk(this.id);
    
    const userApp = await UserApp.findOne({
      where: {
        userId: this.userId,
        appId: this.app.id,
      }
    });

      if (!this.id) {
        return await this.init();
      }

      if (!this.tasks) {

        // If no tasks on the documentation, fall back to simply calling the endpoint. 
        
        // GPT builds API request
        
        const apiCall = await openai.getAPICall(this.docString, this.app, userApp, this.userId);

        const apiArgs = apiCall.args;

         console.log(apiArgs);

        if (apiArgs) {

          if (!userRequest.endpoint) userRequest.endpoint = `${apiArgs.method} ${apiArgs.path}`;
          if (!userRequest.requestPayload) userRequest.requestPayload = apiArgs.body;

          // Calls the selected Apps API with the request built by GPT
          const apiResponse = await handleApp.callAPI(apiArgs.method, apiArgs.path, apiArgs.body, this.app.apiUrl, userApp);

          if (apiArgs.method === 'GET') {

            // Use GPT to select the key with the data
            const keysAndTypes = extractKeysAndTypes(apiResponse);

            console.log(keysAndTypes);

            const returnData = await openai.returnData(keysAndTypes, "GET");

            const data = getValueFromPath(apiResponse, returnData.args.path);

            // Use GPT to select user facing fields from API call response
            const dataSchema = extractKeysAndTypes(data[0]);

            const userSchema = await openai.getUserData(dataSchema);

            const userData = getUserData(data, userSchema.args.userFields, userSchema.args.linkFields);

            if (!userRequest.responsePayload) userRequest.responsePayload = { data, userData };

            await userRequest.save();

            const responseForUser = "Here is the data you requested: "

            return { responseForUser, requestData: { data, userData } };

          }

        }
      } else {

      }

  }
  
    
  // Tools for GPT
  async callAppAPI(method, path, body, baseApiUrl, userApp, tried) {

  }

  async searchAppAPI(userRequest, documentation, numPass, apiRequest, selectedApp, userId) {

  }
}


export default RequestAgent;