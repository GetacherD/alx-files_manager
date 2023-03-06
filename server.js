import express from 'express';
// import dbClient from './utils/db';
// import redisClient from './utils/redis';
// import dbClient from './utils/db';

const app = express();

const port = process.env.PORT || 5000;
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('', require('./routes/index'));
// if (!redisClient.isAlive() && !dbClient.isAlive()) {
//   console.log("Connecting to server mongodb and redis")
// }
// else if (redisClient.isAlive() && !dbClient.isAlive()) {
//   console.log("Connecting to server mongodb")
// } else if (dbClient.isAlive() && !redisClient.isAlive()) {
//   console.log("Connecting to server redis")
// }
// else {

// }
// while (!redisClient.isAlive() || !dbClient.isAlive()) {
//   console.log("Conecting")

// }

// function connectDb() {
//   console.log('Try Connection');
//   if (dbClient.isAlive() && redisClient.isAlive()) {
//     console.log('Connected to mongo');
//     app.listen(port, () => {
//       console.log(`Server running on port ${port}`);
//     });
//   } else {
//     setTimeout(() => connectDb(), 1000);
//   }
// }
// connectDb();

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
