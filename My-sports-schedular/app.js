/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
const express = require("express");
var csrf = require("tiny-csrf");
var format = require("date-format");
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
  if (request.body.email == 0) {
    request.flash("error", "Email should not be empty!");
    flag = false;
  }
  if (request.body.password == 0) {
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
        role: "user",
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
    response.render("home", {
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
    try {
      const admin = await User.getUser(adminId);
      if (admin[0].role == "admin") {
        const sport = await Sports.addNewSport(sportName, adminId);
      }
      response.redirect(`/sports/${sportName}`);
    } catch (err) {
      return response.status(422).json(err);
    }
  }
);

app.get(
  "/sports/:name",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const sport = await Sports.getSportByName(request.params.name);
    const session = await Sessions.getSessionBySId(sport[0].id);
    response.render("sessions", {
      sport,
      session,
      csrfToken: request.csrfToken(),
    });
  }
);

app.get(
  "/sports/:name/new-session",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const sport = await Sports.getSportByName(request.params.name);
    const session = await Sessions.getSessionBySId(sport[0].id);
    const date = new Date();
    response.render("new-session", {
      date,
      sport,
      session,
      csrfToken: request.csrfToken(),
    });
  }
);

app.post(
  "/sports/:name",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const sportName = request.params.name;
    const userId = request.user.id;
    const date = request.body.dateTime;
    const place = request.body.place;
    const members = request.body.members.split(",");
    const players = request.body.players;
    const sportId = request.body.sportId;
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
  }
);

app.get(
  "/sports/:name/session/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const sessionId = request.params.id;
    const sport = await Sports.getSportByName(request.params.name);
    const session = await Sessions.getSessionById(sessionId);
    const players = await Players.getPlayersBySId(sessionId);
    const userId = request.user.id;
    const current = await Players.getPlayersByIdS(userId, sessionId);
    let isJoined = current.length == 1;
    response.render("session-detail", {
      sport,
      session,
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
    const date = new Date();
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
    const sportName = request.params.name;
    const date = request.body.dateTime;
    const place = request.body.place;
    const members = request.body.members.split(",");
    const players = request.body.players;
    const sessionId = request.params.id;
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
    try {
      const cancel = await Sessions.cancelSession(sessionId, reason);
      response.redirect("/sports");
    } catch (err) {
      return response.status(422).json(err);
    }
  }
);

module.exports = app;
