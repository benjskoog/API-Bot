import express from 'express';
import cors from "cors";
import axios from "axios";
import yaml from "js-yaml";
import dotenv from 'dotenv';
import qs from 'qs';
import { Configuration, OpenAIApi } from "openai";
import { get_encoding, encoding_for_model } from "@dqbd/tiktoken";
import bodyParser from "body-parser";
import { sequelize } from './database/db.js';
import { Op } from 'sequelize';
import { PineconeClient } from "@pinecone-database/pinecone";
import { User, Conversation, Message, APIRequest, App as App_sql, UserApp, Documentation } from './database/models.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import bcrypt from 'bcrypt';
import jwt from "jsonwebtoken";
import crypto from "crypto";

// import util
import openai from "./utils/openai.js"
import appManager from "./utils/apps/index.js"
import pinecone from "./database/pinecone.js"
import { sendEmail } from "./utils/sendgrid.js"

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (process.env.NODE_ENV === 'production') {
  dotenv.config({ path: path.resolve(__dirname, '../.env.prod') });
  console.log("prod")
} else {
  dotenv.config({ path: path.resolve(__dirname, '../.env') });
  console.log("dev")
}

const index = pinecone.index;
const indexDescription = pinecone.indexDescription;

const app = express();
const router = express.Router();

const corsOptions = {
  origin: true,
  optionsSuccessStatus: 200,
  allowedHeaders: ['Content-Type', 'Authorization', "ngrok-skip-browser-warning"],
};

app.use(cors(corsOptions));

const JWT_SECRET = process.env.JWT_SECRET_KEY;

app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));
app.use(express.json());

app.use((req, res, next) => {
  console.log(res.get('Access-Control-Allow-Origin'));
  next();
});

