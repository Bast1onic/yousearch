import {addQuery, findQueryByName} from '../models/queryModel.mjs';
import { getResultsByQueryId } from '../models/resultsModel.mjs';
import { scrapeEngine } from './scraper.mjs';

export const returnResults = async (query) => {
    let qId = findQueryByName(query)
    if(qId === null){
        qId = addQuery(query);
        //scrape results from internet, then add to db before returning
        const engineResults = await scrapeEngine(query);
    }
    return getResultsByQueryId(qId);
};