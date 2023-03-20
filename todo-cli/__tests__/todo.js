/* eslint-disable no-undef */
const todoList = require("../todo");
const { all, markAsComplete, add, overdue, dueToday, dueLater } = todoList();

const formattedDate = (d) => {
  return d.toISOString().split("T")[0];
};

var dateToday = new Date();
const today = formattedDate(dateToday);
const yesterday = formattedDate(
  new Date(new Date().setDate(dateToday.getDate() - 1))
);
const tomorrow = formattedDate(
  new Date(new Date().setDate(dateToday.getDate() + 1))
);

describe("Todo list Test suite", () => {
  beforeAll(() => {
    add({
      title: "first todo list",
      completed: false,
      dueDate: today,
    });

    add({
      title: "second todo list",
      completed: false,
      dueDate: yesterday,
    });

    add({
      title: "third todo list",
      completed: false,
      dueDate: tomorrow,
    });

    add({
      title: "fourth todo list",
      completed: false,
      dueDate: yesterday,
    });

    add({
      title: "fifth todo list",
      completed: false,
      dueDate: tomorrow,
    });
  });
  test("Should add new todo", () => {
    const updatedLength = all.length;
    add({
      title: "sixth todo list",
      completed: true,
      dueDate: today,
    });
    expect(all.length).toBe(updatedLength + 1);
  });

  test("mark as complete", () => {
    markAsComplete(0);
    expect(all[0].completed).toBe(true);
    expect(all[5].completed).toBe(true);
  });

  test("Should return overdue", () => {
    const overDue = overdue();
    expect(overDue.length).toBe(2);
    expect(overDue[0].dueDate).toEqual(yesterday);
    expect(overDue[1].title).toEqual("fourth todo list");
  });

  test("Should return dueToady", () => {
    const todayDue = dueToday();
    expect(todayDue.length).toBe(2);
    expect(todayDue[0].dueDate).toEqual("");
    expect(todayDue[1].title).toEqual("sixth todo list");
  });

  test("Should return dueLater", () => {
    const laterDue = dueLater();
    expect(laterDue.length).toBe(2);
    expect(laterDue[0].dueDate).toEqual(tomorrow);
    expect(laterDue[1].title).toEqual("fifth todo list");
  });
});
