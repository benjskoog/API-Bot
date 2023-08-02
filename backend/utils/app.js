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
import url from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (process.env.NODE_ENV === 'production') {
  dotenv.config({ path: path.resolve(__dirname, '../.env.prod') });
  console.log("prod")
} else {
  dotenv.config({ path: path.resolve(__dirname, '../.env') });
  console.log("dev")
}



class App {
    constructor(app) {

      this.id = app.id;
      this.name = app.name;
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

    async callAppAPI(method, path, body) {

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

  async createAuthURL(userInputs, userId) {
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
    authUrl.searchParams.append('redirect_uri', `https://24fd-136-29-96-224.ngrok-free.app/api/oauth/${this.id}`);
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

  async createAccessURL(userInputs) {
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
  

}


export default App;