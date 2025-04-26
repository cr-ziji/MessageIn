/**
 * CORS代理工具
 * 用于解决浏览器环境下的跨域请求问题
 */

// 公共代理服务列表
const CORS_PROXIES = [
  'https://api.codetabs.com/v1/proxy?quest=',
  'https://cors-proxy.fringe.zone/',
  'https://thingproxy.freeboard.io/fetch/'
];

// 检测环境是否为Electron
const isElectron = () => {
  return window.navigator.userAgent.toLowerCase().indexOf('electron') > -1 || 
         window.electronAPI !== undefined;
};

/**
 * 使用代理获取URL内容
 * @param {string} url - 目标URL
 * @returns {Promise<Response>} - fetch响应
 */
export async function fetchWithProxy(url) {
  // 如果是Electron环境，直接请求
  if (isElectron()) {
    console.log('在Electron环境中直接请求:', url);
    
    try {
      return await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': '*/*',
          'Origin': null
        }
      });
    } catch (error) {
      console.error('Electron直接请求失败:', error);
      // 即使在Electron环境，如果直接请求失败，尝试使用代理
    }
  }
  
  // 浏览器环境或Electron直接请求失败，尝试使用代理
  let lastError;
  
  // 先尝试不使用代理的直接请求
  try {
    console.log('尝试直接请求:', url);
    
    const directResponse = await fetch(url, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Accept': '*/*'
      }
    });
    
    if (directResponse.ok) {
      console.log('直接请求成功');
      return directResponse;
    }
  } catch (error) {
    console.warn('直接请求失败，将尝试代理:', error);
  }
  
  // 尝试所有可用的代理
  for (const proxy of CORS_PROXIES) {
    try {
      const proxyUrl = `${proxy}${encodeURIComponent(url)}`;
      console.log('尝试使用代理:', proxyUrl);
      
      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'Accept': '*/*'
        },
        // 5秒超时
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok) {
        console.log('使用代理成功:', proxy);
        return response;
      } else {
        console.warn(`代理 ${proxy} 返回非200状态码:`, response.status);
      }
    } catch (error) {
      console.warn(`代理 ${proxy} 请求失败:`, error);
      lastError = error;
    }
  }
  
  console.error('所有尝试均失败');
  throw lastError || new Error('无法获取数据：所有请求方式均失败');
}

export default {
  fetchWithProxy
}; 