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
import appHandler from './apps/index.js'

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (process.env.NODE_ENV === 'production') {
  dotenv.config({ path: path.resolve(__dirname, '../.env.prod') });
} else {
  dotenv.config({ path: path.resolve(__dirname, '../.env') });
}



class RequestAgent {
    constructor(request) {

      this.id = request.id;
      this.name = request.name;
      this.goal = request.goal;

    }

  async init(request) {
    
  }  
  
    
  // Tools for GPT
  async callAppAPI(method, path, body, baseApiUrl, userApp, tried) {

  }

  async searchAppAPI(userRequest, documentation, numPass, apiRequest, selectedApp, userId) {

  }
}


export default RequestAgent;