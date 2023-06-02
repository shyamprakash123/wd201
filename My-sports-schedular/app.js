/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
const express = require("express");
var csrf = require("tiny-csrf");
const app = express();
const flash = require("connect-flash");
var cookieParser = require("cookie-parser");
const { User, Sports, Sessions, Players } = require("./models");
const bodyParser = require("body-parser");
const path = require("path");
app.set("views", path.join(__dirname, "views"));
app.use(flash());
const passport = require("passport");
const connectEnsureLogin = require("connect-ensure-login");
const session = require("express-session");
const LocalStrategy = require("passport-local");
const bcrypt = require("bcrypt");
const { where } = require("sequelize");
const players = require("./models/players");
const { Session } = require("inspector");
const saltRounds = 10;

app.use(bodyParser.json());

app.use(express.urlencoded({ extended: false }));

app.use(cookieParser("shh! some secret string"));

app.use(csrf("this_should_be_32_character_long", ["POST", "PUT", "DELETE"]));

app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: "my_super-secret-key-2148411464649777996311316",
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use(function (request, response, next) {
  response.locals.messages = request.flash();
  next();
});

app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    (username, password, done) => {
      User.findOne({ where: { email: username } })
        .then(async (user) => {
          const result = await bcrypt.compare(password, user.password);
          if (result) {
            return done(null, user);
          } else {
            return done(null, false, { message: "Invalid password" });
          }
        })
        .catch((error) => {
          return done(null, false, { message: "Invalid credentials" });
        });
    }
  )
);

passport.serializeUser((user, done) => {
  console.log("Serializing user in session", user.id);
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findByPk(id)
    .then((user) => {
      done(null, user);
    })
    .catch((error) => {
      done(error, null);
    });
});

app.get("/", async (request, response) => {
  response.render("index", {
    csrfToken: request.csrfToken(),
  });
});

app.get("/signup", async (request, response) => {
  response.render("signup", {
    csrfToken: request.csrfToken(),
  });
});

app.get("/login", async (request, response) => {
  response.render("login", {
    csrfToken: request.csrfToken(),
  });
});

app.get("/signout", async (request, response, next) => {
  request.logOut((err) => {
    if (err) {
      return next(err);
    }
    response.redirect("/");
  });
});

app.post("/users", async (request, response) => {
  const hasedPwd = await bcrypt.hash(request.body.password, saltRounds);
  let flag = true;
  if (request.body.firstName.length == 0) {
    request.flash("error", "First Name should not be empty!");
    flag = false;
  }
  if (request.body.lastName.length == 0) {
    request.flash("error", "Last Name should not be empty!");
    flag = false;
  }
  if (request.body.email.length == 0) {
    request.flash("error", "Email should not be empty!");
    flag = false;
  }
  if (request.body.password.length == 0) {
    request.flash("error", "Password should not be empty!");
    flag = false;
  }
  try {
    if (flag == true) {
      const users = await User.create({
        firstName: request.body.firstName,
        lastName: request.body.lastName,
        email: request.body.email,
        password: hasedPwd,
        role: "admin",
      });

      request.login(users, (err) => {
        if (err) {
          console.error(err);
          request.flash("error", err);
        }
        response.redirect("/sports");
      });
    } else {
      response.redirect("/signup");
    }
  } catch (err) {
    console.error(err);
    request.flash("error", "Account Already exists");
    response.redirect("/signup");
  }
});

app.post(
  "/session",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  async (request, response) => {
    response.redirect("/sports");
  }
);

app.get(
  "/sports",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const loggedInUser = request.user.id;
    let user = await User.getUser(loggedInUser);
    let sports = await Sports.getAllSports();
    let listOfPlayers = [];
    const players = await Players.getPlayersByUserId(loggedInUser);
    for (var i = 0; i < players.length; i++) {
      listOfPlayers.push(players[i].sessionId);
    }
    const session = await Sessions.getSessionBySesId(listOfPlayers);
    const sessionByUser = await Sessions.getSessionByUId(loggedInUser);
    response.render("home", {
      session,
      sessionByUser,
      user,
      sports,
      csrfToken: request.csrfToken(),
    });
  }
);

