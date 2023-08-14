import express from 'express';
import cors from "cors";
import axios from "axios";
import yaml from "js-yaml";
import dotenv from 'dotenv';
import { Configuration, OpenAIApi } from "openai";
import { get_encoding, encoding_for_model } from "@dqbd/tiktoken";
import bodyParser from "body-parser";
import { PineconeClient } from "@pinecone-database/pinecone";
import { User, Conversation, Message, Request, App as App_sql, UserApp, Documentation } from '../../database/models.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import url from 'url';
import App from "./app.js"
import e from 'express';
import qs from 'qs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (process.env.NODE_ENV === 'production') {
  dotenv.config({ path: path.resolve(__dirname, '../.env.prod') });
} else {
  dotenv.config({ path: path.resolve(__dirname, '../.env') });
}

class Asana extends App {
    constructor(app) {
        super(app)   
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
            
            return response.data;
        } catch (error) {

            console.log(error.response.statusText);
            console.log(error.response.status);
            console.log(tried);

            if (error.response.statusText === "Unauthorized" && error.response.status === 401 && !tried) {
                console.log("retrying");
                const refreshedApp = await this.refreshAuth(userApp);

                this.callAppAPI(method, path, body, baseApiUrl, refreshedApp, true);

            } else {
                console.error(`Error occurred while calling the API: ${error}`);
                console.log(error);
            }
            return null;
        }
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

    async getUserId(data) {
        return data.data.id;
    }
  

}


export default Asana;