/* eslint-disable no-unused-vars */
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

const login = async (agent, username, password) => {
  let res = await agent.get("/login");
  let csrfToken = extractCsrfToken(res);
  res = await agent.post("/session").send({
    email: username,
    password: password,
    _csrf: csrfToken,
  });
};

describe("My-Sports-Schedular test suite", () => {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(3000, () => {});
    agent = request.agent(server);
  });
  afterAll(async () => {
    await db.sequelize.close();
    server.close();
  });

  test("Sign up", async () => {
    // signup user A
    let res = await agent.get("/signup");
    let csrfToken = extractCsrfToken(res);
    res = await agent.post("/users").send({
      firstName: "Test",
      lastName: "User A",
      email: "userA@gmail.com",
      password: "1234",
      _csrf: csrfToken,
    });
    expect(res.statusCode).toBe(302);

    // signup user A
    res = await agent.get("/signup");
    csrfToken = extractCsrfToken(res);
    res = await agent.post("/users").send({
      firstName: "Test",
      lastName: "User B",
      email: "userB@gmail.com",
      password: "1234",
      _csrf: csrfToken,
    });
    expect(res.statusCode).toBe(302);
  });

  test("sign out", async () => {
    let res = await agent.get("/sports");
    expect(res.statusCode).toBe(200);
    res = await agent.get("/signout");
    expect(res.statusCode).toBe(302);
    res = await agent.get("/sports");
    expect(res.statusCode).toBe(302);
  });

  test("creating a new sport", async () => {
    const agent = request.agent(server);
    await login(agent, "userA@gmail.com", "1234");
    const res = await agent.get("/User/changePassword");
    const csrfToken = extractCsrfToken(res);
    let sportName = "Cricket";
    const response = await agent.post("/sports/new-sport").send({
      sportName: sportName,
      _csrf: csrfToken,
    });
    expect(response.statusCode).toBe(302);

    // validating sport
    const groupedTodosResponse = await agent
      .get(`/sports/${sportName}`)
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(groupedTodosResponse.text);
    const sportId = parsedGroupedResponse.sportId;
    const isAdmin = parsedGroupedResponse.isAdmin;
    const returnedSportName = parsedGroupedResponse.sportName;
    const sessionsLength = parsedGroupedResponse.session.length;
    expect(sportId).toBe(1);
    expect(isAdmin).toBe(true);
    expect(returnedSportName).toBe(sportName);
    expect(sessionsLength).toBe(0);
  });

  test("creating a new session", async () => {
    const agent = request.agent(server);
    await login(agent, "userA@gmail.com", "1234");
    let res = await agent.get("/User/changePassword");
    let csrfToken = extractCsrfToken(res);
    let sportName = "Cricket";
    let date = new Date();
    let place = "CBIT";
    let members = "Shyam, Ram, Kiran";
    let players = 5;

    //Getting sportId using sportName
    const groupedTodosResponse = await agent
      .get(`/sports/${sportName}`)
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(groupedTodosResponse.text);
    const sportId = parsedGroupedResponse.sportId;

    const response = await agent.post(`/sports/${sportName}`).send({
      dateTime: date,
      place: place,
      members: members,
      players: players,
      sportId: sportId,
      _csrf: csrfToken,
    });
    expect(response.statusCode).toBe(302);
  });

  test("Adding Player to session", async () => {
    const agent = request.agent(server);
    await login(agent, "userB@gmail.com", "1234");
    const res = await agent.get("/User/changePassword");
    const csrfToken = extractCsrfToken(res);
    let sportName = "Cricket";

    // Getting sessionId
    const groupedTodosResponse = await agent
      .get(`/sports/${sportName}`)
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(groupedTodosResponse.text);
    const sessions = parsedGroupedResponse.session;
    const sessionId = sessions[0].id;
    expect(sessions.length).toBe(1);

    // Getting present players count
    const groupedTodosResponse1 = await agent
      .get(`/sports/${sportName}/session/${sessionId}`)
      .set("Accept", "application/json");
    const parsedGroupedResponse1 = JSON.parse(groupedTodosResponse1.text);
    const oldPlayersLength = parsedGroupedResponse1.session[0].players;

    const response = await agent
      .post(`/sports/addPlayer/${sportName}/${sessionId}`)
      .send({
        _csrf: csrfToken,
      });
    expect(response.statusCode).toBe(200);

    // Getting updated players count
    const groupedTodosResponse2 = await agent
      .get(`/sports/${sportName}/session/${sessionId}`)
      .set("Accept", "application/json");
    const parsedGroupedResponse2 = JSON.parse(groupedTodosResponse2.text);
    const newPlayersLength = parsedGroupedResponse2.session[0].players;
    expect(newPlayersLength).toBe(oldPlayersLength - 1);
  });
});