app.use((req, res, next) => {
  res.header('ngrok-skip-browser-warning', "any");
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

const port = process.env.PORT || 3001;

app.use('/api', router);

sequelize.sync().then(() => {
  app.listen(port, () => {
    console.log(`Server is up and running at http://localhost:${port}`);
  });
}).catch((error) => {
  console.error('Unable to connect to the database:', error);
});

function authenticate(req, res, next) {

  let token;

  if (req.cookies) {
    token = req.cookies['auth_token'];
  } else {
    token = req.headers['authorization']?.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY || '');
    req.userId = decoded.userId; // Attach the user ID to the request
    next(); // Call the next middleware or route handler
  } catch (err) {
    console.error(err);
    return res.status(403).json({ error: 'Invalid token' });
  }
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

async function similaritySearch(userRequest, appName,topK){

  const embedding = await openai.createEmbedding(userRequest);

  const queryResponse = await pinecone.searchByApp(embedding, appName, topK);

  return queryResponse;

}

function buildApiPrompt(userRequest, supported, apiDocumentation, selectedApp, userApp, type) {

  const today = new Date();
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  let prompt = `The following is a user's request to interact with ${selectedApp.name} on ${dateStr}.`;
  
  prompt += `User request: ${userRequest} \n`;

  if (supported === true){

    prompt += type === "summary" ? "Read the user's request carefully and select the most relevant endpoint below. Check your work: \n" : `Here is API documentation you can use to call ${selectedApp.name}'s API: \n`;

    prompt += `${apiDocumentation} \n
    `;

    prompt += type === "summary" ? "Do not select an endpoint that requires information you do not have. Please ask the user for this information first" : "";

    // userApp ? prompt += ` The user's ID in ${selectedApp.name} is ${userApp.appUserId}. Only use this where the documentation states to explicitly use the user's ID. \n` : "";

  } else {

    prompt = prompt + `The request is not supported by the API. Please inform the user. You can also answer their question if it is unrelated to the platform or the API.`;

  }

  console.log(prompt);

  return prompt;
  
}

async function fulfillRequest(userRequest, documentation, numPass, apiRequest, selectedApp, userId) {

  try {

    const userApp = await UserApp.findOne({
      where: {
        userId,
        appId: selectedApp.id,
      }
    });

    const handleApp = appManager.getApp(selectedApp);

    let currentPass = numPass + 1;

    let searchString = apiRequest ? apiRequest : userRequest;

    const relevantDocs = await similaritySearch(searchString, selectedApp.name, 4);

    console.log(relevantDocs);

    // Check the similarity score of the highest scored doc for relevancy
    const minScore = 0.70;
    let apiDocumentation = "";
    let alteredRequest;
    const cannotFulfillRequest = "I am sorry, I cannot help with this request right now. Is there anything else I can help you with?";

    if (relevantDocs.matches[0].score > minScore) {

      // Builds API documentation based on similaritySearch results
      const apiEndpoints = buildApiDocumentation(relevantDocs.matches, "summary", documentation)

      alteredRequest = buildApiPrompt(userRequest, true, apiEndpoints, selectedApp, userApp, "summary");

    } else {

      alteredRequest = buildApiPrompt(userRequest, false);

      const unsupportedResponse = openai.returnUnsupported(alteredRequest, "api");

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

        console.log([relevantDocs.matches[bestMatch]]);

        alteredRequest = buildApiPrompt(userRequest, true, apiDocumentation, selectedApp, userApp, "full");

        // Uncomment line below to return API documentation in chat for testing purposes

        // return alteredRequest;

        const apiCall = await openai.getAPICall(alteredRequest, selectedApp, userApp, userId);

        const apiArgs = apiCall.args;

        console.log(apiArgs);

        if (apiArgs) {

          const handleApp = appManager.getApp(selectedApp);

          const apiResponse = await handleApp.callAppAPI(apiArgs.method, apiArgs.path, apiArgs.body, userApp.apiUrl, userApp);

          if (apiResponse === null) {

          }

          const responseForUser = await openai.returnResponse(apiResponse, apiArgs.method);

          return responseForUser;

        }

      } else if (decision.func_name === "getMoreInfo") {

        const infoSource = decisionArgs.source;

          return decisionArgs.question

      } else {

        return cannotFulfillRequest;

      }

    }

  } catch (error) {
    console.error(`Failed to fulfill request: ${error.message}`);
    throw error;  // re-throw the error if you want to handle it at the caller side, or return a default response.
  }

}

async function getApps(userId) {
  const apps = await App_sql.findAll({
    include: {
      model: UserApp,
      where: {
        userId,
        accessToken: {
          [Op.ne]: null // Op.ne represents the "not equal" operator
        }
      },
      as: 'userApps', // Use the alias
      required: false
    }
  });

  // Transforming the data to include a flag indicating whether the user has connected to each app
  const transformedApps = apps.map(app => ({
    ...app.get(),
    isConnected: app.userApps && app.userApps.length > 0
  }));

  return transformedApps;
}


router.post("/chat", authenticate, async (req, res) => {

  const userId = req.userId;

  console.log(userId);

  const userMessage = req.body.message;

  // Get user's apps and convert to string to pass to GPT with user message
  const userApps = await getApps(userId);

  const userAppsString = userApps.filter(app => app.isConnected === true).map(app => app.name).join(', ');

  try {

    // GPT to decide which app the request is about by using function calls
    const appDecision = await openai.selectApp(userMessage, userAppsString);

    // GPT to optimize request for similarity search

    let optimizedRequest = await openai.optimizeRequest(userMessage);

    optimizedRequest = optimizedRequest.response;

    let selectedApp;
    let documentation;

    if (appDecision.args) {
      selectedApp = appDecision.args.app;
      selectedApp = userApps.filter(app => app.name === selectedApp)[0];
      console.log(selectedApp.documentationUrl);

      // Test block auth refresh for Asana

/*       const handleApp = appManager.getApp(selectedApp);

      const userApp = await UserApp.findOne({
        where: {
          userId,
          appId: selectedApp.id,
        }
      });

      const apiResponse = await handleApp.callAppAPI("GET", "/rest/api/3/project", "" , "https://api.atlassian.com/ex/jira/83447faa-d20d-4838-bbe4-8a3efcaf4955", userApp);

      return(apiResponse); */

      // Test block end

      // delete vectors for selected docs with line below

      // const deleteAsanaDocs = await pinecone.deleteVecsForApp(selectedApp.name);

      const handleApp = appManager.getApp(selectedApp);

      const documentation = await handleApp.loadDocumentation();

      const chatResponse = await fulfillRequest(optimizedRequest, documentation, null, null, selectedApp, userId);

      res.json(chatResponse)

      //console.log(documentation);

    } else {
      const unsupportedResponse = openai.returnUnsupported(userMessage, "api");

      res.json(unsupportedResponse);
    }

  } catch (error) {
    console.error('Error with chat route:', error);
    res.status(500).send('Error with chat route');
  }

});

router.post("/handle-connect/:appId", authenticate, async (req, res) => {
  // Extract the data from the request
  const { app, userInputs } = req.body;
  const userId = req.userId;

  // Validation (optional, but recommended)
  if (!userId || !req.params.appId) {
    return res.status(400).send('userId and appId are required');
  }

  try {
    const appHandler = appManager.getApp(app);

    const authUrl = await appHandler.getAuthUrl(userInputs ? userInputs : null, userId);

    // Check if a record with this userId and appId already exists
    let existingUserApp = await UserApp.findOne({
      where: {
        userId,
        appId: req.params.appId,
      }
    });

    let userAppData;
    if (existingUserApp) {

      existingUserApp.userInputs = userInputs;

      await existingUserApp.save();
      userAppData = existingUserApp;
    } else {
      // Create a new record
      userAppData = await UserApp.create({
        userId,
        appId: req.params.appId,
        userInputs,
      });
    }

    res.json({ ...userAppData, authUrl });

  } catch (error) {
    console.error('Error handling UserApp:', error);
    res.status(500).send('Error handling UserApp');
  }
});


router.get("/user-app/:appId", authenticate, async (req, res) => {
  try {
    // find all apps
    const app = await UserApp.findAll({
      where: {
        userId: req.userId,
        appId: req.params.appId
      }
    });

    // send the found apps in the response
    console.log(app);
    res.json(app);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error retrieving app');
  }
});

router.delete("/user-app/:appId", authenticate, async (req, res) => {
  try {
    // find the app
    const app = await UserApp.findOne({
      where: {
        userId: req.userId,
        appId: req.params.appId
      }
    });

    console.log(app);

    // if the app is not found, respond with an error
    if (!app) {
      return res.status(404).send('App not found');
    }

    // delete the app
    await app.destroy();

    // send a success response
    res.status(200).send('App deleted successfully');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error deleting app');
  }
});

router.get("/apps", authenticate, async (req, res) => {
  try {

    const userId = req.userId;

    // Find all apps, including related UserApp records for the specific user where accessToken is not null
    const transformedApps = await getApps(userId);

    // Send the transformed apps in the response
    res.json(transformedApps);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error retrieving apps');
  }
});


router.get("/app/:id", async (req, res) => {
  try {
    // find app by id
    const app = await App_sql.findByPk(req.params.id);

    // check if the app exists
    if (!app) {
      return res.status(404).send('App not found');
    }

    console.log(indexDescription);

    // send the found app in the response
    res.json(app);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error retrieving app');
  }
});

router.post("/app", async (req, res) => {

  // extract the app data from the request body
  const { name, systemName, authType, clientId, clientSecret, authUrl, accessTokenUrl, documentationUrl, apiUrl, logoUrl, website, formFields, authFlowType } = req.body;

  // validate app data here (if necessary)

  // Parse documentation and upload to Pinecone

  /*

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

  */

  // create app in database

  try {
    // create a new app
    const app = await App_sql.create({
      name,
      systemName,
      authType,
      authFlowType,
      clientId,
      clientSecret,
      authUrl,
      accessTokenUrl,
      documentationUrl,
      apiUrl,
      logoUrl,
      formFields
    });

    // send the created app in the response
    res.json(app);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error creating app');
  }
});

router.get("/docs/:appId", async (req, res) => {

  try {

    console.log("getting docs")

    const docs = await Documentation.findAll({
      where: {
        appId: req.params.appId
      }
    });
  
    res.json(docs);

  } catch (err) {
    res.status(500).send('Error getting docs');
    console.log(err)
  }

});

router.patch("/docs/:docId", async (req, res) => {
  try {
    const { docId } = req.params;
    const { botSummary, botDescription, next, vecId, app } = req.body; // De-structure new fields from the request body

    // Validation can be added for botSummary, botDescription, and next if needed

    // Find a specific documentation by its ID
    const docToUpdate = await Documentation.findOne({
      where: {
        id: docId
      }
    });

    // If no documentation is found with the specified ID, send a 404 response
    if (!docToUpdate) {
      return res.status(404).send('Documentation not found.');
    }

    // Update the new fields of the documentation
    if (botSummary !== undefined) docToUpdate.botSummary = botSummary;
    if (botDescription !== undefined) docToUpdate.botDescription = botDescription;
    if (next !== undefined) docToUpdate.next = next;

    await docToUpdate.save();

    // Update vectors
    const handleApp = appManager.getApp(app);
    await handleApp.updateDocumentation(docToUpdate);

    // Send back the updated documentation as a response
    res.json(docToUpdate);

  } catch (err) {
    res.status(500).send('Error updating documentation');
    console.log(err);
  }
});


router.post("/docs/:appId", authenticate, async (req, res) => {

  const userId = req.userId;

  // find app by id
  const app = await App_sql.findByPk(req.params.appId);

  const userApp = await UserApp.findOne({
    where: {
      userId: req.userId,
      appId: req.params.appId
    }
  });

  const appHandler = appManager.getApp(app);

  // check if the app exists
  if (!app) {
    return res.status(404).send('App not found');
    }
  
  const embedding = await openai.createEmbedding("GET");

  const appDocs = await pinecone.searchByApp(embedding, app.name, 1);

  let documentation;
  let savedDocumentation;

  try {

    if (appDocs.matches.length === 0) {

      documentation = await appHandler.createDocumentation(app, userApp)

      let existingDoc = await Documentation.findOne({
        where: {
          appId: req.params.appId,
          type: "full"
        }
      });
      
      console.log(existingDoc);

      if (existingDoc) {

        existingDoc.specification = documentation

        existingDoc.save()

      } else {

        savedDocumentation = await Documentation.create({
          specification: documentation,
          appId: app.id,
          method: "NA",
          path: "NA",
          type: "full"
        })

        console.log(savedDocumentation)

      }

    }

    const response = documentation ? "created" : "exists";

    res.json(response);
  } catch (error) {
    console.error('Error downloading or parsing YAML:', error);
    res.status(500).send('Error downloading or parsing YAML');
  }

  // create app in database
});

router.delete("/docs/:appId", async (req, res) => {

  const app = await App_sql.findByPk(req.params.appId);

  const deletedRecordsCount = await Documentation.destroy({
    where: { appId: app.id }
  });

  const deleteResponse = await pinecone.deleteVecsForApp(app.name);

  console.log(deleteResponse);

  res.json(deleteResponse);

});

router.patch("/app/:id", async (req, res) => {

  const { name: appName, systemName, authType, authFlowType, clientId, clientSecret, authUrl, accessTokenUrl, apiUrl, documentationUrl, logoUrl, website, formFields } = req.body;

  try {
    // get the app by its id
    const app = await App_sql.findOne({ where: { id: req.params.id } });

    if (!app) {
      // app not found
      return res.status(404).send('App not found');
    }

    // update the app
    app.name = appName;
    app.systemName = systemName;
    app.authType = authType;
    app.clientId = clientId;
    app.clientSecret = clientSecret;
    app.authUrl = authUrl;
    app.authFlowType = authFlowType;
    app.accessTokenUrl = accessTokenUrl;
    app.documentationUrl = documentationUrl;
    app.apiUrl = apiUrl;
    app.logoUrl = logoUrl;
    app.website = website;
    app.formFields = formFields;

    // save the updated app
    await app.save();

    // send the updated app in the response
    res.json(app);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error updating app');
  }
});


router.post('/register', async (req, res) => {
  const data = req.body;

  // Check if the user already exists
  const existingUser = await User.findOne({ where: { email: data.email } });

  if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(data.password, 10);

  // Create the new user
  const user = await User.create({
      username: data.email,
      email: data.email,
      password: hashedPassword
  });

  return res.status(201).json({
      id: user.id,
      email: user.email
  });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
      const user = await User.findOne({ where: { email } });

      if (!user) {
          return res.status(401).json({ error: 'Invalid username or password' });
      }

      const validPassword = await bcrypt.compare(password, user.password);

      if (!validPassword) {
          return res.status(401).json({ error: 'Invalid username or password' });
      }

      const accessToken = jwt.sign({ userId: user.id }, JWT_SECRET, {
          expiresIn: '1h' // The token expires after 1 hour
      });

      return res.json({
          access_token: accessToken,
          id: user.id,
          email: user.email,
      });
  } catch (error) {
      console.log(error);
      return res.status(500).json({ error: 'An error occurred while trying to log in' });
  }
});

