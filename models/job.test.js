"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

describe("create", () => {
  const newJob = {
    title: "Manager at Hostner",
    salary: 120000,
    equity: 0,
    company_handle: "c1",
  };
  test("create new job", async () => {
    const res = await Job.create(newJob);
    expect(res).toEqual({
      id: expect.any(Number),
      title: "Manager at Hostner",
      salary: 120000,
      equity: "0",
      company_handle: "c1",
    });
    const result = await db.query(
      `SELECT * FROM jobs WHERE title = 'Manager at Hostner' `,
    );
    expect(result.rows[0]).toEqual({
      id: expect.any(Number),
      title: "Manager at Hostner",
      salary: 120000,
      equity: "0",
      company_handle: "c1",
    });
  });
});

describe("GET/jobs", () => {
  test("Get list of jobs", async () => {
    const res = await Job.findAll();
    expect(res).toEqual([
      {
        id: expect.any(Number),
        title: "j1",
        salary: 1,
        equity: null,
        company_handle: "c1",
      },
      {
        id: expect.any(Number),
        title: "j2",
        salary: 2,
        equity: "0.2",
        company_handle: "c2",
      },
      {
        id: expect.any(Number),
        title: "j3",
        salary: 3,
        equity: "0.3",
        company_handle: "c3",
      },
    ]);
  });

  test("GET / query string title", async () => {
    const res = await Job.filterJobs({ title: "1" });
    expect(res).toEqual([
      {
        id: expect.any(Number),
        title: "j1",
        salary: 1,
        equity: null,
        company_handle: "c1",
      },
    ]);
  });
  test("GET / query string minSalary", async () => {
    const res = await Job.filterJobs({ minSalary: "3" });
    expect(res).toEqual([
      {
        id: expect.any(Number),
        title: "j3",
        salary: 3,
        equity: "0.3",
        company_handle: "c3",
      },
    ]);
  });
  test("GET / query string hasEquity", async () => {
    const res = await Job.filterJobs({ hasEquity: true });
    expect(res).toEqual([
      {
        id: expect.any(Number),
        title: "j2",
        salary: 2,
        equity: "0.2",
        company_handle: "c2",
      },
      {
        id: expect.any(Number),
        title: "j3",
        salary: 3,
        equity: "0.3",
        company_handle: "c3",
      },
    ]);
  });

  test("Get a job / id ", async () => {
    const job = await db.query(`SELECT id FROM jobs WHERE title='j1'`);

    const res = await Job.get(job.rows[0].id);

    expect(res).toEqual({
      id: expect.any(Number),
      title: "j1",
      salary: 1,
      equity: null,
      company_handle: "c1",
    });
  });
});

describe("PATCH /", () => {
  test("update job salary", async () => {
    const job = await db.query(`SELECT * FROM jobs WHERE title='j1'`);
    const res = await Job.update(job.rows[0].id, { salary: 10 });
    expect(res).toEqual({
      id: expect.any(Number),
      title: "j1",
      salary: 10,
      equity: null,
      company_handle: "c1",
    });
  });

  test("update job title", async () => {
    const job = await db.query(`SELECT * FROM jobs WHERE title='j1'`);
    const res = await Job.update(job.rows[0].id, { title: "j10" });
    expect(res).toEqual({
      id: expect.any(Number),
      title: "j10",
      salary: 1,
      equity: null,
      company_handle: "c1",
    });
  });

  test("update job equity", async () => {
    const job = await db.query(`SELECT id FROM jobs WHERE title='j1'`);
    const res = await Job.update(job.rows[0].id, { equity: 0.1 });
    expect(res).toEqual({
      id: expect.any(Number),
      title: "j1",
      salary: 1,
      equity: "0.1",
      company_handle: "c1",
    });
  });
});

describe("Delete job", () => {
  test("delete a job ", async () => {
    const job = await db.query(`SELECT id FROM jobs WHERE title='j1'`);
    expect(job.rows.length).toBe(1);

    const res = await Job.remove(job.rows[0].id);

    const deletedJob = await db.query(`SELECT id FROM jobs WHERE title='j1'`);
    expect(deletedJob.rows.length).toBe(0);
  });
});
