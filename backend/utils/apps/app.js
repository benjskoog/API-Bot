import express from 'express';
import cors from "cors";
import axios from "axios";
import yaml from "js-yaml";
import dotenv from 'dotenv';
import pinecone from "../../database/pinecone.js";
import openai from "../openai.js";
import { get_encoding, encoding_for_model } from "@dqbd/tiktoken";
import bodyParser from "body-parser";
import { v4 as uuidv4 } from 'uuid'; // Add this import at the top
import { PineconeClient } from "@pinecone-database/pinecone";
import { User, Conversation, Message, Request, App as App_sql, UserApp, Documentation } from '../../database/models.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import url from 'url';
import qs from 'qs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (process.env.NODE_ENV === 'production') {
  dotenv.config({ path: path.resolve(__dirname, '../.env.prod') });
} else {
  dotenv.config({ path: path.resolve(__dirname, '../.env') });
}

const resolveRef = (schema, root) => {

  if (JSON.stringify(schema, null, 2).length > 3000) return schema;

  if (typeof schema !== 'object' || schema === null) return schema;
  if ('$ref' in schema) {
      const refPath = schema.$ref.split('/');
      let ref = root;
      for (const part of refPath) {
          if (part === '#') continue;
          ref = ref[part];
      }
      let resolved = resolveRef(ref, root);
      // If resolution failed due to token limit, return the original schema instead of partially resolved
      if (JSON.stringify(resolved, null, 2).length > 3000) return schema;
      return resolved;
  }

  for (const key of Object.keys(schema)) {
      let resolved = resolveRef(schema[key], root);
      // If resolution failed due to token limit, keep the original key-value pair instead of partially resolved
      if (JSON.stringify(resolved, null, 2).length > 3000) continue;
      schema[key] = resolved;
  }

  return schema;
}

function buildApiDocumentation(searchResults, docType, documentation) {

  // docType should be "full" or "summary"
  const { paths } = documentation;

  // Initialize empty variable to store enhanced API documentation
  let doc;

  // Initialize an empty array to hold the documentation strings
  let documentationStrings = [];

  try {

    searchResults.forEach(match => {
      const { metadata } = match;
      const { method, path } = metadata;

      // Find the corresponding path and method in the API documentation
      if (paths[path] && paths[path][method]) {
        let endpointInfo = paths[path][method];

        // Resolve the $ref in the endpoint info

        try {
          endpointInfo = resolveRef(endpointInfo, documentation);
        } catch (err) {
          `Failed to resolve base schema: ${err.message}`
        }

        let docString = `
          Path: ${path}
          Method: ${method.toUpperCase()}
          Summary: ${endpointInfo.summary}
          Description: ${endpointInfo.description}
        `;

        if (endpointInfo.parameters && docType === 'full') {
          // Resolve $refs in parameters
          const resolvedParameters = endpointInfo.parameters.map(param => resolveRef(param, documentation));
          docString += `
          Parameters: ${JSON.stringify(resolvedParameters, null, 2)}
          `;
        }

        if (docType === 'full') {
          doc = { path, method };
        }

        if (endpointInfo.requestBody && docType === 'full') {
          docString += `
          Request Body: ${JSON.stringify(endpointInfo.requestBody, null, 2)}
          `;
        }

        documentationStrings.push(docString);
      }
    });
    
  } catch (err) {
    console.error(`Failed to build API documentation: ${err.message}`);
  }

  const docString = documentationStrings.join("\n\n----------------------\n\n");

  return { doc, docString };
};

async function similaritySearch(userRequest, appName,topK){

  const embedding = await openai.createEmbedding(userRequest);

  const queryResponse = await pinecone.searchByApp(embedding, appName, topK);

  return queryResponse;

}

