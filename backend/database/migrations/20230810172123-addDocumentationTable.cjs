'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Documentations', {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        unique: true,
        defaultValue: Sequelize.UUIDV4
      },
      vecId: {
        type: Sequelize.UUID,
        allowNull: false // makes it mandatory
      },
      type: {
        type: Sequelize.STRING,
        allowNull: false // makes it mandatory
      },
      path: {
        type: Sequelize.STRING,
        allowNull: false // makes it mandatory
      },
      method: {
        type: Sequelize.STRING,
        allowNull: false // makes it mandatory
      },
      summary: {
        type: Sequelize.TEXT,
        allowNull: true // makes it mandatory
      },
      botSummary: {
        type: Sequelize.TEXT,
        allowNull: true // makes it mandatory
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true // makes it mandatory
      },
      botDescription: {
        type: Sequelize.TEXT,
        allowNull: true // makes it mandatory
      },
      specification: {
        type: Sequelize.JSON,
        allowNull: false // makes it mandatory
      },
      next: {
        type: Sequelize.JSON, // stores metadata
        allowNull: true // makes it optional
      },
      appId: {
        type: Sequelize.UUID,
        references: {
          model: "Apps",
          key: 'id'
        },
        allowNull: false
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Documentations');
  }
};
