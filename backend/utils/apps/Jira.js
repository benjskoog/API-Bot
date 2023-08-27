import express from 'express';
import cors from "cors";
import axios from "axios";
import yaml from "js-yaml";
import dotenv from 'dotenv';
import { Configuration, OpenAIApi } from "openai";
import { get_encoding, encoding_for_model } from "@dqbd/tiktoken";
import bodyParser from "body-parser";
import { PineconeClient } from "@pinecone-database/pinecone";
import { User, Conversation, Message, Request } from '../../database/models.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import url from 'url';
import App from "./app.js"

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (process.env.NODE_ENV === 'production') {
  dotenv.config({ path: path.resolve(__dirname, '../.env.prod') });
} else {
  dotenv.config({ path: path.resolve(__dirname, '../.env') });
}

class Jira extends App {
    constructor(app) {
        super(app)   
    }
  // Tools for GPT
  async callAPI(method, path, body, baseApiUrl, userApp, tried) {

    const apiUrl = `${userApp.apiUrl}${path}`
  
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

        if (error.response?.status === 401 && !tried) {
            console.log("retrying");
            const refreshedApp = await this.refreshAuth(userApp);

            this.callAPI(method, path, body, userApp.apiUrl, refreshedApp, true);

        } else {
            console.error(`Error occurred while calling the API: ${error}`);
            // console.log(error);
        }
        return null;
    }
  }

  // Methods for auth and API documentation management
  async getApiUrl(accessToken) {

    console.log("Jira");
  
    let apiUrl = this.apiUrl; 

    try {
        const response = await axios.get("https://api.atlassian.com/oauth/token/accessible-resources", {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              "Accept" : "application/json"
            }
          })

        console.log(response)
        const cloudId = response.data[0].id;

        apiUrl = `https://api.atlassian.com/ex/jira/${cloudId}`

        console.log(apiUrl);

        return apiUrl;

      } catch (error) {

        console.error('Error creating Jira API Url', error);

      }

  }

  async getUserId(data) {

    const accessToken = data["access_token"];

    try {
      const response = await axios.get("https://api.atlassian.com/me", {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            "Accept" : "application/json"
          }
        })

      console.log(response)

      const userAppId = response.data["account_id"];

      return userAppId;

    } catch (error) {

      console.error('Error getting Jira User ID', error);

    }


  }
  

}


export default Jira;