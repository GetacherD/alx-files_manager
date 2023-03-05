import fs, { existsSync } from 'fs';
import path from 'path';
import { v4 as uuid4 } from 'uuid';
import { ObjectId } from 'mongodb';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

export default class FilesController {
  static async postUpload(req, res) {
    const token = req.header('X-Token');
    let UserID = null;
    try {
      UserID = await redisClient.get(`auth_${token}`); // _id -> of user
      if (!UserID) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
    } catch (e) {
      res.status(500).json({ error: 'Server Error' });
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
    if (parentId_) { // if parent ID !=0  some folder id
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
        clearData = data_;
      } else {
        clearData = Buffer.from(data_, 'base64').toString('utf-8');
      }
      await fs.promises.writeFile(path.join(uploadFolder, fileNameLocal), clearData);
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
    }
  }
}
