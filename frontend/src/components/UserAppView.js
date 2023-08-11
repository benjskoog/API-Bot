import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function UserAppView({ app, user, setModalOpen }) {
  // used to render additional fields
  const [userInputs, setUserInputs] = useState({});
  const [accessToken, setAccessToken] = useState("");
  const [refreshToken, setRefreshToken] = useState("");
  const [apiUrl, setApiUrl] = useState("");
  const [appUserId, setAppUserId] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const backendUrl = process.env.REACT_APP_BACKEND_URL|| "http://localhost:3001";

  const handleInputChange = (event, field) => {
    setUserInputs({
      ...userInputs, 
      [event.target.name]: {
        name: event.target.value,
        type: field.type,
        forAuth: field?.forAuth,
        forAccess: field?.forAccess  
    },
      }
    );
  };

  const renderUserInputs = (userInputs) => {

    const userInputsArray = typeof userInputs === 'object' && userInputs !== null && !Array.isArray(userInputs)
    ? Object.keys(userInputs).map(field => ({ ...userInputs[field], name: field }))
    : [];

    console.log(userInputsArray)

    return userInputsArray;
  };

  const handleDisconnect = async (event) => {
    event.preventDefault();

    try {
        const response = await axios.delete(`${backendUrl}/api/user-app/${app.id}`, {
            headers: {
              'Authorization': `Bearer ${user.accessToken}`
            }
          });
    
        console.log(response);
        toast('App was succesfully disconnected!', { type: 'success', position: 'top-center', autoClose: 1000, pauseOnHover: false });
        setModalOpen(false);
      } catch (error) {
        console.error('Error deleting UserApp:', error);
        toast('Error disconnecting app', { type: 'error', position: 'top-center', autoClose: 5000, pauseOnHover: false });
      }

  };

  useEffect(() => {
    axios.get(`${backendUrl}/api/user-app/${app.id}`, {
        headers: {
          'Authorization': `Bearer ${user.accessToken}`
        }
      })
      .then(app => {
        console.log(app);
        setAccessToken(app.data[0].accessToken);
        setRefreshToken(app.data[0].refreshToken);
        setApiUrl(app.data[0].apiUrl);
        setAppUserId(app.data[0].appUserId);
        setExpiresAt(app.data[0].expiresAt);
        setUserInputs(app.data[0].userInputs);
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  }, []);

  return (
    <form onSubmit={handleDisconnect} style={{ width: '500px', height: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div className="grid gap-6 mb-6">
        <div>
            <label for="accessToken" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Access Token</label>
            <input value={accessToken} type="text" id="accessToken" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="" readonly></input>
        </div>
        <div>
            <label for="refreshToken" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Refresh Token</label>
            <input value={refreshToken} type="text" id="refreshToken" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="" readonly></input>
        </div>
        <div>
            <label for="appUserId" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">App User ID</label>
            <input value={appUserId} type="text" id="appUserId" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="" readonly></input>
        </div>
        <div>
            <label for="apiUrl" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">apiUrl</label>
            <input value={apiUrl} type="text" id="apiUrl" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="" readonly></input>
        </div>
        <div>
            <label for="expiresAt" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Expires At</label>
            <input value={expiresAt} type="text" id="expiresAt" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="" readonly></input>
        </div>
        {userInputs && renderUserInputs(userInputs).map((field, index) => (
          <div key={index}>
            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">{field.name}</label>
            <input className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              type={field.type}
              name={field.name}
              onChange={handleInputChange}
              required={field.required ? true : false}
              placeholder={field.placeholder ? field.placeholder : ""}
            />
          </div>
        ))}
      </div>
      <button type="submit" className="text-white bg-red-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
        Disconnect
      </button>
    </form>
  );
  
}

export default UserAppView;
