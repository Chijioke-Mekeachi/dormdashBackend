const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");
const bcrypt = require("bcryptjs");

class SqliteAuto {
  constructor() {
    this.db = null;
  }

  _run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve(this);
      });
    });
  }

  _all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  _get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  init(dbFile, auth = true) {
    if (!fs.existsSync(dbFile)) fs.writeFileSync(dbFile, "");
    this.db = new sqlite3.Database(dbFile, (err) => {
      if (err) console.error("❌ Database init error:", err.message);
      else console.log(`✅ Database '${dbFile}' initialized`);

      if (auth) {
        this.db.run(
          `CREATE TABLE IF NOT EXISTS userAuth (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE,
            password TEXT
          )`,
          (err) => {
            if (err) console.error("❌ Table create error:", err.message);
            else console.log("✅ userAuth table ready");
          }
        );
      }
    });
    return this;
  }

  async authSignUp(email, password) {
    if (!email || !password) throw new Error("Email and password are required");
    const hashed = await bcrypt.hash(password, 10);
    await this.insert("userAuth", { email, password: hashed });
    console.log(`✅ Registered '${email}'`);
  }

  async authLogin({ email, password }) {
    const user = await this._get(`SELECT * FROM userAuth WHERE email = ?`, [
      email,
    ]);
    if (!user) throw new Error("User not found");

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new Error("Invalid password");

    return user;
  }

  async updatePassword({ email, newPassword, oldPassword }) {
    // ❌ Fixed condition: previously always threw error even with correct args
    if (!email || !newPassword || !oldPassword) {
      throw new Error("3 arguments required: email, newPassword, oldPassword");
    }

    // Ensure old password is valid
    await this.authLogin({ email, password: oldPassword });

    // Hash new password before updating
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await this.update("userAuth", { password: hashedNewPassword }, { email });
    console.log(`✅ Password updated for '${email}'`);
  }

  async createTable(tableName, columns = []) {
    const schema = columns
      .map((col) => {
        let [name, type] = col.split(":");
        name = name.trim();
        type = type ? type.trim().toLowerCase() : "text";

        switch (type) {
          case "int":
          case "integer":
          case "num":
          case "number":
            type = "INTEGER";
            break;
          case "float":
          case "double":
          case "real":
            type = "REAL";
            break;
          case "arr":
          case "array":
          case "intarr":
          case "numarr":
          case "numberarr":
          case "textarr":
            type = "TEXT"; // store arrays as JSON text
            break;
          default:
            type = "TEXT";
            break;
        }

        return `${name} ${type}`;
      })
      .join(", ");

    await this._run(
      `CREATE TABLE IF NOT EXISTS ${tableName} (id INTEGER PRIMARY KEY AUTOINCREMENT, ${schema})`
    );

    console.log(`✅ Table '${tableName}' created with schema: ${schema}`);
  }

  insert(tableName, data = {}) {
    const keys = Object.keys(data);
    const placeholders = keys.map(() => "?").join(",");
    const values = Object.values(data);

    const sql = `INSERT INTO ${tableName} (${keys
      .map((k) => `"${k}"`)
      .join(",")}) VALUES (${placeholders})`;
    console.log("Executing SQL:", sql, values); // for debugging
    return this._run(sql, values);
  }

  // Compatibility: readAll is the underlying implementation. Expose getAll as routes expect it.
  readAll(tableName) {
    return this._all(`SELECT * FROM ${tableName}`);
  }

  // Alias expected by routes
  getAll(tableName) {
    return this.readAll(tableName);
  }

  // findBy returns a single row (uses _get) — routes expect a single object when looking up by unique column
  findBy(tableName, column, value) {
    return this._get(`SELECT * FROM ${tableName} WHERE ${column} = ?`, [value]);
  }

  // findAllBy returns an array of rows matching a column
  findAllBy(tableName, column, value) {
    return this._all(`SELECT * FROM ${tableName} WHERE ${column} = ?`, [value]);
  }

  // Update supports either: update(table, updates, { col: val }) OR update(table, updates, colName, value)
  update(tableName, updates = {}, where = {}, whereValue) {
    const setClause = Object.keys(updates)
      .map((k) => `${k} = ?`)
      .join(", ");

    let whereClause = "";
    let values = [];

    if (typeof where === "string") {
      // called as (table, updates, column, value)
      whereClause = `${where} = ?`;
      values = [...Object.values(updates), whereValue];
    } else {
      // called as (table, updates, { col: val, ... })
      whereClause = Object.keys(where)
        .map((k) => `${k} = ?`)
        .join(" AND ");
      values = [...Object.values(updates), ...Object.values(where)];
    }

    return this._run(
      `UPDATE ${tableName} SET ${setClause} WHERE ${whereClause}`,
      values
    );
  }
  // Count rows matching 2 conditions
async countWhere(table, emailField, emailValue, statusField, statusValue) {
  const sql = `SELECT COUNT(*) as count FROM ${table} WHERE ${emailField} = ? AND ${statusField} = ?`;
  const result = await this._get(sql, [emailValue, statusValue]);
  return result ? result.count : 0;
}

// Count rows matching a single condition
async countWhereSimple(table, field, value) {
  const sql = `SELECT COUNT(*) as count FROM ${table} WHERE ${field} = ?`;
  const result = await this._get(sql, [value]);
  return result ? result.count : 0;
}

// Find all by field
async findAllBy(table, field, value) {
  const sql = `SELECT * FROM ${table} WHERE ${field} = ?`;
  return await this._all(sql, [value]);
}

  // Delete supports either: delete(table, { col: val }) OR delete(table, colName, value)
  delete(tableName, where = {}, value) {
    let whereClause = "";
    let values = [];

    if (typeof where === "string") {
      whereClause = `${where} = ?`;
      values = [value];
    } else {
      whereClause = Object.keys(where)
        .map((k) => `${k} = ?`)
        .join(" AND ");
      values = Object.values(where);
    }

    return this._run(`DELETE FROM ${tableName} WHERE ${whereClause}`, values);
  }
}

module.exports = new SqliteAuto();
