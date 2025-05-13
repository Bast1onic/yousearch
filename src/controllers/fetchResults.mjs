import {addQuery, findQueryByName} from '../models/queryModel.mjs';
import { addResults, getResultsByQueryId } from '../models/resultsModel.mjs';
import { scrapeEngine } from './scraper.mjs';
import { rankUrls } from './scrapeSite.mjs';

const removeDuplicates = (arr) => {
    const seen = new Set();
    let dupeCount = 0;
    const toRet = arr.filter(obj => {
        if (seen.has(obj.url)) {
            dupeCount = dupeCount + 1;
            return false;
        }
        seen.add(obj.url);
        return true;
    });
    return [toRet, dupeCount];
};


export const returnResults = async (query) => {
    let qId = await findQueryByName(query);
    if(qId === null){
        qId = await addQuery(query);
        //scrape results from internet, then add to db before returning
        let engineResults = await scrapeEngine(query);
        let dupeCt = 0
        const remResults = removeDuplicates(engineResults);
        [engineResults, dupeCt] = remResults;
        engineResults.forEach(ele => (ele.termCount = 0));
        engineResults = await rankUrls(engineResults, query.split(' '));
        await addResults(engineResults, qId);
    }
    
    return await getResultsByQueryId(qId);
};