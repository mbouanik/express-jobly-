"use strict";

const db = require("../db");
const {
  BadRequestError,
  NotFoundError,
  ExpressError,
} = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Job {
  /** Create a job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, companyHandle }
   *
   * Returns {id, title, salary, equity, companyHandle}
   *
   * */

  static async create({ title, salary, equity, company_handle }) {
    const result = await db.query(
      `INSERT INTO jobs
           (title, salary, equity, company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING id, title, salary, equity, company_handle`,
      [title, salary, equity, company_handle],
    );
    const job = result.rows[0];

    return job;
  }

  /** Find all jobs.
   *
   * Returns [{ title, salary, equity, companyHandle }, ...]
   * */

  static async findAll() {
    const jobsRes = await db.query(
      `SELECT  id, title, salary, equity, company_handle
           FROM jobs
           ORDER BY id`,
    );
    return jobsRes.rows;
  }

  /** Given a job id , return data about job.
   *
   * Returns { id, title, salary, equity, companyHandle}
   *   where jobs is [{ id, title, salary, equity, companyhandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(id) {
    const jobRes = await db.query(
      `SELECT   id, title, salary, equity, company_handle
         FROM jobs
           WHERE id = $1`,
      [id],
    );

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No job : ${id}`);

    return job;
  }

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {title,salary, equity, companyHandle}
   *
   * Returns {id, title, salary, equity, companyHandle}
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {
      title: "title",
      salary: "salary",
      equity: "equity",
    });
    const jobVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs
                      SET ${setCols} 
                      WHERE id = ${jobVarIdx} 
                      RETURNING id, 
                                title, 
                                salary, 
                                equity,
                                company_handle
    `;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(id) {
    const result = await db.query(
      `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING title`,
      [id],
    );
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No Job ${id}`);
  }

  static async filterJobs(filters) {
    // list of accepted filters
    const acceptedFilters = ["title", "minSalary", "hasEquity"];
    // I get the name of the filter from the query string
    // query string {title:"kl", minSalary:"30000"} => [title, minSalary]
    const keys = Object.keys(filters);
    // map throgth the key if the key is valid i create the appropriate query clause
    // keys =["title", "minSalary"] => ["title LIKE '%kl%'", "minSalary >=30000"]

    const clauseList = keys.map(function (key) {
      if (acceptedFilters.includes(key)) {
        if (key === "title") {
          return `title LIKE '%${filters[key]}%'`;
        } else if (key === "minSalary") {
          return `salary >= ${filters[key]}`;
        } else if (filters[key]) {
          return "equity > 0";
        }
      }
    });
    // create the clause join the list with an AND
    //  ["name LIKE '%kl%'", "salary >=30000"] => "title LIKE '%kl' AND minSalary >= 30000"
    const clause = clauseList.join(" AND ");
    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle FROM jobs WHERE ${clause}`,
    );
    return result.rows;
  }
}

module.exports = Job;