router.post('/forgot-password', async (req, res) => {
  const { email, frontendUrl } = req.body;

  if (!email) {
      return res.status(400).json({ error: 'Email is required' });
  }

  try {
      const user = await User.findOne({ where: { email } });

      if (!user) {
          return res.status(404).json({ error: 'No user found with the provided email' });
      }

      const resetToken = crypto.randomBytes(16).toString('hex');

      await PasswordResetToken.create({
          userId: user.id,
          token: resetToken,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),  // Token expires after 1 hour
      });

      const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;
      const emailSubject = 'Password Reset Request';
      const emailBody = `Please click the following link to reset your password: ${resetLink}`;

      sendEmail(emailSubject, emailBody, email);

      return res.json({ message: 'A password reset link has been sent to your email address' });
  } catch (error) {
      console.log(error);
      return res.status(500).json({ error: 'An error occurred while trying to send a password reset link' });
  }
});

router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
      return res.status(400).json({ error: 'Token and new password are required' });
  }

  try {
      const passwordResetToken = await PasswordResetToken.findOne({ where: { token, expiresAt: { [Op.gt]: new Date() } } });

      if (!passwordResetToken) {
          return res.status(400).json({ error: 'Invalid or expired token' });
      }

      const hashedPassword = await bcrypt.hash(password, 12);  // You may need to adjust the salt

      await User.update({ password: hashedPassword }, { where: { id: passwordResetToken.userId } });

      await passwordResetToken.destroy();

      return res.json({ message: 'Password has been successfully reset' });
  } catch (error) {
      console.log(error);
      return res.status(500).json({ error: 'An error occurred while trying to reset the password' });
  }
});

