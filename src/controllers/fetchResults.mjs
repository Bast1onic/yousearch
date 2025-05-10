import {addQuery, findQueryByName} from '../models/queryModel.mjs';
import { addResults, getResultsByQueryId } from '../models/resultsModel.mjs';
import { scrapeEngine } from './scraper.mjs';

export const returnResults = async (query) => {
    let qId = await findQueryByName(query);
    console.log(`ID was: ${qId}`);
    if(qId === null){
        qId = await addQuery(query);
        //scrape results from internet, then add to db before returning
        const engineResults = await scrapeEngine(query);
        await addResults(engineResults, qId);
        console.log(`ID is now: ${qId}`);
    }
    
    return await getResultsByQueryId(qId);
};