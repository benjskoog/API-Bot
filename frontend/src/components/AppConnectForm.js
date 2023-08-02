import React, { useState } from 'react';
import axios from 'axios';

function AppConnectForm({ app, formFields, user, handleConnect }) {
  const [formInputs, setFormInputs] = useState({});

  const backendUrl = "http://localhost:3001";

  console.log(formFields)

  const handleInputChange = (event, field) => {
    console.log("Field:", field);
    console.log("Event Target Name:", event.target.name);
    console.log("Event Target Value:", event.target.value);
  
    setFormInputs(prevFormInputs => {
      const updatedFormInputs = { ...prevFormInputs };
  
      if (field.type === "multiselect") {
        const valueArray = updatedFormInputs[field.name]?.value || [];
  
        if (event.target.checked) {
          valueArray.push(event.target.value);
        } else {
          const index = valueArray.indexOf(event.target.value);
          if (index > -1) {
            valueArray.splice(index, 1);
          }
        }
  
        updatedFormInputs[field.name] = {
          value: valueArray,
          type: field.type,
          forAuth: field?.forAuth,
          forAccess: field?.forAccess,
        };
      } else {
        updatedFormInputs[event.target.name] = {
          value: event.target.value,
          type: field.type,
          forAuth: field?.forAuth,
          forAccess: field?.forAccess,
        };
      }
  
      console.log("Updated Form Inputs:", updatedFormInputs);
      return updatedFormInputs;
    });
  };
  

  const _handleConnect = async (event) => {
    event.preventDefault();

    console.log(formFields)

    formFields.filter(field => field.type === "config").forEach(field => formInputs[field.name] = {value: field.params, type: field.type});

    const userAppData = {
        app: app,
        userInputs: formInputs
    };

    handleConnect(userAppData);
   

  };

  return (
    <form onSubmit={_handleConnect} style={{ width: '500px', height: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div className="grid gap-6 mb-6">
        {formFields.map((field, index) => (
          field.type !== "config" && (
            <div key={index}>
              <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">{field.label}</label>
              {field.type === "multiselect" ? (
                field.options.map((option, optIndex) => (
                  <div key={optIndex}>
                  <label>
                    <input type="checkbox" 
                           value={option.code}
                           onChange={(e) => handleInputChange(e, field)}
                           name={field.name}
                    />
                    {option.name}
                  </label>
                  </div>
                ))
              ) : (
                <input className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  type={field.type}
                  name={field.name}
                  onChange={(e) => handleInputChange(e, field)}
                  required={field.required ? true : false}
                  placeholder={field.placeholder ? field.placeholder : ""}
                />
              )}
            </div>
          )
        ))}
      </div>
      <button type="submit" className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
        Connect
      </button>
    </form>
  );
  
  
  
}

export default AppConnectForm;
