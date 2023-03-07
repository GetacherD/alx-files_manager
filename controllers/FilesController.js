import fs, { existsSync } from 'fs';
import path from 'path';
import { v4 as uuid4 } from 'uuid';
import { ObjectId } from 'mongodb';
// import { promisify } from 'util';

import redisClient from '../utils/redis';
import dbClient from '../utils/db';

export default class FilesController {
  static async getFile(req, res) {
    try {
      const { id } = req.params;
      const file = await (await dbClient.filesCollection())
        .findOne({ _id: ObjectId(id) });
      if (!file) {
        res.status(404).json({ error: 'Not found' });
        return;
      }
      if (file.isPublic) {
        res.sendFile(file.localPath);
        return;
      }
      const token = req.header('X-Token');
      const UserID = await redisClient.get(`auth_${token}`); // _id -> of user
      if (!UserID) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      if (!file.isPublic && UserID !== file.userId) {
        res.status(404).json({ error: 'Not found' });
        return;
      }
      if (file.type === 'folder') {
        res.status(400).json({ error: 'A folder doesn\'t have content' });
        return;
      }
      if (!existsSync(file.localPath)) {
        res.status(404).json({ error: 'Not found' });
        return;
      }
      res.sendFile(file.localPath);
      return;
    } catch (e) {
      res.status(500).send('');
    }
  }

  static async putUnpublish(req, res) {
    try {
      const token = req.header('X-Token');
      const UserID = await redisClient.get(`auth_${token}`); // _id -> of user
      if (!UserID) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const { id } = req.params;
      console.log('the id', id);
      const file = await (await dbClient.filesCollection())
        .findOne({ _id: ObjectId(id), userId: UserID });
      if (!file) {
        res.status(404).json({ error: 'Not found' });
        return;
      }
      await (await dbClient.filesCollection())
        .updateOne({ _id: ObjectId(id), userId: UserID }, { $set: { isPublic: false } });
      // const data = await fs.promises.readFile(file.localPath, 'utf-8');
      file.isPublic = false;
      res.status(200).send(file);
    } catch (e) {
      res.status(500).json({ error: 'Server error' });
    }
  }

  static async putPublish(req, res) {
    try {
      const token = req.header('X-Token');
      const UserID = await redisClient.get(`auth_${token}`); // _id -> of user
      if (!UserID) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const { id } = req.params;
      const file = await (await dbClient.filesCollection())
        .findOne({ _id: ObjectId(id), userId: UserID });
      if (!file) {
        res.status(404).json({ error: 'Not found' });
        return;
      }
      await (await dbClient.filesCollection())
        .updateOne({ _id: ObjectId(id), userId: UserID }, { $set: { isPublic: true } });
      // const data = await fs.promises.readFile(file.localPath, 'utf-8');
      file.isPublic = true;
      res.status(200).send(file);
    } catch (e) {
      res.status(500).json({ error: 'Server error' });
    }
  }

  static async getIndex(req, res) {
    try {
      const token = req.headers['x-token'];
      const UserID = await redisClient.get(`auth_${token}`); // _id -> of user
      if (!UserID) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const parentId = req.query.parentId ? req.query.parentId : 0;
      const page = req.query.page ? req.query.page : 0;
      if (parentId === 0 || parentId === '0') {
        res.status(200).json([]);
        return;
      }
      const files = await (await (await dbClient.filesCollection())
        .find({ parentId: ObjectId(parentId) }).skip(page * 20).limit(20)).toArray(); // 60 60-80
      console.log(files);
      files.id = files._id;
      delete files._id;
      res.status(200).send(files);
      return;
    } catch (e) {
      res.status(500).json({ error: 'Server error' });
    }
  }

  static async getShow(req, res) {
    try {
      const token = req.headers['x-token'];
      console.log(token);
      const UserID = await redisClient.get(`auth_${token}`); // _id -> of user
      console.log(UserID);
      if (!UserID) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const { id } = req.params;
      console.log(id);
      const file = await (await dbClient.filesCollection())
        .findOne({ _id: ObjectId(id), userId: ObjectId(UserID) });
      console.log('File found', file);
      if (!file) {
        res.status(404).json({ error: 'Not found' });
        return;
      }
      console.log(file);
      res.status(200).json(file);
      // const isExist = existsSync(file.localPath);
      // if (!isExist) {
      //   res.status(404).json({ error: 'Not found' });
      //   return;
      // }
      // // const data = await fs.promises.readFile(file.localPath, 'utf-8');
      // res.status(200).send(file);
      // return;
    } catch (e) {
      res.status(500).json({ error: 'Server error' });
    }
  }

