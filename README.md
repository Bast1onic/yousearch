# YouSearch
Final project for CCNY DSE I2400

# Dependencies
* NodeJS
* MySQL

# Setup
1. Create a `.env` file as follows:
```
PORT=3100
DB_HOST=localhost
DB_USER=searchScraperApp
DB_PASSWORD=
DB_NAME=searchScraper
```
The password can be whatever you want.

2. Run the following commands in MySQL to create the tables (make sure to replace password with the password specified above before running):
```
CREATE SCHEMA searchScraper;

CREATE TABLE `searchScraper`.`searchLog` (
    id INT AUTO_INCREMENT PRIMARY KEY,
    initTime DATETIME NOT NULL,
    searchPhrase VARCHAR(255) NOT NULL,
    numResults INT NOT NULL DEFAULT 0 CHECK (numResults >= 0),
    elapsedTime FLOAT NOT NULL DEFAULT 0 CHECK (elapsedTime >= 0)
);

CREATE TABLE `searchScraper`.`searchResults` (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL DEFAULT 'Placeholder',
    url VARCHAR(2083) NOT NULL, -- Using a large VARCHAR to accommodate URLs
    termCount INT NOT NULL DEFAULT 0 CHECK (termCount >= 0),
    searchLog_id INT NOT NULL,
    FOREIGN KEY (searchLog_id) REFERENCES searchLog(id) ON DELETE CASCADE
);

CREATE USER 'searchScraperApp'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON searchScraper.* TO 'searchScraperApp'@'localhost';
```

3. Run the following commands:
* `git clone https://github.com/Bast1onic/yousearch.git`
* `npm i`

4. To start the app, run `npm start`. To stop it, do Ctrl+C. You can go to the url displayed in the command line in your browser to view the app.