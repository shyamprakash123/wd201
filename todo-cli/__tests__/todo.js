/* eslint-disable no-undef */
const todoList = require("../todo");
const { all, markAsComplete, add } = todoList();

describe("Todo list Test suite", () => {
  beforeAll(() => {
    add({
      title: "new todo list",
      completed: false,
      dueDate: new Date().toISOString(),
    });
  });
  test("Should add new todo", () => {
    const updatedLength = all.length;
    add({
      title: "new todo list",
      completed: false,
      dueDate: new Date().toISOString(),
    });
    expect(all.length).toBe(updatedLength + 1);
  });

  test("mark as complete", () => {
    markAsComplete(0);
    expect(all[0].completed).toBe(true);
  });
});
