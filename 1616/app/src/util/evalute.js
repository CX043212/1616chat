
import axios from "axios";
import qs from "qs";

const http = axios.create({
    baseURL:"http://154.8.222.129",//域名地址
    timeout:10000
})
export default http;

// //请求拦截
// http.interceptors.request.use((config)=>{
//     // if(method === "post"){
//     //     config.data = qs.stringify(config.data);
//     // }
//     return config;
// },(err)=>{
//     return Promise.reject(err);
// })

// //响应拦截
// http.interceptors.response.use((res)=>{
//     return res.data;
// },(err)=>{
//     return Promise.reject(err);
// })

// export default (method,url,data=null)=>{
//     if(method == "post"){
//         return http.post(url,data);//返回值promise
//     }else if(method == "get"){
//         return http.get(url,{params:data});
//     }else{
//         return;
//     }
// }