class App {
    constructor(app) {

      this.id = app.id;
      this.name = app.name;
      this.systemName = app.systemName;
      this.authType = app.authType;
      this.clientId = app.clientId;
      this.clientSecret = app.clientSecret;
      this.authUrl = app.authUrl;
      this.accessTokenUrl = app.accessTokenUrl;
      this.documentationUrl = app.documentationUrl;
      this.apiUrl = app.apiUrl;
      this.logoUrl = app.logoUrl;
      this.website = app.website;
      this.formFields = app.formFields;
        
    }
  
    
    // Tools for GPT
  async callAPI(method, path, body, baseApiUrl, userApp, tried) {

    const apiUrl = `${baseApiUrl}${path}`
  
    const headers = {
      "authorization": `Bearer ${userApp.accessToken}`,
      "accept": "application/json",
      "connection": "keep-alive"
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

        console.log(error);

        return null;
    }
  }

  async searchAPI(userRequest, userId) {

    try {
  
      // Gets userApp from db
      const userApp = await UserApp.findOne({
        where: {
          userId,
          appId: this.id,
        }
      });
  
      let searchString = userRequest;
  
  
      // Retrieve relevant API paths for the selected app
      const relevantDocs = await similaritySearch(searchString, this.name, 4);
  
      console.log(relevantDocs);
  
      // Check the similarity score of the highest scored doc for relevancy
      const minScore = 0.70;
      let apiDocumentation = "";
      let requestedDocs;
      const cannotFulfillRequest = "I am sorry, I cannot help with this request right now. Is there anything else I can help you with?";

      const documentation = await this.loadDocumentation();
  
      // Checks to see if the API documentation retrieval is relevant
      if (relevantDocs.matches[0].score > minScore) {
  
        // Builds API documentation based on similaritySearch results
        const apiEndpoints = buildApiDocumentation(relevantDocs.matches, "summary", documentation)
  
        requestedDocs = this.buildApiPrompt(userRequest, true, apiEndpoints.docString, userApp, "summary");
  
      } else {
  
        requestedDocs = this.buildApiPrompt(userRequest, false);
  
        const unsupportedResponse = openai.returnUnsupported(requestedDocs, "api");
  
        return unsupportedResponse
  
      }
      
      // GPT to decide whether to call the API endpoint or ask the user for more information
      const decision = await openai.chooseEndpoint(requestedDocs);
  
      console.log(JSON.stringify(decision));
  
      const decisionArgs = decision.args;
  
      // Checks if GPT called a function
      if (decisionArgs) {
  
        if (decision.func_name === "chooseAPIEndpoint") {
  
          const bestMatch = decisionArgs.order;
  
          console.log(bestMatch);
  
  
          // Expands documentation for the selected endpoint
          const apiDocumentation = buildApiDocumentation([relevantDocs.matches[bestMatch]], "full", documentation);
  
          console.log([relevantDocs.matches[bestMatch]]);
  
          // Builds prompt that GPT will use to call the API endpoint
          requestedDocs = this.buildApiPrompt(userRequest, true, apiDocumentation.docString, userApp, "full");

          // Gets enhanced API documentation from db
          let docs = apiDocumentation.doc;

          docs = await Documentation.findOne({
            where: {
              appId: this.id,
              path: docs.path,
              method: docs.method
            }
          });
  
          // Uncomment line below to return API documentation in chat for testing purposes
  
          return { requestedDocs, docs };
  
        } else {
  
          return cannotFulfillRequest;
  
        }
  
      }
  
    } catch (error) {
      console.error(`Failed to fulfill request: ${error.message}`);
      throw error;
    }
  
  }

  // Internal methods used by tools

  buildApiPrompt(userRequest, supported, apiDocumentation, userApp, type) {

    console.log(this.name)
  
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  
    let prompt = "";
  
    if (supported === true){
  
      if (type === "summary") {
  
        prompt = `The following is a user's request to interact with ${this.name} on ${dateStr}. \n`;
  
        prompt += `User request: ${userRequest} \n`;
  
        prompt += "Read the user's request carefully and select the most relevant endpoint below. Check your work: \n";
    
        // userApp ? prompt += ` The user's ID in ${selectedApp.name} is ${userApp.appUserId}. Only use this where the documentation states to explicitly use the user's ID. \n` : "";
  
      } else {
        prompt += `Here is API documentation you can use to call ${this.name}'s API: \n`
      }
  
      prompt += `${apiDocumentation} \n`;
  
    } else {
  
      prompt = prompt + `The request is not supported by the API. Please inform the user. You can also answer their question if it is unrelated to the platform or the API.`;
  
    }
  
    console.log(prompt);
  
    return prompt;
    
  }

