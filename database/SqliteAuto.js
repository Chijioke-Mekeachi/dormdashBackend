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

  /**
   * Initialize database
   * Automatically switches to :memory: when running in serverless or read-only environments
   */
  init(dbFile = "dormDash.db", auth = true) {
    let dbPath = dbFile;

    // ✅ Detect read-only environments (Vercel, etc.)
    try {
      fs.accessSync(".", fs.constants.W_OK);
    } catch {
      console.warn("⚠️ Read-only environment detected — using in-memory SQLite");
      dbPath = ":memory:";
    }

    // ✅ Only write the file locally (if not using :memory:)
    if (dbPath !== ":memory:" && !fs.existsSync(dbPath)) {
      fs.writeFileSync(dbPath, "");
    }

    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) console.error("❌ Database init error:", err.message);
      else console.log(`✅ Database initialized (${dbPath === ":memory:" ? "in-memory" : dbPath})`);

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
    const user = await this._get(`SELECT * FROM userAuth WHERE email = ?`, [email]);
    if (!user) throw new Error("User not found");

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new Error("Invalid password");

    return user;
  }

  async updatePassword({ email, newPassword, oldPassword }) {
    if (!email || !newPassword || !oldPassword) {
      throw new Error("3 arguments required: email, newPassword, oldPassword");
    }

    await this.authLogin({ email, password: oldPassword });

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
            type = "TEXT";
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

    const sql = `INSERT INTO ${tableName} (${keys.map((k) => `"${k}"`).join(",")}) VALUES (${placeholders})`;
    console.log("Executing SQL:", sql, values);
    return this._run(sql, values);
  }

  readAll(tableName) {
    return this._all(`SELECT * FROM ${tableName}`);
  }

  getAll(tableName) {
    return this.readAll(tableName);
  }

  findBy(tableName, column, value) {
    return this._get(`SELECT * FROM ${tableName} WHERE ${column} = ?`, [value]);
  }

  findAllBy(tableName, column, value) {
    return this._all(`SELECT * FROM ${tableName} WHERE ${column} = ?`, [value]);
  }

  update(tableName, updates = {}, where = {}, whereValue) {
    const setClause = Object.keys(updates).map((k) => `${k} = ?`).join(", ");
    let whereClause = "";
    let values = [];

    if (typeof where === "string") {
      whereClause = `${where} = ?`;
      values = [...Object.values(updates), whereValue];
    } else {
      whereClause = Object.keys(where).map((k) => `${k} = ?`).join(" AND ");
      values = [...Object.values(updates), ...Object.values(where)];
    }

    return this._run(`UPDATE ${tableName} SET ${setClause} WHERE ${whereClause}`, values);
  }

  async countWhere(table, emailField, emailValue, statusField, statusValue) {
    const sql = `SELECT COUNT(*) as count FROM ${table} WHERE ${emailField} = ? AND ${statusField} = ?`;
    const result = await this._get(sql, [emailValue, statusValue]);
    return result ? result.count : 0;
  }

  async countWhereSimple(table, field, value) {
    const sql = `SELECT COUNT(*) as count FROM ${table} WHERE ${field} = ?`;
    const result = await this._get(sql, [value]);
    return result ? result.count : 0;
  }

  async findAllBy(table, field, value) {
    const sql = `SELECT * FROM ${table} WHERE ${field} = ?`;
    return await this._all(sql, [value]);
  }

  delete(tableName, where = {}, value) {
    let whereClause = "";
    let values = [];

    if (typeof where === "string") {
      whereClause = `${where} = ?`;
      values = [value];
    } else {
      whereClause = Object.keys(where).map((k) => `${k} = ?`).join(" AND ");
      values = Object.values(where);
    }

    return this._run(`DELETE FROM ${tableName} WHERE ${whereClause}`, values);
  }
}

module.exports = new SqliteAuto();
