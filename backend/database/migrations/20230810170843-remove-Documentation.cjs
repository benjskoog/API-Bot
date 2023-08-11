'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Documentations'); // Make sure the table name matches the name used in your database
  },

  down: async (queryInterface, Sequelize) => {
    // Here you'd usually recreate the table, but since you're deleting the model, you can leave it empty
    // If you ever need to undo this migration, you'd have to manually recreate the table
  }
};
