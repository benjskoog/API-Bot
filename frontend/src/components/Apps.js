import React, { useEffect, useState, useContext, useRef } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation, Link } from 'react-router-dom';
import NavBarLogo from './NavBarLogo';
import Chat from './Chat/Chat';
import axios from 'axios';
import Modal from 'react-modal';
import UserContext from './User/UserContext';
import AppConnectForm from './AppConnectForm';
import UserAppView from './UserAppView'
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Apps = () => {
   const { user, loading, logout } = useContext(UserContext);
   const [popupWindow, setPopupWindow] = useState(null);

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

    const openPopup = (url) => {

      if (popupWindow) {
        popupWindow.close();
      }

      const width = 600;
      const height = 600;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const newWindow = window.open(url, "_blank", `toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=${width}, height=${height}, top=${top}, left=${left}`);
      setPopupWindow(newWindow);

      const listenerFunction = function(event) {
        console.log(event.origin);
        if (event.origin !== `${"https://2804-136-29-96-224.ngrok-free.app" || process.env.REACT_APP_FRONTEND_URL}`) {
          console.log("no_match");
          return; 
        }

        console.log(event.data);
        const message = event.data.message;
    
        if (message === 'success') {
          toast('App successfully connected!', { type: 'success', position: 'top-center', autoClose: 1000, pauseOnHover: false });
          setModalOpen(false);
          
          window.removeEventListener('message', listenerFunction, false);
        }
      };
    
      window.addEventListener('message', listenerFunction, false);
    };
    


   const [apps, setApps] = useState([]);
   const [modalOpen, setModalOpen] = useState(false);
   const [currentApp, setCurrentApp] = useState(null); // current app to connect
   const backendUrl = "http://localhost:3001";

   useEffect(() => {
      if (!user || !user.accessToken) return;
   
      axios.get(`${backendUrl}/api/apps`, {
        headers: {
          'Authorization': `Bearer ${user.accessToken}`
        }
      })
      .then(response => {
        setApps(response.data);
        console.log(response.data);
      })
      .catch((error) => {
        console.error('Error:', error);
      });
   }, [user]); // Include user in the dependency array

    const handleConnect = async (userAppData) => {

      const { app, userInputs } = userAppData;

      console.log(app);
  
      try {
          const response = await axios.post(`${backendUrl}/api/handle-connect/${app.id}`, userAppData, {
            headers: {
              'Authorization': `Bearer ${user.accessToken}`
            }
          });
          const { authUrl } = response.data;
          console.log(authUrl);
          openPopup(authUrl);
        } catch (error) {
          console.error('Error creating UserApp:', error);
        }
        
  
    };

    const handleOpenModal = (app) => {

      const data = {
         app
      }

      if (app.isConnected || app.formFields) {

         setCurrentApp(app);
         setModalOpen(true);

      } else {

         console.log("connecting app")

         handleConnect(data);

      }
    };

    const handleCloseModal = () => {
      setCurrentApp(null);
      setModalOpen(false);
    };

  return (
<>
<div className="pt-6">
    <a href="/new-app" className="hidden sm:inline-flex ml-5 text-white bg-cyan-600 hover:bg-cyan-700 focus:ring-4 focus:ring-cyan-200 font-medium rounded-lg text-sm px-5 py-2.5 text-center items-center mr-3">
        Add App
    </a>
</div>
<div className="px-4">
<div className="grid grid-cols-1 xl:gap-4 my-4">
                  <div className="bg-white shadow rounded-lg mb-4 p-4 sm:p-6 h-full">
                     <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold leading-none text-gray-900">Apps</h3>
                        <a href="#" className="text-sm font-medium text-cyan-600 hover:bg-gray-100 rounded-lg inline-flex items-center p-2">
                        View all
                        </a>
                     </div>
                     <div className="flow-root">
                        <ul role="list" className="divide-y divide-gray-200">
                           {apps.map((app, index) => (
                            <li className="py-3 sm:py-4" key={index}>
                              <div className="flex items-center space-x-4">
                                 <div className="flex-shrink-0">
                                    <img className="h-8 w-8 rounded-full" src={app.logoUrl} alt={app.name}></img>
                                 </div>
                                    <div className="flex-1 min-w-0">
                                       <a href={`/app/${app.id}`}>
                                          <p className="text-sm font-medium text-gray-900 truncate">
                                             {app.name}
                                          </p>
                                       </a>
                                    </div>
                                 {app.isConnected ? (
                                    <button onClick={() => handleOpenModal(app)} className="hidden sm:inline-flex ml-5 text-white bg-cyan-600 hover:bg-cyan-700 focus:ring-4 focus:ring-cyan-200 font-medium rounded-lg text-sm px-5 py-2.5 text-center items-center mr-3">
                                       View Details
                                 </button>
                                 ) : (
                                    <button onClick={() => handleOpenModal(app)} className="hidden sm:inline-flex ml-5 text-white bg-cyan-600 hover:bg-cyan-700 focus:ring-4 focus:ring-cyan-200 font-medium rounded-lg text-sm px-5 py-2.5 text-center items-center mr-3">
                                       Connect
                                    </button>
                                 )
                                }
                              </div>
                           </li>
                          ))}
                        
                        </ul>
                     </div>
                  </div>
               </div>
               </div>

    <Modal
      isOpen={modalOpen}
      onRequestClose={handleCloseModal}
      contentLabel="Connect to App"
      style={customStyles}
    >
      {currentApp && currentApp.isConnected === false && <AppConnectForm user={user} app={currentApp} handleConnect={handleConnect} formFields={currentApp.formFields ? JSON.parse(currentApp.formFields) : ""} />}
      {currentApp && currentApp.isConnected === true && <UserAppView user={user} app={currentApp} formFields={currentApp.formFields ? JSON.parse(currentApp.formFields) : ""} setModalOpen={setModalOpen} />}
    </Modal>
</>
  );
};

export default Apps;