  // Methods for auth and API documentation management
  async refreshAuth(userApp) {

      const app = await UserApp.findOne({ where: { id: userApp.id } });

      const postUrl = await this.getAccessUrl(userApp.userInputs);

      // console.log(app);

      const tokenResponse = await axios({
          method: 'post',
          url: postUrl,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          data: qs.stringify({
            grant_type: 'refresh_token',
            refresh_token: userApp.refreshToken,
            client_id: this.clientId,
            client_secret: this.clientSecret,
            redirect_uri: `${process.env.NGROK_TUNNEL}/api/oauth/${this.id}`
          })
        });

        const { access_token, refresh_token, expires_in } = tokenResponse.data;

        console.log(tokenResponse.data);

        app.accessToken = access_token;
        app.refreshToken = refresh_token;
        app.expiresAt = expires_in;
    
        await app.save();

        return { accessToken: access_token };
      
  }
    
  async Authenticate() {

      try {
        // exchange code for access token
        const tokenResponse = await axios({
          method: 'post',
          url: 'https://oauth2.example.com/token',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          auth: {
            username: CLIENT_ID,     // Use your client Id
            password: CLIENT_SECRET  // Use your client Secret
          },
          data: qs.stringify({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: 'http://localhost:3000/apps'  // Use your redirect_uri
          })
        });
    
        const { access_token, refresh_token, expires_in } = tokenResponse.data;
    
        // save tokens in your database associated with the user
    
        // redirect to a page in your application, possibly passing along some info
        res.redirect('/apps');
    
      } catch (error) {
        console.error('Error in OAuth callback', error);
        res.status(500).send('Error in OAuth callback');
      }

  }

  async getAuthUrl(userInputs, userId) {
    const userInputsArray = typeof userInputs === 'object' && userInputs !== null && !Array.isArray(userInputs)
      ? Object.keys(userInputs).map(field => ({ ...userInputs[field], name: field }))
      : [];
  
    let domainUrl = this.authUrl; // Default value
    let scopesString;
    let queryParams = {};
  
    if (userInputsArray.length > 0) {
      for (let field of userInputsArray) {
        if (field?.forAuth === true) {
          domainUrl = field.value; // Use user's domain if provided
        }
  
        if (field.name === "scopes") {
          scopesString = field.value.join(' ');
        }
  
        if (field.name === "queryParameters") {
          queryParams = Object.fromEntries(field.value.map(f => [f.name, f.value]));
        }
      }
    }
  
    const authUrl = new URL(domainUrl);
    authUrl.pathname = new URL(this.authUrl).pathname; // Use the path from the base authUrl
    authUrl.search = ''; // Clear all existing search parameters
  
    authUrl.searchParams.append('client_id', this.clientId);
    authUrl.searchParams.append('redirect_uri', `${process.env.NGROK_TUNNEL}/api/oauth/${this.id}`);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('state', userId);
  
    if (scopesString) {
      authUrl.searchParams.append('scope', scopesString);
    }
  
    for (const [key, value] of Object.entries(queryParams)) {
      authUrl.searchParams.append(key, value);
    }
  
    console.log(authUrl.toString());
  
    return authUrl.toString();
  }  

