const express = require("express");
const cors = require("cors");
const db = require("../database/SqliteAuto");
const { error } = require("console");
const route = express.Router();

route.use(cors());
route.use(express.json());

route.post("/login", async (req, res) =>  {
  try {
    console.log("accessed server...")
    const { email, password } = req.body;
    // console.log("recieved data...")
    try{
        await db.authLogin({ email: email, password: password });
        return res.json({"Message":"Login Successfully"});
    }catch(error){
        return res.status(400).json({"error":"Incorrect Credentials"})
    }
  } catch (err) {
    res.status(403);
  }
});
route.post("/signup", async (req, res) => {
   try {
    console.log("accessed server...")
    const { email, password } = req.body;
    // console.log("r data...")
    try{
        await db.authSignUp(email, password);
        return res.json({"Message":"Account Created Successfully"});
    }catch(error){
        return res.status(400).json({"error":"SignUp Error"})
    }
  } catch (err) {
    res.status(403).json({"Error":"Signup Error"});
  }
})

route.get("/test", (req, res) => {
  return res.json({ result: "success" });
});

module.exports = route;
