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
} else {
  dotenv.config({ path: path.resolve(__dirname, '../.env') });
}

const openaiConfig = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(openaiConfig);

const tokenizer = encoding_for_model("gpt-3.5-turbo");

const printTokens = (stringsArray) => {

  const inputString = stringsArray.join("")

  console.log(tokenizer.encode(inputString).length);
};

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
            "description": "If you are missing required for the API request, call this function to ask the user for the information",
            "parameters": {
              "type": "object",
              "properties": {
                "question": {
                    "type": "string",
                    "description": "Ask for the required information."
                }
              },
              "required": ["question"]
            }
          }
        
        ]

        this.getAPIcallFunctions = [{

            "name": "callAppAPI",
            "description": "Use this function to call the App API. Please include the body if the request method is POST",
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

          this.selectAppFunction = [{

            "name": "determineRequestApp",
            "description": "Selects the application related to the user's request from the list of the user's connected applications",
            "parameters": {
              "type": "object",
              "properties": {
                "app": {
                  "type": "string",
                  "description": "Name of the selected connected application. Must match the name from the list provided."
                }
              },
              "required": ["app"]
            }
          }]

          this.optimizeRequestFunction = [{

            "name": "saveOptimizedRequest",
            "description": "Saves the optimized request",
            "parameters": {
              "type": "object",
              "properties": {
                "optimizedRequest": {
                  "type": "string",
                  "description": "Optimized request."
                }
              },
              "required": ["optimizedRequest"]
            }
          }]

          this.getUserIdFunction = [{

            "name": "saveUserId",
            "description": "Saves the ID of the user in the database.",
            "parameters": {
              "type": "object",
              "properties": {
                "userId": {
                  "type": "string",
                  "description": "The ID of the user."
                }
              },
              "required": ["userId"]
            }
          }]

          this.optimizeRequestSystemMessage = ""

          this.selectAppSystemMessage = "You are an enterprise software assistant. In this specific case, you will be selecting a software application from the provided list that is most relevant to the user's request.";

          this.decideSystemMessage = "You are an enterprise application co-pilot. You will be selecting the API endpoint most relevant to the user's request. If you are presented with an API endpoint that is relevant, but you need more information to make the request, please ask the user.";
          
          this.returnResponseSystemMessage = "You are a helpful assistant that formats API responses into user-friendly messages.";

          this.unsupportedSystemMessages = {
            api: "You are a helpful assistant that calls enterprise software API's and formats responses into user-friendly messages. In this specific case, you are handling requests that are not supported by the API.",
            app: "You are a helpful assistant that categorizes user requests to interact with a specific application. In this case, you are handling requests that are not uncategorized."
          };

          this.getAPICallSystemMessage = "You are an enterprise software co-pilot. You will take a user's request and output a JSON object adhering to the attached functions signature. This function will decide which API endpoint to call.";

          this.getUserIdSystemMessage = "You will be given a payload of data that may contain a user's ID. Please call the function with the user's ID to save the ID in the database.";
    
        
    }

    async selectApp(request, userApps) {

      const formattedRequest = `Below is a user's to interact with a specific software application: \n
      
      User Request: ${request}\n

      Please call the function with the name of the most relevant application from the list below: \n

      User's applciations: ${userApps}

      `
    
      const inputString = this.selectAppSystemMessage + request + JSON.stringify(this.selectAppFunction);

      console.log(tokenizer.encode(inputString).length);
    
      const appChoice = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [{"role": "system", "content": this.selectAppSystemMessage}, 
        {role: "user", content: formattedRequest}],
        functions: this.selectAppFunction
      });

      if (appChoice.data.choices[0].message.function_call) {

        console.log(`function decision: ${JSON.stringify(appChoice.data.choices[0].message.function_call)}`);

        const { arguments: functionArgs } = appChoice.data.choices[0].message.function_call;
  
        const args = JSON.parse(functionArgs);
  
        const func_name = appChoice.data.choices[0].message.function_call.name;

        console.log(`function decision: ${JSON.stringify({ func_name, args })}`);

        return { func_name, args }

    } else {

        return { response: appChoice.data.choices[0].message.content }

    }

    }

    async optimizeRequest(request) {

      const formattedRequest = `Below is a user's to interact with a specific software application: \n
      
      User Request: ${request}\n

      Please reword the request without references to the specific software application. Please call the attached function with the request. Here is an example:\n

      Original Request: Can you please get a list of my projects in Asana?

      New request: Can you please get a list of my projects?

      `
    
      const inputString = formattedRequest + JSON.stringify(this.optimizeRequestFunction);

      console.log(tokenizer.encode(inputString).length);
    
      const optimizedRequest = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [
        {role: "user", content: formattedRequest}],
        functions: this.optimizeRequestFunction
      });

      console.log(optimizedRequest);

      if (optimizedRequest.data.choices[0].message.function_call) {

        console.log(`function decision: ${JSON.stringify(optimizedRequest.data.choices[0].message.function_call)}`);

        const { arguments: functionArgs } = optimizedRequest.data.choices[0].message.function_call;
  
        const args = JSON.parse(functionArgs);
  
        const func_name = optimizedRequest.data.choices[0].message.function_call.name;

        console.log(`function decision: ${JSON.stringify({ func_name, args })}`);

        return { response: args["optimizedRequest"] }

    } else {

        return { response: optimizedRequest.data.choices[0].message.content }

    }

    }

    async decide(request) {

        const inputString = this.decideSystemMessage;

        + request + JSON.stringify(this.decideFunctions);

        console.log(tokenizer.encode(inputString).length);

        const decision = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [ 
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

    async getAPICall(request, selectedApp, userApp, userId) {

        const inputString = this.getAPICallSystemMessage;

        + request + JSON.stringify(this.getAPIcallFunctions);

        console.log(tokenizer.encode(inputString).length);

        const apiCall = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [{"role": "system", "content": this.getAPICallSystemMessage}, 
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

    async returnResponse(apiResponse, method) {

        console.log(apiResponse)

        if (apiResponse === null) {
          return "No data available."
        }

        let prompt;
        let dataToFormat;
      
        if (method === "GET") {
          // Determine if apiResponse is an object with a data property, a single record object, or an array
          if (Array.isArray(apiResponse)) {
            dataToFormat = apiResponse;
          } else if (apiResponse.data && Array.isArray(apiResponse.data)) {
            dataToFormat = apiResponse.data;
          } else {
            // Treat apiResponse as a single record object
            dataToFormat = [apiResponse];
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
          prompt = `The user has requested a ${method} request. Here is the response: \n ${JSON.stringify(apiResponse, null, 2)} \n How would you format this response for the user?`;
        }

        const inputString = this.returnResponseSystemMessage + prompt;

        console.log(tokenizer.encode(inputString).length);
      
        const getRequest = await openai.createChatCompletion({
          model: "gpt-3.5-turbo",
          messages: [{"role": "system", "content": this.returnResponseSystemMessage}, 
          {role: "user", content: prompt}]
        });
      
        const message = getRequest.data.choices[0].message.content;
        return message;
      }

    async returnUnsupported(prompt, type) {

    
        const inputString = this.unsupportedSystemMessages[type] + prompt;

        console.log(tokenizer.encode(inputString).length);
      
        const getRequest = await openai.createChatCompletion({
          model: "gpt-3.5-turbo",
          messages: [{"role": "system", "content": this.unsupportedSystemMessages[type]}, 
          {role: "user", content: prompt}]
        });
      
        const message = getRequest.data.choices[0].message.content;
        return message;
      }

    async getUserId(data) {

      const userId = await openai.createChatCompletion({
          model: "gpt-3.5-turbo",
          messages: [{"role": "system", "content": this.getUserIdSystemMessage}, 
          {role: "user", content: data}],
          functions: this.getUserIdFunction
      });

      if (userId.data.choices[0].message.function_call) {

        console.log(`function decision: ${JSON.stringify(apiCall.data.choices[0].message.function_call)}`);

        const { arguments: functionArgs } = apiCall.data.choices[0].message.function_call;
  
        const args = JSON.parse(functionArgs);

        return { args }

      } else {

        return { response: apiCall.data.choices[0].message.content }

      }
    
    }

    async createEmbedding(text) {

        const response = await openai.createEmbedding({
            model: "text-embedding-ada-002",
            input: text,
          });
        
          // console.log(response.data.data[0].embedding);
    
        return response.data.data[0].embedding;
    }

}

const _openai = new OpenAI();

export default _openai;