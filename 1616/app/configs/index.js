module.exports = Object.assign({}, require('./base'), require('./dev'))
// module.exports = {
// dev: {
//   assetsSubDirectory: 'static',
//   assetsPublicPath: '/',
//     proxy: {
//       "/api": {
//         target: "http://154.8.222.129",
//         pathRewrite: {"^/api" : ""}
//       },
//       "apis":{
//         target: "http://detail.1818lao.com/leading",
//         pathRewrite: {"^/apis" : ""}
//       }	
//  }
// }
// }