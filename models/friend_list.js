/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
    let friendList= sequelize.define('friend_list', {
        user_id: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            primaryKey : true,
            references: {
                model: 'user',
                key: 'id'
            }
        },
        friend_id: {
            type: DataTypes.INTEGER(10).UNSIGNED,
            primaryKey : true,
            references: {
                model: 'user',
                key: 'id'
            }
        }
    }, {
        tableName: 'friend_list',
        freezeTableName: true,
        hooks : {
            beforeCreate(attributes, options) {
                if(attributes.user_id === attributes.friend_id){
                    throw new Error("내 아이디는 친구로 추가할 수 없습니다!");
                }
            }

        }
    });

    friendList.associate = (models) => {
        friendList.belongsTo(models.user, {foreignKey : 'friend_id', targetKey : "id"}),
        friendList.belongsTo(models.user, {foreignKey : 'user_id', targetKey : "id"});
    };



    return friendList;
};
