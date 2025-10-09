const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");
const bcrypt = require("bcryptjs");
const { error } = require("console");

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
    const user = await this._get(`SELECT * FROM userAuth WHERE email = ?`, [email]);
    if (!user) {
        throw new Error("User not found");
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new Error("Invalid password");
    return user;
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

        // For array types — store as TEXT (JSON string) but remember the subtype
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
    return this._run(`INSERT INTO ${tableName} (${keys.join(",")}) VALUES (${placeholders})`, values);
  }

  readAll(tableName) {
    return this._all(`SELECT * FROM ${tableName}`);
  }

  findBy(tableName, column, value) {
    return this._all(`SELECT * FROM ${tableName} WHERE ${column} = ?`, [value]);
  }

  update(tableName, updates = {}, where = {}) {
    const setClause = Object.keys(updates).map((k) => `${k} = ?`).join(", ");
    const whereClause = Object.keys(where).map((k) => `${k} = ?`).join(" AND ");
    const values = [...Object.values(updates), ...Object.values(where)];
    return this._run(`UPDATE ${tableName} SET ${setClause} WHERE ${whereClause}`, values);
  }

  delete(tableName, where = {}) {
    const whereClause = Object.keys(where).map((k) => `${k} = ?`).join(" AND ");
    const values = Object.values(where);
    return this._run(`DELETE FROM ${tableName} WHERE ${whereClause}`, values);
  }
}

module.exports = new SqliteAuto();
