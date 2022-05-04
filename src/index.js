const functions = require("firebase-functions") 
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const admin = require("firebase-admin");
const world_json = require('./views/pages/world.json')
const country_names = require('./views/pages/names.js')
const app = express();
const port = process.env.PORT || 8080;




// CS5356 TODO #2
// Uncomment this next line after you've created
// serviceAccountKey.json
const serviceAccount = require("../serviceAccountKey.json");
const userFeed = require("./app/user-feed");
const authMiddleware = require("./app/auth-middleware");

// CS5356 TODO #2
// Uncomment this next block after you've created serviceAccountKey.json
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});



// use cookies
app.use(cookieParser());
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
// set the view engine to ejs
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use("/static", express.static("static/"));

// use res.render to load up an ejs view file
// index page
app.get("/", function (req, res) {
  res.render("pages/index");
});

app.get("/sign-in", function (req, res) {
  res.render("pages/sign-in");
});

app.get("/sign-up", function (req, res) {
  res.render("pages/sign-up", { world_json, country_names });
});

app.get("/dashNew", authMiddleware, async function (req, res) {
  const feed = await userFeed.get();
  const posts = await getPosts('posts')
  res.render("pages/dashNew", { user: req.user, feed, posts});
});

app.get("/dashNologin", authMiddleware, async function (req, res) {
  const feed = await userFeed.get();
  const posts = await getPosts('posts')
  res.render("pages/dashNologin", { user: req.user, feed, posts});
});

app.get("/franceDash", authMiddleware, async function (req, res) {
  const feed = await userFeed.get();
  const francePosts = await getPosts('france')
  res.render("pages/franceDash", { user: req.user, feed, francePosts});
});

app.get("/franceNologin", authMiddleware, async function (req, res) {
  const feed = await userFeed.get();
  const francePosts = await getPosts('france')
  res.render("pages/franceNologin", { user: req.user, feed, francePosts});
});

app.get("/lebanonDash", authMiddleware, async function (req, res) {
  const feed = await userFeed.get();
  const posts = await getPosts('Lebanon')
  res.render("pages/lebanonDash", { user: req.user, feed, posts});
});

app.get("/lebanonNologin", authMiddleware, async function (req, res) {
  const feed = await userFeed.get();
  const posts = await getPosts('Lebanon')
  res.render("pages/lebanonNologin", { user: req.user, feed, posts});
});

app.get("/columbiaDash", authMiddleware, async function (req, res) {
  const feed = await userFeed.get();
  const posts = await getPosts('Columbia ')
  res.render("pages/columbiaDash", { user: req.user, feed, posts});
});

app.get("/columbiaNologin", authMiddleware, async function (req, res) {
  const feed = await userFeed.get();
  const posts = await getPosts('Lebanon')
  res.render("pages/columbiaNologin", { user: req.user, feed, posts});
});


// app.get("/dashNew/:countryCode", authMiddleware, async function (req, res) {
//   const feed = await userFeed.get();
//   const posts = await getPosts(req.params.countryCode)
//   res.render("pages/dashNew", { user: req.user, feed, posts});
// });
// /dashNew/:countryCode\

// req.params.countryCode


app.get("/dashboard", authMiddleware, async function (req, res) {
  const feed = await userFeed.get();
  res.render("pages/dashboard", { user: req.user, feed });
});



app.post("/sessionLogin", async (req, res) => {
  // Get the ID token from the request body
  // Create a session cookie using the Firebase Admin SDK
  // Set that cookie with the name 'session'
  // And then return a 200 status code instead of a 501
  const idToken = req.body.idToken;

  const expiresIn = 60 * 60 * 24 * 5 * 1000;

  admin
    .auth()
    .createSessionCookie(idToken, { expiresIn })
    .then(
      session => {
        const options = { maxAge: expiresIn, httpOnly: true };
        res.cookie("session", session, options);
        res.status(200).send(JSON.stringify({ status: "success" }));
      },
      error => {
        res.status(401).send("UNAUTHORIZED REQUEST");
      }
    )
});

app.get("/sessionLogout", (req, res) => {
  res.clearCookie("session");
  res.redirect("/sign-in");
});

app.post("/addToTimeline", authMiddleware, async (req, res) => {
  // Get the message that was submitted from the request body
  const message = req.body.message
  // Get the user object from the request body
  const user = req.user
  // Add the message to the userFeed so its associated with the user
  await userFeed.add(user, message)
  // Reload and redirect to dashboard
  await createPost(message, user.email, 'posts' )
  
  res.redirect('/dashNew')

});

app.post("/addToFrance", authMiddleware, async (req, res) => {
  // Get the message that was submitted from the request body
  const message = req.body.message
  // Get the user object from the request body
  const user = req.user
  // Add the message to the userFeed so its associated with the user
  await userFeed.add(user, message)
  // Reload and redirect to dashboard
  await createPost(message, user.email, 'france' )
  
  res.redirect('/franceDash')

});

app.post("/addToColumbia", authMiddleware, async (req, res) => {
  // Get the message that was submitted from the request body
  const message = req.body.message
  // Get the user object from the request body
  const user = req.user
  // Add the message to the userFeed so its associated with the user
  await userFeed.add(user, message)
  // Reload and redirect to dashboard
  await createPost(message, user.email, 'Columbia ' )
  
  res.redirect('/columbiaDash')

});

app.post("/addToLebanon", authMiddleware, async (req, res) => {
  // Get the message that was submitted from the request body
  const message = req.body.message
  // Get the user object from the request body
  const user = req.user
  // Add the message to the userFeed so its associated with the user
  await userFeed.add(user, message)
  // Reload and redirect to dashboard
  await createPost(message, user.email, 'Lebanon' )
  
  res.redirect('/lebanonDash')

});

// app.listen(port);
// console.log("Server started at http://localhost:" + port);
const db = admin.firestore(); 
async function createPost(postText, userEmail, countryName){
                console.log("here")
                const postCollection = await db.collection(countryName).add({
                  text: postText,
                  email: userEmail
              });
            }
async function getPosts(countryName){
              const snapshot = await db.collection(countryName).get()
              if (snapshot.empty) {
                console.log('No such document!');
                return null;
              } else {
                const docs = []
                snapshot.forEach(doc => {
                      docs.push(doc.data())
                });
                return docs
              }
          }

        

exports.app = functions.https.onRequest(app); 
