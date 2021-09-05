/**@author msx47
 *
 * @about This script reads the response file and scrapes only the names of the subreddits from it
 *
 */

const fs = require("fs");

const str = fs.readFileSync("subredditlist1.txt", { encoding: "utf8" });

const dataArray = str.split("\n");

const responseArray = dataArray
  .map((x) => {
    let str = x.split("\t");
    return str[0];
  })
  .join("\n");

fs.writeFileSync("subredditNames.txt", responseArray, { encoding: "utf8" });
