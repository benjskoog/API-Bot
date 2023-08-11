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
import { User, Conversation, Message, APIRequest, App as App_sql, UserApp, Documentation } from '../../database/models.js';
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

    async callAppAPI(method, path, body, baseApiUrl, userApp, tried) {

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