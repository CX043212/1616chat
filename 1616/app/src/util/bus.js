let eventList = {};


const $on=(eventName,cb)=>{

    if(!eventList[eventName]){
        eventList[eventName] = [];
    }
    eventList[eventName].push(cb)
}




const $emit = (eventName,params)=>{

    if(eventList[eventName]){
        let arr = eventList[eventName];
        arr.map((cb)=>{
            cb(params)
        })
    }
}


const $off = (eventName,cb)=>{
    if(eventList[eventName]){
        if(cb){
            let index = eventList[eventName].indexOf(cb);
            eventList[eventName].splice(index,1);

        }else{
            eventList[eventName].length = 0;
            
        }
    }
}