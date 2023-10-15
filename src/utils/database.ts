import sqlite3 from 'sqlite3';
import { config } from "./config";

class Database {
  private db: sqlite3.Database;

  constructor() {
    this.db = new sqlite3.Database(config.data_path + config.database_file_name);
    this.createTable();
  }

  private createTable() {
    this.db.run(`CREATE TABLE IF NOT EXISTS devices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device TEXT,
      name TEXT,
      version TEXT,
      android TEXT,
      status TEXT,
      selinux TEXT,
      kernelsu TEXT,
      date TEXT,
      sourcforge_url TEXT,
      changelog TEXT,
      note TEXT
    )`);
  }

  public insertData(item: any) {
    const selectStmt = this.db.prepare('SELECT * FROM devices WHERE device = ? AND version = ?');
    selectStmt.get(item.device, item.version, (err: any, row: any) => {
      if (err) {
        console.error(err);
        return;
      }

      if (row) {
        console.log('Data already exists in the database. Skipped insertion.');
      } else {
        const insertStmt = this.db.prepare(`INSERT INTO devices (
          device, name, version, android, status, selinux, kernelsu, date, sourcforge_url, changelog, note
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

        insertStmt.run(
          item.device,
          item.name,
          item.version,
          item.android,
          item.status,
          item.selinux,
          item.kernelsu,
          item.data,
          item.sourcforge_url,
          JSON.stringify(item.changelog),
          JSON.stringify(item.note)
        );

        insertStmt.finalize();
        console.log('Data inserted into the database.');
      }
    });
    selectStmt.finalize();
  }

  public getData(device?: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      let query = 'SELECT * FROM devices';
      let params: any[] = [];
  
      if (device) {
        query += ' WHERE device = ?';
        params.push(device);
      }
  
      query += ' ORDER BY date DESC';
  
      this.db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  public close() {
    this.db.close();
  }
}

export default new Database();
