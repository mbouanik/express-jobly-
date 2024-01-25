const { sqlForPartialUpdate } = require("./sql");
let user = {
  username: "Alicia",
  age: 30,
  job_title: "fullstack developer",
  city: "San Antonio",
  state: "Texas",
};

describe("partial update, select the culumn you need to update", () => {
  test("update, job_title, age", () => {
    const result = sqlForPartialUpdate(
      { job_title: "data scientist", age: 20 },
      { job_title: "job_title", age: "age" },
    );
    expect(result).toEqual({
      setCols: '"job_title"=$1, "age"=$2',
      values: ["data scientist", 20],
    });
  });
});
