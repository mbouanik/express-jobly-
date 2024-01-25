const { BadRequestError } = require("../expressError");

/* THIS NEEDS SOME GREAT DOCUMENTATION.
 Allow to update a table partialy return a Object with the values to update in the  SET clause
dataToUpdate Object {column_name: newVAlue}
jsToSql Object {column_name: "column_name"}
return Object { setCols :'"column_name"=$1, "column_name2"=$2', values:[value1, value2]} */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map(
    (colName, idx) => `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
