'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('Documentations', 'vecId', {
      type: Sequelize.UUID,
      allowNull: true  // Set allowNull to true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('Documentations', 'vecId', {
      type: Sequelize.UUID,
      allowNull: false  // Reverting back to allowNull false
    });
  }
};
