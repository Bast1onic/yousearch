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
PER_ENGINE=250
PAGES_PER=25
```
The password can be whatever you want. `PER_ENGINE` controls how many results are fetched per engine, and `PAGES_PER` controls how many pages for an engine are scraped. This assumes that there are 10 results per page, so this should be 1/10 of `PER_ENGINE`.

2. Run the following commands in MySQL to create the tables (make sure to replace password with the password specified above before running):
```
CREATE SCHEMA searchScraper;

CREATE TABLE `searchScraper`.`searchLog` (
    id INT AUTO_INCREMENT PRIMARY KEY,
    initTime DATETIME NOT NULL,
    searchPhrase VARCHAR(255) NOT NULL,
    numResults INT NOT NULL DEFAULT 0 CHECK (numResults >= 0),
    dupes INT NOT NULL DEFAULT 0 CHECK (dupes >= 0)
);

CREATE TABLE `searchScraper`.`searchResults` (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL DEFAULT 'Placeholder',
    url VARCHAR(2083) NOT NULL, -- Using a large VARCHAR to accommodate URLs
    description VARCHAR(2083) NOT NULL DEFAULT '',
    termCount INT NOT NULL DEFAULT 0 CHECK (termCount >= 0),
    engine VARCHAR(255) DEFAULT '',
    searchLog_id INT NOT NULL,
    FOREIGN KEY (searchLog_id) REFERENCES searchLog(id) ON DELETE CASCADE
);

CREATE TABLE `searchScraper`.`adCounts` (
    searchId INT PRIMARY KEY,
    ddgAds INT NOT NULL DEFAULT 0 CHECK (ddgAds >= 0),
    bingAds INT NOT NULL DEFAULT 0 CHECK (bingAds >= 0),
    yahooAds INT NOT NULL DEFAULT 0 CHECK (yahooAds >= 0),
    googleAds INT NOT NULL DEFAULT 0 CHECK (googleAds >= 0),
    numDDG INT NOT NULL DEFAULT 0 CHECK (numDDG >= 0),
    numBing INT NOT NULL DEFAULT 0 CHECK (numBing >= 0),
    numYahoo INT NOT NULL DEFAULT 0 CHECK (numYahoo >= 0),
    numGoogle INT NOT NULL DEFAULT 0 CHECK (numGoogle >= 0),
    FOREIGN KEY (searchId) REFERENCES `searchScraper`.`searchLog`(id) ON DELETE CASCADE
);

CREATE USER 'searchScraperApp'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON searchScraper.* TO 'searchScraperApp'@'localhost';
```

3. Run the following commands:
* `git clone https://github.com/Bast1onic/yousearch.git`
* `npm i`

4. To start the app, run `npm start`. To stop it, do Ctrl+C. You can go to the url displayed in the command line in your browser to view the app.