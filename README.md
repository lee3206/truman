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

Now, go into the Truman directory and make a file called .env (if you are using windows, you cannot do this from windows explorer. I recommend Atom (LINK) as a text editor, but use whatever you prefer)

Copy/paste everything in the file called .env.example into .env. This is necessary, as .env stores all your important keys and other information that you don't want to share on github.

Next, start by opening the CMD and navigating (cd /yourdirectory) to where ever Truman is on your computer.

Ok, now open another CMD and run MongoDB by entering
```bash
mongo
```
(if this doesnt work, see tutorial on adding mongoDB to the PATH file (LINK))

You should see some text scroll by (LINK to MONGODB Tutorial) like this, and then enter
```bash
use test
```
to make a local database called test (which is the database that Truman looks for by default)

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
