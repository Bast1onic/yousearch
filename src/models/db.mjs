import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

let pool;

try {
    pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'my_database',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
    });

    const testConnection = async () => {
        try {
            const connection = await pool.getConnection();
            console.log('Database connection established successfully!');
            connection.release(); // Release the connection back to the pool
        } catch (error) {
            console.error('Database connection failed: ', error.message);
        }
    };

    testConnection();
} catch (error) {
    console.error('Error creating the database pool: ', error.message);
}

export default pool;