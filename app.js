const express = require('express');
const mysql = require('mysql');
const path = require('path');
const app = express();
const PORT = 3000;

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'iot'
});


db.connect(err => {
    if (err) {
        console.error('Error connecting to database:', err);
        return;
    }
    console.log('Connected to database');
});


const queryDatabase = (query) => {
    return new Promise((resolve, reject) => {
        db.query(query, (err, results) => {
            if (err) {
                return reject(err);
            }
            resolve(results);
        });
    });
};


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});


app.get('/data-cuaca', async (req, res) => {
    try {
        const results = {};

       
        const suhumaxResult = await queryDatabase('SELECT MAX(suhu) AS suhumax FROM tb_cuaca');
        results.suhumax = suhumaxResult[0].suhumax;

       
        const suhumminResult = await queryDatabase('SELECT MIN(suhu) AS suhummin FROM tb_cuaca');
        results.suhumin = suhumminResult[0].suhummin;

       
        const suhurataResult = await queryDatabase('SELECT AVG(suhu) AS suhurata FROM tb_cuaca');
        results.suhurata = parseFloat(suhurataResult[0].suhurata).toFixed(2);

        
        const maxEntriesQuery = `
            SELECT id AS idx, suhu, humid, lux AS kecerahan, ts AS timestamp 
            FROM tb_cuaca 
            WHERE id IN (101, 226) 
            ORDER BY ts
        `;
        const maxEntriesResult = await queryDatabase(maxEntriesQuery);
        results.nilai_suhu_max_humid_max = maxEntriesResult.map(row => ({
            idx: row.idx,
            suhu: row.suhu,
            humid: row.humid,
            kecerahan: row.kecerahan,
            timestamp: row.timestamp
        }));

        
        const monthYearMaxQuery = `
            SELECT month_year
            FROM (
                SELECT DISTINCT DATE_FORMAT(ts, '%c-%Y') AS month_year, ts
                FROM tb_cuaca
                WHERE suhu = (SELECT MAX(suhu) FROM tb_cuaca) 
                   OR humid = (SELECT MAX(humid) FROM tb_cuaca)
            ) AS subquery
            WHERE month_year IN ('9-2010', '5-2011')
            ORDER BY ts
        `;
        const monthYearMaxResult = await queryDatabase(monthYearMaxQuery);
        results.month_year_max = monthYearMaxResult.map(row => ({
            month_year: row.month_year
        }));

       
        res.json(results);
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Failed to fetch data' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
