import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Documentation({ documentation, app }) {
  const [docType, setDocType] = useState(documentation ? documentation.type : '');
  const [botSummary, setBotSummary] = useState(documentation ? documentation.botSummary : '');
  const [botDescription, setBotDescription] = useState(documentation ? documentation.botDescription : '');
  const [next, setNext] = useState(documentation ? documentation.next : '');

  const backendUrl = "http://localhost:3001";

  useEffect(() => {
    if (documentation) {
      setDocType(documentation.type);
      setBotSummary(documentation.botSummary);
      setBotDescription(documentation.botDescription);
      setNext(documentation.next);
    }
  }, [documentation]);

  if (!documentation) {
    return <div>Select a documentation to view details...</div>;
  }

  const handleUpdate = async () => {
    try {
      const response = await axios.patch(`${backendUrl}/api/docs/${documentation.id}`, {
        botSummary,
        botDescription,
        next,
        vecId: documentation.vecId,
        app
      });
  
      console.log('Updated documentation:', response.data);
  
    } catch (error) {
      console.error('Failed to update documentation:', error);
    }
  };

  return (
    <div style={{ width: '800px', height: '600px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <h2>Documentation Detail</h2>
      <p><strong>ID:</strong> {documentation.id}</p>
      <p>
        <strong>Type:</strong> 
        <select 
          value={docType}
          onChange={e => setDocType(e.target.value)}
        >
          <option value=""></option>
          <option value="full">full</option>
          <option value="API">API</option>
          <option value="Methods">Methods</option>
        </select>
      </p>
      <p>
        <strong>Summary: </strong>
        {documentation.summary}
      </p>
      <p>
        <strong>Description: </strong>
        {documentation.description}
      </p>
      <p>
        <strong>Bot Summary:</strong>
        <textarea 
          value={botSummary}
          onChange={e => setBotSummary(e.target.value)}
          className="w-full p-2 mt-2 border rounded"
        ></textarea>
      </p>
      <p>
        <strong>Bot Description:</strong>
        <textarea 
          value={botDescription}
          onChange={e => setBotDescription(e.target.value)}
          className="w-full p-2 mt-2 border rounded"
        ></textarea>
      </p>
      <p>
        <strong>Next:</strong>
        <textarea 
          value={next}
          onChange={e => setNext(e.target.value)}
          className="w-full p-2 mt-2 border rounded"
        ></textarea>
      </p>
      <button onClick={handleUpdate} className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">Save Changes</button>
      <h3>Specification:</h3>
      <pre>{JSON.stringify(documentation.specification, null, 2)}</pre>
      {documentation.metaData && (
        <>
          <h3>Metadata:</h3>
          <pre>{JSON.stringify(documentation.metaData, null, 2)}</pre>
        </>
      )}
    </div>
  );
}

export default Documentation;
