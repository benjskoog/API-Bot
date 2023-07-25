import React, { useContext, useRef } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation, Link } from 'react-router-dom';
import NavBarLogo from './NavBarLogo';
import Chat from './Chat/Chat';

const Platforms = ({ selectedItem, onNewChatClick }) => {

  const icon1 = useRef(null);
  const menu1 = useRef(null);
  const icon2 = useRef(null);
  const menu2 = useRef(null);

  const showMenu1 = () => {
    icon1.current.classNameList.toggle("rotate-180");
    menu1.current.classNameList.toggle("hidden");
  };

  const showMenu2 = () => {
    icon2.current.classNameList.toggle("rotate-180");
    menu2.current.classNameList.toggle("hidden");
  };

  return (
<>
<div class="pt-6">
    <a href="/new-platform" className="hidden sm:inline-flex ml-5 text-white bg-cyan-600 hover:bg-cyan-700 focus:ring-4 focus:ring-cyan-200 font-medium rounded-lg text-sm px-5 py-2.5 text-center items-center mr-3">
        Add Platform
    </a>
</div>
<div class="px-4">
<div className="grid grid-cols-1 xl:gap-4 my-4">
                  <div className="bg-white shadow rounded-lg mb-4 p-4 sm:p-6 h-full">
                     <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold leading-none text-gray-900">Platforms</h3>
                        <a href="#" className="text-sm font-medium text-cyan-600 hover:bg-gray-100 rounded-lg inline-flex items-center p-2">
                        View all
                        </a>
                     </div>
                     <div className="flow-root">
                        <ul role="list" className="divide-y divide-gray-200">
                           <li className="py-3 sm:py-4">
                              <div className="flex items-center space-x-4">
                                 <div className="flex-shrink-0">
                                    <img className="h-8 w-8 rounded-full" src="https://static-00.iconduck.com/assets.00/jira-icon-512x512-kkop6eik.png" alt="Jira"></img>
                                 </div>
                                 <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                       Jira
                                    </p>
                                 </div>
                                 <a href="#" className="hidden sm:inline-flex ml-5 text-white bg-cyan-600 hover:bg-cyan-700 focus:ring-4 focus:ring-cyan-200 font-medium rounded-lg text-sm px-5 py-2.5 text-center items-center mr-3">
                                    Connect
                                </a>
                              </div>
                           </li>
                           <li className="py-3 sm:py-4">
                              <div className="flex items-center space-x-4">
                                 <div className="flex-shrink-0">
                                    <img className="h-8 w-8 rounded-full" src="https://upload.wikimedia.org/wikipedia/en/e/e9/Optimizely_Logo.png" alt="Optimizely CMP"></img>
                                 </div>
                                 <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                       Optimizely CMP
                                    </p>
                                 </div>
                                 <a href="#" className="hidden sm:inline-flex ml-5 text-white bg-cyan-600 hover:bg-cyan-700 focus:ring-4 focus:ring-cyan-200 font-medium rounded-lg text-sm px-5 py-2.5 text-center items-center mr-3">
                                    Connect
                                </a>
                              </div>
                           </li>
                        
                        </ul>
                     </div>
                  </div>
               </div>
               </div>
               
<script async defer src="https://buttons.github.io/buttons.js"></script>
</>
  );
};

export default Platforms;