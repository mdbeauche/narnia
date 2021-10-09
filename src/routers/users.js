const express = require('express');
const routeHandler = require('../util/routeHandler');
const { users } = require('../database');

const usersRouter = express.Router({ mergeParams: true });

usersRouter.route('/').get(routeHandler(users.getUsers));

usersRouter.route('/:user_id').get(routeHandler(users.getUser));

usersRouter.route('/:user_id/create').get(routeHandler(users.createUser));

usersRouter.route('/:user_id/update').post(routeHandler(users.updateUser));

usersRouter.route('/:user_id/delete').post(routeHandler(users.deleteUser));

module.exports = usersRouter;
