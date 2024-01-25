"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  adminToken,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/*********************************/

describe("POST / job", () => {
  const newJob = {
    title: "Manager at Hostner",
    salary: 120000,
    equity: "0",
    company_handle: "c1",
  };

  test("ok for admin", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        title: "Manager at Hostner",
        salary: 120000,
        equity: "0",
        company_handle: "c1",
      },
    });
  });

  test("not ok for user", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
    expect(resp.body).toEqual({
      error: {
        message: "Unauthorized",
        status: 401,
      },
    });
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        title: "new",
        salary: 10,
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        ...newJob,
        equity: 0,
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      jobs: [
        {
          id: expect.any(Number),
          title: "j1",
          salary: 1,
          equity: "0",
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
      ],
    });
  });
  test("GET/Job:id", async () => {
    const job = await db.query(`SELECT id FROM jobs WHERE title='j1'`);
    const resp = await request(app).get(`/jobs/${job.rows[0].id}`);
    expect(resp.statusCode).toBe(200);
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        title: "j1",
        salary: 1,
        equity: "0",
        company_handle: "c1",
      },
    });
  });
});

describe("GET/ filters", () => {
  test("test title", async () => {
    const resp = await request(app).get("/jobs?title=1");
    expect(resp.statusCode).toBe(200);
    expect(resp.body).toEqual({
      jobs: [
        {
          id: expect.any(Number),
          title: "j1",
          salary: 1,
          equity: "0",
          company_handle: "c1",
        },
      ],
    });
  });

  test("test salary", async () => {
    const resp = await request(app).get("/jobs?minSalary=2");
    expect(resp.statusCode).toBe(200);
    expect(resp.body).toEqual({
      jobs: [
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
      ],
    });
  });

  test("test hasEquity", async () => {
    const resp = await request(app).get("/jobs?hasEquity=true");
    expect(resp.statusCode).toBe(200);
    expect(resp.body).toEqual({
      jobs: [
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
      ],
    });
  });
});

describe("Update", () => {
  test("update job for admin", async () => {
    const job = await db.query(`SELECT id FROM jobs WHERE title='j1'`);
    console.log(job.rows[0].id);
    const resp = await request(app)
      .patch(`/jobs/${job.rows[0].id}`)
      .send({ salary: 10 })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toBe(200);
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        title: "j1",
        salary: 10,
        equity: "0",
        company_handle: "c1",
      },
    });
  });
  test("update job  not working for user", async () => {
    const job = await db.query(`SELECT id FROM jobs WHERE title='j1'`);
    console.log(job.rows[0].id);
    const resp = await request(app)
      .patch(`/jobs/${job.rows[0].id}`)
      .send({ salary: 10 })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toBe(401);
    expect(resp.body).toEqual({
      error: {
        message: "Unauthorized",
        status: 401,
      },
    });
  });
});

describe("Delete", () => {
  test("delete job for admin", async () => {
    const job = await db.query(`SELECT id FROM jobs WHERE title='j1'`);
    console.log(job);
    console.log(job.rows[0].id);
    const resp = await request(app)
      .delete(`/jobs/${job.rows[0].id}`)
      .set("authorization", `Bearer ${adminToken}`);
    console.log(resp);
    expect(resp.statusCode).toBe(200);
    expect(resp.body).toEqual({ deleted: expect.any(String) });
  });
  test("delete job not working for user", async () => {
    const job = await db.query(`SELECT id FROM jobs WHERE title='j2'`);
    const resp = await request(app)
      .delete(`/jobs/${job.rows[0].id}`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toBe(401);
    expect(resp.body).toEqual({
      error: {
        message: "Unauthorized",
        status: 401,
      },
    });
  });
});
