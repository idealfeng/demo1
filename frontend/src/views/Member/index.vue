<script setup></script>

<template>
  <div class="member-container">
    <!-- 左侧菜单 -->
    <aside class="xtx-member-aside">
      <div class="user-manage">
        <h4>我的账户</h4>
        <div class="links">
          <!-- ① 严格匹配 -->
          <router-link
            :to="{ name:'member-info' }"
            exact-active-class="active"
          >个人中心</router-link>
        </div>

        <h4>交易管理</h4>
        <div class="links">
          <!-- ② 同样严格匹配 -->
          <router-link
            :to="{ name:'member-order' }"
            exact-active-class="active"
          >我的订单</router-link>
  <router-link
            :to="{ name:'member-favorite' }"
            exact-active-class="active"
          >我的收藏</router-link>
        </div>
      </div>
    </aside>

    <!-- 右侧内容区 -->
    <section class="article">
      <RouterView />
    </section>
  </div>
</template>

<style scoped lang="scss">
@use "@/styles/common.scss" as *;


.member-container{
  max-width:1200px; margin:0 auto;
  display:flex; padding-top:20px;
}

.xtx-member-aside{
  width:220px; margin-right:20px;
  background:#fff; border-radius:2px;
  flex-shrink:0;

  .user-manage{
    h4{font-size:18px;font-weight:400;
        padding:20px 52px 5px;border-top:1px solid #f6f6f6;}
    .links{padding:0 52px 10px;}
    a{
      display:block;padding:15px 0;font-size:14px;color:#666;
      position:relative;line-height:1;

      &:hover{color:$xtxColor;}

      /* ← 只要 .active 就够了 */
      &.active{
        color:$xtxColor;
        &::before{display:block;}
      }

      &::before{
        content:'';display:none;width:6px;height:6px;border-radius:50%;
        position:absolute;top:19px;left:-16px;background:$xtxColor;
      }
    }
  }
}

.article{flex:1;background:#fff;}
</style>