app.get(
  "/sports/new-sport",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    response.render("new-sport", {
      csrfToken: request.csrfToken(),
    });
  }
);

app.post(
  "/sports/new-sport",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const adminId = request.user.id;
    const sportName = request.body.sportName;
    let flag = true;
    if (sportName.length == 0) {
      flag = false;
      request.flash("error", "Sport Name should not be empty!");
    }
    if (flag) {
      try {
        const admin = await User.getUser(adminId);
        if (admin[0].role == "admin") {
          const sport = await Sports.addNewSport(sportName, adminId);
        }
        response.redirect(`/sports/${sportName}`);
      } catch (err) {
        request.flash("error", "Sport name already exists!");
        response.redirect("/sports/new-sport");
      }
    } else {
      response.redirect("/sports/new-sport");
    }
  }
);

app.get(
  "/sports/update-sport/:name/:sportId",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const sportId = request.params.sportId;
    const sportName = request.params.name;
    response.render("editSport", {
      sportName,
      sportId,
      csrfToken: request.csrfToken(),
    });
  }
);

app.post(
  "/sports/update-sport/:name/:sportId",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const adminId = request.user.id;
    const newSportName = request.body.sportName;
    let flag = true;
    if (newSportName.length == 0) {
      flag = false;
      request.flash("error", "Sport Name should not be empty!");
    }
    const oldSportName = request.params.name;
    const sportId = request.params.sportId;
    if (flag) {
      try {
        const admin = await User.getUser(adminId);
        if (admin[0].role == "admin") {
          const sport = await Sports.updateSportName(newSportName, sportId);
          const updateSessionsSportNames = await Sessions.updateSportsNames(
            oldSportName,
            newSportName
          );
        }
        response.redirect(`/sports/${newSportName}`);
      } catch (err) {
        request.flash("error", err.messages);
        response.redirect(`/sports/update-sport/${oldSportName}/${sportId}`);
      }
    } else {
      response.redirect(`/sports/update-sport/${oldSportName}/${sportId}`);
    }
  }
);

app.get(
  "/sports/:name",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const adminId = request.user.id;
    const sportName = request.params.name;
    const sport = await Sports.getSportByName(sportName);
    const sportId = sport[0].id;
    const session = await Sessions.getSessionBySId(sportId);
    const admin = await User.getUser(adminId);
    const isAdmin = admin[0].role == "admin";
    response.render("sessions", {
      isAdmin,
      sportName,
      sportId,
      session,
      csrfToken: request.csrfToken(),
    });
  }
);

app.get(
  "/sports/:name/new-session",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const sportName = request.params.name;
    const sport = await Sports.getSportByName(sportName);
    const session = await Sessions.getESessionBySId(sport[0].id);
    const date = new Date().toISOString().slice(0, 16);
    response.render("new-session", {
      sportName,
      sport,
      date,
      session,
      csrfToken: request.csrfToken(),
    });
  }
);

app.get(
  "/sports/:name/previous-session",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const sport = await Sports.getSportByName(request.params.name);
    const session = await Sessions.getESessionBySId(sport[0].id);
    response.render("previous-sessions", {
      sport,
      session,
      csrfToken: request.csrfToken(),
    });
  }
);

app.get(
  "/sports/:name/previous-session/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const sessionId = request.params.id;
    const session = await Sessions.getSessionById(sessionId);
    const players = await Players.getPlayersBySId(sessionId);
    const userId = request.user.id;
    response.render("previous-session-detail", {
      session,
      players,
      userId,
      csrfToken: request.csrfToken(),
    });
  }
);

