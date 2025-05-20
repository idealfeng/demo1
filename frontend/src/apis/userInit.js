// src/plugins/userInit.js (这个是好的，保持不变)
import { useUserStore } from '@/stores/user' // 这里导入的就应该是 版本A 的 store
const USER_INFO_KEY = 'userInfo_sicau';
export function setupUserState(app) {
    const userStore = useUserStore();
    if (userStore.token) {
        if (!userStore.userInfo || userStore.userInfo.id === undefined || userStore.userInfo.id === null) {
            console.warn(`[userInit] Token found, but user info from localStorage ('${USER_INFO_KEY}') is missing or incomplete (no id)...`);
        } else {
            console.log(`[userInit] User state successfully restored from localStorage. User ID: ${userStore.userInfo.id}, Account: ${userStore.userInfo.account}`);
        }
    } else {
        console.log('[userInit] No user token found in localStorage. User is not logged in.');
    }
}