  async getAccessUrl(userInputs) {
    const userInputsArray = typeof userInputs === 'object' && userInputs !== null && !Array.isArray(userInputs)
      ? Object.keys(userInputs).map(field => ({ ...userInputs[field], name: field }))
      : [];
  
    let domainUrl = this.accessTokenUrl; // Default value
  
    if (userInputsArray.length > 0) {
      for (let field of userInputsArray) {
        if (field?.forAccess === true) {
          domainUrl = field.value; // Use user's domain if provided
        }
      }
    }
  
    const accessTokenUrl = new URL(domainUrl);
    accessTokenUrl.pathname = new URL(this.accessTokenUrl).pathname; // Use the path from the base accessTokenUrl
  
    console.log(accessTokenUrl.toString());
  
    return accessTokenUrl.toString();
  }

  async getDomainUrl(userInputs) {
    const userInputsArray = typeof userInputs === 'object' && userInputs !== null && !Array.isArray(userInputs)
      ? Object.keys(userInputs).map(field => ({ ...userInputs[field], name: field }))
      : [];
  
    let domainUrl = null;
  
    if (userInputsArray.length > 0) {
      for (let field of userInputsArray) {
        if (field?.forAccess === true) {
          domainUrl = field.value; // Use user's domain if provided
        }
      }
    }
  
    if (domainUrl) {
      // Create a URL object
      const parsedUrl = new URL(domainUrl);
  
      // Convert the URL object to string and strip any trailing '/'
      domainUrl = parsedUrl.toString().endsWith('/')
        ? parsedUrl.toString().slice(0, -1)
        : parsedUrl.toString();
    }
  
    console.log(domainUrl);
    return domainUrl;
  }  

  async getApiUrl(userApp) {

    return this.apiUrl;

  }

  async getUserId(data) {


  }

  async createDocumentation(app, appName) {
    const response = await axios.get(app.documentationUrl);
    let documentation;
  
    if (typeof response.data === "object") {
        documentation = response.data;
    } else {
        documentation = yaml.load(response.data);
    }
  
    const { paths } = documentation;

    const validHttpMethods = ["get", "post", "put", "delete", "patch", "options", "head"];
  
    for (let path in paths) {
        const methods = paths[path];
      
        for (let method in methods) {
            if (validHttpMethods.includes(method.toLowerCase())) {
                const methodData = methods[method];
                const description = methodData.description;
                const summary = methodData.summary;

                const inputString = `Path:${path} 
                                    Method: ${method.toUpperCase()} 
                                    Summary: ${summary}
                                    Description: ${description}`;
                
                const embedding = await openai.createEmbedding(inputString);
                
                const metadata = {
                    path,
                    method,
                    description,
                    summary,
                    app: app.name,
                };

                const id = uuidv4();
                
                const upsertResponse = await pinecone.upsertSingle({
                    id,
                    embedding,
                    metadata,
                });
                
                console.log(upsertResponse);

                // Insert a documentation record using Sequelize
                const documentationRecord = {
                  vecId: id,
                  type: "API",
                  path: path,
                  method: method,
                  summary: summary,
                  botSummary: null,
                  description: description,
                  botDescription: null,
                  specification: methodData,
                  next: null,
                  appId: app.id,
              };

              await Documentation.create(documentationRecord);
            }
        }
    }
  
    return documentation;
};

  async updateDocumentation(documentation) {

    const summary = documentation.botSummary ? documentation.botSummary : documentation.summary;
    const description = documentation.botDescription ? documentation.botDescription : documentation.description;

    const inputString = `Path:${documentation.path}\nMethod: ${documentation.method}\nSummary: ${summary}\nDescription: ${description}`;

    console.log(inputString);
                
    const embedding = await openai.createEmbedding(inputString);
    
    const metadata = {
        path: documentation.path,
        method: documentation.method,
        description,
        summary,
        app: this.name,
        botEnabled: true
    };

    console.log(metadata);

    console.log(documentation.vecId);

    const upsertResponse = await pinecone.updateById({
      id: documentation.vecId,
      embedding,
      metadata,
    });

    return upsertResponse;

  }


  async loadDocumentation() {

    const documentation = await Documentation.findOne({
      where: {
        appId: this.id,
        type: "full"
      }
    });

    return documentation.specification;
  }
  

}


export default App;