app.get(
  "/sports/:name/canceled-session/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const sessionId = request.params.id;
    const session = await Sessions.getESessionById(sessionId);
    const players = await Players.getPlayersBySId(sessionId);
    const userId = request.user.id;
    response.render("canceled-session-detail", {
      session,
      players,
      userId,
      csrfToken: request.csrfToken(),
    });
  }
);

app.post(
  "/sports/:name",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const sportName = request.params.name;
    let flag = true;
    const userId = request.user.id;
    const date = request.body.dateTime;
    const place = request.body.place;
    let members = request.body.members;
    const players = request.body.players;
    const sportId = request.body.sportId;
    if (date.length == 0) {
      flag = false;
      request.flash("error", "Date and Time should not be empty!");
    }
    if (place.length == 0) {
      flag = false;
      request.flash("error", "Address should not be empty!");
    }
    if (members.length == 0) {
      flag = false;
      request.flash("error", "Team members should not be empty!");
    } else {
      members = members.split(",");
    }
    if (players.length == 0) {
      flag = false;
      request.flash("error", "Number of players should not be empty!");
    }
    if (flag) {
      const userName = request.user.firstName + " " + request.user.lastName;
      try {
        const session = await Sessions.newSession(
          date,
          place,
          members,
          sportName,
          Number(players),
          userId,
          sportId
        );
        const player = await Players.addPlayers(userId, session.id, userName);
        response.redirect(`/sports/${sportName}/session/${session.id}`);
      } catch (err) {
        return response.status(422).json(err);
      }
    } else {
      response.redirect(`/sports/${sportName}/new-session`);
    }
  }
);

app.get(
  "/sports/:name/session/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const sessionId = request.params.id;
    const session = await Sessions.getSessionById(sessionId);
    const players = await Players.getPlayersBySId(sessionId);
    const userId = request.user.id;
    const current = await Players.getPlayersByIdS(userId, sessionId);
    const noOfSessionsJoined = await Players.getPlayersByUserId(userId);
    let sessions = null;
    for (var i = 0; i < noOfSessionsJoined.length; i++) {
      sessions = await Sessions.getSessionsWithSIdT(
        noOfSessionsJoined[i].sessionId,
        session[0].dateTime
      );
      if (sessions.length > 0) {
        break;
      } else {
        sessions = null;
      }
    }
    const allowToJoin = sessions;
    let isJoined = current.length == 1;
    let isAdminJoined = false;
    for (var j = 0; i < players.length; i++) {
      if (players[i].userId == userId) {
        isAdminJoined = true;
        break;
      }
    }
    response.render("session-detail", {
      session,
      isAdminJoined,
      allowToJoin,
      players,
      userId,
      isJoined,
      csrfToken: request.csrfToken(),
    });
  }
);

app.post(
  "/sports/addPlayer/:name/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const name = request.params.name;
    const userId = request.user.id;
    const sessionId = request.params.id;
    const userName = request.user.firstName + " " + request.user.lastName;
    const player = await Sessions.getSessionById(sessionId);
    const updatePlayers = await Sessions.updatePlayers(
      player[0].players - 1,
      sessionId
    );
    try {
      const player = await Players.addPlayers(userId, sessionId, userName);
      return response.json({ success: true });
    } catch (err) {
      return response.status(422).json(err);
    }
  }
);

app.delete(
  "/sports/addPlayer/:name/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const name = request.params.name;
    const userId = request.user.id;
    const sessionId = request.params.id;
    const players = await Sessions.getSessionById(sessionId);
    const updatePlayers = await Sessions.updatePlayers(
      players[0].players + 1,
      sessionId
    );
    try {
      const player = await Players.deletePlayers(userId, sessionId);
      return response.json({ success: true });
    } catch (err) {
      return response.status(422).json(err);
    }
  }
);

