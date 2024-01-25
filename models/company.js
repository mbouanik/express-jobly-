"use strict";

const db = require("../db");
const {
  BadRequestError,
  NotFoundError,
  ExpressError,
} = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(
      `SELECT handle
           FROM companies
           WHERE handle = $1`,
      [handle],
    );

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(
      `INSERT INTO companies
           (handle, name, description, num_employees, logo_url)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
      [handle, name, description, numEmployees, logoUrl],
    );
    const company = result.rows[0];

    return company;
  }

  /** Find all companies.
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

  static async findAll() {
    const companiesRes = await db.query(
      `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           ORDER BY name`,
    );
    return companiesRes.rows;
  }

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    const companyRes = await db.query(
      `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           WHERE handle = $1`,
      [handle],
    );

    const company = companyRes.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {
      numEmployees: "num_employees",
      logoUrl: "logo_url",
    });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE companies 
                      SET ${setCols} 
                      WHERE handle = ${handleVarIdx} 
                      RETURNING handle, 
                                name, 
                                description, 
                                num_employees AS "numEmployees", 
                                logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(
      `DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
      [handle],
    );
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }

  static async filterCompany(filters) {
    // list of accepted filters
    const acceptedFilters = ["name", "minEmployees", "maxEmployees"];
    // I get the name of the filter from the query string
    // query string {name:"kl", minEmployees:"3"} => [name, minEmployees]
    // verify that minEmployees < maxEmployees otherwise return 400 BadRequestError
    const keys = Object.keys(filters);
    if (keys.includes("minEmployees") && keys.includes("maxEmployees")) {
      if (
        parseInt(filters["minEmployees"]) > parseInt(filters["maxEmployees"])
      ) {
        throw new ExpressError(
          "minEmployees can't be greater than maxEmployees",
          400,
        );
      }
    }
    // map throgth the key if the key is valid i create the appropriate query clause
    // keys =["name", "minEmployees"] => ["name LIKE '%kl%'", "num_employees >=3"]

    const clauseList = keys.map(function (key) {
      if (acceptedFilters.includes(key)) {
        if (key === "name") {
          return `name LIKE '%${filters[key]}%'`;
        } else if (key === "minEmployees") {
          return `num_employees >= ${filters[key]}`;
        } else {
          return `num_employees <= ${filters[key]}`;
        }
      }
    });
    // create the clause join the list with an AND
    //  ["name LIKE '%kl%'", "num_employees >=3"] => "name LIKE '%kl' AND minEmployees >= 3"
    const clause = clauseList.join(" AND ");
    const result = await db.query(
      `SELECT handle, name, description, num_employees, logo_url FROM companies WHERE ${clause}`,
    );
    return result.rows;
  }
}

module.exports = Company;
