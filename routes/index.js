import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';

const express = require('express');

const router = express.Router();

router.get('/stats', AppController.getStats);

router.get('/status', AppController.getStatus);

// router.get('/connect', AppController.getConnect);

// router.get('/disconnect', AppController.getDisconnect);

// router.get('/users/me', UsersController.getMe);

router.post('/users', UsersController.postNew);

module.exports = router;
