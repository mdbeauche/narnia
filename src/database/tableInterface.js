const bcrypt = require('bcrypt');
const {
  initializeSchema,
  validateSchema,
  validateUpdates,
} = require('./util/schema');
const { PAGINATION_SIZE } = require('../config');

module.exports = class TableInterface {
  constructor(name) {
    this.name = name || '';
    this.numRecords = 0;

    this.routes = [
      {
        path: '/',
        function: 'getRecords',
        method: 'GET',
      },
      {
        path: '/data',
        function: 'getData',
        method: 'GET',
      },
      {
        path: '/count',
        function: 'getNumRecords',
        method: 'GET',
      },
      {
        path: '/schema',
        function: 'getSchema',
        method: 'GET',
      },
      {
        path: '/order',
        function: 'getOrderedRecords',
        method: 'GET',
      },
      {
        path: '/query',
        function: 'getRecordsByQuery',
        method: 'GET',
      },
      {
        path: '/all', // TODO: disable route
        function: 'getAllRecords',
        method: 'GET',
      },
      {
        path: '/create',
        function: 'createRecord',
        method: 'POST',
      },
      {
        path: '/:id',
        function: 'getRecordById',
        method: 'GET',
      },
      {
        path: '/find/:id',
        function: 'getRecordsById',
        method: 'GET',
      },
      {
        path: '/update/:id',
        function: 'updateRecord',
        method: 'POST',
      },
      {
        path: '/delete/:id',
        function: 'deleteRecord',
        method: 'POST',
      },
    ];

    this.initialize = this.initialize.bind(this);
    this.getData = this.getData.bind(this);
    this.getNumRecords = this.getNumRecords.bind(this);
    this.getSchema = this.getSchema.bind(this);
    this.getOrderedRecords = this.getOrderedRecords.bind(this);
    this.getRecordsByQuery = this.getRecordsByQuery.bind(this);
    this.getAllRecords = this.getAllRecords.bind(this);
    this.validateRecord = this.validateRecord.bind(this);
    this.getRecords = this.getRecords.bind(this);
    this.getRecordById = this.getRecordById.bind(this);
    this.getRecordsById = this.getRecordsById.bind(this);
    this.createRecord = this.createRecord.bind(this);
    this.updateRecord = this.updateRecord.bind(this);
    this.deleteRecord = this.deleteRecord.bind(this);
  }

  async initialize(db) {
    this.schema = await initializeSchema(db, this.name);

    const {
      data: [count],
    } = await this.getNumRecords(db);

    this.numRecords = count;

    return count;
  }

  async getNumRecords(db) {
    try {
      const [[{ count }]] = await db.execute(
        `SELECT COUNT(*) AS count FROM ${this.name};`,
      );
      this.numRecords = count;

      return { success: true, data: [count] };
    } catch (err) {
      return {
        success: false,
        message: `getNumRecords failed: ${err.message}`,
      };
    }
  }

  async getSchema() {
    if (this.schema) {
      return { success: true, data: [this.schema] };
    }

    return { success: false, message: 'Table interface not initialized' };
  }

  async validateRecord(db, record) {
    const validationErrors = await validateSchema(
      db,
      record,
      this.name,
      this.schema,
    );

    return validationErrors;
  }

  async getAllRecords(db) {
    let rows;

    try {
      [rows] = await db.execute(`SELECT * FROM ${this.name}`);
    } catch (err) {
      return { success: false, message: `getRecords failed: ${err.message}` };
    }

    if (rows && Array.isArray(rows)) {
      return { success: true, data: rows };
    }

    return { success: false, message: `No ${this.name} table found` };
  }

  async getRecords(db, params) {
    let rows;

    const { page = 0 } = params;
    const offset = (page < 0 ? 0 : page) * PAGINATION_SIZE;

    try {
      [rows] = await db.execute(
        `SELECT * FROM ${this.name} LIMIT ? OFFSET ?;`,
        [PAGINATION_SIZE, offset],
      );
    } catch (err) {
      return { success: false, message: `getRecords failed: ${err.message}` };
    }

    if (rows && Array.isArray(rows)) {
      return { success: true, data: [rows, this.numRecords] };
    }

    return { success: false, message: `No ${this.name} table found` };
  }

  async getRecordById(db, params) {
    let rows;

    try {
      [rows] = await db.execute(
        `SELECT * FROM ${this.name} WHERE id = ? LIMIT 1`,
        [params.id],
      );
    } catch (err) {
      return { success: false, message: `getRecord failed: ${err.message}` };
    }

    if (rows && rows.length) {
      return { success: true, data: rows };
    }

    return { success: false, message: `No record found by id ${params.id}` };
  }

  async getRecordsById(db, params) {
    let rows;

    const { page = 0 } = params;
    const offset = (page < 0 ? 0 : page) * PAGINATION_SIZE;

    try {
      [rows] = await db.execute(
        `SELECT * FROM ${this.name} WHERE id = ? LIMIT ? OFFSET ?`,
        [params.id, PAGINATION_SIZE, offset],
      );
    } catch (err) {
      return { success: false, message: `getRecord failed: ${err.message}` };
    }

    if (rows && rows.length) {
      return { success: true, data: rows };
    }

    return { success: false, message: `No record found by id ${params.id}` };
  }

  async getOrderedRecords(db, params) {
    let rows;

    const { orders, page = 0 } = params;

    const offset = (page < 0 ? 0 : page) * PAGINATION_SIZE;
    // [ { field: string, ascending: boolean }, ]
    // ? ASC|DESC, ? ASC|DESC;    ... [field1, field2]

    let orderString = '';
    let fieldNotFound = null;

    orders.forEach((order) => {
      const parsedOrder = JSON.parse(order);

      // only allow searching for fields that exist in schema
      // (SQL does not allow the ? variable escaping for column names in ORDER BY)
      if (
        Object.prototype.hasOwnProperty.call(this.schema, parsedOrder.field) ||
        parsedOrder.field === 'id' ||
        parsedOrder.field === 'created_at' ||
        parsedOrder.field === 'updated_at'
      ) {
        const ascending = Object.prototype.hasOwnProperty.call(
          parsedOrder,
          'ascending',
        )
          ? ` ${parsedOrder.ascending === true ? 'ASC' : 'DESC'}`
          : '';
        orderString += `${parsedOrder.field}${ascending}, `;
      } else {
        fieldNotFound = parsedOrder.field;
      }
    });

    if (fieldNotFound) {
      return {
        success: false,
        // eslint-disable-next-line max-len
        message: `getOrderedRecords failed: field ${fieldNotFound} does not exist in table ${this.name}`,
      };
    }

    orderString = orderString.slice(0, -2);

    try {
      [rows] = await db.execute(
        `SELECT * FROM ${this.name} ORDER BY ${orderString} LIMIT ? OFFSET ?;`,
        [PAGINATION_SIZE, offset],
      );
    } catch (err) {
      return {
        success: false,
        message: `getOrderedRecords failed: ${err.message}`,
      };
    }

    if (rows && Array.isArray(rows)) {
      return { success: true, data: [rows, this.numRecords] };
    }

    return { success: false, message: `No ${this.name} table found` };
  }

  async getRecordsByQuery(db, params) {
    let rows;

    const { query, page = 0 } = params;

    const parsedQuery = JSON.parse(query);

    const offset = (page < 0 ? 0 : page) * PAGINATION_SIZE;
    // { column: string, value: string }

    // SELECT * FROM Customers
    // WHERE CustomerID=1;

    try {
      [rows] = await db.execute(
        // eslint-disable-next-line max-len
        `SELECT * FROM ${this.name} WHERE ${parsedQuery.column}=? ORDER BY created_at DESC LIMIT ? OFFSET ?;`,
        [parsedQuery.value, PAGINATION_SIZE, offset],
      );
    } catch (err) {
      return {
        success: false,
        message: `getRecordsByQuery failed: ${err.message}`,
      };
    }

    if (rows && Array.isArray(rows)) {
      return { success: true, data: [rows, this.numRecords] };
    }

    return { success: false, message: `No ${this.name} table found` };
  }

  async getData(db) {
    // need to get current count
    await this.getNumRecords();

    let rows;

    try {
      [rows] = await db.execute(`SELECT * FROM ${this.name} LIMIT ?;`, [
        PAGINATION_SIZE,
      ]);
    } catch (err) {
      return { success: false, message: `getData failed: ${err.message}` };
    }

    if (rows && Array.isArray(rows)) {
      return { success: true, data: [this.schema, rows, this.numRecords] };
    }

    return { success: false, message: 'Unknown getData failure' };
  }

  async createRecord(db, params) {
    // testing
    // const testUser = {
    //   password: 'testpass',
    //   first_name: 'Michael',
    //   last_name: 'Beauchemin',
    //   email: 'michael.beauchemin@gmail.com',
    // };

    const validationErrors = await this.validateRecord(db, params.record);

    if (validationErrors.length > 0) {
      return {
        success: false,
        message: `Failed to validate record: ${validationErrors}`,
      };
    }

    const fields = `${Object.keys(params.record).join(', ')}`;
    const values = `${Object.keys(params.record)
      .map(() => '?')
      .join(', ')}`;

    if (params.record.password) {
      // hash password before storing in db
      const hash = await bcrypt.hash(params.record.password, 10);
      params.record.password = hash;
    }

    let rows;
    try {
      [rows] = await db.execute(
        // `INSERT INTO ${this.name} ( first_name, last_name, email, password )'
        // + ' VALUES ( ?, ?, ?, ? );`,
        `INSERT INTO ${this.name} ( ${fields} ) VALUES ( ${values} );`,
        Object.values(params.record),
      );
    } catch (err) {
      return { success: false, message: `createRecord failed: ${err.message}` };
    }

    if (rows?.affectedRows && rows.affectedRows > 0) {
      this.numRecords += rows.affectedRows;

      return {
        success: true,
        message: `Created record with id: ${rows.insertId}`,
      };
    }

    return { success: false, message: 'Failed to create record' };
  }

  async deleteRecord(db, params) {
    let rows;
    try {
      [rows] = await db.execute(`DELETE FROM ${this.name} WHERE id = ?;`, [
        params.id,
      ]);
    } catch (err) {
      return { success: false, message: `deleteRecord failed: ${err.message}` };
    }

    if (rows?.affectedRows > 0) {
      this.numRecords -= rows.affectedRows;

      return {
        success: true,
        message: `Deleted ${rows.affectedRows} record${
          rows.affectedRows > 1 ? 's' : ''
        } with id: ${params.id}`,
      };
    }

    return {
      success: false,
      message: `Unable to delete record with id ${params.id}`,
    };
  }

  async updateRecord(db, params) {
    // testing
    // params.updates = [
    //   { field: 'first_name', value: 'zombified' },
    //   { field: 'last_name', value: 'grumpy' },
    // ];

    const validationErrors = await validateUpdates(this.schema, params.updates);

    if (validationErrors.length > 0) {
      return {
        success: false,
        message: `Unable to update record due to ${validationErrors}`,
      };
    }

    // need to create string of form field1 = value1, field2 = value2
    // difficulty: default escaping only occurs on values, not fields
    let updateString = params.updates.reduce(
      (prev, curr) => `${prev}${curr.field} = ?, `,
      '',
    );
    // remove trailing comma
    updateString = updateString.slice(0, -2);
    const values = params.updates.map((update) => update.value);

    let rows;

    try {
      [rows] = await db.execute(
        `UPDATE ${this.name} SET ${updateString} WHERE id = ?;`,
        [...values, params.id],
      );
    } catch (err) {
      return { success: false, message: `updateRecord failed: ${err.message}` };
    }

    if (rows && rows.affectedRows > 0) {
      return { success: true, data: rows };
    }

    return {
      success: false,
      message: `Unable to update record with id ${params.id}`,
    };
  }
};
