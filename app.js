const express = require("express");
const app = express();
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const format = require("date-fns/format");
const isMatch = require("date-fns/isMatch");
var isValid = require("date-fns/isValid");

//const bcrypt = require("bcrypt");
app.use(express.json());
let db = null;

const dbPath = path.join(__dirname, "todoApplication.db");
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("SERVER IS RUNNING AT http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const covertToCamelCase = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
    category: dbObject.category,
    dueDate: dbObject.due_date,
  };
};

const statusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const priorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const categoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const priorityAndStatusProperty = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const categoryAndStatusProperty = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const categoryAndPriorityProperty = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

const search_qProperty = (requestQuery) => {
  return requestQuery.search_q !== undefined;
};

// APL 1
app.get("/todos/", async (request, response) => {
  const { search_q = "", status, priority, category } = request.query;
  let getColumn;
  let data;
  switch (true) {
    case statusProperty(request.query):
      if (status === "IN PROGRESS" || status === "TO DO" || status === "DONE") {
        getColumn = `select *  from todo where status like '${status}'`;
        data = await db.all(getColumn);
        response.send(data.map((eachRow) => covertToCamelCase(eachRow)));
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case priorityProperty(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        getColumn = `select *  from todo where priority like '${priority}'`;
        data = await db.all(getColumn);
        response.send(data.map((eachRow) => covertToCamelCase(eachRow)));
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case categoryProperty(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        getColumn = `select *  from todo where category like '${category}'`;
        data = await db.all(getColumn);
        response.send(data.map((eachRow) => covertToCamelCase(eachRow)));
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case priorityAndStatusProperty(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        if (
          status === "IN PROGRESS" ||
          status === "TO DO" ||
          status === "DONE"
        ) {
          getColumn = `select *  from todo where status = '${status}' AND priority = '${priority}'`;
          data = await db.all(getColumn);
          response.send(data.map((eachRow) => covertToCamelCase(eachRow)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case search_qProperty(request.query):
      getColumn = `select *  from todo where todo like '%${search_q}%'`;
      data = await db.all(getColumn);
      response.send(data.map((eachRow) => covertToCamelCase(eachRow)));
      break;

    case categoryAndStatusProperty(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          status === "IN PROGRESS" ||
          status === "TO DO" ||
          status === "DONE"
        ) {
          getColumn = `select *  from todo where  category = '${category}' AND status = '${status}' `;
          data = await db.all(getColumn);
          response.send(data.map((eachRow) => covertToCamelCase(eachRow)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case categoryAndPriorityProperty(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          priority === "HIGH" ||
          priority === "MEDIUM" ||
          priority === "LOW"
        ) {
          getColumn = `select *  from todo where   category = '${category}' AND priority = '${priority}' `;
          data = await db.all(getColumn);
          response.send(data.map((eachRow) => covertToCamelCase(eachRow)));
        } else {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    default:
      getColumn = `select *  from todo`;
      data = await db.all(getColumn);
      response.send(data.map((eachRow) => covertToCamelCase(eachRow)));
      break;
  }
});

//APls 2
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `SELECT * FROM todo WHERE id = ${todoId}`;
  const todo = await db.get(getTodoQuery);
  response.send(covertToCamelCase(todo));
});

//APls 3
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  const matched = isMatch(date, "yyyy-MM-dd");
  //console.log(matched);
  if (matched) {
    const newDate = format(new Date(date), "yyyy-MM-dd");
    //console.log(newDate);
    const getTodoDateQuery = `SELECT * FROM todo WHERE due_date = '${newDate}'`;
    const todoDate = await db.all(getTodoDateQuery);
    response.send(todoDate.map((eachRow) => covertToCamelCase(eachRow)));
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }

  //console.log(getTodoDateQuery);
});
// APL 4
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  if (status === "IN PROGRESS" || status === "TO DO" || status === "DONE") {
    if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (isMatch(dueDate, "yyyy-MM-dd")) {
          const newDate = format(new Date(dueDate), "yyyy-MM-dd");

          const postTodoQuery = `
                    INSERT INTO
                    todo (id, todo, priority, status,category,due_date)
                    VALUES
                    (
                        ${id},
                        '${todo}',
                        '${priority}',
                        '${status}',
                        '${category}',
                        '${newDate}'
                    )`;
          await db.run(postTodoQuery);
          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Status");
  }
});

// APL 5
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  //let updateColumn = "";
  const requestBody = request.body;
  const perviousTodoQuery = `select * from todo where id = ${todoId};`;
  const perviousTodo = await db.get(perviousTodoQuery);
  const {
    todo = perviousTodo.todo,
    priority = perviousTodo.priority,
    status = perviousTodo.status,
    category = perviousTodo.category,
    dueDate = perviousTodo.dueDate,
  } = request.body;
  let updateTodoQuery;
  switch (true) {
    case requestBody.status !== undefined:
      if (status === "IN PROGRESS" || status === "TO DO" || status === "DONE") {
        updateTodoQuery = `UPDATE
                todo
                SET
                todo = '${todo}',
                priority = '${priority}',
                status = '${status}',
                category = '${category}',
                due_date = '${dueDate}'
                WHERE 
                id = ${todoId};`;

        await db.run(updateTodoQuery);
        response.send("Status Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case requestBody.priority !== undefined:
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        updateTodoQuery = `UPDATE
                todo
                SET
                todo = '${todo}',
                priority = '${priority}',
                status = '${status}',
                category = '${category}',
                due_date = '${dueDate}'
                WHERE 
                id = ${todoId};`;

        await db.run(updateTodoQuery);
        response.send("Priority Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }

      break;

    case requestBody.todo !== undefined:
      updateTodoQuery = `UPDATE
                todo
                SET
                todo = '${todo}',
                priority = '${priority}',
                status = '${status}',
                category = '${category}',
                due_date = '${dueDate}'
                WHERE 
                id = ${todoId};`;

      await db.run(updateTodoQuery);
      response.send("Todo Updated");
      break;
    case requestBody.category !== undefined:
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        updateTodoQuery = `UPDATE
                todo
                SET
                todo = '${todo}',
                priority = '${priority}',
                status = '${status}',
                category = '${category}',
                due_date = '${dueDate}'
                WHERE 
                id = ${todoId};`;

        await db.run(updateTodoQuery);
        response.send("Category Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }

      break;
    case requestBody.dueDate !== undefined:
      if (isMatch(dueDate, "yyyy-MM-dd")) {
        const newDate = format(new Date(dueDate), "yyyy-MM-dd");
        updateTodoQuery = `UPDATE
                    todo
                    SET
                    todo = '${todo}',
                    priority = '${priority}',
                    status = '${status}',
                    category = '${category}',
                    due_date = '${newDate}'
                    WHERE 
                    id = ${todoId};`;

        await db.run(updateTodoQuery);
        response.send("Due Date Updated");
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
      break;
  }
});

// APL 6
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `DELETE FROM todo WHERE id = ${todoId}`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
