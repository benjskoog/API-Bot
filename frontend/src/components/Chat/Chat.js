import React, { useState, useEffect, useContext } from "react";
import api from "../../Api.js"
import BottomInput from './BottomInput';
import ChatHistory from './ChatHistory';
import Messages from './Messages';
import UserContext from '../User/UserContext';
import { useParams } from 'react-router-dom';

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [requestData, setRequestData] = useState([]);
  const [fetchingResponse, setFetchingResponse] = useState(false);
  const { user, loading, logout } = useContext(UserContext);
  const { conversationId } = useParams();

  const handleFormSubmit = async ({ query }) => {

    setMessages((prevMessages) => [
      ...prevMessages,
      { type: "user", content: query },
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
      
      const botMessage = response.data.responseForUser;

      setRequestData(response.data.requestData.userData);

      console.log(botMessage);
      
      setMessages((prevMessages) => [
        ...prevMessages,
        { type: "bot", content: botMessage },
      ]);

      setFetchingResponse(false);
    } catch (error) {
      console.error("Error posting message:", error);
    }
  };

  useEffect(() => {

    if (!user || !user.accessToken) {
      console.error('User not authenticated or access token missing');
      return;
    } 
    
    if (conversationId) {

      api.get(`/conversations/${conversationId}`,
      {headers: {
        'Authorization': `Bearer ${user.accessToken}`
      }})
        .then(response => {
          const conversation = response.data;
          console.log(conversation.Requests[0].responsePayload.userData);
          setMessages(conversation.Messages);
          setRequestData(conversation.Requests[0].responsePayload.userData);
        })
        .catch((error) => {
          console.error('Error:', error);
        });

    }
  }, []);

  function DynamicTable({ data }) {
    if (!data || data.length === 0) {
      return;
    }
  
    // Retrieve column headers (keys from the objects)
    const columns = Object.keys(data[0]);
  
    return (
        <table className="w-full min-w-full">
          <thead>
              <tr>
                {columns.map((col, index) => (
                    <th key={index} className="border-b p-2">{col}</th>
                ))}
              </tr>
          </thead>
          <tbody>
              {data.map((row, rowIndex) => (
                <tr key={rowIndex}>
                    {columns.map((col, colIndex) => (
                      <td key={colIndex} className="border-t p-3 break-words">
                          {typeof row[col] === 'object' ? JSON.stringify(row[col]) : row[col]}
                      </td>
                    ))}
                </tr>
              ))}
          </tbody>
        </table>
    );
  }
  

  return (
          <div className="flex overflow-hidden">
          <div className="max-w-full flex-1 flex-col">
            <Messages
              messages={messages}
              fetchingResponse={fetchingResponse}
            />
            {requestData.length > 0 && (
                <div className="bg-white shadow rounded-xl mx-auto my-4 p-4 max-w-6xl overflow-auto">
                    <DynamicTable data={requestData} />
                </div>
            )}
            <div className="p-8"></div>
            <BottomInput onSubmit={handleFormSubmit}/>
          </div>
        </div>
  );
}

export default Chat;
