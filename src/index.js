const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const app = express();

app.use(cors());
app.use(express.json());

const users = [];

// Middleware que verifica se o usuário já existe
function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;
  const user = users.find(users => users.username === username);

  if(!user){
    return response.status(400).json({ error: "User not found" });
  }

  request.user = user;

  return next();
}

// Middleware que verifica se o ToDo já existe
function checkIfTodoExists(request, response, next) {
  const { id } = request.params;
  const { user } = request;
  
  const todo = user.todos.find(todo => todo.id === id);

  if(!todo){
    return response.status(404).json({error: "ToDo doesn't exists!"})
  }

  return next();
}

// Criar um novo usuário
app.post('/users', (request, response) => {
  const { name, username } = request.body;

  const userAlreadyExists = users.some(
    (users) => users.username === username
  )

  if(userAlreadyExists){
    return response.status(400).json({error: "Username already exists!"})
  }

  users.push({
    id: uuidv4(),
    name,
    username,
    todos: []
  });

  const thisUser = users.find(users => users.username === username);

  return response.status(201).json(thisUser);
});

// Exibir todos os ToDo do usuário
app.get('/todos', checksExistsUserAccount, (request, response) => {
  const { user } = request;

  return response.json(user.todos);
});

// Inserir um novo ToDo
app.post('/todos', checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body;
  const { user } = request;

  const userTodo = {
    id: uuidv4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date()
  };

  user.todos.push(userTodo)

  return response.status(201).json(userTodo);
});

// Alterar o titulo e o prazo final de um ToDo específico
app.put('/todos/:id', checksExistsUserAccount, checkIfTodoExists, (request, response) => {
  const { title, deadline } = request.body;
  const { id } = request.params;
  const { user } = request;

  const todo = user.todos.find(todo => todo.id === id);

  todo.title = title;
  todo.deadline = new Date(deadline);

  return response.json(todo);
});

// mudar o status de um ToDo específico para concluído
app.patch('/todos/:id/done', checksExistsUserAccount, checkIfTodoExists, (request, response) => {
  const { id } = request.params;
  const { user } = request;

  const todo = user.todos.find(todo => todo.id === id);

  todo.done = true;

  return response.json(todo);
});

// deletar um ToDo específico
app.delete('/todos/:id', checksExistsUserAccount, checkIfTodoExists, (request, response) => {
  const { id } = request.params;
  const { user } = request;

  const todo = user.todos

  todo.splice(todo.indexOf(id), 1)

  return response.status(204).json({error: "ToDo deleted"});
});

module.exports = app;