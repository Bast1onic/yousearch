import pool from './database.mjs';
const tableName = 'searchLog'

export const getAllQueries = async () => {
    const [rows] = await pool.query(`SELECT * FROM ${tableName}`);
    return rows;
};

export const getQueryById = async (id) => {
    const [rows] = await pool.query(`SELECT * FROM ${tableName} WHERE id = ${id}`);
    return rows[0];
};

export const addQuery = async (query) => {
    const initTime = new Date().toISOString().slice(0, 19).replace('T', ' ');; // log time of query and convert for SQL compat
    const [result] = await pool.query(
        `INSERT INTO ${tableName} (query, initTime) VALUES (?, ?)`,
        [query.toLowerCase(), initTime]
    );
    return result.insertId;
};

