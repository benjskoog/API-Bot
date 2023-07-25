import fs from 'fs';
import { get_encoding, encoding_for_model } from "@dqbd/tiktoken";

const tokenizer = encoding_for_model("gpt-3.5-turbo");

// Define the path to your JSON file
const jsonFilePath = './jira.json';

// Read the JSON file
const rawJsonData = fs.readFileSync(jsonFilePath, 'utf-8');

console.log(tokenizer.encode(rawJsonData).length);
