import React, { useState, useEffect, useContext } from "react";
import api from "../../Api.js"
import BottomInput from './BottomInput';
import ChatHistory from './ChatHistory';
import Messages from './Messages';
import UserContext from '../User/UserContext';

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [fetchingResponse, setFetchingResponse] = useState(false);
  const { user, loading, logout } = useContext(UserContext);

  const handleFormSubmit = async ({ query }) => {

    setMessages((prevMessages) => [
      ...prevMessages,
      { type: "user", message: query },
    ]);

    setMessage("");  // Clear input field

    try {
      setFetchingResponse(true);
      
      const response = await api.post('/chat', {
        message: query
      },
      {headers: {
        'Authorization': `Bearer ${user.accessToken}`
      }});
      
      const botMessage = response.data;

      console.log(botMessage);
      
      setMessages((prevMessages) => [
        ...prevMessages,
        { type: "bot", message: botMessage },
      ]);

      setFetchingResponse(false);
    } catch (error) {
      console.error("Error posting message:", error);
    }
  };

  return (
          <div className="flex">
          <div className="overflow-y-auto max-w-full flex-1 flex-col">
            <Messages
              messages={messages}
              fetchingResponse={fetchingResponse}
            />
            <BottomInput onSubmit={handleFormSubmit}/>
          </div>
        </div>
  );
}

export default Chat;
