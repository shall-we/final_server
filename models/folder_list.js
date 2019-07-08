/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
    return sequelize.define(
        "folder_list",
        {
            user_id: {
                type: DataTypes.INTEGER(10).UNSIGNED,
                allowNull: false,
                primaryKey: true,
                references: {
                    model: "user",
                    key: "id"
                }
            },
            folder_id: {
                type: DataTypes.INTEGER(10).UNSIGNED,
                allowNull: false,
                primaryKey: true,
                references: {
                    model: "folder",
                    key: "id"
                }
            },
            permission: {
                type: DataTypes.ENUM("OWNER", "MANAGER", "MEMBER"),
                allowNull: true
            }
        },
        {
            tableName: "folder_list"
        }
    );
};
