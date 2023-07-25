import express from 'express';
import cors from "cors";
import axios from "axios";
import yaml from "js-yaml";
import dotenv from 'dotenv';
import { Configuration, OpenAIApi } from "openai";
import { get_encoding, encoding_for_model } from "@dqbd/tiktoken";
import bodyParser from "body-parser";
import { sequelize } from './database/db.js';
import { PineconeClient } from "@pinecone-database/pinecone";
import { User, Conversation, Message, APIRequest } from './database/models.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

// import utils
import OpenAI from "./utils/openai.js"
import Platform from "./utils/platform.js"
import Pinecone from "./database/pinecone.js"

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (process.env.NODE_ENV === 'production') {
  dotenv.config({ path: path.resolve(__dirname, '../.env.prod') });
  console.log("prod")
} else {
  dotenv.config({ path: path.resolve(__dirname, '../.env') });
  console.log("dev")
}

const openai = new OpenAI();
const pinecone = new Pinecone();

const apiURL = "https://developers.welcomesoftware.com/openapi/openapi.yaml?hash=0145985";

const index = pinecone.index;
const indexDescription = pinecone.indexDescription;

const app = express();

app.use(bodyParser.json({ limit: "10mb" })); // You can set the limit to any appropriate size.
app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 3001;

sequelize.sync().then(() => {
  app.listen(port, () => {
    console.log(`Server is up and running at http://localhost:${port}`);
  });
}).catch((error) => {
  console.error('Unable to connect to the database:', error);
});

const uploadApiEndpoints = async (documentation) => {
  const { paths } = documentation;

  for (let path in paths) {
    const methods = paths[path];
    
    for (let method in methods) {
      const methodData = methods[method];
      const description = methodData.description;

      // Create a string that includes the path, method, and description
      const inputString = `Path:${path} 
                           Method: ${method.toUpperCase()} 
                           Description: ${description}`;

      // replace with class
      const embedding = await openai.createEmbedding(inputString);

      // Construct metadata
      const metadata = {
        path,
        method,
        description
      };

      // Upload the vector embedding to Pinecone

      const upsertResponse = await pinecone.upsertSingle({
        id: `${path}-${method}`,
        values: embedding,
        metadata,
      });
      
      console.log(upsertResponse);
    }
  }

};

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

