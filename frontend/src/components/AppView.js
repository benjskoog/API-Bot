import React, { useEffect, useState, useContext, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import UserContext from './User/UserContext';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Documentation from "./Documentation"
import Modal from 'react-modal';

const customStyles = {
  overlay: {
    backgroundColor: 'rgba(0,0,0,0.5)',  // This will darken the background
  },
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: 'white',
    borderRadius: '4px',
    padding: '20px',
    // Add any other styles you want for the modal content
  }
};

const AppView = ({ mode }) => {
  const { appId } = useParams();
  const backendUrl = "http://localhost:3001";
  const navigate = useNavigate();
  const { user, loading, logout } = useContext(UserContext);

  // Create states for each field
  const [app, setApp] = useState({});
  const [appName, setAppName] = useState("");
  const [systemName, setSystemName] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [authType, setAuthType] = useState("");
  const [authFlowType, setAuthFlowType] = useState("");
  const [authUrl, setAuthUrl] = useState("");
  const [apiUrl, setApiUrl] = useState("");
  const [accessTokenUrl, setAccessTokenUrl] = useState("");
  const [refreshTokenExample, setRefreshTokenExample] = useState("");
  const [documentationUrl, setDocumentationUrl] = useState("");
  const [logoURL, setLogoURL] = useState("");
  const [website, setWebsite] = useState("");
  const [formFields, setFormFields] = useState("");

  // Documentation states
  const [showDocumentationModal, setShowDocumentationModal] = useState(false);
  const [documentationRecords, setDocumentationRecords] = useState([]);
  const [selectedDocumentation, setSelectedDocumentation] = useState(null);


  // Configuration states

  const calculateRows = (text) => {
    if (text) {
      console.log(text);
      const width = 60; // Replace this with your desired width in characters
      const numOfLines = Math.ceil(text.length / width);
      console.log(numOfLines);
      return numOfLines;
    }
    return 5; // default rows for blank text
  };

  const handleSave = (event) => {
    event.preventDefault();

    console.log(authFlowType);

    const updatedApp = {
      name: appName,
      systemName,
      clientId,
      clientSecret,
      authType,
      authFlowType,
      authUrl,
      accessTokenUrl,
      documentationUrl,
      apiUrl,
      logoURL,
      website,
      formFields
    };

    axios.patch(`${backendUrl}/api/app/${appId}`, updatedApp)
      .then((response) => {
        toast('App data saved successfully!', { type: 'success', position: 'top-center', autoClose: 1000, pauseOnHover: false });
      })
      .catch((error) => {
        console.error('Error:', error);
        toast('Failed to save app data.', { type: 'error', position: 'top-center', pauseOnHover: false });
      });
  };

  const handleCreateDocumentation = (event) => {
    event.preventDefault();

    axios.post(`${backendUrl}/api/docs/${appId}`, null, {
      headers: {
        'Authorization': `Bearer ${user.accessToken}`
      }
    })
      .then((response) => {

        console.log(response);

        if (response.data === "created"){

            toast('Documentation created successfully!', { type: 'success', position: 'top-center', autoClose: 1000, pauseOnHover: false });
        } else {
            toast('Documentation already exists', { type: 'info', position: 'top-center', autoClose: 1000, pauseOnHover: false });
        }
      })
      .catch((error) => {
        console.error('Error:', error);
        toast('Failed to create documentation.', { type: 'error', position: 'top-center', pauseOnHover: false });
      });
  };

  const handleDeleteDocumentation = (event) => {
    event.preventDefault();
  
    axios.delete(`${backendUrl}/api/docs/${app.id}`)
      .then((response) => {

        console.log(response);

        if (response.data === "created"){

            toast('Documentation deleted successfully!', { type: 'success', position: 'top-center', autoClose: 1000, pauseOnHover: false });
        } else {
            toast('Error deleting documentation', { type: 'error', position: 'top-center', autoClose: 1000, pauseOnHover: false });
        }
      })
      .catch((error) => {
        console.error('Error:', error);
        toast('Failed to create documentation.', { type: 'error', position: 'top-center', pauseOnHover: false });
      });
  };

  const handleDocumentationClick = (documentation) => {
    setSelectedDocumentation(documentation);
    setShowDocumentationModal(!showDocumentationModal);
  };

  const handleCloseModal = () => {
    setSelectedDocumentation();
    setShowDocumentationModal(!showDocumentationModal);
  };
  

  useEffect(() => {
    axios.get(`${backendUrl}/api/app/${appId}`)
      .then(response => {
        const app = response.data;
        setApp(app);
        // Update each state with the fetched data
        setAppName(app.name);
        setSystemName(app.systemName);
        setClientId(app.clientId);
        setClientSecret(app.clientSecret);
        setAuthType(app.authType);
        setAuthFlowType(app.authFlowType);
        setAuthUrl(app.authUrl);
        setAccessTokenUrl(app.accessTokenUrl);
        setApiUrl(app.apiUrl);
        setDocumentationUrl(app.documentationUrl);
        setLogoURL(app.logoUrl);
        setWebsite(app.website);
        setFormFields(app.formFields);
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  }, []);

  useEffect(() => {
    axios.get(`${backendUrl}/api/docs/${appId}`)
      .then(response => {
        console.log(response.data)
        setDocumentationRecords(response.data);
      })
      .catch((error) => {
        console.error('Error fetching documentation records:', error);
      });
  }, [appId]);

  return (
<div>
<div className="max-w-2xl mx-auto bg-gray-50 p-16">
    <div className="mb-4">
    {logoURL && <img src={logoURL} alt="Logo" style={{ width: "100px", height: "100px" }}/>}
    </div>
<form onSubmit={handleSave}>
<div className="grid gap-6 mb-6">
    <div>
        <label for="app_name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">App name</label>
        <input value={appName} onChange={(e) => setAppName(e.target.value)} type="text" id="app_name" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Jira" required></input>
    </div>
    <div>
        <label for="system_name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">System Name</label>
        <input value={systemName} onChange={(e) => setSystemName(e.target.value)} type="text" id="system_name" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Jira" required></input>
    </div>
    <div>
      <label for="auth_type" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Authentication Type</label>
      <select value={authType} onChange={(e) => setAuthType(e.target.value)} id="auth_type" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" required>
        <option value="OAuth 2.0">OAuth 2.0</option>
        <option value="API Key">API Key</option>
        <option value="Basic Auth">Basic Auth</option>
      </select>
    </div>
    <div>
      <label for="auth_flow_type" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Authorization Flow Type</label>
      <select value={authFlowType} onChange={(e) => setAuthFlowType(e.target.value)} id="auth_flow_type" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" required>
        <option value="auth_code">Authorization Code</option>
        <option value="client_credentials">Client Credentials</option>
      </select>
    </div>
    <div>
        <label for="authUrl" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Authentication URL</label>
        <input value={authUrl} onChange={(e) => setAuthUrl(e.target.value)} type="text" id="authUrl" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="" required></input>
    </div>
    <div>
        <label for="clientId" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Client ID</label>
        <input value={clientId} onChange={(e) => setClientId(e.target.value)} type="text" id="clientId" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="" required></input>
    </div>
    <div>
        <label for="clientSecret" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Client Secret</label>
        <input value={clientSecret} onChange={(e) => setClientSecret(e.target.value)} type="password" id="client_secret" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="" required></input>
    </div>
    <div>
        <label for="accessTokenExample" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Access Token URL</label>
        <input value={accessTokenUrl} onChange={(e) => setAccessTokenUrl(e.target.value)} rows={calculateRows(accessTokenUrl)} type="text" id="accessTokenExample" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder=""></input>
    </div>
    <div>
        <label for="apiUrl" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">API URL</label>
        <input value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} type="url" id="apiUrl" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder=""></input>
    </div>  
    <div>
        <label for="documentationUrl" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">API Documentation URL</label>
        <input value={documentationUrl} onChange={(e) => setDocumentationUrl(e.target.value)} type="url" id="documentationUrl" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="https://dac-static.atlassian.com/cloud/jira/platform/swagger.v3.json?_v=1.6459.0-0.1278.0"></input>
    </div>  
    <div>
        <label for="logoURL" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Logo URL</label>
        <input value={logoURL} onChange={(e) => setLogoURL(e.target.value)} type="text" id="logoURL" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="https://static-00.iconduck.com/assets.00/jira-icon-512x512-kkop6eik.png"></input>
    </div>
    <div>
        <label for="website" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">App website</label>
        <input value={website} onChange={(e) => setWebsite(e.target.value)} type="url" id="website" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="https://www.atlassian.com/software/jira"></input>
    </div>
    <div>
        <label for="formFields" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">User Auth Fields</label>
        <textarea value={formFields} onChange={(e) => setFormFields(e.target.value)} rows={calculateRows(formFields)} type="text" id="formFields" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder=""></textarea>
    </div>

</div>
<div className="flex justify-between">
    <button type="submit" className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">Save</button>
    <button onClick={handleCreateDocumentation} className="text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:outline-none focus:ring-green-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800 mt-4">Create Documentation</button>
    <button onClick={handleDeleteDocumentation} className="text-white bg-red-700 hover:bg-green-800 focus:ring-4 focus:outline-none focus:ring-green-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800 mt-4">Delete Documentation</button>
</div>
</form>

</div>
<table className="max-w-2xl mx-auto bg-white">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b">id</th>
            <th className="py-2 px-4 border-b">path</th>
            <th className="py-2 px-4 border-b">method</th>
            <th className="py-2 px-4 border-b">summary</th>
            <th className="py-2 px-4 border-b">Actions</th>
          </tr>
        </thead>
        <tbody>
        {documentationRecords
          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)) // This will sort the records by `updatedAt` in descending order
          .map(record => (
            <tr key={record.id} onClick={() => handleDocumentationClick(record)}>
              <td className="py-2 px-4 border-b">{record.id}</td>
              <td className="py-2 px-4 border-b">{record.path}</td>
              <td className="py-2 px-4 border-b">{record.method}</td>
              <td className="py-2 px-4 border-b">{record.summary}</td>
              <td className="py-2 px-4 border-b">
                {/* You can add actions like view, edit, delete here */}
                <button>View</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Modal
        isOpen={showDocumentationModal}
        onRequestClose={handleCloseModal}
        contentLabel="Connect to App"
        style={customStyles}
        >
        <Documentation documentation={selectedDocumentation} app={app} />
      </Modal>
</div>
  );
};

export default AppView;