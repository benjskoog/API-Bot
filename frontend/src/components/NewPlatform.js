import React, { useRef } from 'react';
import axios from 'axios';

const NewPlatform = ({ currentPath }) => {
  const platformNameRef = useRef();
  const APIURLRef = useRef();
  const logoURLRef = useRef();
  const websiteRef = useRef();

  const backendUrl = "http://localhost:3001";

  const handleSubmit = async (e) => {
    e.preventDefault();

    const platformData = {
      name: platformNameRef.current.value,
      api_url: APIURLRef.current.value,
      logo_url: logoURLRef.current.value,
      website: websiteRef.current.value,
    };

    try {
      const response = await axios.post(`${backendUrl}/create-platform`, platformData);
      console.log(response.data);
    } catch (err) {
      console.error(err);
    }
  };


  return (
<div class="max-w-2xl mx-auto bg-gray-50 p-16">

<form>
<div class="grid gap-6 mb-6">
    <div>
        <label for="first_name" class="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Platform name</label>
        <input type="text" id="first_name" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Jira" required></input>
    </div>
    <div>
        <label for="APIUrl" class="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">API Documentation URL</label>
        <input type="url" id="APIURL" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="https://dac-static.atlassian.com/cloud/jira/platform/swagger.v3.json?_v=1.6459.0-0.1278.0" required></input>
    </div>  
    <div>
        <label for="LogoURL" class="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Logo URL</label>
        <input type="url" id="LogoURL" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="https://static-00.iconduck.com/assets.00/jira-icon-512x512-kkop6eik.png"></input>
    </div>
    <div>
        <label for="website" class="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Platform website</label>
        <input type="url" id="website" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="https://www.atlassian.com/software/jira"></input>
    </div>
</div>
<button type="submit" class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">Submit</button>
</form>
</div>
  );
};

export default NewPlatform;