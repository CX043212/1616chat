<script>
    import Card from './card';
    import evalute from './evalute'
    import List from './list';
    import Message from './message';
    import Textinput from './textinput';
    import imgShow from './imgShow';
    import getimgsrc from '../../util/shotImg.js'
    import picDialog from './picDialog.vue'
    import {uploadPicByBase64,getAllFriend} from '../../util/wrapsdk.js'
    import mainHeader from './mainHeader'
    import rightSide from './rightSide'
    import {shell} from 'electron'
    import autoMessage from './autoMessage'
    // const {BrowserWindow} = require('electron').remote
    const {ipcRenderer} = require('electron');
    const path = require('path')
    export default {
        data(){
            return {
                showimg:false,
                src:'',
                PicDialog:false,
                mKey:'',
                avalute:this.$store.getters.avalute,
            }
        },
        components: {
            Card,
            List,
            Textinput,
            Message,
            imgShow,
            picDialog,
            mainHeader,
            rightSide,
            autoMessage,
            evalute
        },
        methods:{
            showimgBox(msg){
                if(!msg){
                    this.src='';
                }
                this.showimg=msg;
            },
            showPicDialog(msg){
                if(!msg){
                    this.src='';
                }
                this.PicDialog=msg;
            },
            setImgSrc(Src, msg){
                // console.log('Src====',Src,msg);
                ipcRenderer.send('msg',Src);
            },
            newImgurl(){
                var imgsrc=getimgsrc(),_this=this;
                var selToID=this.$store.getters.getSelToID;
                uploadPicByBase64(imgsrc,selToID,function(){
                    _this.showimg=true;
                });
            },
            getUserSetting(user){
                let data = localStorage.getItem('userInfo');
                data = JSON.parse(data);
                let temp;
                if(data.constructor.name !== 'Array'){
                    throw new Error(`${key}的值的类型不是array.`);
                }
                for(let v of data){
                    if(v['name'] === user){
                        temp = v['screenshotHotKeys'] ? v['screenshotHotKeys'] : 'Ctrl+Alt+D';
                    } 
                }
                return temp;
            },
            cli:function(){
                shell.openExternal('http://www.1818lao.com/')
            },
        },
        mounted:function(){
            ipcRenderer.send('msg','setWindowSize');
            window.Electron.ipc.on('screenshot',(event)=>{
                this.newImgurl();
                this.showimg=true;
            });
            // 启动截屏的热键启动功能
            let currentUserHotKey = this.getUserSetting(this.$store.getters.getSelfname);
            ipcRenderer.send('update-shortCut', currentUserHotKey, currentUserHotKey);


            document.onkeydown=function (event) {
                var e = event || window.event;
                if(e.ctrlKey && e.altKey && e.keyCode == 123){
                    // console.log('聊天界面打开调试工具');
                    ipcRenderer.send("msg","openDevTool");
                }
                //event.preventDefault();
                //return false;
            }
        },
        computed:{
             getFriendNum:function(){
                 var num = this.$store.getters.getFriendNum;
                 console.log('计算属性中的num===',num);
                 return num
             },
             filterFriend:function(){
                var sessons=this.$store.getters.getFrinds;
                if(sessons){
                    console.log('好友=========',sessons.length)
                    console.log(sessons);
                    return sessons;
                }else{
                    return ''
                }
            },
        },
        updated() {
            this.getFriendNum,
            this.filterFriends
        },

    };
</script>
<template>
<div class="window">
    <div id="chat">
        <div class="sidebar">
            <card></card>
            <evalute></evalute>
            <list></list>
        </div>
        <div class="main">
           <main-header></main-header>
           <div class="nofriends_list" v-show="filterFriend.length ===0?true:false" >
            <!-- <div class="nofriends_list" v-show="getFriendNum =='0'?true:flase"> -->
               <img src="../../images/friends.png" alt="">
               <p>{{$t("message.obj.no_message")}}</p>
               <a href="javascript:;" @click="cli" :title="$t('message.obj.go_shopping')">{{$t("message.obj.go_shopping")}}</a>
           </div>
           <div class = "main_box" id="main-box" v-show="filterFriend.length ===0?false:true">
            <!-- <div class = "main_box" id="main-box" v-show="getFriendNum =='0'?false:true"> -->
                <message @imageClick = "setImgSrc"></message>
                <textinput  @fromChildMsg = "showimgBox"></textinput>
           </div>
           <!-- <div class="main_evalute" v-show="avalute===true?true:flase">
                评论信息
           </div> -->
           <right-side v-show="filterFriend.length ===0?false:true"></right-side>
           <!-- <right-side v-show="getFriendNum =='0'?false:true"></right-side> -->
        </div>
    </div>
    <imgShow v-show = "showimg" @imgClosed = "showimgBox">
    </imgShow>
    <picDialog v-show = "PicDialog" @picDialogClosed = "showPicDialog" :imgsrc = "src"></picDialog>
</div>

</template>

<style>
    .nofriends_list {
        width: 100%;
        height: 100%;
        text-align: center;
        padding-top:20%;
        background: #fff;
    }
    .nofriends_list p{
        margin:15px 0;
    }
    .nofriends_list a{
        position:relative;
        display: block;
        width: 200px;
        height: 50px;
        background: #3799eb;
        border-radius: 10px;
        text-decoration: none;
        line-height: 50px;
        text-align: center;
        color: white;
        left: 50%;
        margin-left: -100px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        
    }
    .main_box{
        width: calc(100% - 200px);
        height: calc(100% - 50px);
        position: relative;
        display: inline-block;
        background-color: #fff;
    }
    .main_evalute{
        width: calc(100% - 200px);
        height: calc(100% - 50px);
        position: relative;
        display: inline-block;
        background-color: #fff;
    }
    .mask{
        width: 100%;
        height: 100%;
        opacity: 0.6;
        background: #000;
        position: absolute;
        top:0;
        left:0;
    }
    .setting{
        width:100%;
        height: 100%;
    }
    .window{
        width:100%;
        height:100%;
        position:relative;
        border: 1px solid #999;
        box-shadow: 0 0 10px rgba(0, 0, 0, 1);
    }
    #chat {
        margin: 0px auto;
        width:100%;
        height:100%;
        overflow: hidden;
        border-radius: 3px;
    } 
    #chat .main {
        height: 100%;
    }
    
    #chat .sidebar {
        float: left;
        width: 200px;
        height: 100%;
        color: #f4f4f4;
        background:url('../../images/friend_bg.jpg') no-repeat;
        background-size: cover;
    }
    
    #chat .main {
        position: relative;
        overflow: hidden;
        background-color: #eee;
    }
    
    #chat .text {
        position: absolute;
        width: 100%;
        bottom: 0;
        left: 0;
    }
    
    .main .message {
        height: calc(100% - 160px);
    }
    
</style>