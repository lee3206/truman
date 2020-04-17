Truman Platform
=======================

The Truman Platform is a fake social network for real results. This fake social network application allows researchers to create interesting and believable scenarios in a social network environment. Since the interactions that take place in a social setting and influence the outcome of an experiment, all content, users, interactions and notifications are “fake” and created by a set of digital actors. Each participant sees the same interactions and conversations, believe these to be unique to them.

This allows any experiment to be completely replicated, and the tools can be repurposed for other studies.

This current iteration is testing the bystander effect on cyberbullying. Future studies could be done on a number of other topics and issues.

This project and software development was supported by the National Science Foundation through IIS-1405634. Special thanks to everyone at Cornell Social Media Lab in the Department of Communication.

Also special thanks to Sahat Yalkabov and his [Hackathon Starter](https://github.com/sahat/hackathon-starter) project, which provided the basic organization for this project.

========================

Tutorial (Getting started by running on your local machine)

To start with, you should download the following programs
- [MongoDB](https://www.mongodb.com/download-center/community)
- [Node.js 8.0+](http://nodejs.org)
- [Docker installation](https://docs.docker.com/engine/installation/)
- [Common problems setting up docker](https://docs.docker.com/toolbox/faqs/troubleshoot/)

4: ???

Now, go into the Truman directory and make a file called .env (if you are using windows, you cannot do this from windows explorer. I recommend [Atom](https://www.atom.io) as a text editor, but use whatever you prefer)

Copy/paste everything in the file called .env.example into .env.
This is necessary, as .env stores all your important keys and other information that you don't want to share on github.

Next, start by opening the CMD and navigating (cd /yourdirectory) to where ever Truman is on your computer.

Ok, now open another CMD and run MongoDB by entering
```bash
mongo
```
(If on a MAC and running into errors, check this [stack](https://stackoverflow.com/questions/11707938/mongodb-installed-via-homebrew-not-working) post
If this doesn't work, see tutorial on adding [mongoDB](https://closebrace.com/tutorials/2017-03-02/the-dead-simple-step-by-step-guide-for-front-end-developers-to-getting-up-and-running-with-nodejs-express-and-mongodb) to the PATH file.

You should see some text scroll by (LINK to MONGODB Tutorial) like this, and then enter
```bash
use test
```
to make a local database called test (which is the database that Truman looks for by default).
Leave this running in the background.

Now, switch back to your original CMD and write
```
docker-compose build web
```
This will build out the environment for your instance of Truman, and install a bunch of stuff.

At the end you should see
```bash
Successfully built 32204b468713
Successfully tagged truman_web:latest
```

Next, try
```
docker-compose up web
```
If everything is working correctly you should now see something like this:
```
App is running at http://localhost:3000 in development mode
Press CTRL-C to stop
```
Congratulations! Navigate to the local host by copying that into your favorite browser and you should be up and running!

But wait! Something is missing. If you sign in and create an account, there isn't any activity there!
Where are all the actors!?

Well, you need to place them into the database. Currently, nothing is in there.

To fix this, go into docker. I'm sure there is another way to do this, but here is how I do it.

First, download the Kitematic Docker visualizer. Then, click the EXEC button to create a CMD within the docker!

From here, type

```
node populate.js
```
You should see some text scroll up about adding some actors and posts. These are drawn from the folder "final_data" in truman.
If you decide to edit this data (You probably should to fit with your project) this is where you will go.

Anyway, if this has worked correctly, try refreshing your localhost browser. You should now be displaying a bunch of posts!

Congrats, you have a fake social media network that you can start to play around it.

======================================================
/n
Step 2: Doing something interesting

Ok, you've got a version of Truman running, but it's not exactly what you want. We can fix that!

(I mean, you can. I'm just some text.)

To be continued...

TODO:
Let actors have their posts stay on their profile
Fix actor commenting so they randomly comment on people's posts
