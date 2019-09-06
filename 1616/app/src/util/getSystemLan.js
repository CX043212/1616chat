//国际化语言
var config = require('../../../config');
export default function getSystemLan(){
    let url=config.urls.appUrl+"language.json";
    // let url="../../language.json";
    return fetch(url) 
    .then(response=>response.json())
    .then(data=>{
       return data;
    })
    .catch(e=>console.log('error',e));
}