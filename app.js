//jshint esversion:6
require('dotenv').config();   // no need to set the const for it will be running throughout
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");

const app = express();


app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

mongoose.connect("mongodb://localhost:27017/userDB");

// /we create a schema for ourdb
const userSchema = new mongoose.Schema ({
  email: String,
  password: String
});

//we tap into the value for secret that was defined in the secret var in the .env
userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ["password"]});


const User  = new mongoose.model("User", userSchema);

app.get("/", function(req, res){
  res.render("home");
});

app.get("/login", function(req, res){
  res.render("login");
});

app.get("/register", function(req, res){
  res.render("register");
});

//this will be targeted by the register route as the user submits the info from the form
app.post("/register", function(req, res){
  const newUser = new User({
    email: req.body.username,
    password: req.body.password
  });

  newUser.save(function(err){
    if(err){
      console.log(err);
    } else {
      //we are only rendering the secrets page from the login and register routes
      res.render("secrets");
    }
  });
});

//then here we create the login
app.post("/login", function(req, res){
  const username = req.body.username;
  const password = req.body.password;

  User.findOne({email: username}, function(err, foundUser){
    if(err){
      console.log(err);
    } else {
      if(foundUser.password === password){
        res.render("secrets");
      }
    }
  });
});



app.listen(3000, function(){
  console.log("Server has started on port 3000");
});
