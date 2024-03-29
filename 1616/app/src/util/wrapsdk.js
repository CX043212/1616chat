var SparkMD5 = require('../webim/spark-md5.js'); //获取MD5对象
var configs = require('../../../config'); // 应用配置
//var getThum=require('./getThum.js');
define(function (require, exports, module) {
    var webim = require('../webim/webim.js');
    var store = require('../store');
    var electron = require('electron');
    let fetch = require('./fetch')
    var getThum = require('./getThum.js');
    var ipc = electron.ipcRenderer;
    var userSig,
        //登录
        loginInfo = {
            sdkAppID: configs.webim.sdkAppID,//  正式1400071504   1400065243 - String, 用户标识接入SDK的应用ID，必填
            identifier: '',//   - String, 用户帐号,必须是字符串类型，必填
            accountType: configs.webim.accountType,// 正式23251 22062- int, 账号类型，必填
            identifierNick: '',//   - String, 用户昵称，选填
            userSig: null,//'eJxlj1FPgzAUhd-5FYRXjbaUjtXEB0NwayYuCzoTX0iFMi4K66DMbsb-7oYkknhfvy-n3PNl2bbtPD3EVyJNt12tE31Q0rFvbAc5l39QKcgSoRPSZP*gNAoamYhcy6aHmFLqIjR2IJO1hhwG40wxJQhP0kLokddm70lf9hvknTzKkO*NFdj0MAqfA74KYoE-F2atp6ZDd*WjIW8XC3FdZhOCjdhVx-Uxf6V4yaFc8U20v4*8A3*RVGm3nQdpOCumVTknmIH5WOZBx3esLmZ*HN6OKjVUcliGqcd8ysYP7WXTwrYehp0Ul6DzOda39QOx8F7J',//      - String, 鉴权Token，必须是字符串类型，必填
            //userSig:'eJxlj11PgzAARd-5FYRXjbTQdtZkD0yZYYJzUebmS4NQtmL4WCkbzvjf3ZBEEu-rObk390vTdd148Z*vojgum0Ix9VlxQ7-RDWBc-sGqEgmLFLNl8g-ythKSsyhVXHYQYowtAIaOSHihRCp640wtSAAk8TZSA69OPlg39luETh6mYISGith0MHAXt94dntR5Ox*VCXWPF7tpaO6mdt3Qp8W95WbmW9tIe7Y*OGTrOcIJZuZkw32JHp1lRkNiPoDVcU5X2Tvah06*TF*9a38dwKw8jMeDSSVy3j*DmBCIkD2gey5rURb9sZNi2eAcQ-vWfgAbl12B',//      - String, 鉴权Token，必须是字符串类型，必填
            //userSig:userSig,//      - String, 鉴权Token，必须是字符串类型，必填
            headurl: ''
        }
        , totalCount = 200
        , loginoptions = {
            isAccessFormalEnv: true,
            isLogOn: false
        }
        , reqMsgCount = 15 //每次请求的历史消息条数
        , getPrePageC2CHistroyMsgInfoMap = {} //保留下一次拉取好友历史消息的信息
        , selfInfo = {},//自己的用户信息,用来设置昵称和头像等信息
        friendHeadUrl = '/images/1.jpg',
        selType = webim.SESSION_TYPE.C2C,  //webim.SESSION_TYPE.C2C-私聊   webim.SESSION_TYPE.GROUP-群聊
        selSess = null,
        images = null,
        offLine = {},
        arrEntities = {'lt': '<', 'gt': '>', 'amp;nbsp': ' ', 'nbsp': ' ', 'amp': '&', 'quot': '"'};

    offLine.title = "离线通知";
    offLine.info = "连接断开 点击重新登录";

    var mI18nObj = {};
    var curLan = '';
    var times;
    //连接回调函数
    function _onConnNotify(resp) {
        var info;
        switch (resp.ErrorCode) {
            case webim.CONNECTION_STATUS.ON:
                //console.log('建立连接成功: ' + resp.ErrorInfo);
                ipc.send('on-line', selfInfo.memberName);
                var sefId = "UID" + selfInfo.tbMemberId;
                _getProfilePortrait([sefId],
                    function (resp) {
                        if (resp.UserProfileItem && resp.UserProfileItem.length > 0) {
                            var nick = null, gender = null, allowType = null, imageUrl = null, needset = false;
                            for (var i in resp.UserProfileItem) {
                                var to_account = resp.UserProfileItem[i].To_Account;
                                if (resp.UserProfileItem[i].ProfileItem) { //从未设置过，返回的是undefined
                                    for (var j in resp.UserProfileItem[i].ProfileItem) {
                                        switch (resp.UserProfileItem[i].ProfileItem[j].Tag) {
                                            case 'Tag_Profile_IM_Nick':
                                                nick = resp.UserProfileItem[i].ProfileItem[j].Value;
                                                if (nick != selfInfo.memberName) {
                                                    needset = true;
                                                }
                                                break;
                                            case 'Tag_Profile_IM_Image':
                                                imageUrl = resp.UserProfileItem[i].ProfileItem[j].Value;
                                                if (imageUrl != selfInfo.headImage) {
                                                    needset = true;
                                                }
                                                break;
                                        }
                                    }
                                } else {
                                    needset = true;
                                }
                            }
                            if (needset) {
                                //console.log('need setProfileProtrait==>')
                                _setProfilePortrait(selfInfo);
                            }
                        }
                    },
                    function (err) {
                        console.error(err.ErrorInfo);
                    });
                webim.syncMsgs(_onMsgNotify);
                break;
            case webim.CONNECTION_STATUS.OFF:
                //info = '连接已断开，无法收到新消息，请检查下你的网络是否正常: ' + resp.ErrorInfo;
                info = mI18nObj.$t("message.obj.check_network") + resp.ErrorInfo;
                console.log(info)
                //ipc.send('off-line', {'title': '掉线通知', 'info': info});
                ipc.send('off-line', {'title': mI18nObj.$t("message.obj.notice") , 'info': info});
                break;
            case webim.CONNECTION_STATUS.RECONNECT:
                info = '连接状态恢复正常: ' + resp.ErrorInfo;
                ipc.send('on-line', selfInfo.memberName);
                webim.syncMsgs(_onMsgNotify);
                break;
            default:
                console.error('未知连接状态: =' + resp.ErrorInfo)
                break;
        }
    }

    //新消息
    // function _onMsgNotify(newMsgList) {
    //     console.log('newMsgList',newMsgList)
    //     var selToID = store.default.getters.getSelToID;
    //     console.log('selToID==',selToID)
    //     var sess, newMsg, _this = this;
    //     var sessMap = webim.MsgStore.sessMap();
    //     for (var j in newMsgList) {
    //         newMsg = newMsgList[j];
    //         console.log('newMsg=====','newMsg')
    //         selSess = newMsg.getSession();
    //         console.log('selSess=====',selSess);
    //         //消息处理
    //         var msgId = newMsg.getFromAccount();
    //         console.log("msgId",msgId)

    //         var friendInfo;
    //         if (msgId != selToID) {//判断是否为当前聊天的好友
    //             // friendInfo = {
    //             //     'selToID': msgId,
    //             //     'unRead': true
    //             // }
    //              friendInfo = {
    //                 'selToID': selToID,
    //                 'unRead': true
    //             }
    //             store.default.dispatch('update_friend', friendInfo);
    //         } else {
    //             //消息已读上报，以及设置会话自动已读标记
    //             webim.setAutoRead(selSess, true, true);
    //         }
    //         var msgs = [];
    //         //storeMessage(newMsg);
    //         console.log('newMsg====',newMsg);
    //         msgs.push(addMsg(newMsg));
    //         store.default.dispatch('append_msg', {
    //             selToID: msgId,
    //             // selToID:selToID,
    //             msgList: msgs
    //         });
    //         //向主进程发消息  图标闪烁
    //         ipc.send('has-info');
    //         //声音提示
    //         let audio = new Audio();
    //         audio.src=configs.urls.appUrl+'msg.mp3';
    //         console.log('声音提示');
    //         audio.play();
    //     }
    // }
    //新消息
    function _onMsgNotify(newMsgList) {
        console.log('newMsgList',newMsgList)
        var selToID = store.default.getters.getSelToID;
        console.log('selToID==',selToID)
        var sess, newMsg, _this = this;
        var sessMap = webim.MsgStore.sessMap();
        for (var j in newMsgList) {
            newMsg = newMsgList[j];
            console.log('newMsg=====','newMsg')
            selSess = newMsg.getSession();
            console.log('selSess=====',selSess);
            //消息处理
            var msgId = newMsg.getFromAccount();
            console.log("msgId",msgId)

            var friendInfo;
            var self = 'UID'+ selfInfo.tbMemberId;
            if (msgId != selToID) {//判断是否为当前聊天的好友
              friendInfo = {};  
              if(msgId!=self){
                  friendInfo = {
                      'selToID': msgId,
                      'unRead': true
                  }
              }else{
                friendInfo = {
                  'selToID': selToID,
                  'unRead': true
                }
              }
              console.log("--------------_onMsgNotify排序-------------",self);
              store.default.dispatch('update_friend', friendInfo);
            } else {
                console.log("--------------_onMsgNotify置顶-------------");
                //消息已读上报，以及设置会话自动已读标记
                webim.setAutoRead(selSess, true, true);
            }
            var msgs = [];
            //storeMessage(newMsg);
            console.log('newMsg====',newMsg);
            msgs.push(addMsg(newMsg));
            store.default.dispatch('append_msg', {
                selToID: msgId,
                // selToID:selToID,
                msgList: msgs
            });
            //向主进程发消息  图标闪烁
            ipc.send('has-info');
            //声音提示
            let audio = new Audio();
            audio.src=configs.urls.appUrl+'msg.mp3';
            console.log('声音提示');
            audio.play();
        }
    }
    //好友系统通知
    function _onFriendSystemNotifys() {

    }

    //资料系统通知
    function _onProfileSystemNotifys() {

    }

    //C2C系统消息通道
    var _onC2cEventNotifys = {
        "92": onMsgReadedNotify,//消息已读通知
    }

    //消息已读通知
    function onMsgReadedNotify(notify) {
        //console.log(notify,'消息已读通知');
        var sessMap = webim.MsgStore.sessMap()[webim.SESSION_TYPE.C2C + notify.From_Account];
        if (sessMap) {
            var msgs = _.clone(sessMap.msgs());
            var rm_msgs = _.remove(msgs, function (m) {
                return m.time <= notify.LastReadTime
            });
            var unread = sessMap.unread() - rm_msgs.length;
            unread = unread > 0 ? unread : 0;
            //更新sess的未读数
            sessMap.unread(unread);

        }
    }

    //设置用户资料
    function _setProfilePortrait(userInfo) {
        var profile_item = [
            {
                "Tag": "Tag_Profile_IM_Nick",
                "Value": userInfo.memberName
            },
            {
                "Tag": "Tag_Profile_IM_Image",
                "Value": userInfo.headImage
            },
            {
                "Tag": "Tag_Profile_IM_AllowType",
                "Value": "AllowType_Type_AllowAny"
            }
        ];
        var options = {
            'ProfileItem': profile_item
        };

        webim.setProfilePortrait(
            options,
            function (resp) {
                //console.log('setProfilePortrait success')
            },
            function (err) {
                console.error(err.ErrorInfo);
            }
        );
    }

    //获取用户资料
    function _getProfilePortrait(userInfo, cbOk, cbErr) {
        //console.log(userInfo,'userInfo=====>')
        var tag_list = [
            "Tag_Profile_IM_Nick",//昵称
            "Tag_Profile_IM_AllowType",//加好友方式
            "Tag_Profile_IM_Image"//头像
        ];
        var options = {
            'To_Account': userInfo,
            'TagList': tag_list
        };

        webim.getProfilePortrait(
            options, cbOk, cbErr
        );
    }

    //监听事件
    var _onFriendSystemNotifys = {
        "1": onFriendAddNotify, //好友表增加
        //"2": onFriendDeleteNotify, //好友表删除
        //"3": onPendencyAddNotify, //未决增加
        // "4": onPendencyDeleteNotify, //未决删除
        // "5": onBlackListAddNotify, //黑名单增加
        //"6": onBlackListDeleteNotify//黑名单删除
    };
    var listeners = {
        "onConnNotify": _onConnNotify//监听连接状态回调变化事件,必填
        // ,"jsonpCallback": jsonpCallback//IE9(含)以下浏览器用到的jsonp回调函数，
        , "onMsgNotify": _onMsgNotify//监听新消息(私聊，普通群(非直播聊天室)消息，全员推送消息)事件，必填
        //,"onBigGroupMsgNotify": onBigGroupMsgNotify//监听新消息(直播聊天室)事件，直播场景下必填
        //,"onGroupSystemNotifys": onGroupSystemNotifys//监听（多终端同步）群系统消息事件，如果不需要监听，可不填
        //,"onGroupInfoChangeNotify": onGroupInfoChangeNotify//监听群资料变化事件，选填
        , "onFriendSystemNotifys": _onFriendSystemNotifys//监听好友系统通知事件，选填
        , "onProfileSystemNotifys": _onProfileSystemNotifys//监听资料系统（自己或好友）通知事件，选填
        , "onKickedEventCall": _onProfileSystemNotifys//被其他登录实例踢下线
        , "onC2cEventNotifys": _onC2cEventNotifys//监听C2C系统消息通道
    };

    //解析一条消息
    function convertMsgtoHtml(msg) {//解析一条消息
        var html = "", elems, elem, type, content, _this = this;
        elems = msg.getElems();//获取消息包含的元素数组
        for (var i in elems) {
            elem = elems[i];
            type = elem.getType();//获取元素类型
            content = elem.getContent();//获取元素对象
            switch (type) {
                case webim.MSG_ELEMENT_TYPE.TEXT:
                    html += convertTextMsgToHtml(content);
                    break;
                case webim.MSG_ELEMENT_TYPE.FACE:
                    html += convertFaceMsgToHtml(content);
                    break;
                case webim.MSG_ELEMENT_TYPE.IMAGE:
                    html += convertImageMsgToHtml(content);
                    break;
                case webim.MSG_ELEMENT_TYPE.SOUND:
                    //html +=convertSoundMsgToHtml(content);
                    break;
                case webim.MSG_ELEMENT_TYPE.FILE:
                    //html +=_this. convertFileMsgToHtml(content);
                    break;
                case webim.MSG_ELEMENT_TYPE.LOCATION://暂不支持地理位置
                    //html += convertLocationMsgToHtml(content);
                    break;
                case webim.MSG_ELEMENT_TYPE.CUSTOM:
                    html += convertCustomMsgToHtml(content);
                    break;
                case webim.MSG_ELEMENT_TYPE.GROUP_TIP:
                    //html += convertGroupTipMsgToHtml(content);
                    break;
                default:
                    webim.Log.error('未知消息元素类型: elemType=' + type);
                    break;
            }
        }
        return html;
    }

    //解析文本消息
    function convertTextMsgToHtml(content) {//解析文本消息
        return content.getText()
                    .replace(/' '/g, "&nbsp;")
                    .replace(/\n/g, "<br>")
                    .replace(/\t+/gim, function(word){
                        console.log(word.match(/\t/gim));
                        return `<span style="white-space:pre">${word}</span>`;
                    });
    }

    //解析表情消息元素
    function convertFaceMsgToHtml(content) {//解析表情消息元素
        var index = content.getIndex() || 0;
        var data = content.getData();
        var url = null;
        var emotion = webim.Emotions[index];
        if (emotion && emotion[1]) {
            url = emotion[1];
        }
        if (url) {
            return    "<img src='" + url + "' ondragstart='return false;'/>";
        } else {
            return data;
        }
    }

    //解析图片消息元素
    function convertImageMsgToHtml(content) {//解析图片消息元素
        var smallImage = content.getImage(webim.IMAGE_TYPE.SMALL);//小图
        var bigImage = content.getImage(webim.IMAGE_TYPE.LARGE);//大图
        var oriImage = content.getImage(webim.IMAGE_TYPE.ORIGIN);//原图
        var self = this;
        if (!bigImage) {
            bigImage = smallImage;
        }
        if (!oriImage) {
            oriImage = smallImage;
        }
        return    "<img class = 'imgClick' src='" + smallImage.getUrl() + "#" + bigImage.getUrl() + "#" + oriImage.getUrl() + "' style='CURSOR: hand' id='" + content.getImageId() + "' bigImgUrl='" + bigImage.getUrl() + "' ondragstart='return false;'/>";

    }

    //解析自定义消息
    function convertCustomMsgToHtml(content) {
        var data = content.getData();
        data = JSON.parse(data);
        console.log(data,"自定义消息")
        if(data.price== "面议"){
            return `
        <span class= "custom" style = " white-space: normal;">
            <a class = "custom_pic" href="javascript: void(0);" >
                <img data-goodsUrl="${data.goodsUrl}" class = "custom_msg" src="${data.imgUrl}" title = " ${data.title}">
            </a>
            <span class = "custom_desc">
                <a class = "custom_msg" href="javascript: void(0);" data-goodsUrl="${data.goodsUrl}" title="${data.title}">${data.title}</a>
                <em>${data.price}</em>
                
            </span>
        </span>
        `}else{
            return `
        <span class= "custom" style = " white-space: normal;">
            <a class = "custom_pic" href="javascript: void(0);" >
                <img data-goodsUrl="${data.goodsUrl}" class = "custom_msg" src="${data.imgUrl}" title = " ${data.title}">
            </a>
            <span class = "custom_desc">
                <a class = "custom_msg" href="javascript: void(0);" data-goodsUrl="${data.goodsUrl}" title="${data.title}">${data.title}</a>
                <em>${data.price}/${data.unitName}</em>
            </span>
        </span>
        `
        }

        //return "data=" + data + ", desc=" + desc + ", ext=" + ext;
    }

    //增加一条消息
    function addMsg(msg) {
        //console.log('addMsg---->',msg)
        var isSelfSend, fromAccount, fromAccountNick, sessType, subType, oneMsg;
        fromAccount = msg.getFromAccount();
        //console.log('发送者addMsg---->fromAccount',fromAccount);
        //console.log('接受者addMsg---->msg.getSession().id()',msg.getSession().id());
        if (!fromAccount) {
            fromAccount = '';
        }
        //处理消息
        fromAccountNick = msg.getFromAccountNick();
        if (!fromAccountNick) {
            fromAccountNick = fromAccount;
        }
        isSelfSend = msg.getIsSend();//消息是否为自己发的
        var contents = convertMsgtoHtml(msg);

        oneMsg = {
            date: webim.Tool.formatTimeStamp(msg.getTime()),
            self: isSelfSend,
            content: contents,
            headUrl: isSelfSend ? selfInfo.headImage : store.default.getters.getFriendhead(msg.fromAccount),
            selToID: msg.getSession().id(),
            uniqueId: msg.uniqueId
        }
        return oneMsg;
    }

    //历史消息回调处理
    function getHistoryMsgCallback(msgs, selToID) {
        var msg, msgList = [];
        for (var j in msgs) {//遍历新消息
            msg = msgs[j];
            msgList.push(addMsg(msg));
        }
        store.default.dispatch('append_historymsg', {
            selToID: selToID,
            msgList: msgList
        });
        //消息已读上报，并将当前会话的消息设置成自动已读
        webim.setAutoRead(selSess, true, true);
    }

    //friendInfo处理
    function onFriendAddNotify(notify) {
        //console.log('notify===========',notify)
        _getProfilePortrait(notify.Accounts,
            function (resp) {
            //console.log('resp++++++',resp)
            console.log('好友回调处理');
                if (resp.UserProfileItem && resp.UserProfileItem.length > 0) {
                    var nick = null, gender = null, allowType = null, imageUrl = null, needset = false, friendList = [],
                        friendInfos;
                    for (var i in resp.UserProfileItem) {
                        var to_account = resp.UserProfileItem[i].To_Account;
                        if (resp.UserProfileItem[i].ProfileItem) {
                            for (var j in resp.UserProfileItem[i].ProfileItem) {
                                switch (resp.UserProfileItem[i].ProfileItem[j].Tag) {
                                    case 'Tag_Profile_IM_Nick':
                                        nick = resp.UserProfileItem[i].ProfileItem[j].Value;
                                        break;
                                    case 'Tag_Profile_IM_Image':
                                        imageUrl = resp.UserProfileItem[i].ProfileItem[j].Value;
                                        break;
                                }
                            }
                            friendInfos = {
                                'headImage': imageUrl,
                                'friendName': nick,
                                'selToID': to_account, // 用户id
                                'offline': false
                            }
                            //增加一个好友
                            friendList.push(friendInfos);
                            friendList.forEach((index,item)=>{
                                console.log(index,item.friendName,item.selToID,99999999999);
                            })
                            console.log(friendList,'onFriendAddNotify处理')
                            store.default.dispatch('add_friends', friendList);
                            store.default.dispatch('getFriendName',friendInfos.friendName);
                        } else {
                            var b2bId = to_account.substring(3, to_account.length);
                            getThum.default(b2bId, true);
                        }
                    }

                }
            },
            function (err) {
                console.log('好友处理错误');
                console.error(err.ErrorInfo);
            });


    }

    function getSingleFriendInfo(friend, cb){
        let friend_id = friend.Info_Account, //好友id
            friend_name = friend.Info_Account,
            friendHeadUrl = '/images/1.jpg', 
            friendInfos;

        // 如果没有昵称跟头像，就请求l8l8捞接口 
        if(!friend.SnsProfileItem || friend.SnsProfileItem.length < 2){
            let formData = new FormData();
            let tempId = friend_id.replace('UID', '');
            formData.append('pid', tempId);

            fetch.default({
                url: '/memberAction.aspx?method=queryMemberList',
                method: 'post',
                mode:'cors',
                data: formData
            }).then(res =>{  
                let data =JSON.parse(res.data.ret);
                friendInfos = {
                    'headImage': data[tempId].headImage,
                    'friendName': data[tempId].memberName,
                    'selToID': friend_id,
                    'unRead': false,
                    'offline': true
                }
                cb(friendInfos);
            })
            .catch(err => {
                console.log(err);
                throw err;
            })
        }else{
            friend_name = friend.SnsProfileItem[0].Value;
            friendHeadUrl = friend.SnsProfileItem[1].Value;
            friendInfos = {
                'headImage': friendHeadUrl,
                'friendName': friend_name,
                'selToID': friend_id,
                'unRead': false,
                'offline': true
            }
            cb(friendInfos);
        }
    }

    function friendInfo(friends) {
        let i = 0;
        len = friends.length, friendList = [];
        for (; i < len; i++) {
            friendObj = friends[i];
            var friend_id = friendObj.Info_Account,//好友id
                friend_name = friendObj.Info_Account,
                friendHeadUrl = '/images/1.jpg';

            if (friendObj.SnsProfileItem && friendObj.SnsProfileItem[0]
                && friendObj.SnsProfileItem[0].Tag) {
                friend_name = friendObj.SnsProfileItem[0].Value;
            }
            if (friendObj.SnsProfileItem && friendObj.SnsProfileItem[1]
                && friendObj.SnsProfileItem[1].Tag) {
                friendHeadUrl = friendObj.SnsProfileItem[1].Value;
            }

            var friendInfos = {
                'headImage': friendHeadUrl,
                'friendName': friend_name,
                'selToID': friend_id,
                'unRead': false,
                'offline': true
            }
            //增加一个好友
            friendList.push(friendInfos);
        }
        return friendList;
    }

    /*把转义字符转换回原来的符号 */
    function escape2Html(str) {
        return str.replace(/&(lt|gt|amp;nbsp|nbsp|amp|quot);/ig, function (all, t) {
            return arrEntities[t];
        });
    }

    //自定义提示弹框
    function mAlert(content, sure) {
        var mbox = document.getElementById('mbox');
        if (mbox == null) {
            var box = this.document.createElement('div');
            box.innerHTML = `<div id="mbox" style="position: absolute;
                        top: 50%;
                        left: 50%;
                        background: #fff;
                        border-radius: 3px;
                        box-shadow:0 0 12px 2px rgba(0,0,0,.5);
                        transform:translate(-50%,-50%);
                            padding: 0px 5px 5px 5px;">
                <div style="margin: 15px 10px">${content}</div>
                <div style="text-align: right;margin: 8px 3px 5px 0px;"><span style="padding: 5px 10px;border-radius: 3px;background-color: #2799ea;
                color: #fff;" id="box_sure">${sure}</span></div>
                </div>`;

            this.document.getElementById('app').appendChild(box);
            this.document.getElementById('box_sure').onclick = function () {
                this.parentNode.parentNode.parentNode.remove();
            }
        } else {
            return;
        }
    }

    //登录
    exports.login = function (userInfo, okcb, errcb) {
        selfInfo = userInfo;
        loginInfo.identifier = 'UID' + userInfo.tbMemberId;
        loginInfo.identifierNick = userInfo.memberName;
        loginInfo.userSig = userInfo.signature;
        //console.log('userInfo=====',userInfo);
        webim.Log.info(userInfo);
        webim.login(loginInfo, listeners, loginoptions, okcb, errcb)
    }
    //加好友
    exports.applyaddfriend = function (friendname, unread) {
        console.log('sdk中加好友');
        //添加好友
        var add_friend_item = [
            {
                'To_Account': friendname,
                "AddSource": "AddSource_Type_Unknow",
                "AddWording": '' //加好友附言，可为空
            }
        ];
        var add_friend_options = {
            'From_Account': loginInfo.identifier,
            'AddFriendItem': add_friend_item
        };
        webim.applyAddFriend(
            add_friend_options,
            function (resp) {
                console.log('加好友成功resp====',resp);
                var friends = resp.ResultItem;
                console.log(friends,'好友列表')
                _getProfilePortrait([friends[0].To_Account],function (resp) {
                    //console.log('获取好友资料',resp);
                    if (resp.UserProfileItem && resp.UserProfileItem.length > 0) {
                        var nick = null,imageUrl = null,friendList = [], friendInfos;
                        for(var i in resp.UserProfileItem){
                            var to_account = resp.UserProfileItem[i].To_Account;
                            if(resp.UserProfileItem[i].ProfileItem){
                                for (var j in resp.UserProfileItem[i].ProfileItem) {
                                     switch (resp.UserProfileItem[i].ProfileItem[j].Tag) {
                                        case 'Tag_Profile_IM_Nick':
                                            nick = resp.UserProfileItem[i].ProfileItem[j].Value;
                                            break;
                                        case 'Tag_Profile_IM_Image':
                                             imageUrl = resp.UserProfileItem[i].ProfileItem[j].Value;
                                             break;
                                        }
                                 }
                                friendInfos = {
                                    'headImage': imageUrl,
                                    'friendName': nick,
                                    'selToID': to_account,
                                    'unRead': unread || false,
                                    'offline': false
                                }
                                //增加一个好友
                                friendList.push(friendInfos);
                                console.log('增加一个好友',friendList);
                                store.default.dispatch('add_friends', friendList);
                                store.default.dispatch('getFriendName',friendInfos.friendName);
                            }else {
                                var b2bId = to_account.substring(3, to_account.length);
                                getThum.default(b2bId, true);
                            }
                        }
                    }
                },function () {

                })
            }, function(err){
                console.log('加好友失败====',err);
            }
        );
    }
    //我的好友列表   刚登录时调用
    exports.getAllFriend = function () {
        var get_all_friend_options = {
            'From_Account': loginInfo.identifier,
            'TimeStamp': 0,
            'StartIndex': 0,
            'GetCount': totalCount,
            'LastStandardSequence': 0,
            "TagList":
                [
                    "Tag_Profile_IM_Nick",
                    "Tag_Profile_IM_Image"
                ]
        };
        console.log(get_all_friend_options,'获取所有用户配置')
        webim.getAllFriend(get_all_friend_options,function (resp) {
            console.log(resp,'腾讯传过来的信息')

                 //FriendNum  好友数量
                 //console.log('resp.FriendNum=====',resp.InfoItem);
                 if(resp.FriendNum > 0){
                     //返回好友信息
                     var friends = resp.InfoItem;
                    //  console.log(friends,'返回好友信息')
                     if (!friends || friends.length == 0) {
                         //return ;
                     }else{
                         // console.log('好友列表');
                         // friends.forEach((item,index)=>{
                         //     console.log(index,item.Info_Account);
                         // })
                         var friendList = friendInfo(friends);
                        //  console.log(friendList,'腾讯传来的数据')
                     }
                     //好友个数
                     //store.default.dispatch('is_friends',resp.FriendNum)
                     store.default.dispatch('add_friends', friendList); //向store放入好友列表
                     store.default.dispatch('check_needtalk');

                     webim.getRecentContactList({
                         'Count':30
                     },function (resp) {
                         //返回最近联系人列表
                         times = resp.SessionItem;
                         // console.log('最近联系人列表====');
                         //     times.forEach((item,index)=>{
                         //     console.log(index,item.To_Account)
                         //  })
                         if(times && times.length > 0){
                             for(var i = 0; i < times.length; i++) {
                                 var cid = times[i].To_Account;
                                 var ind = friends.findIndex(item=>item.Info_Account == cid);
                                 if(ind == -1){
                                     times.splice(i,1);
                                 }
                             }
                             console.log('删除后的最近联系人列表====');
                           /*  times.forEach((item,index)=>{
                                 console.log(index,item.To_Account)
                             })*/
                             //根据最近联系人顺序调整好友列表顺序
                             for(var i = 0; i < times.length;i++){
                                 var uid = times[i].To_Account;
                                 for(var j = 0; j < friends.length; j++){
                                     var fid = friends[j].Info_Account;
                                     if(uid == fid){
                                         //插入位置，从0开始
                                         friends.splice(i,0,friends[j]);
                                         //删除原位置
                                         friends.splice(j+1,1);
                                     }
                                 }
                             }
                         }
                         var friendList = friendInfo(friends);
                         console.log(friendList,'排序完好友列表')
                         // console.log('排完序好友列表。。。');
                         // friendList.forEach((item,index)=>{
                         //     console.log(index,item.friendName,item.selToID,item.unRead);
                         // })
                         store.default.dispatch('add_friends', friendList); //向store放入好友列表
                         store.default.dispatch('update_friend_list', friendList); //向store放入好友列表
                     },
                     function (err) {
                         console.log('获取最近联系人失败')
                     })

                }else{
                    // 无好友的情况
                    //store.default.dispatch('is_friends',resp.FriendNum)
                     store.default.dispatch('check_needtalk');
                     console.log('resp.FriendNum=====',resp.FriendNum);
                }
        },
        function (err) {

        })
        /*webim.getRecentContactList({
            'Count':15
        },function (resp) {
            //console.log('最近联系人列表====',resp.SessionItem);
            //返回最近联系人列表
             times = resp.SessionItem;
             console.log('最近联系人列表====');
             times.forEach((item,index)=>{
                 console.log(index,item.To_Account)
             })
            webim.getAllFriend(
                get_all_friend_options,
                function (resp) {
                    console.log('friendNum==>',resp.FriendNum);
                    store.default.dispatch('check_needtalk');
                    if (resp.FriendNum > 0) {
                        var friends = resp.InfoItem;
                        console.log('好友列表====');
                        if (!friends || friends.length == 0) {
                            //return ;
                        }else{
                            friends.forEach((item,index)=>{
                                console.log(index,item.Info_Account);
                            })
                        }
                        if(times && times.length > 0){
                            for(i = 0; i < times.length; i++) {
                                var cid = times[i].To_Account;
                                var ind = friends.findIndex(item=>item.Info_Account == cid);
                                if(ind == -1){
                                    times.splice(i,1);
                                }
                            }
                            //根据最近联系人顺序调整好友列表顺序
                            for(var i = 0; i < times.length;i++){
                                var uid = times[i].To_Account;
                                for(var j = 0; j < friends.length; j++){
                                    var fid = friends[j].Info_Account;
                                    if(uid == fid){
                                        //插入位置，从0开始
                                        friends.splice(i,0,friends[j]);
                                        //删除原位置
                                        friends.splice(j+1,1);
                                    }
                                }
                            }
                        }
                        console.log('排完序好友列表');
                        friends.forEach((item,index)=>{
                            //console.log(index,item.Info_Account);
                        })
                        var friendList = friendInfo(friends);
                        console.log('排完序好友列表。。。');
                        friendList.forEach((item,index)=>{
                            console.log(index,item.friendName,item.selToID,item.unRead);
                        })
                        store.default.dispatch('update_friend_list', friendList); //向store放入好友列表
                        store.default.dispatch('check_needtalk');
                    }
                },
                function (err) {
                    console.error(err.ErrorInfo);
                })
        },function (resp) {

        })*/

    }
    //删除好友
    exports.delFriend = function (selToID, cbOK) {
        var mbox = document.getElementById('mbox');
        if (mbox == null) {
            var box = this.document.createElement('div');
            box.innerHTML = `<div id="mbox" style="position: absolute;
                        top: 50%;
                        left: 50%;
                        background: #fff;
                        border-radius: 3px;
                        box-shadow:0 0 12px 2px rgba(0,0,0,.5);
                        transform:translate(-50%,-50%);
                            padding: 0px 5px 5px 5px;">
                <div style="margin: 15px 10px">${mI18nObj.$t("message.obj.del_friend")}</div>
                <div style="text-align: right;margin: 8px 3px 5px 0px;">
                    <span style=";padding: 5px 10px;border-radius: 3px;background-color: #2799ea;
                    color: #fff;cursor: default" id="box_sure">${mI18nObj.$t("message.obj.sure")}</span>
                    <span style=";padding: 5px 10px;border-radius: 3px;background-color: #2799ea;
                    color: #fff;cursor: default" id="box_off">${mI18nObj.$t("message.obj.off")}</span>
                </div>
                </div>`;

            this.document.getElementById('app').appendChild(box);
            this.document.getElementById('box_sure').onclick = function () {
                var to_account = [];
                to_account = [
                    selToID
                ];
                if (to_account.length <= 0) {
                    return;
                }
                var options = {
                    'From_Account': loginInfo.identifier,
                    'To_Account': to_account,
                    //Delete_Type_Both'//单向删除："Delete_Type_Single", 双向删除："Delete_Type_Both".
                    'DeleteType': 'Delete_Type_Single'
                };
                webim.deleteFriend(
                    options,
                    cbOK,
                    function (err) {
                        alert(err.ErrorInfo);
                    }
                );
                //删除好友的同时在最近联系人列表中也删除
                webim.deleteChat({
                    'To_Account': selToID,
                    'chatType': '1'
                },function (resp) {
                    console.log('删除最近联系人',resp);
                })
                this.parentNode.parentNode.parentNode.remove();
            }
            this.document.getElementById('box_off').onclick = function (e) {
                this.parentNode.parentNode.parentNode.remove();
            }
        }

    }

    //发送消息  不再用
    exports.sendMsg = function (msgtosend, selToID) {
        if (!selToID) {
            mAlert(mI18nObj.$t("message.obj.no_friend"), mI18nObj.$t("message.obj.sure"));
            return;
        }
        msgtosend = zjlaoEmoji(msgtosend);//转换后的表情
        //msgtosend=escape2Html(msgtosend)
        var msgLen = webim.Tool.getStrBytes(msgtosend);//获取的字节数

        if (msgtosend.length < 1) {
            mAlert(mI18nObj.$t("message.obj.send_msg"), mI18nObj.$t("message.obj.sure"));
            return;
        }

        var maxLen, errInfo;
        if (selType == webim.SESSION_TYPE.C2C) {
            maxLen = webim.MSG_MAX_LENGTH.C2C;
            errInfo = mI18nObj.$t("message.obj.msg_length");
        }
        if (msgLen > maxLen) {
            alert(errInfo);
            return;
        }
        if (!selSess) {
            var selSess = new webim.Session(selType, selToID, selToID, friendHeadUrl, Math.round(new Date().getTime() / 1000))
        }
        var isSend = true,//是否为自己发送
            seq = -1,
            random = Math.round(Math.random() * 4294967296),
            msgTime = Math.round(new Date().getTime() / 1000),//消息时间戳
            subType;
        if (selType == webim.SESSION_TYPE.C2C) {
            subType = webim.C2C_MSG_SUB_TYPE.COMMON;
        }
        var msg = new webim.Msg(selSess, isSend, seq, random, msgTime, loginInfo.identifier, subType, loginInfo.identifierNick),
            text_obj,
            //解析文本和表情
            expr = /\[[^[\]]{1,3}\]/mg,
            emotions = msgtosend.match(expr);

        //console.log("msg--->", msg);
        //console.log('msg.PushInfoBoolean-->',msg.PushInfoBoolean);
        //console.log('msg-->')
        if (!emotions || emotions.length < 1) {
            text_obj = new webim.Msg.Elem.Text(msgtosend);
            msg.addText(text_obj);
        } else {
            for (var i = 0; i < emotions.length; i++) {
                tmsg = msgtosend.substring(0, msgtosend.indexOf(emotions[i]));
                if (tmsg) {
                    text_obj = new webim.Msg.Elem.Text(tmsg);
                    msg.addText(text_obj);
                }
                emotionIndex = webim.EmotionDataIndexs[emotions[i]];
                emotion = webim.Emotions[emotionIndex];

                if (emotion) {
                    face_obj = new webim.Msg.Elem.Face(emotionIndex, emotions[i]);
                    msg.addFace(face_obj);
                } else {
                    text_obj = new webim.Msg.Elem.Text(emotions[i]);
                    msg.addText(text_obj);
                }
                restMsgIndex = msgtosend.indexOf(emotions[i]) + emotions[i].length;
                msgtosend = msgtosend.substring(restMsgIndex);
            }
            if (msgtosend) {
                text_obj = new webim.Msg.Elem.Text(msgtosend);
                msg.addText(text_obj);
            }
        }
        msg.PushInfo = {
            "PushFlag": 0,
            "Ext": loginInfo.identifier, //离线推送透传内容
        };

        msg.PushInfoBoolean = true; //是否开启离线推送push同步
        var _this = this;
        webim.sendMsg(msg,
            function (resp) {//调用消息发送接口
                if (selType == webim.SESSION_TYPE.C2C) {//私聊时，在聊天窗口手动添加一条发的消息，群聊时，长轮询接口会返回自己发的消息
                    iframe = document.getElementById('editor'),
                        content = iframe.contentDocument || iframe.contentWindow.document;
                    content.body.innerHTML = "";
                    var msgList = [];
                    var flag = new webim.Msg.Elem.Text('succ');
                    msg.addText(flag);
                    msgList.push(addMsg(msg));
                    store.default.dispatch('append_msg', {
                        selToID: selToID,
                        msgList: msgList
                    });
                    store.default.dispatch('update_friend_order',{
                        selToID: selToID,
                    });
                }
                webim.Tool.setCookie("tmpmsg_" + selToID, '', 0);
            }, function (err) {
                //发送出错处理
                console.log('err.ErrorInfo.response======', err);
                if (err.ErrorCode == -2) {
                    mAlert(mI18nObj.$t("message.obj.check_network"), mI18nObj.$t("message.obj.sure"));
                    return;
                } else {
                    iframe = document.getElementById('editor'),
                        content = iframe.contentDocument || iframe.contentWindow.document;
                    content.body.innerHTML = "";
                    var msgList = [];
                    var flag = new webim.Msg.Elem.Text('fail');
                    msg.addText(flag);
                    msgList.push(addMsg(msg));
                    store.default.dispatch('append_msg', {
                        selToID: selToID,
                        msgList: msgList
                    });
                }
            });

        /*把表情串转为字符*/
        function zjlaoEmoji(str) {
            var reg = /<img[^>]*>/ig;
            var num = str.replace(reg, function (word) {
                return word.split('xfei')[0].split('name="')[1];
            });
            return num;
        }
    }

    //发送自定义消息（产品链接）
    exports.sendCustomMsg = function (msgtosend, selToID) {
        console.log(selToID,'自定义消息发送给谁')
        if (!selToID) {
            //alert(mI18nObj.$t("message.obj.no_friend"));
            mAlert(mI18nObj.$t("message.obj.no_friend"), mI18nObj.$t("message.obj.sure"));
            return;
        }
        //自定义消息处理
        var data;
        data = msgtosend;

        var msgLen = webim.Tool.getStrBytes(data);

        if (data.length < 1) {
            //alert(mI18nObj.$t("message.obj.send_msg"));
            mAlert(mI18nObj.$t("message.obj.send_msg"), mI18nObj.$t("message.obj.sure"));
            return;
        }
        var maxLen, errInfo;
        if (selType == webim.SESSION_TYPE.C2C) {
            maxLen = webim.MSG_MAX_LENGTH.C2C;
            errInfo = mI18nObj.$t("message.obj.msg_length");
        } else {
            maxLen = webim.MSG_MAX_LENGTH.GROUP;
            errInfo = mI18nObj.$t("message.obj.msg_length");
        }
        if (msgLen > maxLen) {
            alert(errInfo);
            return;
        }

        if (!selSess) {
            selSess = new webim.Session(selType, selToID, selToID, friendHeadUrl, Math.round(new Date().getTime() / 1000));
        }
        var msg = new webim.Msg(selSess, true, -1, -1, -1, loginInfo.identifier, 0, loginInfo.identifierNick);
        var custom_obj = new webim.Msg.Elem.Custom(data);
        msg.addCustom(custom_obj);
        //调用发送消息接口
        webim.sendMsg(msg, function (resp) {
            if (selType == webim.SESSION_TYPE.C2C) {//私聊时，在聊天窗口手动添加一条发的消息，群聊时，长轮询接口会返回自己发的消息
                var msgList = [];
                msgList.push(addMsg(msg));
                console.log(selToID,'自定义消息的id')
                store.default.dispatch('append_msg', {
                    selToID: selToID,
                    msgList: msgList
                });
                console.log('webim',selToID,msgList);
                store.default.dispatch('update_friend_order',{
                    selToID: selToID,
                });
            }
        }, function (err) {
            alert(err.ErrorInfo);
        });
    }

    //获取最新的c2c历史消息,用于切换好友聊天，重新拉取好友的聊天消息
    exports.getLastHistoryMsg = function (selToID) {
        var lastMsgTime = 0//第一次拉取好友历史消息时，必须传0
            , msgKey = ''
            , options = {
            'Peer_Account': selToID, //好友帐号
            'MaxCnt': reqMsgCount, //拉取消息条数
            'LastMsgTime': lastMsgTime, //最近的消息时间，即从这个时间点向前拉取历史消息
            'MsgKey': msgKey
        };
        selSess = null;
        webim.MsgStore.delSessByTypeId(selType, selToID);

        webim.getC2CHistoryMsgs(
            options,
            function (resp) {
                var complete = resp.Complete;//是否还有历史消息可以拉取，1-表示没有，0-表示有
                var retMsgCount = resp.MsgCount;//返回的消息条数，小于或等于请求的消息条数，小于的时候，说明没有历史消息可拉取了

                if (resp.MsgList.length == 0) {
                    store.default.dispatch('set_msgtip', 3);
                    //console.error("没有历史消息了:data=" + JSON.stringify(options));
                    webim.Log.info("没有历史消息了:data=" + JSON.stringify(options))
                    return;
                }
                getPrePageC2CHistroyMsgInfoMap[selToID] = {//保留服务器返回的最近消息时间和消息Key,用于下次向前拉取历史消息
                    'LastMsgTime': resp.LastMsgTime,
                    'MsgKey': resp.MsgKey
                };
                //if (cbOk)
                //console.log(resp.MsgList,'msgList');
                store.default.dispatch('set_msgtip', 1)
                var msgs = [];
                for (var j in resp.MsgList) {
                    msgs.push(addMsg(resp.MsgList[j]));
                }
                store.default.dispatch('set_msgtip', 1)
                store.default.dispatch('init_msg', {
                    selToID: selToID,
                    msgList: msgs
                });
            },
            function (err) {
                //console.error('getLastHistoryMsg=>', err.ErrorInfo)
            }
        );
    }

    //向上翻页，获取更早的好友历史消息
    exports.getPrePageHistorymsg = function (selToID) {
        var tempInfo = getPrePageC2CHistroyMsgInfoMap[selToID]//获取下一次拉取的c2c消息时间和消息Key
            , lastMsgTime
            , msgKey;
        if (tempInfo) {
            lastMsgTime = tempInfo.LastMsgTime;
            msgKey = tempInfo.MsgKey;
        } else {
            module.exports.getLastHistoryMsg(selToID);
            console.error('获取下一次拉取的c2c消息时间和消息Key为空');
            return;
        }
        var options = {
            'Peer_Account': selToID, //好友帐号
            'MaxCnt': reqMsgCount, //拉取消息条数
            'LastMsgTime': lastMsgTime, //最近的消息时间，即从这个时间点向前拉取历史消息
            'MsgKey': msgKey
        };
        webim.getC2CHistoryMsgs(
            options,
            function (resp) {
                var complete = resp.Complete;//是否还有历史消息可以拉取，1-表示没有，0-表示有
                if (resp.MsgList.length == 0) {
                    store.default.dispatch('set_msgtip', 3);
                    webim.Log.warn("没有历史消息了:data=" + JSON.stringify(options));
                    return;
                }
                getPrePageC2CHistroyMsgInfoMap[selToID] = {//保留服务器返回的最近消息时间和消息Key,用于下次向前拉取历史消息
                    'LastMsgTime': resp.LastMsgTime,
                    'MsgKey': resp.MsgKey
                };
                if (resp.MsgList) {
                    store.default.dispatch('set_msgtip', 1)
                    getHistoryMsgCallback(resp.MsgList, selToID);
                }
            },
            function (err) {
                console.error('getPreHistoryMsg=>', err.ErrorInfo)
            }
        );
    }
    //获取个人的头像和id
    exports.getLoginInfo = function () {
        return {
            identifier: selfInfo.tbMemberId,
            usersig: selfInfo.signature
        }
    }
    //获取Emotions对象
    exports.Emotions = function () {
        return webim.Emotions;
    }
    //上传图片
    exports.uploadPic = function (file, selToID, cbOk) {
        var businessType;
        if (selType == webim.SESSION_TYPE.C2C) {//向好友发文件
            businessType = webim.UPLOAD_PIC_BUSSINESS_TYPE.C2C_MSG;
        }

        var opt = {
            'file': file, //图片对象
            //'onProgressCallBack': onProgressCallBack, //上传图片进度条回调函数
            //'abortButton': document.getElementById('upd_abort'), //停止上传图片按钮
            'From_Account': loginInfo.identifier, //发送者帐号
            'To_Account': selToID, //接收者
            'businessType': businessType//业务类型
        };
        webim.uploadPic(opt,
            function (resp) {
                //console.log(resp,'uploadPic')
                images = resp;
                //上传成功发送图片
                var URL_INFO = resp.URL_INFO;
                var picBox = document.querySelector('#previewPicDiv');
                picBox.innerHTML = "";
                var img = new Image();
                img.src = URL_INFO[2].DownUrl + '#' + URL_INFO[1].DownUrl + '#' + URL_INFO[0].DownUrl;
                picBox.appendChild(img);
                cbOk();

                //Msg.sendPic(resp,selToID,selType,selSess,friendHeadUrl,_this.$store);
                //清空file的value值
                document.getElementById('file').value = '';

            },
            function (err) {
                alert(err.ErrorInfo);
            }
        );
    }
    //上传64编码的图片
    exports.uploadPicByBase64 = function (base64str, selToID, cbOk) {
        var businessType;//业务类型，1-发群图片，2-向好友发图片
        if (selType == webim.SESSION_TYPE.C2C) {//向好友发图片
            businessType = webim.UPLOAD_PIC_BUSSINESS_TYPE.C2C_MSG;
        }
        base64str = electron.clipboard.readImage();
        var dataArr = base64str.toPng();
        var base64Img = base64str.toDataURL();
        var base64 = base64Img.substring(22);
        var equalIndex = base64.indexOf('=');
        if (base64.indexOf('=') > 0) {
            base64 = base64.substring(0, equalIndex);
        }
        var len = base64.length;
        var fileSize = parseInt(len - len / 8 * 2);

        var spark = new SparkMD5.ArrayBuffer(); //获取MD5对象
        spark.append(dataArr);
        var fileMd5 = spark.end();
        var opt = {
            'toAccount': selToID, //接收者
            'businessType': businessType,//图片的使用业务类型
            'fileMd5': fileMd5,//fileMd5, //图片md5
            'totalSize': fileSize, //图片大小,Byte
            'base64Str': base64 //图片base64编码
        }
        webim.uploadPicByBase64(opt,
            function (resp) {
                // console.log(resp,'uploadPicbase64')
                images = resp;
                //上传成功发送图片
                var URL_INFO = resp.URL_INFO;
                var picBox = document.querySelector('#previewPicDiv');
                picBox.innerHTML = "";
                var img = new Image();
                img.src = URL_INFO[2].DownUrl + '#' + URL_INFO[1].DownUrl + '#' + URL_INFO[0].DownUrl;
                picBox.appendChild(img);
                cbOk();

                //Msg.sendPic(resp,selToID,selType,selSess,friendHeadUrl,_this.$store);
                //清空file的value值
                //document.getElementById('previewPicDiv').innerHTML='';

            },
            function (err) {
                alert(err.ErrorInfo);
            }
        );
    }
    //发送图片
    exports.sendPic = function (selToID) {
        if (!selToID) {
            //alert(mI18nObj.$t("message.obj.no_friend"));
            mAlert(mI18nObj.$t("message.obj.no_friend"), mI18nObj.$t("message.obj.sure"));
            return;
        }
        if (!selSess) {
            selSess = new webim.Session(selType, selToID, selToID, friendHeadUrl,
                Math.round(new Date().getTime() / 1000));
        }
        var msg = new webim.Msg(selSess, true);
        var images_obj = new webim.Msg.Elem.Images(images.File_UUID);
        for (var i in images.URL_INFO) {
            var img = images.URL_INFO[i];
            var newImg;
            var type;
            switch (img.PIC_TYPE) {
                case 1://原图
                    type = 1;//原图
                    break;
                case 2://小图（缩略图）
                    type = 3;//小图
                    break;
                case 4://大图
                    type = 2;//大图
                    break;
            }
            newImg = new webim.Msg.Elem.Images.Image(type, img.PIC_Size, img.PIC_Width,
                img.PIC_Height, img.DownUrl);
            images_obj.addImage(newImg);
        }
        //处理图片
        msg.addImage(images_obj);
        msg.PushInfo = {
            "PushFlag": 0,
            "Ext": selToID, //离线推送透传内容
        };

        msg.PushInfoBoolean = true; //是否开启离线推送push同步
        //调用发送图片接口
        webim.sendMsg(msg,
            function (resp) {
                var msgList = [];
                msgList.push(addMsg(msg));
                store.default.dispatch('append_msg', {
                    selToID: selToID,
                    msgList: msgList
                })
                document.getElementById('previewPicDiv').innerHTML = '';
            }, function (err) {
                alert(err.ErrorInfo);
            });
    }
    //设置好友头像
    exports.setFriendHeadImg = function (friendHeadimg) {
        friendHeadUrl = friendHeadimg;
    },
    /*设置已读*/
    exports.setRead = function (selToID) {
        //console.log('setread====')
        var selSess = webim.MsgStore.sessByTypeId(selType, selToID);
        if (!selSess) {
            selSess = new webim.Session(selType, selToID, selToID, friendHeadUrl, Math.round(new Date().getTime() / 1000));
        }
        webim.setAutoRead(selSess, true, true)
    },
    /*退出登录 */
    exports.logout = function (cbOK, cbErr) {
        //console.log('logout')
        webim.logout(cbOK, cbErr)
    }
    /* 获取i18n对象*/
    exports.getI18n = function (obj) {
        mI18nObj = obj;
        console.log('mI18nObj=======',mI18nObj.$i18n);
        curLan = mI18nObj.$i18n.locale;
        console.log('mI18nObj.locale=======',curLan);

    }

    function uploadPicByBase64(base64str,selToID,cbOk){
        return new Promise(function(resolve, reject){
            var businessType;//业务类型，1-发群图片，2-向好友发图片
            if (selType == webim.SESSION_TYPE.C2C) {//向好友发图片
                businessType = webim.UPLOAD_PIC_BUSSINESS_TYPE.C2C_MSG;
            }
            base64str = electron.clipboard.readImage();
            var dataArr = base64str.toPng();
            var base64Img = base64str.toDataURL();
            var base64 = base64Img.substring(22);
            var equalIndex = base64.indexOf('=');
            if(base64.indexOf('=')>0)
            {
                base64=base64.substring(0, equalIndex);
            }
            var len=base64.length;
            var fileSize=parseInt(len-len/8*2);

            var spark = new SparkMD5.ArrayBuffer(); //获取MD5对象
            spark.append(dataArr);
            var fileMd5 = spark.end();
            var opt = {
                'toAccount': selToID, //接收者
                'businessType': businessType,//图片的使用业务类型
                'fileMd5':fileMd5,//fileMd5, //图片md5
                'totalSize':fileSize, //图片大小,Byte
                'base64Str':base64 //图片base64编码
                }
            webim.uploadPicByBase64(opt,
                function (resp) {
                    resolve({
                        type: 'success',
                        data: resp
                    });
                    // console.log(resp,'uploadPicbase64')
                    // console.log(resp);
                    return false;
                    images=resp;
                    //上传成功发送图片
                    var URL_INFO=resp.URL_INFO;
                    var picBox=document.querySelector('#previewPicDiv');
                    picBox.innerHTML="";
                    var img=new Image();
                    img.src=URL_INFO[2].DownUrl+'#'+URL_INFO[1].DownUrl+'#'+URL_INFO[0].DownUrl;
                    picBox.appendChild(img);
                    cbOk();
                },
                function (err) {
                    if(err.ErrorCode == -4){ // 没有登录，走Promise的捕错流程
                        reject(err);
                    }else{ // 其他错误，走自定义的错误处理流程
                        resolve({
                            type: 'error',
                            data: {
                                err,
                                base64str,
                                selToID
                            }
                        });
                    }
                    // alert(err.ErrorInfo);
                }
            );
        });
        
    }

    function returnImageObject(image){
        var images_obj = new webim.Msg.Elem.Images(image.File_UUID);
        for (var i in image.URL_INFO) {
            var img = image.URL_INFO[i];
            var newImg;
            var type;
            switch (img.PIC_TYPE) {
                case 1://原图
                    type = 1;//原图
                    break;
                case 2://小图（缩略图）
                    type = 3;//小图
                    break;
                case 4://大图
                    type = 2;//大图
                    break;
            }
            newImg = new webim.Msg.Elem.Images.Image(type, img.PIC_Size, img.PIC_Width, img.PIC_Height, img.DownUrl);
            images_obj.addImage(newImg);
        }
        return images_obj;
    }

    // 上传编辑器中的base64格式图片
    function uploadImageOfMsg(msgtosend, selToID){
        var imageExpr = /<img[^>]*\bdata-format\b[^>]*[\/]*>/img;  // 匹配带有data-format属性的img标签 图片消息
        var images = msgtosend.match(imageExpr);
        var imageArray = [];
        let promiseArray = [];
        if(images && images.length > 0){
            for(let i = 0, len = images.length; i < len; i++){
                let base64str = images[i].match(/src\s*=\s*[\'|\"][^\s\'\"]*/gim)[0].split('=')[1];
                let p = uploadPicByBase64(base64str, selToID);
                promiseArray.push(p);
            }
        }
        return promiseArray;
    }
    // 执行同步上传图片，第一次失败后，重新执行失败的，重新执行失败后，提示错误，请求重新发送信息
    function executePromiseArray(promiseArray, index, cb){
        if(promiseArray.length < 1){
            cb([]);
            return false;
        }
        index++;
        Promise.all(promiseArray)
        .then(function(values){
            let rejectPromiseArray = [];
            for(let i = 0; i < values.length; i++){
                if(values[i].type == 'error'){
                    rejectPromiseArray.push(uploadPicByBase64(values[i].base64str, values[i].selToID));
                }
            }
            if(rejectPromiseArray.length > 0 && index <= 2){
                executePromiseArray(rejectPromiseArray, index, cb);
            }else if(rejectPromiseArray.length > 0 && index > 2){
                alert('上传图片失败，请重新发送。');
            }else if(rejectPromiseArray.length < 1 && index <= 2){
                cb(values);
            }
        })
        .catch(function(err){
            alert(err.ErrorInfo);
        });
    }

    function exist(str, array){
        let temp = false;
        for(let i = 0; i < array.length; i++){
            temp = str.includes(array[i]);
            if(temp){
                break;
            }
        }
        return temp;
    }

    // 发送消息（包括文本、表情、图片(base64格式)3种元素）
    exports.addCustomMsg = function(msgtosend, selToID){
        if (!selToID) {
            mAlert(mI18nObj.$t("message.obj.no_friend"), mI18nObj.$t("message.obj.sure"));
            return;
        }
        if (msgtosend.length < 1) {
            mAlert(mI18nObj.$t("message.obj.send_msg"), mI18nObj.$t("message.obj.sure"));
            return;
        }
        if(!selSess){
            var selSess=new webim.Session(selType,selToID,selToID,friendHeadUrl,Math.round(new Date().getTime() / 1000))
        }
        var isSend=true,//是否为自己发送
            seq=-1,
            random=Math.round(Math.random()*4294967296),
            msgTime=Math.round(new Date().getTime()/1000),//消息时间戳
            subType;
        if(selType==webim.SESSION_TYPE.C2C){
            subType=webim.C2C_MSG_SUB_TYPE.COMMON;
        }

        var msg = new webim.Msg(selSess, isSend, seq, random, msgTime, loginInfo.identifier, subType, loginInfo.identifierNick);   
        var text_obj, face_obj, tmsg, emotionIndex, emotion, image, restMsgIndex;

        executePromiseArray(uploadImageOfMsg(msgtosend, selToID), 0, function(values){
            let imagesMsg_array = [];
            if(values && values.length > 0){
                for(let i = 0; i < values.length; i++){
                    imagesMsg_array.push(returnImageObject(values[i].data));
                }
            }

            // 匹配带有data-format属性的img标签 图片消息
            var imageExpr = /<img[^>]*\bdata-format\b[^>]*[\/]*>/img;
            // 匹配带有xfei标记的img标签  表情消息 
            var faceExpr = /<img[^>]*xfei\b[^>]*[\/]*>/img;
            let imageSign = 0;
            msgtosend = msgtosend.replace(faceExpr, function(faceword){
                return faceword.match(/alt\s*=\s*[\'|\"]+[^\s\'\"]*[\'|\"]+/gim)[0].split('=')[1].split('"')[1];
            });
            msgtosend = msgtosend.replace(imageExpr, function(imageword){
                return `{imageSign_${imageSign++}}`;
            });

            var maxLen, errInfo;
            if (selType == webim.SESSION_TYPE.C2C) {
                maxLen = webim.MSG_MAX_LENGTH.C2C;
                errInfo = mI18nObj.$t("message.obj.msg_length");
            } 
            var msgLen = webim.Tool.getStrBytes(msgtosend);
            if (msgLen > maxLen) {
                console.log(msgLen, maxLen);
                alert(errInfo);
                return;
            }

            var imageStringExpr = /\{imageSign_[^{\}]{1,3}\}/mg;
            var faceStringExpr = /\[[^[\]]{1,3}\]/mg;

            var images = msgtosend.match(imageStringExpr);
            var emotions = msgtosend.match(faceStringExpr);

            // 只有文本
            if((!images || images.length < 1) && (!emotions || emotions.length < 1)){
                text_obj = new webim.Msg.Elem.Text(msgtosend);
                msg.addText(text_obj);
            }else if((emotions && emotions.length > 0) && (!images || images.length < 1)){ // 包含表情，即文本+表情
                for(var i = 0; i < emotions.length; i++){
                    tmsg = msgtosend.substring(0, msgtosend.indexOf(emotions[i]));
                    if(tmsg){
                        text_obj = new webim.Msg.Elem.Text(tmsg);
                        msg.addText(text_obj);
                    }
                    emotionIndex = webim.EmotionDataIndexs[emotions[i]];
                    emotion = webim.Emotions[emotionIndex];
                    if (emotion) {
                        face_obj = new webim.Msg.Elem.Face(emotionIndex, emotions[i]);
                        msg.addFace(face_obj);
                    } else {
                        text_obj = new webim.Msg.Elem.Text(emotions[i]);
                        msg.addText(text_obj);
                    }
                    restMsgIndex = msgtosend.indexOf(emotions[i]) + emotions[i].length;
                    msgtosend = msgtosend.substring(restMsgIndex);

                    if (!exist(msgtosend, emotions)) {
                        text_obj = new webim.Msg.Elem.Text(msgtosend);
                        msg.addText(text_obj);
                    }
                }
            }else if((images && images.length > 0) && (!emotions || emotions.length < 1)){ // 包含图片，即文本+图片
                for(var i = 0; i < images.length; i++){
                    tmsg = msgtosend.substring(0, msgtosend.indexOf(images[i]));
                    if(tmsg){
                        text_obj = new webim.Msg.Elem.Text(tmsg);
                        msg.addText(text_obj);
                    }
                    image = imagesMsg_array[i];
                    if (image) {
                        msg.addImage(image);
                    } else {
                        text_obj = new webim.Msg.Elem.Text(images[i]);
                        msg.addText(text_obj);
                    }
                    restMsgIndex = msgtosend.indexOf(images[i]) + images[i].length;
                    msgtosend = msgtosend.substring(restMsgIndex);

                    if (!exist(msgtosend, images)) {
                        text_obj = new webim.Msg.Elem.Text(msgtosend);
                        msg.addText(text_obj);
                    }
                }
            }else if(emotions &&  emotions.length > 0 && images && images.length > 0){ // 包含图片，表情，即文本+表情+图片 
                for(let i = 0; i < images.length; i++){
                    tmsg = msgtosend.substring(0, msgtosend.indexOf(images[i]));
                    if(tmsg){
                        if(exist(tmsg, emotions)){
                            for(let n = 0; n < emotions.length; n++){
                                subtmsg = tmsg.substring(0, tmsg.indexOf(emotions[n]));
                                if(subtmsg){
                                    text_obj = new webim.Msg.Elem.Text(subtmsg);
                                    msg.addText(text_obj);
                                }
                                emotionIndex = webim.EmotionDataIndexs[emotions[n]];
                                emotion = webim.Emotions[emotionIndex];
                                if (emotion) {
                                    face_obj = new webim.Msg.Elem.Face(emotionIndex, emotions[n]);
                                    msg.addFace(face_obj);
                                } else {
                                    text_obj = new webim.Msg.Elem.Text(emotions[n]);
                                    msg.addText(text_obj);
                                }
                                subRestMsgIndex = tmsg.indexOf(emotions[n]) + emotions[n].length;
                                tmsg = tmsg.substring(subRestMsgIndex);
                                if (!exist(tmsg, emotions)) {
                                    text_obj = new webim.Msg.Elem.Text(tmsg);
                                    msg.addText(text_obj);
                                }
                            }
                        }else{
                            text_obj = new webim.Msg.Elem.Text(tmsg);
                            msg.addText(text_obj);
                        }
                    }
                    image = imagesMsg_array[i];
                    if (image) {
                        msg.addImage(image);
                    } else {
                        text_obj = new webim.Msg.Elem.Text(images[i]);
                        msg.addText(text_obj);
                    }
                    
                    restMsgIndex = msgtosend.indexOf(images[i]) + images[i].length;
                    msgtosend = msgtosend.substring(restMsgIndex);
                    
                    if(!exist(msgtosend, images)) {
                        if(exist(msgtosend, emotions)){
                            for(let m = 0; m < emotions.length; m++){
                                subtmsg = msgtosend.substring(0, msgtosend.indexOf(emotions[m]));
                                if(subtmsg && subtmsg.trim() != ''){
                                    text_obj = new webim.Msg.Elem.Text(subtmsg);
                                    msg.addText(text_obj);
                                }
                                emotionIndex = webim.EmotionDataIndexs[emotions[m]];
                                emotion = webim.Emotions[emotionIndex];
                                if (emotion) {
                                    face_obj = new webim.Msg.Elem.Face(emotionIndex, emotions[m]);
                                    msg.addFace(face_obj);
                                } else {
                                    text_obj = new webim.Msg.Elem.Text(emotions[m]);
                                    msg.addText(text_obj);
                                }
                                subRestMsgIndex = msgtosend.indexOf(emotions[m]) + emotions[m].length;
                                msgtosend = msgtosend.substring(subRestMsgIndex);
                                if (!exist(msgtosend, emotions)) {
                                    text_obj = new webim.Msg.Elem.Text(msgtosend);
                                    msg.addText(text_obj);
                                }
                            }
                        }else{
                            text_obj = new webim.Msg.Elem.Text(msgtosend);
                            msg.addText(text_obj);
                        }
                    }
                }
            }

            // console.log(msg);
            // return false;

            webim.sendMsg(msg, function (resp) {
                console.log('消息发送成功resp',resp);
                if (selType == webim.SESSION_TYPE.C2C) {//私聊时，在聊天窗口手动添加一条发的消息，群聊时，长轮询接口会返回自己发的消息
                    iframe = document.getElementById('editor'),
                        content = iframe.contentDocument || iframe.contentWindow.document;
                    content.body.innerHTML = "";
                    var msgList = [];
                    var flag = new webim.Msg.Elem.Text('succ');
                    msg.addText(flag);
                    msgList.push(addMsg(msg));
                    store.default.dispatch('append_msg',{
                        selToID: selToID,
                        msgList: msgList
                    });
                    store.default.dispatch('update_friend_order',{
                        selToID: selToID,
                    });
                }
                webim.Tool.setCookie("tmpmsg_" + selToID, '', 0);
            }, function (err) {
                //发送出错处理
                console.log('err.ErrorInfo.response======', err);
                if (err.ErrorCode == -2) {
                    mAlert(mI18nObj.$t("message.obj.check_network"), mI18nObj.$t("message.obj.sure"));
                    return;
                } else {
                    iframe = document.getElementById('editor'),
                        content = iframe.contentDocument || iframe.contentWindow.document;
                    content.body.innerHTML = "";
                    var msgList = [];
                    var flag = new webim.Msg.Elem.Text('fail');
                    msg.addText(flag);
                    msgList.push(addMsg(msg));
                    store.default.dispatch('append_msg', {
                        selToID: selToID,
                        msgList: msgList
                    });
                }
            });

        });
    }
    
    function storeMessage(msgObj) {
        console.log('msgObj====',msgObj);
        //删除数据库
        indexedDB.deleteDatabase('myMsgs');
   /*     var request = indexedDB.open('myMsgs',4);
        request.onsuccess = function (e) {
            console.log('链接数据库成功');
            var db = e.target.result;
            var tx = db.transaction('messages','readwrite');
            var store = tx.objectStore('messages');
            var value = {'fromAccount':'123456789'};
            var req1 = store.put(value);
        }
        request.onupgradeneeded = function (e) {
            var db = e.target.result;
            var store = db.createObjectStore('message',{keyPath:'fromAccount',autoIncrement:false});
            console.log('onupgradeneeded创建对象仓库成功');
            store.createIndex('accountIndex','fromAccount');
            console.log('onupgradeneeded创建索引成功');
            var tx = db.transaction('message','readonly');
            tx.oncomplete = function (e) {
                console.log('事务结束了');
            }
            tx.onabort = function (e) {
                console.log('事务被终止了');
            }
        }
        request.onerror = function (e) {
            console.log('链接数据库失败');
        }*/
    }
}) 