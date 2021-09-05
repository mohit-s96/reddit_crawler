## Reddit listing crawler

#### Retrieves reddit listing data for a given endpoint and stores them into small chunked text files

### Note

#### modhash and session cookie are required only if you want to fetch nsfw subreddits as well.

To obtain modhash:

Login to reddit on your desktop and visit https://www.reddit.com/api/me.json , you can get the modhash in the json data returned.

To obtain the reddit session cookie

Open browser devtools -> application -> cookies and copy the cookie with the name reddit_session. Then create a cookie string as "reddit_session=YOUR_SESSION_COOKIE" and paste it in the request (or the .env file)

#### I recommend hosting with heroku, its free and easy to set up.
