import pool from './db.mjs';
const tableName = 'searchLog'

export const getAllQueries = async () => {
    const [rows] = await pool.query(`SELECT * FROM ${tableName}`);
    return rows;
};

export const getQueryById = async (id) => {
    const [rows] = await pool.query(`SELECT * FROM ${tableName} WHERE id = ?`, [id]);
    return rows[0];
};

export const addQuery = async (query) => {
    const initTime = new Date().toISOString().slice(0, 19).replace('T', ' ');; // log time of query and convert for SQL compat
    const [result] = await pool.query(
        `INSERT INTO ${tableName} (searchPhrase, initTime, numResults) VALUES (?, ?, ?)`,
        [query, initTime, 0]
    );
    return result.insertId;
};

export const findQueryByName = async (query) => {
    const [rows] = await pool.query(`SELECT * FROM ${tableName} WHERE searchPhrase = ?`, [query.toLowerCase()]);
    return rows.length > 0 ? rows[0].id : null;
};

export const updateQueryById = async (id, total, ddg, bing, yahoo, google) => {
    const [rows] = await pool.query(`SELECT * FROM ${tableName} WHERE id = ?`, [id]);

    if (rows.length === 0) {
        return null; // No row found
    }

    await pool.query(
        `UPDATE ${tableName} SET numResults = ?, ddgAds = ?, bingAds = ?, yahooAds = ?, googleAds = ? WHERE id = ?`,
        [total, ddg, bing, yahoo, google, id]
    );

    return true; // Update success
};