router.get('/oauth/:appId', async (req, res) => {
  // extract the code from the request
  const userId = req.query.state;
  const code = req.query.code;
  const appId = req.params.appId;

  console.log(appId)

  const app = await App_sql.findByPk(appId);
  console.log(app.systemName)

  const authFlowType = app.authFlowType;

  const userApp = await UserApp.findOne({ where: { appId: appId, userId: userId } });

  const appHandler = appManager.getApp(app);

  const postUrl = await appHandler.getAccessUrl(userApp.userInputs);

  console.log(postUrl);

  if (!code) {
    return res.status(400).send('No code provided in OAuth callback');
  }

  try {
    let tokenResponse;
    // Determine the authentication flow
    if (authFlowType === 'auth_code') {
      // exchange code for access token using the authorization code flow
      tokenResponse = await axios({
        method: 'post',
        url: postUrl,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        data: qs.stringify({
          grant_type: 'authorization_code',
          code: code,
          client_id: app.clientId,
          client_secret: app.clientSecret,
          redirect_uri: `${process.env.NGROK_TUNNEL}/api/oauth/${app.id}`
        })
      });
    } else if (authFlowType === 'client_credentials') {
      // exchange credentials for access token using the client credentials flow
      tokenResponse = await axios({
        method: 'post',
        url: postUrl,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        data: qs.stringify({
          grant_type: 'client_credentials',
          client_id: app.clientId,
          client_secret: app.clientSecret
        })
      });
    } else {
      return res.status(400).send('Unsupported authentication flow type');
    }

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    console.log(tokenResponse.data);

    const apiUrl = await appHandler.getApiUrl(access_token);

    const appUserId = await appHandler.getUserId(tokenResponse.data);

    console.log(apiUrl);
    console.log(appUserId);

    userApp.accessToken = access_token;
    userApp.refreshToken = refresh_token;
    userApp.apiUrl = apiUrl;
    userApp.expiresAt = expires_in;
    userApp.appUserId = appUserId;

    await userApp.save();

    let frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

    res.send(`
      <html>
        <head>
          <script>
    
            // Post the token back to the parent window
            window.opener.postMessage({ message: "success" }, '${frontendUrl}');

            console.log("message");

            window.close();
    
            // Close the popup
   
          </script>
        </head>
        <body>
          Redirecting...
        </body>
      </html>
    `);

  } catch (error) {
    console.error('Error in OAuth callback', error);
    res.status(500).send('Error in OAuth callback');
  }
});

export { router };

