import { writeFileAsync } from 'fs';
import Queue from 'bull/lib/queue';
import { ObjectId } from 'mongodb';
import dbClient from './utils/db';

const imageThumbnail = require('image-thumbnail');

const fileQueue = new Queue('fileQueue');
const userQueue = new Queue('userQueue');

async function generateThumbnail(filepath, size) {
  const thumb = await imageThumbnail(filepath, { width: size });
  return writeFileAsync(`${filepath}_${size}`, thumb);
}

fileQueue.process(async (job, done) => {
  const userId = job.data.userId || null;
  const fileId = job.data.fileId || null;

  if (!userId) {
    throw new Error('Missing userId');
  }
  if (!fileId) {
    throw new Error('Missing userId');
  }

  const file = await (await dbClient.filesCollection())
    .findOne({ userId: ObjectId(userId), _id: ObjectId(fileId) });

  if (!file) {
    throw new Error('File not found');
  }

  const width = [500, 250, 100];
  Promise.all(width.map((size) => generateThumbnail(file.localPath, size)))
    .then(() => {
      done();
    });
});

userQueue.process(async (job, done) => {
  const userId = job.data.userId || null;
  if (!userId) {
    throw new Error('Missing userId');
  }
  const user = await (await dbClient.usersCollection())
    .findOne({ userId: ObjectId(userId) });
  if (!user) {
    throw new Error('User not found');
  }
  console.log(`Welcome ${user.email}!`);
  done();
});
