const http = require("http");
const fs = require("fs");
const args = require("minimist")(process.argv.slice(2));
port =args["port"];
console.log(port);

let homeContent = "";
let projectContent = "";
let registration = "";

fs.readFile("home.html", (err, home) => {
  if (err) {
    throw err;
  }
  homeContent = home;
});

fs.readFile("project.html", (err, project) => {
  if (err) {
    throw err;
  }
  projectContent = project;
});

fs.readFile("registration.html", (err, reg) => {
  if (err) {
    throw err;
  }
  registration = reg;
});


http.createServer((request, response) => {
    let url = request.url;
    response.writeHeader(200, { "Content-Type": "text/html" });
    switch (url) {
      case "/project":
        response.write(projectContent);
        response.end();
        break;
      case "/registration":
        response.write(registration);
        response.end();
        break;
      default:
        response.write(homeContent);
        response.end();
        break;
    }
    })
    .listen(port);
