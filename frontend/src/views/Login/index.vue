<script setup>
import { reactive, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import 'element-plus/theme-chalk/el-message.css'
// import axios from 'axios' // 如果 loginAPI 内部处理了 axios，这里不需要
import { loginAPI } from '@/apis/auth' // 确保 loginAPI 返回的是后端原始响应的 data 部分
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const form = reactive({
  account: '',
  password: '',
  agree: true
})
const formRef = ref(null)

const rules = {
  account: [
    { required: true, message: '请输入账号', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    {
      min: 6,
      message: '密码长度不能小于6位',
      trigger: 'blur'
    }
  ],
  agree: [
    {
      validator: (_r, v, cb) => (v ? cb() : cb(new Error('请先勾选协议'))),
      trigger: 'change'
    }
  ]
}

const doLogin = async () => {
  console.log('[1] 点击按钮');
  if (!formRef.value) return;

  try {
    console.log('[2] 开始调用 validate');
    await formRef.value.validate();
    console.log('[3] 校验通过');

    const { account, password } = form; // 从表单获取的 account 和 password
    console.log('[4] 准备发请求', { account, password });

    // 调用登录接口
    // 假设 loginAPI 返回 Promise，其 resolve 的值是后端响应的 data 部分: { token, userInfo }
    const responseData = await loginAPI({ account, password });
    // loginAPI 内部应该处理 code 和 message，如果 code !== 0 应该 reject 或抛出错误
    // 或者 loginAPI 返回完整的 { code, message, data }，在这里判断
    // 我们假设 loginAPI 返回的是 { code, message, data: { token, userInfo } } 结构

    console.log('[5] 请求返回 (raw response from loginAPI):', responseData);

    // 检查后端响应结构是否符合预期
    if (responseData && responseData.code === 0 && responseData.data && responseData.data.token && responseData.data.userInfo && responseData.data.userInfo.id !== undefined) {
      const { token, userInfo } = responseData.data; // userInfo 应该是 { id: ..., account: ..., avatar: ... }

      console.log('>>> DEBUG (Login.vue): 登录成功，获取的 token:', token);
      console.log('>>> DEBUG (Login.vue): 登录成功，获取的 userInfo:', JSON.parse(JSON.stringify(userInfo))); // 打印确认

      // 调用 store 的 action，传递从后端获取的 token 和 userInfo
      // setUser 的参数是 { token: 'xxx', userInfo: { id: 1, account: 'name', avatar: 'url' } }
      await userStore.setUser({ token, userInfo }); // <--- 确保这里的 userInfo 是后端返回的那个对象

      ElMessage.success(responseData.message || '登录成功');
      router.replace(route.query.redirect || '/home');

    } else {
      const errorMessage = responseData?.message || '登录失败，用户信息不完整或服务器响应异常。';
      ElMessage.error(errorMessage);
      console.error('>>> DEBUG (Login.vue): 登录失败或响应数据不符合预期 (userInfo.id missing or invalid):', responseData);
    }

  } catch (err) {
    console.error('[X] 登录过程中发生错误 (catch block):', err);
    // 尝试从错误对象中提取更具体的错误信息
    const messageFromServer = err?.response?.data?.message; // Axios 错误常见结构
    const genericMessage = err?.message;
    ElMessage.error(messageFromServer || genericMessage || '登录时发生未知错误，请稍后重试。');
  }
}

const visitorGo = () => router.push('/home')
</script>

<!-- Template 部分保持不变 -->
<template>
  <div>
    <!-- 头部 -->
    <header class="login-header">
      <div class="container m-top-20">
        <h1 class="logo">
          <RouterLink to="/">sicau商城</RouterLink>
        </h1>
        <a class="entry" href="javascript:;" @click="visitorGo">
          进入网站首页
          <i class="iconfont icon-angle-right"></i>
          <i class="iconfont icon-angle-right"></i>
        </a>
      </div>
    </header>
    <!-- 登录主体 -->
    <section class="login-section">
      <div class="wrapper">
        <nav><a href="javascript:;">账户登录</a></nav>
        <div class="account-box">
          <div class="form">
            <el-form
              ref="formRef"
              :model="form"
              :rules="rules"
              label-position="right"
              label-width="60px"
              status-icon
            >
              <el-form-item label="账户" prop="account">
                <el-input v-model="form.account" />
              </el-form-item>
              <el-form-item label="密码" prop="password">
                <el-input v-model="form.password" show-password />
              </el-form-item>
              <el-form-item prop="agree" label-width="22px">
                <el-checkbox v-model="form.agree" size="large">
                  我已同意隐私条款和服务条款
                </el-checkbox>
              </el-form-item>
              <el-form-item>
                <el-button
                  type="primary"
                  size="large"
                  class="subBtn"
                  @click="doLogin"
                  style="width: 100%"
                >
                  点击登录 / 注册
                </el-button>
              </el-form-item>
            </el-form>
          </div>
        </div>
      </div>
    </section>
    <!-- 页脚 -->
    <footer class="login-footer">
      <div class="container">
        <p>
          <a href="javascript:;">关于我们</a>
          <a href="javascript:;">帮助中心</a>
          <a href="javascript:;">售后服务</a>
          <a href="javascript:;">配送与验收</a>
          <a href="javascript:;">商务合作</a>
          <a href="javascript:;">搜索推荐</a>
          <a href="javascript:;">友情链接</a>
        </p>
        <p>CopyRight &copy; sicau服饰商城</p>
      </div>
    </footer>
  </div>
</template>



<style scoped lang='scss'>
@use "@/styles/common.scss" as *;
 // 添加这行以使用 $xtxColor 变量
.login-header {
    background: white;
    border-bottom: 1px solid #e4e4e4;

    .container {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
    }

    .logo {
        width: 200px;

        a {
            display: block;
            height: 132px;
            width: 100%;
            text-indent: -9999px;
            background: url("@/assets/images/图片1.png") no-repeat center 18px / contain;
        }
    }

    .sub {
        flex: 1;
        font-size: 24px;
        font-weight: normal;
        margin-bottom: 38px;
        margin-left: 20px;
        color: #666;
    }

    .entry {
        width: 120px;
        margin-bottom: 38px;
        font-size: 16px;

        i {
            font-size: 14px;
            color: $xtxColor;
            letter-spacing: -5px;
        }
    }
}

.login-section {
    background: url('@/assets/images/login-bg.png') no-repeat center / cover;
    height: 650px;
    position: relative;

    .wrapper {
        width: 380px;
        background: #fff;
        position: absolute;
        left: 50%;
        top: 54px;
        transform: translate3d(100px, 0, 0);
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.15);

        nav {
            font-size: 14px;
            height: 55px;
            margin-bottom: 20px;
            border-bottom: 1px solid #f5f5f5;
            display: flex;
            padding: 0 40px;
            text-align: right;
            align-items: center;

            a {
                flex: 1;
                line-height: 1;
                display: inline-block;
                font-size: 18px;
                position: relative;
                text-align: center;
            }
        }
    }
}

.login-footer {
    padding: 30px 0 50px;
    background: white;

    p {
        text-align: center;
        color: #999;
        padding-top: 20px;

        a {
            line-height: 1;
            padding: 0 10px;
            color: #999;
            display: inline-block;

            ~a {
                border-left: 1px solid #ccc;
            }
        }
    }
}

.account-box {
    .toggle {
        padding: 15px 40px;
        text-align: right;

        a {
            color: $xtxColor;

            i {
                font-size: 14px;
            }
        }
    }

    .form {
        padding: 0 20px 20px 20px;

        &-item {
            margin-bottom: 28px;

            .input {
                position: relative;
                height: 36px;

                >i {
                    width: 34px;
                    height: 34px;
                    background: #cfcdcd;
                    color: #fff;
                    position: absolute;
                    left: 1px;
                    top: 1px;
                    text-align: center;
                    line-height: 34px;
                    font-size: 18px;
                }

                input {
                    padding-left: 44px;
                    border: 1px solid #cfcdcd;
                    height: 36px;
                    line-height: 36px;
                    width: 100%;

                    &.error {
                        border-color: $priceColor;
                    }

                    &.active,
                    &:focus {
                        border-color: $xtxColor;
                    }
                }

                .code {
                    position: absolute;
                    right: 1px;
                    top: 1px;
                    text-align: center;
                    line-height: 34px;
                    font-size: 14px;
                    background: #f5f5f5;
                    color: #666;
                    width: 90px;
                    height: 34px;
                    cursor: pointer;
                }
            }

            >.error {
                position: absolute;
                font-size: 12px;
                line-height: 28px;
                color: $priceColor;

                i {
                    font-size: 14px;
                    margin-right: 2px;
                }
            }
        }

        .agree {
            a {
                color: #069;
            }
        }

        .btn {
            display: block;
            width: 100%;
            height: 40px;
            color: #fff;
            text-align: center;
            line-height: 40px;
            background: $xtxColor;

            &.disabled {
                background: #cfcdcd;
            }
        }
    }

    .action {
        padding: 20px 40px;
        display: flex;
        justify-content: space-between;
        align-items: center;

        .url {
            a {
                color: #999;
                margin-left: 10px;
            }
        }
    }
}

.subBtn {
    background: $xtxColor;
    width: 100%;
    color: #fff;
}
</style>