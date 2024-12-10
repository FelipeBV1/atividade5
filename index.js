const express = require("express");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const path = require("path");

let usuarios = [];
let mensagens = [];
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static("public"));
app.use(
  session({
    secret: "trabalho_final_ppi",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      maxAge: 1000 * 60 * 30,
    },
  })
);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});
app.post("/login", (req, res) => {
  try {
    const { nickName, password } = req.body;

    if (nickName === "admin" && password === "123") {
      const sessionId = Date.now();
      const formattedDate = new Date().toLocaleString();
      req.session.user = {
        id: sessionId,
        nickName: nickName,
        formattedDate: formattedDate,
      };
      const userSession = {
        id: sessionId,
        nickName: nickName,
        formattedDate: formattedDate,
      };
      res.cookie("userSession", userSession, {
        httpOnly: true,
        maxAge: 1000 * 60 * 30,
      });
      return res.redirect("/menu");
    }

    const existingUser = usuarios.find(user => user.nickName === nickName && user.password === password);

    if (existingUser) {
      const sessionId = Date.now();
      const formattedDate = new Date().toLocaleString();
      req.session.user = {
        id: sessionId,
        nickName: existingUser.nickName,
        formattedDate: formattedDate,
      };
      const userSession = {
        id: sessionId,
        nickName: existingUser.nickName,
        formattedDate: formattedDate,
      };
      res.cookie("userSession", userSession, {
        httpOnly: true,
        maxAge: 1000 * 60 * 30,
      });
      return res.redirect("/menu");
    }

    return res.redirect("/?erro=true");

  } catch (err) {
    res.status(500).send({
      message: "Erro interno no servidor",
    });
  }
});

app.get("/menu", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/");
  }
  const nickName = req.session.user.nickName;
  const lastTimeLogged = req.session.user.formattedDate;
  res.send(`
    <!DOCTYPE html>
    <html lang="pt-br">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Menu</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #white;
            color: white;
            margin: 0;
            display: flex;
            flex-direction: column;
            height: 100vh;
            justify-content: center;
            align-items: center;
          }
          .menu-container {
            background-color: #1e1e1e;
            border-radius: 10px;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
            padding: 20px;
            text-align: center;
            max-width: 400px;
            width: 100%;
          }
          h1 {
            font-size: 24px;
            margin-bottom: 20px;
            color: #fff;
          }
          h2 {
            font-size: 18px;
            margin-bottom: 20px;
            color: #bbb;
          }
          button {
            padding: 10px 20px;
            border-radius: 5px;
            background-color: #333;
            color: white;
            border: none;
            cursor: pointer;
            transition: background-color 0.3s ease;
            font-size: 16px;
            margin-bottom: 10px;
            width: 100%;
          }
          button:hover {
            background-color: #555;
          }
          .back-button {
            background-color: #444;
          }
          .back-button:hover {
            background-color: #666;
          }
          .button-container {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }
        </style>
      </head>
      <body>
        <div class="menu-container">
          <h1>Bem-vindo, <span>${nickName}</span>!</h1>
          <h2>Última vez logado: <span>${lastTimeLogged}</span></h2>
          <div class="button-container">
            <button onclick="registerUser()">Cadastro de Usuários</button>
            <button onclick="chat()">Bate-papo</button>
            <button class="back-button" onclick="logOut()">Sair</button>
          </div>
        </div>
        <script>
          function logOut() {
            fetch("/api/user/logOut", {
              method: "GET",
              credentials: "same-origin", 
            }).then(() => {
              window.location.href = "/";
            });
          }
          function registerUser() {
            window.location.href = "/cadastrarUsuario";
          }
          function chat() {
            window.location.href = "/chat";
          }
        </script>
      </body>
    </html>
`);
});
app.get("/cadastrarUsuario", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/");
  }
  res.sendFile(path.join(__dirname, "public", "cadastrar.html"));
});
app.get("/usuarios", (req, res) => {
  res.json(usuarios);
});
app.post("/cadastro", (req, res) => {
  const { nome, dataNascimento, nickName, password } = req.body;
  if (!nome || !dataNascimento || !nickName || !password) {
    return res.status(400).send("Todos os campos são obrigatórios.");
  }
  usuarios.push({ nome, dataNascimento, nickName, password });
  res.redirect("/cadastrarUsuario");
});
app.post("/enviarMsg", (req, res) => {
  const { messageSelect, messageText } = req.body;
  const horario = new Date().toLocaleString();
  if (!messageSelect || !messageText) {
    return res.status(400).send("Todos os campos são obrigatórios.");
  }
  mensagens.push({ horario, messageSelect, messageText });
  res.redirect("/chat");
});
app.get("/api/user/logOut", (req, res) => {
  try {
    res.clearCookie("connect.sid", { path: "/" });
    res.clearCookie("userSession", { path: "/" });

    req.session.destroy((err) => {
      if (err) {
        return res.status(500).send("Erro ao realizar logout.");
      }

      res.redirect("/");
    });
  } catch (error) {
    res.status(500).send("Erro interno no servidor");
  }
});
app.get("/mensagens", (req, res) => {
  res.json(mensagens);
});
app.get("/chat", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/");
  }
  res.sendFile(path.join(__dirname, "public", "chat.html"));
});

app.listen(3000, () => {
  console.log("Servidor rodando na porta 3000");
});
