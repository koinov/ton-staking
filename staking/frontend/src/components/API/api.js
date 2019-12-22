import { resolveProjectReferencePath } from 'typescript';

// "{\"jsonrpc\":\"2.0\",\"method\":\"subscriber\",\"id\":1,\"params\": {\"address\":\"EQDbquWDvZ+bRNyROGf6SrMsUMtnVLVXDVmMMztF9siuganM\"}}

const axios = require('axios').default;
class api {
    //_url = "http://localhost:6310";
    _url = "/api";
    
    constructor(url){
        if(url){
            this._url = url;
        }
    }

    request = async (method, params) => {
        const response = await axios.post(this._url, {jsonrpc: "2.0", id:1,  method, params});
        console.log(response);
        return response;
    }


    getState = async () => {
        const response = await this.request("pool_state", {});
        console.log("API getState", response);
        return response.data.result;
    }

    getPerformance = async () => {
        const response = await this.request("performance", {});
        console.log("API getPerformance", response);
        return response.data.result.performance;
    }

    getNominators = async () => {
        const response = await this.request("nominators", {});
        console.log("API getNominators", response);
        return response.data.result.nominators;
    }

    getSubscriber = async (address) => {
        const response = await this.request("subscriber", {address:address});
        console.log("API getSubscriber", response);
        return response.data.result.subscriptions;
    }


}

const TONAPI = new api();

export default TONAPI;