app.delete(
  "/sports/deletePlayer/:name/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const name = request.params.name;
    const userId = request.body.userId;
    const sessionId = request.params.id;
    const players = await Sessions.getSessionById(sessionId);
    const updatePlayers = await Sessions.updatePlayers(
      players[0].players + 1,
      sessionId
    );
    try {
      const player = await Players.deletePlayers(userId, sessionId);
      return response.json({ success: true });
    } catch (err) {
      return response.status(422).json(err);
    }
  }
);

app.delete(
  "/sports/deleteMember/:name/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const name = request.params.name;
    const memberId = request.body.memberId;
    const sessionId = request.params.id;
    const members = await Sessions.getSessionById(sessionId);
    members[0].members.splice(memberId, 1);
    try {
      const player = await Sessions.deleteMember(members[0].members, sessionId);
      return response.json({ success: true });
    } catch (err) {
      return response.status(422).json(err);
    }
  }
);

app.get(
  "/sports/editsession/:name/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const sportName = request.params.name;
    const session = await Sessions.getSessionById(request.params.id);
    const userId = request.user.id;
    const date = new Date().toISOString().slice(0, 16);
    if (session[0].userId == userId) {
      response.render("editSession", {
        date,
        sportName,
        session,
        userId,
        csrfToken: request.csrfToken(),
      });
    } else {
      response.render("pageNotFound");
    }
  }
);

app.post(
  "/sports/editsession/:name/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    let flag = true;
    const sportName = request.params.name;
    const date = request.body.dateTime;
    const place = request.body.place;
    let members = request.body.members;
    const players = request.body.players;
    const sessionId = request.params.id;
    if (date.length == 0) {
      flag = false;
      request.flash("error", "Date and Time should not be empty!");
    }
    if (place.length == 0) {
      flag = false;
      request.flash("error", "Address should not be empty!");
    }
    if (members.length == 0) {
      flag = false;
      request.flash("error", "Team members should not be empty!");
    } else {
      members = members.split(",");
    }
    if (players.length == 0) {
      flag = false;
      request.flash("error", "Number of players should not be empty!");
    }
    if (flag) {
      try {
        const session = await Sessions.sessionUpdate(
          date,
          place,
          members,
          Number(players),
          sessionId
        );
        response.redirect(`/sports/${sportName}/session/${sessionId}`);
      } catch (err) {
        return response.status(422).json(err);
      }
    } else {
      response.redirect(`/sports/${sportName}/new-session`);
    }
  }
);

app.get(
  "/sports/cancel-session/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const sessionId = request.params.id;
    response.render("cancelSession", {
      sessionId,
      csrfToken: request.csrfToken(),
    });
  }
);

app.post(
  "/sports/cancel-session/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const sessionId = request.params.id;
    const reason = request.body.reason;
    let flag = true;
    if (reason.length == 0) {
      flag = false;
      request.flash("error", "Reason should not be empty");
    }
    if (flag) {
      try {
        const cancel = await Sessions.cancelSession(sessionId, reason);
        response.redirect("/sports");
      } catch (err) {
        return response.status(422).json(err);
      }
    } else {
      response.redirect(`/sports/cancel-session/${sessionId}`);
    }
  }
);

app.delete(
  "/sports/deleteSport/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const adminId = request.user.id;
    const sportId = request.params.id;
    const sport = await Sports.getSportById(sportId);
    const sportName = sport[0].sports_name;
    try {
      const admin = await User.getUser(adminId);
      if (admin[0].role == "admin") {
        const deleteSessions = await Sessions.deleteSessionBySName(sportName);
        const deleteSport = await Sports.deleteSportById(sportId);
      }
      return response.json({ success: true });
    } catch (err) {
      return response.status(422).json(err);
    }
  }
);

