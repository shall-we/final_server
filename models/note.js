/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  let note= sequelize.define('note', {
    id: {
      type: DataTypes.INTEGER(10).UNSIGNED,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    content: {
      type: DataTypes.STRING(300),
      allowNull: false,
    },
    folder_id: {
      type: DataTypes.INTEGER(10).UNSIGNED,
      allowNull: false,
      references: {
        model: 'folder',
        key: 'id'
      }
    }
  }, {
    tableName: 'note'
  });

  // note 1 : attachment n
  note.associate = (models) =>{
    note.belongsTo(models.folder, { foreignKeyConstraint: true, onDelete: 'cascade' }),
    note.hasMany(models.attachment, { foreignKey : 'note_id', onDelete : 'cascade' });
    note.hasOne(models.status, { foreignKey: 'id', onDelete: 'cascade' });
    //note.belongsTo(models.status);
  };

  return note;
};
