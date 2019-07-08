module.exports = function(sequelize, DataTypes) {
    const chatroom= sequelize.define('chatroom', {
        chatroom_id: {
            type : DataTypes.STRING(50),
            primaryKey : true,
        }
    }, {
        tableName: 'chatroom',
        freezeTableName: true
    });
    return chatroom;
};