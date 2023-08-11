import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const NewApp = ({ currentPath }) => {
  const appNameRef = useRef();
  const appSystemNameRef = useRef();
  const clientIdRef = useRef();
  const clientSecretRef = useRef();
  const authTypeRef = useRef();
  const authFlowTypeRef = useRef();
  const authUrlRef = useRef();
  const accessTokenUrlRef = useRef();
  const documentationUrlRef = useRef();
  const APIURLRef = useRef();
  const logoURLRef = useRef();
  const websiteRef = useRef();
  const formFieldsRef = useRef();

  const backendUrl = "http://localhost:3001";

  let navigate = useNavigate();

  const calculateRows = (ref) => {
    if (ref && ref.current) {
      const text = ref.current.value;
      const width = 60;
      const numOfLines = Math.ceil(text.length / width);
      return numOfLines;
    }
    return 5;
  };
  

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const appData = {
      name: appNameRef.current ? appNameRef.current.value : '',
      systemName: appSystemNameRef.current ? appSystemNameRef.current.value : '',
      authType: authTypeRef.current ? authTypeRef.current.value : '',
      authFlowType: authFlowTypeRef.current ? authFlowTypeRef.current.value : '',
      clientId: clientIdRef.current ? clientIdRef.current.value : '',
      clientSecret: clientSecretRef.current ? clientSecretRef.current.value : '',
      authUrl: authUrlRef.current ? authUrlRef.current.value : '',
      accessTokenUrl: accessTokenUrlRef.current ? accessTokenUrlRef.current.value : '',
      documentationUrl: documentationUrlRef.current ? documentationUrlRef.current.value : '',
      apiUrl: APIURLRef.current ? APIURLRef.current.value : '',
      logoUrl: logoURLRef.current ? logoURLRef.current.value : '',
      formFields: formFieldsRef.current ? formFieldsRef.current.value : '',
    };

    console.log(appData);
  
    try {
      const response = await axios.post(`${backendUrl}/api/app`, appData);
      console.log(response.data);
      
      // Show success message
      toast.success('App successfully submitted!', {
        position: toast.POSITION.TOP_CENTER
      });
      
      // Navigate back to Apps
      navigate('/apps');
      
    } catch (err) {
      console.error(err);
      toast.error('Error submitting app', {
        position: toast.POSITION.TOP_CENTER
      });
    }
  };

  return (
<div className="max-w-2xl mx-auto bg-gray-50 p-16">

<form onSubmit={handleSubmit}>
<div className="grid gap-6 mb-6">
    <div>
        <label for="app_name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">App name</label>
        <input ref={appNameRef} type="text" id="app_name" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Jira" required></input>
    </div>
    <div>
        <label for="system_name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">System Name</label>
        <input ref={appSystemNameRef} type="text" id="system_name" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Jira" required></input>
    </div>
    <div>
      <label for="auth_type" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Authentication Type</label>
      <select ref={authTypeRef} id="auth_type" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" required>
        <option value="OAuth 2.0">OAuth 2.0</option>
        <option value="API Key">API Key</option>
        <option value="Basic Auth">Basic Auth</option>
      </select>
    </div>
    <div>
      <label for="auth_flow_type" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Authorization Flow Type</label>
      <select ref={authFlowTypeRef} id="auth_flow_type" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" required>
        <option value="auth_code">Authorization Code</option>
        <option value="client_credentials">Client Credentials</option>
      </select>
    </div>
    <div>
        <label for="auth_url" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Authentication URL</label>
        <input ref={authUrlRef} type="text" id="auth_url" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="" required></input>
    </div>
    <div>
        <label for="client_id" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Client ID</label>
        <input ref={clientIdRef} type="text" id="clientId" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="" required></input>
    </div>
    <div>
        <label for="client_secret" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Client Secret</label>
        <input ref={clientSecretRef} type="password" id="client_secret" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="" required></input>
    </div>
    <div>
        <label for="access_token" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Access Token URL</label>
        <textarea ref={accessTokenUrlRef} rows={calculateRows(accessTokenUrlRef)} type="text" id="access_token" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder=""></textarea>
    </div>
    <div>
        <label for="APIUrl" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">API Documentation URL</label>
        <input ref={APIURLRef} type="url" id="APIURL" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="https://dac-static.atlassian.com/cloud/jira/platform/swagger.v3.json?_v=1.6459.0-0.1278.0"></input>
    </div>  
    <div>
        <label for="LogoURL" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Logo URL</label>
        <input ref={logoURLRef} type="text" id="LogoURL" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="https://static-00.iconduck.com/assets.00/jira-icon-512x512-kkop6eik.png"></input>
    </div>
    <div>
        <label for="formFields" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Form Fields</label>
        <textarea ref={formFieldsRef} rows={calculateRows(formFieldsRef)} type="text" id="formFields" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder=""></textarea>
    </div>
</div>
<button type="submit" className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">Submit</button>
</form>
</div>
  );
};

export default NewApp;