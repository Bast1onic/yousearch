import pool from './db.mjs';
const tableName = 'searchResults'

export const getResultsByQueryId = async (id) => {
    const [rows] = await pool.query(`SELECT * FROM ${tableName} WHERE searchLog_id = ${id} ORDER BY termCount DESC`);
    return rows;
};

export const addResults = async (resultsList, queryId) => {
    console.log("Adding results");
    const values = resultsList.map(ele => [ele.url, ele.title, ele.description, ele.termCount, queryId]); // Use array format for parameterized queries
    console.log(values[0]);
    const query = `INSERT INTO ${tableName} (url, title, description, termCount, searchLog_id) VALUES ?`;

    try {
        const [result] = await pool.query(query, [values]); // Pass values as a parameterized array
        return result.insertId;
    } catch (error) {
        console.error("Error inserting results:", error);
        throw error;
    }
};

