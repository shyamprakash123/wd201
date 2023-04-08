/* eslint-disable no-undef */
const request = require("supertest");

const db = require("../models/index");
const app = require("../app");

let server, agent;

describe("Todo test suite", () => {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(3000, () => {});
    agent = request.agent(server);
  });
  afterAll(async () => {
    await db.sequelize.close();
    server.close();
  });

  test("responds with json at /todos", async () => {
    const response = await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: false,
    });

    const parsedResponse = JSON.parse(response.text);
    expect(parsedResponse.id).toBeDefined();
  });

  test("mark a todo as complete", async () => {
    const response = await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: false,
    });

    const parsedResponse = JSON.parse(response.text);
    const todoID = parsedResponse.id;
    expect(parsedResponse.id).toBeDefined();

    expect(parsedResponse.completed).toBe(false);

    const markResponse = await agent.put(`/todos/${todoID}/markAsCompleted`);
    const parsedUpdatedResponse = JSON.parse(markResponse.text);
    expect(parsedUpdatedResponse.completed).toBe(true);
  });
});
