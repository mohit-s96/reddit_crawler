// Please ignore this file. It was hosted on a European instance as aproxy for when a subreddit was blocked in m country

const fetch = require("node-fetch");
const express = require("express");

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
const port = process.env.PORT || 5000;

app.post("/api/uri", async (req, res) => {
  let uri = req.body.uri;
  try {
    const data = await fetch(uri);
    const json = await data.json();
    res.json(json);
    res.status(500);
  } catch (error) {
    res.json({ error: "Unknown error" });
    res.status(500);
  }
});

app.get("/api/test", (_req, res) => {
  res.json({ hello: "hello world!!" });
});

app.listen(port, () => {
  console.log("Server started on port " + port);
});