app.get(
  "/sports/reports/insights/:startDate?/:endDate?",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    let start = request.query.startDate;
    let end = request.query.endDate;
    start = start || "null";
    end = end || "null";
    let flag = true;
    if (start !== "null" && end !== "null") {
      if (start > end) {
        flag = false;
        request.flash("error", "Start Date should be less than End Date");
      }
    }
    if (flag) {
      const sports = await Sports.getAllSports();
      let TotalSessionsCount = 0;
      let rankings = [];
      let sports_Name = [];
      let sportPercentage = [];
      for (var i = 0; i < sports.length; i++) {
        const sportsName = sports[i].sports_name;
        const count = await Sessions.getSessionsCountBySName(
          sportsName,
          start,
          end
        );
        TotalSessionsCount += count;
        rankings.push({ name: sportsName, count: count });
        sports_Name.push(sportsName.toString());
        sportPercentage.push(count);
      }
      rankings.sort((a, b) => b.count - a.count);
      response.render("reports", {
        TotalSessionsCount,
        rankings,
        sports_Name,
        sportPercentage,
        csrfToken: request.csrfToken(),
      });
    } else {
      response.redirect("/sports/reports/insights/");
    }
  }
);

app.get(
  "/sports/reports/:name/insights/:startDate?/:endDate?",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    let start = request.query.startDate;
    let end = request.query.endDate;
    start = start || "null";
    end = end || "null";
    const sportName = request.params.name;
    const previousSession = await Sessions.getPreviousSessions(
      sportName,
      start,
      end
    );
    const todaysSession = await Sessions.getTodaysSessions(
      sportName,
      start,
      end
    );
    const upcomingSession = await Sessions.getUpcomingSessions(
      sportName,
      start,
      end
    );
    const canceledSession = await Sessions.getCanceledSessions(
      sportName,
      start,
      end
    );
    let startDate = new Date(start);
    let endDate = new Date(end);
    response.render("sport-insights", {
      startDate,
      endDate,
      sportName,
      previousSession,
      todaysSession,
      upcomingSession,
      canceledSession,
      csrfToken: request.csrfToken(),
    });
  }
);

app.get(
  "/User/changePassword",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    response.render("passwordChange", {
      csrfToken: request.csrfToken(),
    });
  }
);

app.post(
  "/User/changePassword/newPassword",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const oldPassword = request.body.oldpassword;
    const newPassword = request.body.newpassword;
    let flag = true;
    if (oldPassword.length == 0) {
      flag = false;
      request.flash("error", "Old Password should not be empty!");
    }
    if (newPassword.length == 0) {
      flag = false;
      request.flash("error", "New Password should not be empty!");
    }
    const userId = request.user.id;
    if (flag) {
      try {
        let flag1 = true;
        await User.findOne({ where: { id: userId } })
          .then(async (user) => {
            const result = await bcrypt.compare(oldPassword, user.password);
            if (result) {
              const hasedNewPwd = await bcrypt.hash(newPassword, saltRounds);
              const updatePassword = await User.updatePassword(
                userId,
                hasedNewPwd
              );
            } else {
              flag1 = false;
              request.flash("error", "Password is not matched!");
            }
          })
          .catch((error) => {
            flag1 = false;
            request.flash("error", "Invalid credentials");
          });
        if (flag1) {
          response.redirect("/sports");
        } else {
          response.redirect("/User/changePassword");
        }
      } catch (err) {
        request.flash("error", "Password is not matched!");
        response.redirect("/User/changePassword");
      }
    } else {
      response.redirect("/User/changePassword");
    }
  }
);

app.get(
  "/user/user-sessions",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const userId = request.user.id;
    const players = await Players.getPlayersByUserId(userId);
    let sessionIds = [];
    for (var i = 0; i < players.length; i++) {
      sessionIds.push(players[i].sessionId);
    }
    const previousSession = await Sessions.getPreviousSessionsByIds(sessionIds);
    const canceledSession = await Sessions.getCanceledSessionsByIds(sessionIds);
    response.render("user-sessions", {
      previousSession,
      canceledSession,
      csrfToken: request.csrfToken(),
    });
  }
);

module.exports = app;
