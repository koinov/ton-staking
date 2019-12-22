import React from "react";

export default function Gram(props){
    let intValue = 0;
    let measure = "gr";
    let precision = 1000000000;
    let rounding = 3;

    if(!props.amount){
        return(<span>{0} <small>{measure}</small></span>)
    }

    if(props.float){
        return <span>{parseFloat(props.amount).toFixed(rounding).toString()} <small>gr</small></span>
    }else if(props.hex){
        intValue = parseInt(props.amount, 16)
    }else{
        intValue = parseInt(props.amount)
    }


    if(intValue < 1000000000){
        precision = 1000000;
        measure = "mg";
    }
    
    if(intValue < 1000000) {
        precision = 1;
        measure = "ng";
        rounding = 0
    }


    return(
        <span>{(intValue / precision).toFixed(rounding).toString()} <small>{measure}</small></span>
    )
}

export function toNanoGrams(amount, measure){
    if( measure == "mg"){
        return parseInt(amount*1000000);
    }
    if( measure == "gr"){
        return parseInt(amount*1000000000);
    }
    if( measure == "ng"){
        return parseInt(amount);
    }
    
}