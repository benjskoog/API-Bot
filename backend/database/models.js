import { DataTypes } from 'sequelize';
import { sequelize } from './db.js';

// Define User model
const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        unique: true
    },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

// Define Conversation model
const Conversation = sequelize.define('Conversation', {
    id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        unique: true
    },
  userId: {
    type: DataTypes.UUID,
    references: {
      model: User, 
      key: 'id'
    }
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

// Define Message model
const Message = sequelize.define('Message', {
    id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        unique: true
    },
  conversationId: {
    type: DataTypes.UUID,
    references: {
      model: Conversation, 
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.UUID,
    references: {
      model: User, 
      key: 'id'
    }
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  }
});

// Define APIRequest model
const APIRequest = sequelize.define('APIRequest', {
    id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        unique: true
    },
  conversationId: {
    type: DataTypes.UUID,
    references: {
      model: Conversation, 
      key: 'id'
    }
  },
  endpoint: {
    type: DataTypes.STRING,
    allowNull: false
  },
  requestPayload: {
    type: DataTypes.JSON,
    allowNull: true
  },
  responsePayload: {
    type: DataTypes.JSON,
    allowNull: true
  },
  statusCode: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
});

// Update Platform model
const Platform = sequelize.define('Platform', {
    id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        unique: true
    },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  documentationUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  logoUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // You might want to store some general details about the platform here, 
  // but specific user authentication details should go in UserPlatform
});

// New UserPlatform model
const UserPlatform = sequelize.define('UserPlatform', {
  id: {
    type: DataTypes.UUID,
    allowNull: false,
    primaryKey: true,
    unique: true
  },
  userId: {
    type: DataTypes.UUID,
    references: {
      model: User,
      key: 'id'
    }
  },
  platformId: {
    type: DataTypes.UUID,
    references: {
      model: Platform,
      key: 'id'
    }
  },
  accessToken: {
    type: DataTypes.STRING,
    allowNull: true
  },
  refreshToken: {
    type: DataTypes.STRING,
    allowNull: true
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // Any other fields needed for authentication or configuration with the platform
});

// User - UserPlatform relationship
User.hasMany(UserPlatform, {
  foreignKey: 'userId'
});
UserPlatform.belongsTo(User, {
  foreignKey: 'userId'
});

// Platform - UserPlatform relationship
Platform.hasMany(UserPlatform, {
  foreignKey: 'platformId'
});
UserPlatform.belongsTo(Platform, {
  foreignKey: 'platformId'
});


// User - Conversation relationship
User.hasMany(Conversation, {
  foreignKey: 'userId'
});
Conversation.belongsTo(User, {
  foreignKey: 'userId'
});

// User - Message relationship
User.hasMany(Message, {
  foreignKey: 'userId'
});
Message.belongsTo(User, {
  foreignKey: 'userId'
});

// Conversation - Message relationship
Conversation.hasMany(Message, {
  foreignKey: 'conversationId'
});
Message.belongsTo(Conversation, {
  foreignKey: 'conversationId'
});

// Conversation - APIRequest relationship
Conversation.hasMany(APIRequest, {
  foreignKey: 'conversationId'
});
APIRequest.belongsTo(Conversation, {
  foreignKey: 'conversationId'
});

export { User, Conversation, Message, APIRequest, Platform };
