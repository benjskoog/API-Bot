import React, { useEffect, useState, useContext, useRef } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation, Link } from 'react-router-dom';
import NavBarLogo from './NavBarLogo';
import Chat from './Chat/Chat';
import api from "../Api.js"
import Modal from 'react-modal';
import UserContext from './User/UserContext';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Requests = () => {
   const { user, loading, logout } = useContext(UserContext);
   const [requests, setRequests] = useState([]);

   const handleDelete = (requestId) => {
    api.delete(`/requests/${requestId}`,
    {
        headers: {
          'Authorization': `Bearer ${user.accessToken}`
        }
    })
    .then(response => {
        console.log(response);
    })
    .catch((error) => {
        console.error(error);
    });
   }; 

   useEffect(() => {
      if (!user || !user.accessToken) return;
   
      api.get('/requests', {
        headers: {
          'Authorization': `Bearer ${user.accessToken}`
        }
      })
      .then(response => {
        setRequests(response.data);
        console.log(response);
      })
      .catch((error) => {
        console.error('Error:', error);
      });
   }, [user]); // Include user in the dependency array

  return (
<>
<div className="pt-6">
</div>
<div className="px-4">
<div className="grid grid-cols-1 xl:gap-4 my-4">
                  <div className="bg-white shadow rounded-lg mb-4 p-4 sm:p-6 h-full">
                     <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold leading-none text-gray-900">Requests</h3>
                        <a href="#" className="text-sm font-medium text-cyan-600 hover:bg-gray-100 rounded-lg inline-flex items-center p-2">
                        View all
                        </a>
                     </div>
                     <div className="flow-root">
                        <ul role="list" className="divide-y divide-gray-200">
                           {requests.map((request, index) => (
                            <li className="py-3 sm:py-4" key={index}>
                              <div className="flex items-center space-x-4">
                                    <div className="flex-1 min-w-0">
                                       <a>
                                          <p className="text-sm font-medium text-gray-900 truncate">
                                             {request.userRequest}
                                          </p>
                                       </a>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                       <a>
                                          <p className="text-sm font-medium text-gray-900 truncate">
                                             {request.createdAt}
                                          </p>
                                       </a>
                                    </div>
                                <button onClick={() => handleDelete(request.id)} className="hidden sm:inline-flex ml-5 text-white bg-cyan-600 hover:bg-cyan-700 focus:ring-4 focus:ring-cyan-200 font-medium rounded-lg text-sm px-5 py-2.5 text-center items-center mr-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                    </svg>
                                 </button>
                              </div>
                           </li>
                          ))}
                        
                        </ul>
                     </div>
                  </div>
               </div>
               </div>
</>
  );
};

export default Requests;
