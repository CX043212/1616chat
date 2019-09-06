<template>
  <div class="eva">
    <img src="../../images/avalute.png" alt="" style="position: absolute;left:10px;top:76px;">
    <Button @click.stop="open()" type="primary" class="btnOpen">{{$t("message.obj.eva")}}</Button>
    <Drawer title="评价管理" placement="left" :scrollable="true" v-model="value2">
      <div class="evaContent" v-for="(item,index) in evdata" :key="item.id">
        <div class="evaTop">
          <div>
            <img :src="userimg" style="width:36px;height:36px" />
            <span>{{user}}</span>
          </div>
          <div>{{item.timeStr}}</div>
        </div>
        <div class="evaMid">
          <p class="server">服务评价</p>
          <div class="goods">
            <span :class="item.score == 0?'very0-active':'' ">非常好</span>
            <span :class="item.score == 1?'very0-active':'' ">好</span>
            <span :class="item.score == 2?'very0-active':'' ">一般</span>
            <span :class="item.score == 3?'very0-active':'' ">差</span>
          </div>
          <div class="good" v-show="item.problem==''?false:true">
            <span class="title">存在问题:</span>
            <span class="prob" :class='item.problem == "回复不及时"?"very1-active":"" '>回复不及时</span>
            <span class="prob" :class='item.problem == "服务态度差"?"very1-active":"" '>服务态度差</span>
          </div>
        </div>
        <div class="evaBoto">
          <a target="_blank" :href="item.shop.shopUrl" v-show="item.shop.shopUrl== null?false:true">
            <img :src="item.shop.shopLog" style="width:36px;height:36px"/>
          </a>
          <p>{{item.shopName}}</p>
        </div>
        <Button type="primary" @click.stop="modify(item)" class="modifyBtn">修改评价</Button>
        <Modal v-model="modal1" title="服务评价" @on-ok="ok" @on-cancel="cancel" class="evalu">
          <span class="very0" v-for="(item,index) in goods" @click.stop="my0(index)"  :class='index == activeindex?"active0":"" '>{{item}}</span>
          <p class="problem0" v-show="isShow0">
            <span class="title0">存在问题:</span>
            <span ref="pro" class="prob" v-for="(item,index) in good"  @click.stop="my1(index)" :class='index == activeindex0?"active1":"" '>{{item}}</span>
          </p>
        </Modal>
      </div>
    </Drawer>
    
  </div>
