'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Requests', 'userId', {
      type: Sequelize.UUID,
      references: {
        model: 'Users', // name of the Target model (assuming your user table is named 'Users')
        key: 'id',     // key in the Target model that we're referencing
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Requests', 'userId');
  }
};

