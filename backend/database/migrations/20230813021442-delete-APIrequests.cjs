'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // code to run to apply the migration
    return queryInterface.dropTable('APIRequests');
  },

  down: async (queryInterface, Sequelize) => {
    // code to run to undo the migration
    return queryInterface.createTable('APIRequests', {
      // columns and their definitions
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        unique: true,
        defaultValue: Sequelize.UUIDV4
      },
      // ... other column definitions ...
      // ... 
    });
  }
};