const buildApiDocumentation = (searchResults, docType, documentation) => {

  // docType should be "full" or "summary"
  const { paths } = documentation;

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
          Description: ${endpointInfo.description}
        `;

        if (endpointInfo.parameters && docType === 'full') {
          // Resolve $refs in parameters
          const resolvedParameters = endpointInfo.parameters.map(param => resolveRef(param, documentation));
          docString += `
          Parameters: ${JSON.stringify(resolvedParameters, null, 2)}
          `;
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

  const totalDocumentationString = documentationStrings.join("\n\n----------------------\n\n");

  return totalDocumentationString;
};

async function callPlatformAPI(method, path, body) {

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

async function similaritySearch(userRequest, topK){

  const embedding = await openai.createEmbedding(userRequest);

  const queryResponse = await pinecone.similaritySearch(embedding, 2);

  return queryResponse;

}

function buildApiPrompt(userRequest, supported, apiDocumentation) {

  const today = new Date();
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  let prompt;

  if (supported === true){

    prompt = `The following is a user's request to interact with the Optimizely Content Marketing Platform on ${dateStr}: \n
  
    ${userRequest} \n
  
    Here is API documentation you can use to fulfill the user's request: \n
  
    ${apiDocumentation} \n
    `;

  } else {

    prompt = `The following is a user's request to interact with the Optimizely Content Marketing Platform on ${dateStr}: \n
  
    ${userRequest} \n
  
    The request is not supported by the API. Please inform the user. You can also answer their question if it is unrelated to the platform or the API.
    `;

  }

  console.log(prompt);

  return prompt;

  
}

async function fulfillRequest(userRequest, documentation, numPass, apiRequest) {

  try {
    let currentPass = numPass + 1;

    let searchString = apiRequest ? apiRequest : userRequest;

    const relevantDocs = await similaritySearch(searchString, 2);

    // Check the similarity score of the highest scored doc for relevancy
    const minScore = 0.70;
    let apiDocumentation = "";
    let alteredRequest;
    const cannotFulfillRequest = "I am sorry, I cannot help with this request right now. Is there anything else I can help you with?";

    if (relevantDocs.matches[0].score > minScore) {

      // Builds API documentation based on similaritySearch results
      const apiEndpoints = buildApiDocumentation(relevantDocs.matches, "summary", documentation)

      alteredRequest = buildApiPrompt(userRequest, true, apiEndpoints);

    } else {

      alteredRequest = buildApiPrompt(userRequest, false);

      const unsupportedResponse = openai.returnUnsupported(alteredRequest);

      return unsupportedResponse

    }
    
    const decision = await openai.decide(alteredRequest);

    console.log(JSON.stringify(decision));

    const decisionArgs = decision.args;

    if (decisionArgs) {

      if (decision.func_name === "chooseAPIEndpoint") {

        const bestMatch = decisionArgs.order;

        console.log(bestMatch);

        const apiDocumentation = buildApiDocumentation([relevantDocs.matches[bestMatch]], "full", documentation);

        alteredRequest = buildApiPrompt(userRequest, true, apiDocumentation);

        return alteredRequest;

        const apiCall = await openai.getAPICall(alteredRequest);

        const apiArgs = apiCall.args;

        console.log(apiArgs);

        if (apiArgs) {

          const apiResponse = await callPlatformAPI(apiArgs.method, apiArgs.path, apiArgs.body);

          if (apiResponse === null) {

          }

          const responseForUser = await openai.returnResponse(apiResponse, apiArgs.method);

          return responseForUser;

        }

      } else if (decision.func_name === "getMoreInfo") {

        const infoSource = decisionArgs.source;

        if (infoSource === "documentation") {

          return decisionArgs.question

          // await fulfillRequest(userRequest, documentation, currentPass, decisionArgs.question);

        } else {

          return decisionArgs.question

        }

      } else {

        return cannotFulfillRequest;

      }

    }

    /*

    if (decision.func_name) {

      if (decision.func_name === "callPlatformAPI") {

        const apiResponse = callPlatformAPI(decision.args.method, decision.args.method, decision.args.body);

        const responseForUser = openai.returnResponse(apiResponse, decision.args.method);

        return responseForUser;

      } else if (decision.func_name === "moreAPIInfo") {

        if (currentPass < 2) {

          await fulfillRequest(userRequest, documentation, currentPass, decision.args.otherDocsRequest);

        } else {

          return cannotFulfillRequest;

        }

      } else if (decision.func_name === "moreUserInfo") {

        return decision.args.request;
        
      } else return cannotFulfillRequest;

    }

    */

  } catch (error) {
    console.error(`Failed to fulfill request: ${error.message}`);
    throw error;  // re-throw the error if you want to handle it at the caller side, or return a default response.
  }

}


app.post("/chat", async (req, res) => {

  const userMessage = req.body.message;  // extract the message from the request body

  try {
    const response = await axios.get(apiURL);
    const yamlData = response.data;
    const documentation = yaml.load(yamlData);

    // Check if "paths" property exists in the JSON object
    if (!documentation.hasOwnProperty('paths')) {
      console.error('No "paths" property in the parsed YAML data');
      return res.status(500).send('No "paths" property in the parsed YAML data');
    }

    const chatResponse = await fulfillRequest(userMessage, documentation);

    res.json(chatResponse)

  } catch (error) {
    console.error('Error downloading or parsing YAML:', error);
    res.status(500).send('Error downloading or parsing YAML');
  }

});

app.post("/select-platform", async (req, res) => {

  const apiURL = "https://developers.welcomesoftware.com/openapi/openapi.yaml?hash=0145985";

  try {

    const response = await axios.get(apiURL);
    const yamlData = response.data;
    const documentation = yaml.load(yamlData);

    if (!indexDescription) {
      uploadApiEndpoints(documentation)
    }

    // Check if "paths" property exists in the JSON object
    if (!documentation.hasOwnProperty('paths')) {
      console.error('No "paths" property in the parsed YAML data');
      return res.status(500).send('No "paths" property in the parsed YAML data');
    }

    const pathKeys = Object.keys(documentation.paths);
    res.json(pathKeys);
  } catch (error) {
    console.error('Error downloading or parsing YAML:', error);
    res.status(500).send('Error downloading or parsing YAML');
  }
});

