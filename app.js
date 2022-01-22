//jshint esversion:6
require('dotenv').config(); // no need to set the const for it will be running throughout
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");


const app = express();
const router = express.Router();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({
  secret: "Yeah this is not my secret",
  resave: false,
  saveUninitialized: false
}));

//then we allow our app to use the passport and session
app.use(passport.initialize());
app.use(passport.session());


mongoose.connect("mongodb://localhost:27017/userDB");

// /we create a schema for ourdb
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String
});

//we arte going to use this to hash and sort our passwords and to save our users in the monogDB db
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);


const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());


//initially, we had the serialization from passportLocalMongoose but now we replace it witha general one that will work for all the methods
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});


passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);

    User.findOrCreate({
      googleId: profile.id
    }, function(err, user) {
      return cb(err, user);
    });
  }
));


app.get("/", function(req, res) {
  res.render("home");
});

//we use the passport to auth our users using the google strategy
app.get("/auth/google",
  passport.authenticate("google", {
    scope: ["profile"]
  }));

// this will direct to secrets if the auth goes right and to the login if not
app.get("/auth/google/secrets",
  passport.authenticate("google", {
    failureRedirect: "/login"
  }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

app.get("/login", function(req, res, next) {
  res.render("login");
});

app.get("/register", function(req, res) {
  res.render("register");
});

app.get("/secrets", function(req, res) {
  if (req.isAuthenticated()) {
    res.render("secrets");
  } else {
    res.redirect("/login");
  }
});

//here we declare for the redirection
app.get("/logout", function(req, res) {
  req.logout();
  res.redirect("/");
});

router.post('/logout', function(req, res, next) {
  req.logout();
  res.redirect('/');
});

//this will be targeted by the register route as the user submits the info from the form
app.post("/register", function(req, res) {

  User.register({
    username: req.body.username
  }, req.body.password, function(err, user) {
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/secrets");
      });
    }
  });
});

//then here we create the login
app.post("/login", function(req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/secrets");
      });
    }
  });
});

app.listen(3000, function() {
  console.log("Server has started on port 3000");
});
