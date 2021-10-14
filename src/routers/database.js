const express = require('express');
const routeHandler = require('../util/routeHandler');
const TableInterface = require('../database/tableInterface');

module.exports = class TableRouter {
  constructor(name) {
    this.name = name || '';
    this.table = new TableInterface(name);
    this.tableRouter = express.Router({ mergeParams: true });

    this.table.routes.forEach((route) => {
      switch (route.method) {
        case 'GET':
          this.tableRouter
            .route(route.path)
            .get(routeHandler(this.table[route.function]));
          break;
        case 'POST':
          this.tableRouter
            .route(route.path)
            .post(routeHandler(this.table[route.function]));
          break;
        default:
          break;
      }
    });

    this.initialize = this.initialize.bind(this);
  }

  // initialize schema from db
  async initialize(database) {
    this.table.initialize(database);
  }
};
