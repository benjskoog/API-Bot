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

const openaiConfig = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(openaiConfig);

const tokenizer = encoding_for_model("gpt-3.5-turbo");

class OpenAI {
    constructor() {

        this.decideFunctions = [
          {
            "name": "chooseAPIEndpoint",
            "description": "From the provided endpoints, select the relevant API endpoint by calling this function.",
            "parameters": {
              "type": "object",
              "properties": {
                "order": {
                  "type": "integer",
                  "description": "Out of the list of endpoints provided, the order of the correct endpoint. The list starts with 0."
                }
              },
              "required": ["order"]
            }
          },
          {
            "name": "getMoreInfo",
            "description": "If none of the endpoints are relevant or the request is not clear, gets additional information from API documentation or user.",
            "parameters": {
              "type": "object",
              "properties": {
                "source": {
                  "type": "string",
                  "enum": ["user", "documentation"],
                  "description": "Source of the information."
                },
                "question": {
                    "type": "string",
                    "description": "Ask for the required information."
                }
              },
              "required": ["source", "question"]
            }
          }
        
        ]

        this.getAPIcallFunctions = [{

            "name": "callPlatformAPI",
            "description": "Use this function to call the Platform API",
            "parameters": {
              "type": "object",
              "properties": {
                "method": {
                  "type": "string",
                  "description": "The HTTP method to call. Accepts GET, POST, PUT, PATCH, DELETE."
                },
                "path": {
                  "type": "string",
                  "description": "The API path. Will be appended to the base API URL. Include path parameters and query parameters where appropriate."
                },
                "body": {
                  "type": "object",
                  "description": "The JSON request body to be sent with the API request. Required for certain endpoints."
                }
                
              },
              "required": ["method", "path"]
            }
          }]
    
        
    }

    async decide(request) {

        const inputString = "You are the Optimizely Content Marketing Platform co-pilot. You will take a user's request and output a JSON object adhering to the attached functions signature. This function will decide which API endpoint to call."

        + request + JSON.stringify(this.decideFunctions);

        console.log(tokenizer.encode(inputString).length);

        const decision = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [{"role": "system", "content": "You are the Optimizely Content Marketing Platform co-pilot. You will take a user's request and output a JSON object adhering to the attached functions signature. This function will decide which API endpoint to call."}, 
            {role: "user", content: request}],
            functions: this.decideFunctions
        });

        if (decision.data.choices[0].message.function_call) {

            console.log(`function decision: ${JSON.stringify(decision.data.choices[0].message.function_call)}`);

            const { arguments: functionArgs } = decision.data.choices[0].message.function_call;
      
            const args = JSON.parse(functionArgs);
      
            const func_name = decision.data.choices[0].message.function_call.name;

            console.log(`function decision: ${JSON.stringify({ func_name, args })}`);

            return { func_name, args }

        } else {

            return { response: decision.data.choices[0].message.content }

        }
    }

    async getAPICall(request) {

        const inputString = "You are the Optimizely Content Marketing Platform co-pilot. You will take a user's request and output a JSON object adhering to the attached functions signature. This function will decide which API endpoint to call."

        + request + JSON.stringify(this.getAPIcallFunctions);

        console.log(tokenizer.encode(inputString).length);

        const apiCall = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [{"role": "system", "content": "You are the Optimizely Content Marketing Platform co-pilot. You will take a user's request and output a JSON object adhering to the attached functions signature. This function will call the Optimizely CMP API and return the requested information."}, 
            {role: "user", content: request}],
            functions: this.getAPIcallFunctions
        });

        if (apiCall.data.choices[0].message.function_call) {

            console.log(`function decision: ${JSON.stringify(apiCall.data.choices[0].message.function_call)}`);

            const { arguments: functionArgs } = apiCall.data.choices[0].message.function_call;
      
            const args = JSON.parse(functionArgs);

            return { args }

        } else {

            return { response: apiCall.data.choices[0].message.content }

        }
    }

    async returnResponse(cmpResponse, method) {

        console.log(cmpResponse)

        let prompt;
        let dataToFormat;
      
        if (method === "GET") {
          // Determine if cmpResponse is an object with a data property, a single record object, or an array
          if (Array.isArray(cmpResponse)) {
            dataToFormat = cmpResponse;
          } else if (cmpResponse.data && Array.isArray(cmpResponse.data)) {
            dataToFormat = cmpResponse.data;
          } else {
            // Treat cmpResponse as a single record object
            dataToFormat = [cmpResponse];
          }

          console.log(`Response data to format: ${dataToFormat}`);

          let responseData;

          if (dataToFormat.length > 1) {
                // Only include the first two properties of each object in the data array
            responseData = dataToFormat.map(obj => {
                const keys = Object.keys(obj);
                return {
                [keys[0]]: obj[keys[0]],
                [keys[1]]: obj[keys[1]]
                };
            });
          } else {
            responseData = dataToFormat;
          }
    
          
          console.log(`Reduced response: ${responseData}`);
      
          prompt = `The user has requested to retrieve data. Here is a brief overview of the data retrieved: \n\n ${JSON.stringify(responseData, null, 2)} \n\n How would you format this response for the user?`;
        } else {
          prompt = `The user has requested a ${method} request. Here is the response: \n ${cmpResponse} \n How would you format this response for the user?`;
        }

        const inputString = "You are a helpful assistant that formats API responses into user-friendly messages." + prompt;

        console.log(tokenizer.encode(inputString).length);
      
        const getRequest = await openai.createChatCompletion({
          model: "gpt-3.5-turbo",
          messages: [{"role": "system", "content": "You are a helpful assistant that formats API responses into user-friendly messages."}, 
          {role: "user", content: prompt}]
        });
      
        const message = getRequest.data.choices[0].message.content;
        return message;
      }

    async returnUnsupported(prompt) {

    
        const inputString = "You are a helpful assistant that calls the Optimizely Content Marketing Platform API and formats responses into user-friendly messages. In this specific case, you are handling requests that are not supported by the API." + prompt;

        console.log(tokenizer.encode(inputString).length);
      
        const getRequest = await openai.createChatCompletion({
          model: "gpt-3.5-turbo",
          messages: [{"role": "system", "content": "You are a helpful assistant that calls the Optimizely Content Marketing Platform API and formats responses into user-friendly messages. In this specific case, you are handling requests that are not supported by the API."}, 
          {role: "user", content: prompt}]
        });
      
        const message = getRequest.data.choices[0].message.content;
        return message;
      }

    async createEmbedding(text) {

        const response = await openai.createEmbedding({
            model: "text-embedding-ada-002",
            input: text,
          });
    
        return response.data.data[0].embedding;
    }

}


export default OpenAI;