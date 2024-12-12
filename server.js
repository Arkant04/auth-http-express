const express = require('express');
const { getUser } = require('./database');
const crypto = require('crypto');
const app = express();
const figlet = require("figlet")
app.use(express.static("public"))

const realm = 'User Visible Realm';

// Middleware para autenticar usando Auth Basic HTTP
function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    // Si no hay cabecera de autorización o no es del tipo Basic, pedir credenciales
    res.setHeader('WWW-Authenticate', `Basic realm="${realm}"`);
    return res.status(401).send('Autenticación requerida');
  }

  // Decodificar credenciales base64
  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
  const [username, password] = credentials.split(':');

  const user = getUser(username);
  const md5hash = crypto.createHash('md5').update(password).digest('hex');

  if (!user || user.password !== md5hash) {
    // Si el usuario no existe o la contraseña es incorrecta
    res.setHeader('WWW-Authenticate', `Basic realm="${realm}"`);
    return res.status(401).send('Credenciales incorrectas');
  }

  // Si las credenciales son correctas, continuar con la siguiente función
  return next();
}

// Rutas protegidas por la autenticación Basic
app.get('/protected', authMiddleware, (req, res) => {
  const authHeader = req.headers['authorization'];
  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
  const [username] = credentials.split(':');
  
  res.send(`Bienvenido ${username}, has accedido a una ruta protegida.`);
});

app.get('/mensajeUsuarioLog',authMiddleware ,(req, res) => {

  res.send("Hola")
})

app.get('/logout', (req, res) => {
  res.setHeader('WWW-Authenticate', `Basic realm="${realm}"`);
  res.status(401).send('Has sido deslogueado');
});

// Ruta sin protección para pruebas
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.get("/fonts", (req, res) =>{
  figlet.fonts(function (err, fonts) {
      if (err) {
        console.log("something went wrong...");
        console.dir(err);
        return;
      }
      res.send(fonts);
    });
})

app.get("/figlet",authMiddleware , (req, res) =>{
  const text = req.query.text
  const font = req.query.font
  
  figlet.text(
      `${text}`,
      {
        font: `${font}`,
        horizontalLayout: "default",
        verticalLayout: "default",
        width: 80,
        whitespaceBreak: true,
      },
      function (err, data) {
        if (err) {
          console.log("Something went wrong...");
          console.dir(err);
          return;
        }
        res.send(`<pre>${data}</pre>`);
      }
    );

})

// Iniciar el servidor
app.listen(3000, () => {
  console.log('Servidor escuchando en http://localhost:3000');
});