  static async postUpload(req, res) {
    try {
      const token = req.headers['x-token'];
      // console.log(token)
      // res.send(token)
      const UserID = await redisClient.get(`auth_${token}`); // _id -> of user
      // res.send(UserID)
      if (!UserID) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      console.log('The user is', UserID);

      const name_ = (req.body && req.body.name) ? req.body.name : null;
      const type_ = (req.body && req.body.type) ? req.body.type : null;
      const parentId_ = (req.body && req.body.parentId) ? req.body.parentId : 0;
      const isPublic_ = (req.body && req.body.isPublic) ? req.body.isPublic : false;
      let data_ = null; // Base64 file format
      if (type_ === 'file' || type_ === 'image') {
        data_ = (req.body && req.body.data) ? req.body.data : null;
      }
      if (!name_) {
        res.status(400).json({ error: 'Missing name' });
        return;
      }
      const fileType = ['file', 'folder', 'image'];
      if (!type_ || !fileType.includes(type_)) {
        res.status(400).json({ error: 'Missing type' });
        return;
      }
      if (!data_ && type_ !== 'folder') {
        res.status(400).json({ error: 'Missing data' });
        return;
      }

      if (parentId_ !== 0) { // if parent ID !=0  some folder id
        const fileObj = await (await dbClient.filesCollection()) // folder object
          .findOne({ _id: ObjectId(parentId_) });
        console.log('the FileObj is', fileObj);
        if (!fileObj) {
          res.status(400).json({ error: 'Parent not found' });
          return;
        }
        // file image folder
        if (fileObj.type !== 'folder') {
          res.status(400).json({ error: 'Parent is not a folder' });
          return;
        }
      }

      // only if ther is user, parent id set and is folder of not set at all
      // ready to be saved in specified folder
      if (type_ === 'folder') {
        const NewFolder = {
          type: 'folder', userId: ObjectId(UserID), name: name_, isPublic: isPublic_, parentId: parentId_ !== '0' ? ObjectId(parentId_) : '0',
        };
        const insert = await (await dbClient.filesCollection())
          .insertOne(NewFolder);
        res.status(201).send({
          id: insert.insertedId,
          name: name_,
          type: type_,
          userId: UserID.toString(),
          parentId: parentId_,
          isPublic: isPublic_,
        });
        return;
      }
      // only if type is not folder
      const uploadFolder = process.env.FOLDER_PATH || '/tmp/files_manager';
      const folderExists = existsSync(uploadFolder);
      if (!folderExists) {
        await fs.promises.mkdir(uploadFolder, { recursive: true });
      }

      // either already exist or success created
      const fileNameLocal = uuid4();
      const clearData = Buffer.from(data_, 'base64');
      // if (type_ === 'image') {
      //   clearData = Buffer.from(data_, 'base64');
      // } else {
      //   clearData = Buffer.from(data_, 'base64').toString('utf-8');
      // }
      // write to hard disk
      await fs.promises.writeFile(path.join(uploadFolder, fileNameLocal), clearData);
      // file is placed in HDD
      // DB reference to the file

      const addedToDb = await (await dbClient.filesCollection()).insertOne({
        userId: ObjectId(UserID),
        name: name_,
        type: type_,
        isPublic: isPublic_,
        parentId: parentId_ !== '0' ? ObjectId(parentId_) : '0',
        localPath: `${uploadFolder}/${fileNameLocal}`,
      });
      res.status(201).json({
        id: addedToDb.insertedId,
        userId: UserID.toString(),
        name: name_,
        type: type_,
        isPublic: isPublic_,
        parentId: parentId_,
        localPath: `${uploadFolder}/${fileNameLocal}`,
      });
    } catch (e) {
      res.status(500).json({ error: 'Server Error' });
    }
  }
}
