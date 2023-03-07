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
      const token = req.header('X-Token');
      const UserID = await redisClient.get(`auth_${token}`); // _id -> of user
      if (!UserID) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const parentId = Number(req.query.parentId ? req.query.parentId : 0);
      const page = Number(req.query.page) ? Number(req.query.page) : 0;
      const files = await (await (await dbClient.filesCollection())
        .find({ parentId }).skip(page * 20).limit(20)).toArray();
      res.status(200).send(files);
      return;
    } catch (e) {
      res.status(500).json({ error: 'Server error' });
    }
  }

  static async getShow(req, res) {
    try {
      const token = req.header('X-Token');
      const UserID = await redisClient.get(`auth_${token}`); // _id -> of user
      if (!UserID) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const { id } = req.params;

      const file = await (await dbClient.filesCollection())
        .findOne({ _id: ObjectId(id) });
      console.log('File found', file);
      if (!file) {
        res.status(404).json({ error: 'Not found' });
        return;
      }
      const isExist = existsSync(file.localPath);
      if (!isExist) {
        res.status(404).json({ error: 'Not found' });
        return;
      }
      // const data = await fs.promises.readFile(file.localPath, 'utf-8');
      res.status(200).send(file);
      return;
    } catch (e) {
      res.status(500).json({ error: 'Server error' });
    }
  }

  static async postUpload(req, res) {
    try {
      const token = req.header('X-Token');

      const UserID = await redisClient.get(`auth_${token}`); // _id -> of user
      if (!UserID) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const name_ = (req.body && req.body.name) ? req.body.name : null;
      const type_ = (req.body && req.body.type) ? req.body.type : null;
      const parentId_ = (req.body && req.body.parentId) ? req.body.parentId : 0;
      const isPublic_ = (req.body && req.body.isPublic) ? req.body.isPublic : false;
      let data_ = null; // Base64 file format
      if (type_ === 'file' || type_ === 'image') {
        data_ = req.body ? req.body.data : null;
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
      // parent_ID -> folder id for file    root /  default 0
      if (parentId_ !== 0) { // if parent ID !=0  some folder id
        const folderId = await (await dbClient.filesCollection()) // folder object
          .findOne({ _id: ObjectId(parentId_) });

        if (!folderId) {
          res.status(400).json({ error: 'Parent not found' });
          return;
        }
        if (folderId.type !== 'folder') {
          res.status(400).json({ error: 'Parent is not a folder' });
          return;
        }
      }
      // ready to be saved in specified folder
      if (type_ === 'folder') {
        try {
          const NewFolder = {
            type: 'folder', userId: UserID, name: name_, isPublic: isPublic_, parentId: parentId_ || 0,
          };
          const insert = await (await dbClient.filesCollection())
            .insertOne(NewFolder);
          res.status(201).send({
            id: insert.insertedId,
            name: name_,
            type: type_,
            userId: UserID,
            parentId: parentId_ || 0,
            isPublic: isPublic_,
          });
          return;
        } catch (e) {
          res.status(500).json({ error: 'Server Error' });
          return;
        }
      }
      // only if type is not folder
      const uploadFolder = process.env.FOLDER_PATH || '/tmp/files_manager';
      const folderExists = existsSync(uploadFolder);
      if (!folderExists) {
        const createdDir = await fs.promises.mkdir(uploadFolder);
        if (!createdDir) {
          res.status(500).json({ error: 'Server Error' });
          return;
        }
      }

      try {
        // either already exist or success created
        const fileNameLocal = uuid4();
        let clearData = null;
        if (type_ === 'image') {
          clearData = Buffer.from(data_, 'base64');
        } else {
          clearData = Buffer.from(data_, 'base64').toString('utf-8');
        }
        await fs.promises.writeFile(path.join(uploadFolder, fileNameLocal), clearData, { flag: 'w' });
        // file is placed in HDD
        // DB reference to the file
        const addedToDb = await (await dbClient.filesCollection()).insertOne({
          userId: UserID,
          name: name_,
          type: type_,
          isPublic: isPublic_,
          parentId: parentId_,
          localPath: `${uploadFolder}/${fileNameLocal}`,
        });

        res.status(201).json({
          id: addedToDb.insertedId,
          userId: UserID,
          name: name_,
          type: type_,
          isPublic: isPublic_,
          parentId: parentId_,
          localPath: `${uploadFolder}/${fileNameLocal}`,
        });
      } catch (e) {
        res.status(500).json({ error: 'Server Error' });
        return;
      }
    } catch (e) {
      res.status(500).json({ error: 'Server Error' });
    }
  }
}
