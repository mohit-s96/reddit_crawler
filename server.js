/**@author msx47
 *
 * @date 31/08/2021
 *
 * @license MIT
 *
 * @about Retrieves reddit listing data for a given endpoint and stores them into small chunked text files
 *
 */

require("dotenv").config();
const fs = require("fs");
const fetch = require("node-fetch");
const express = require("express");

const app = express();
const port = process.env.PORT || 5000;

/**
 * subsPerRequest is the response count of the number of subreddits to return in 1 listing
 *
 * MAX_VALUE: 100
 */

const subPerRequest = 100;

/**
 * baseUri: Reddit has 2 main endpoints for retrieving subreddit data
 *
 * 1 -> https://www.reddit.com/subreddits/new/.json
 *
 * 2 -> https://www.reddit.com/reddits.json
 *
 * The first one returns a linked list type response which fetches around 250000 newly ceated subreddits.
 *
 * The second one returns a linked list type response of top 5000 subreddits
 *
 */

const baseUri = `https://www.reddit.com/reddits.json?limit=${subPerRequest}`;

/**
 * This varible maintains the current number of subreddits fetched from the API
 */
let subCount = 0;

// globals to track file size

const FILE_NAME = "subredditlist";

/**
 * MAX_SUBS_PER_FILE is a size limiter. I wanted the result files to be divided into several smaller chunks instead of one big file.
 *
 * This constant helps with same by checking subs in a file after each request
 */

const MAX_SUBS_PER_FILE = 10000;
let currentFileIndex = 1;
let stream = fs.createWriteStream(`${FILE_NAME}${currentFileIndex}.txt`, {
  flags: "a",
});

/**
 * Creates a new write stream with the next file and closes the last stream
 */

function createNewStream() {
  currentFileIndex++;
  stream.end();
  stream = fs.createWriteStream(`${FILE_NAME}${currentFileIndex}.txt`, {
    flags: "a",
  });
}

// I hosted this server on a heroku instance to fetch all subreddit data. This process takes a few hours so I made a small API to check current progress.

app.get("/api/count", (_req, res) => {
  res.json({ subCount, currentFileIndex });
  res.status(200);
  return;
});

app.get("/api/list/:idx", (req, res) => {
  let index = req.params.idx;

  index = +index;

  if (
    Number.isInteger(index) &&
    !Number.isNaN(index) &&
    index > 0 &&
    index < currentFileIndex
  ) {
    try {
      fs.readFile(
        `${FILE_NAME}${index}.txt`,
        { encoding: "utf8" },
        (err, data) => {
          if (err) {
            console.log(err);
            res.json({ error: "Something went wrong" });
            res.status(500);
            return;
          } else {
            const dataArray = data.split("\n");

            const responseArray = dataArray.map((x) => {
              let str = x.split("\t");
              const resObject = {
                subredditName: str[0],
                isNSFW: str[1] === "true" ? true : false,
                subCount: str[2],
                accessType: str[3],
              };
              return resObject;
            });

            res.json({ data: responseArray });
          }
        }
      );
    } catch (error) {
      res.json(error);
      res.status(500);
    }
  } else {
    res.json({ error: "Bad request" });
    res.status(400);
  }
});

app.listen(port, () => {
  console.log("Server started on port " + port);
});

// Handle api response
//------------------------------------------------

function handleApiResponse(res) {
  subCount += res.data.dist;
  console.log(subCount);
  const children = res.data.children;
  const names = children.map((x) => {
    // break data by tabs. You can access a lot more data here. Refer to the official reddit API docs.

    const str = `${x.data.display_name}\t${x.data.over18}\t${x.data.subscribers}\t${x.data.subreddit_type}`;
    return str;
  });

  const str = names.join("\n");

  // check the current nuber of subs written to the file and create a new write stream if it's >= MAX_SUBS_PER_FILE

  if (subCount / currentFileIndex >= MAX_SUBS_PER_FILE) {
    createNewStream();
  }
  stream.write(str + "\n");
  if (res.data.after) {
    readSubData(res.data.after);
  } else {
    console.log("Stopping Data fetch, last known data chunk");
    console.log(res);
    stream.end();
    return;
  }
}

//------------------------------------------------

// modhash and session cookie are required only if you want to fetch nsfw subreddits as well.

// to obtain modhash: login to reddit on your desktop and visit https://www.reddit.com/api/me.json , you can get the modhash in the json data returned
// to obtain the reddit session cookie open browser devtools -> application -> cookies and copy the cookie with the name reddit_session. Then create a cookie string as "reddit_session=YOUR_SESSION_COOKIE" and paste it in the request (or the .env file)

const modhash = process.env.REDDIT_MODHASH;
const cookie = process.env.REDDIT_SESSION;
const userAgent = "myCustomGuy:customMiner:v0.1 (by /u/myname)";
const options = {
  method: "get",
  headers: {
    "X-Modhash": modhash,
    cookie: cookie,
    "User-Agent": userAgent,
  },
};

function readSubData(lastId) {
  let uri = "";
  if (lastId) {
    uri = `&after=${lastId}`;
  }
  fetch(baseUri + uri, options)
    .then((res) => res.json())
    .then((res) => {
      handleApiResponse(res);
    })
    .catch((err) => {
      console.log(err);
    });
}

readSubData();
