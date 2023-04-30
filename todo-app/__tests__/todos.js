/* eslint-disable no-undef */
const request = require("supertest");
var cheerio = require("cheerio");
const db = require("../models/index");
const app = require("../app");

let server, agent;
function extractCsrfToken(res) {
  var $ = cheerio.load(res.text);
  return $("[name=_csrf]").val();
}
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
    const res = await agent.get("/");
    const csrfToken = extractCsrfToken(res);
    const response = await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });

    expect(response.status).toBe(302);
  });

  test("mark a todo as complete", async () => {
    let res = await agent.get("/");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });

    const groupedTodosResponse = await agent
      .get("/")
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(groupedTodosResponse.text);
    const dueTodayCount = parsedGroupedResponse.dueToday.length;
    const latestTodo = parsedGroupedResponse.dueToday[dueTodayCount - 1];

    res = await agent.get("/");
    csrfToken = extractCsrfToken(res);

    const markCompleteResponse = await agent
      .put(`/todos/${latestTodo.id}`)
      .send({
        _csrf: csrfToken,
        completed: true,
      });

    const parsedUpdateResponse = JSON.parse(markCompleteResponse.text);
    expect(parsedUpdateResponse.completed).toBe(true);
  });

  test("marking an item as incomplete", async () => {
    let res = await agent.get("/");
    let csrfToken = extractCsrfToken(res);

    await agent.post("/todos").send({
      title: "Buy shampoo",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });

    const groupedTodosResponse = await agent
      .get("/")
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(groupedTodosResponse.text);
    const dueTodayCount = parsedGroupedResponse.dueToday.length;
    const latestTodo = parsedGroupedResponse.dueToday[dueTodayCount - 1];

    res = await agent.get("/");
    csrfToken = extractCsrfToken(res);

    const markCompleteResponse = await agent
      .put(`/todos/${latestTodo.id}`)
      .send({
        _csrf: csrfToken,
        completed: true,
      });

    const parsedmarkCompleteResponse = JSON.parse(markCompleteResponse.text);
    expect(parsedmarkCompleteResponse.completed).toBe(true);

    // eslint-disable-next-line no-unused-vars
    const markInCompleteResponse = await agent
      .put(`/todos/${latestTodo.id}`)
      .send({
        _csrf: csrfToken,
        completed: false,
      });

    const groupedTodosResponseInComplete = await agent
      .get("/")
      .set("Accept", "application/json");
    const parsedGroupedResponseInComplete = JSON.parse(
      groupedTodosResponseInComplete.text
    );
    const dueTodayCountCompletedInComplete =
      parsedGroupedResponseInComplete.dueToday.length;

    expect(dueTodayCount - 1).toBe(dueTodayCountCompletedInComplete);
  });

  test("deleting a todo", async () => {
    let res = await agent.get("/");
    let csrfToken = extractCsrfToken(res);

    const groupedTodosResponse = await agent
      .get("/")
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(groupedTodosResponse.text);
    // eslint-disable-next-line no-unused-vars
    const dueTodayCount = parsedGroupedResponse.dueToday.length;
    const latestTodo = parsedGroupedResponse.dueToday[dueTodayCount - 1];

    res = await agent.get("/");
    csrfToken = extractCsrfToken(res);

    // eslint-disable-next-line no-unused-vars
    const deleteATodo = await agent.delete(`/todos/${latestTodo.id}`).send({
      _csrf: csrfToken,
    });

    const newGroupedTodosResponse = await agent
      .get("/")
      .set("Accept", "application/json");
    const newParsedGroupedResponse = JSON.parse(newGroupedTodosResponse.text);
    // eslint-disable-next-line no-unused-vars
    const newDueTodayCount = newParsedGroupedResponse.dueToday.length;

    expect(dueTodayCount - 1).toBe(newDueTodayCount);
  });

  // const parsedResponse = JSON.parse(response.text);
  // const todoID = parsedResponse.id;
  // expect(parsedResponse.id).toBeDefined();

  // expect(parsedResponse.completed).toBe(false);

  // const markResponse = await agent.put(`/todos/${todoID}/markAsCompleted`);
  // const parsedUpdatedResponse = JSON.parse(markResponse.text);
  // expect(parsedUpdatedResponse.completed).toBe(true);
});
