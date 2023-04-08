/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
const express = require("express");
const app = express();
const { Todo } = require("./models");
const bodyParser = require("body-parser");
app.use(bodyParser.json());

app.get("/todos", async (request, response) => {
  console.log("Todo List");
  try {
    const users = await Todo.findAll();
    return response.json(users);
  } catch (err) {
    console.error(err);
    return response.status(422).json(users);
  }
});

app.post("/todos", async (request, response) => {
  console.log("Creating a todo", request.body);
  try {
    const todo = await Todo.addTodo({
      title: request.body.title,
      dueDate: request.body.dueDate,
      completed: false,
    });
    return response.json(todo);
  } catch (error) {
    console.error(error);
    return response.status(422).json(error);
  }
});

app.put("/todos/:id/markAsCompleted", async (request, response) => {
  console.log("we have to update a todo with ID:", request.params.id);
  const todo = await Todo.findByPk(request.params.id);
  try {
    const updatedTodo = await todo.markAsComplete();
    return response.json(updatedTodo);
  } catch (err) {
    console.error(err);
    return response.status(422).json(updatedTodo);
  }
});

app.delete("/todos/:id", async (request, response) => {
  console.log("Delete a todo by ID:", request.params.id);
  const TodoID = request.params.id;
  try {
    const res = await Todo.destroy({
      where: {
        id: TodoID,
      },
    });
    if (res > 0) {
      return response.send(true);
    } else {
      return response.send(false);
    }
  } catch (err) {
    console.error(err);
    return response.send(false);
  }
});

module.exports = app;

// app.listen(3000, () => {
//   console.log("server started on port 3000");
// });