</template>
<script>
import { getLoginInfo } from "../../util/wrapsdk.js";
import evalute from "../../util/evalute";
export default {
  inject: ['reload'],
  data() {
    return {
      user: this.$store.getters.getSelfname,
      userimg: this.$store.getters.getSelfhead,
      value2: false,
      goods: ["非常好", "好", "一般", "差"],
      good: ["回复不及时", "服务态度差"],
      modal1: false,
      value2: false,
      evdata: "",
      score:0,
      problem:'',
      id:'',
      activeindex:0,
      activeindex0:0,

    };
  },
  methods: {
    ok() {},
    cancel() {},
    open() {
      this.value2 = true;
      var selfInfo = getLoginInfo();
      var evaluator = "UID" + selfInfo.identifier; //评价人id
      console.log("/front/evaluate/selectByEvaluator/" + evaluator);
      evalute
        .get("/front/evaluate/selectByEvaluator/" + evaluator)
        .then(res => {
          console.log("res", res.data);
          this.evdata = res.data.data;
        })
        .catch(err => {
          console.log(err);
          throw err;
        });
    },
    modify(item) {
      this.modal1 = true;
      this.activeindex = 0;
      this.activeindex0 = 0;
      this.isShow0 = false;
      this.id = item.id;
    },
    ok(){
      var self = this;
       var data = {
        "id":this.id,
        "score":this.score, //评分
        "problem":this.problem

      };
      var self = this;
      console.log(data,987654321)
      evalute({
        headers: {
          "Content-Type": "application/json"
        },
        url: "/front/evaluate/update",
        data: data,
        method: "post"
      })
        .then(res => {
          console.log(res);
           var message = res.data.message
           this.$Message.info(message, 5);
            // location.reload(true)
            // self.reload()
            var selfInfo = getLoginInfo();
             var evaluator = "UID" + selfInfo.identifier; //评价人id
             console.log("/front/evaluate/selectByEvaluator/" + evaluator);
             evalute.get("/front/evaluate/selectByEvaluator/" + evaluator)
            .then(function(res){
                console.log("res", res.data);
             self.evdata = res.data.data;
          // self.reload()
          // location.reload(true)
          })
        .catch(err => {
          console.log(err);
          throw err;
        });
        })
        .catch(err => {
          console.log(err);
          throw err;
        });
      this.score = 0;
      this.problem = '';

    },
    my0(index){
      this.problem = '';
      this.isShow0 = false;
      this.score = index;
      this.activeindex = index;
      console.log(this.score);
      console.log(this.isShow0)
      if(index==2||index==3){
            this.isShow0 = true;
            this.problem = this.$refs.pro[0].innerHTML;
      }
  },
    my1(index){
      this.problem = this.$refs.pro[index].innerHTML;
      this.activeindex0 = index;
      console.log(this.problem)
    },
  },

};
</script>
<style>
.eva {
  height: 42px;
  line-height: 42px;
  text-align: center;
}
.ivu-drawer-left {
  position: absolute !important;
  left: 200px !important;
  width: 520px !important;
}
.btnOpen {
  color: #fff !important;

  background: rgba(255,255,255,0) !important;
  /* opacity: 0 !important; */
  width: 20%;
  height: 42px;
  border-radius: 0 !important;
  /* background: url(/v220/images/friend_bg.jpg) no-repeat !important; */
  background-size: cover;
  border: 0 !important;
  float:left;
  margin-left:20px;
}
.evaContent {
  width: 400px;
  height: 315px;
  margin: 0 auto;
  padding-top: 10px;
  background: #fff;
  border: 1px solid rgb(255, 255, 255, 0.2);
}
.evaTop {
  width: 390px;
  display: flex;
  justify-content: space-between;
}
.evaTop>div>img{
  vertical-align: middle;
  margin-right:5px;
}
.evaTop > div {
  height: 60px;
  line-height: 60px;
}
.evaMid {
  width: 390px;
  height: 131px;
  margin: 0 auto;
  border: 1px solid rgba(174, 174, 174, 1);
  border-radius: 5px;
  padding-left: 20px;
}
.evaMid > .server {
  height: 33px;
  line-height: 33px;
}
.goods {
  margin-bottom: 20px;
}
.good {
}
.goods > span {
  width: 61px;
  height: 26px;
  padding: 6px 16px;
  border: 1px solid rgb(161, 161, 161);
  border-radius: 6px;
  color: #515151;
  text-align: center;
  line-height: 26px;
  cursor: pointer;
  margin-right: 20px;
}
.good > .title {
  margin-left: 10px;
}
.good > .prob {
  border: 1px solid rgb(161, 161, 161);
  border-radius: 25px;
  margin-right: 20px;
  cursor: pointer;
  padding: 2px;
}

.evaBoto {
  width: 390px;
  height: 60px;
  /* background:rgba(174, 174, 174, 1); */
  line-height: 60px;
  display: flex;
}
.evaBoto{
  margin-left:5px;
}
.evaBoto>a>img{
  vertical-align: middle;
}
.modifyBtn {
  background: #fff !important;
  float: right;
  margin-right: 10px;
  border: 1px solid rgb(161, 161, 161) !important;
  color: black !important;
  width: 80px;
  height: 30px;
  border-radius: 30px;
}
.ivu-modal-mask {
  display: none !important;
  
}
/* .ivu-drawer-body{
     background: rgba(174, 174, 174, 1) !important;
} */

.very0-active {
  color: rgb(0, 51, 255) !important;
  border: 1px solid rgb(0, 51, 255) !important;
}
.active0{
  color: rgb(0, 51, 255) !important;
  border: 1px solid rgb(0, 51, 255) !important;
}
.active1{
  color: rgb(0, 51, 255) !important;
  border: 1px solid rgb(0, 51, 255) !important;
}
.very1-active {
  color: rgb(0, 51, 255);
  border: 1px solid rgb(0, 51, 255) !important;
}
.problem0 {
  display: flex;
  margin-top: 10px;
  justify-content: flex-start;
  align-items: center;
}
.problem0 > .title0 {
  margin-right: 6px;
  margin-left: 15px;
}
.prob0 {
  border: 1px solid rgb(161, 161, 161);
  border-radius: 25px;
  margin-right: 20px;
  cursor: pointer;
  padding: 2px;
}
.very0 {
  width: 61px;
  height: 26px;
  padding: 6px 16px;
  border: 1px solid rgb(161, 161, 161);
  border-radius: 6px;
  color: #515151;
  text-align: center;
  line-height: 26px;
  cursor: pointer;
  margin-right: 20px;
}
.ivu-drawer-content{
  -webkit-app-region: no-drag;
}
.ivu-drawer-mask{
  -webkit-app-region: no-drag;
}
/* .pro-active{
    color:rgb(0, 102, 255);
    border:1px solid rgb(0, 102, 255);
} */
</style>