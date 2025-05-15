import pool from "./db.mjs";

// Method to fetch all rows from adCounts
export async function getAllAdCounts() {
    const [rows] = await pool.query('SELECT * FROM adCounts');
    return rows;
}

// Method to fetch a specific row by searchId
export async function getAdCountById(searchId) {
    const [rows] = await pool.query('SELECT * FROM adCounts WHERE searchId = ?', [searchId]);
    return rows.length ? rows[0] : null;
}

// Method to insert a new row into adCounts
export async function insertAdCount(searchId, ddgAds, bingAds, yahooAds, googleAds, numDDG, numBing, numYahoo, numGoogle) {
    const query = `
        INSERT INTO adCounts (searchId, ddgAds, bingAds, yahooAds, googleAds, numDDG, numBing, numYahoo, numGoogle)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.query(query, [searchId, ddgAds, bingAds, yahooAds, googleAds, numDDG, numBing, numYahoo, numGoogle]);
    return result.insertId;
}

// Method to update an existing row in adCounts
export async function updateAdCount(searchId, ddgAds, bingAds, yahooAds, googleAds, numDDG, numBing, numYahoo, numGoogle) {
    const query = `
        UPDATE adCounts 
        SET ddgAds = ?, bingAds = ?, yahooAds = ?, googleAds = ?, numDDG = ?, numBing = ?, numYahoo = ?, numGoogle = ?
        WHERE searchId = ?
    `;
    const [result] = await pool.query(query, [ddgAds, bingAds, yahooAds, googleAds, numDDG, numBing, numYahoo, numGoogle, searchId]);
    return result.affectedRows;
}

// Method to delete a row by searchId
export async function deleteAdCount(searchId) {
    const query = 'DELETE FROM adCounts WHERE searchId = ?';
    const [result] = await pool.query(query, [searchId]);
    return result.affectedRows;
}