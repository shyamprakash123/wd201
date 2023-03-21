/* eslint-disable no-unused-vars */
const { where } = require("sequelize");
const { connect } = require("./connectDB.js");
const Todo = require("./TodoModel.js");

const createTodo = async () => {
  try {
    await connect();
    const todo = await Todo.addTask({
      title: "second item",
      dueDate: new Date(),
      completed: false,
    });
    console.log("Created todo with ID :" + todo.id);
  } catch (error) {
    console.error(error);
  }
};

const countItems = async () => {
  try {
    const totalCount = await Todo.count();
    console.log("Found " + totalCount + " Items in the table");
  } catch (error) {
    console.error(error);
  }
};

const getAllTodos = async () => {
  try {
    const todos = await Todo
      .findAll
      //     {
      //     where: {
      //         completed: false,
      //     },
      //     order: [
      //         ['id', 'DESC']
      //     ]
      // }
      ();
    const todoList = todos.map((todo) => todo.displayebleString()).join("\n");
    console.log(todoList);
  } catch (error) {
    console.error(error);
  }
};

const getSingleTodo = async () => {
  try {
    const todo = await Todo
      .findOne
      //     {
      //     where: {
      //         completed: false,
      //     },
      //     order: [
      //         ['id', 'DESC']
      //     ]
      // }
      ();
    const todoList = todo.displayebleString();
    console.log(todoList);
  } catch (error) {
    console.error(error);
  }
};

const updateTodo = async (id) => {
  try {
    const update = await Todo.update(
      { completed: true },
      {
        where: {
          id: id,
        },
      }
    );
    console.log(`Todo of id ${id} has updated`);
  } catch (error) {
    console.error(error);
  }
};

const deleteItem = async (id) => {
  try {
    const deletedRows = await Todo.destroy({
      where: {
        id: id,
      },
    });
    console.log(`Deleted ${deletedRows} Rows in TodoList`);
  } catch (error) {
    console.error(error);
  }
};

(async () => {
  // await createTodo();
  // await countItems();

  // await getSingleTodo();
  // await updateTodo(2);
  await getAllTodos();
  await deleteItem(2);
  await getAllTodos();
})();
