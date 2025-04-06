import pool from './database.mjs';
const tableName = 'searchResults'

export const getResultsByQueryId = async (id) => {
    const [rows] = await pool.query(`SELECT * FROM ${tableName} WHERE searchLog_id = ${id}`);
    return rows;
};

export const addResults = async (resultsList, sEngine, queryId) => {
    const valsToInsert = resultsList.map(ele => `('${ele.url}', 0, ${sEngine}, ${queryId})`).join(',\n')
    const [result] = await pool.query(
        `INSERT INTO ${tableName} (url, termCount, source, searchLog_id)
        VALUES ${valsToInsert};`,
    );
    return result.insertId;
};

