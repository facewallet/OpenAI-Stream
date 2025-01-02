/**
 * 计算一个字符串在另一个字符串中出现的次数
 * @param {string} mainString
 * @param {string} searchString
 */
export function countOccurrences(mainString, searchString) {
    // 使用 split() 方法将主字符串按照搜索字符串进行拆分，生成一个数组
    const splitArray = mainString.split(new RegExp(searchString, 'g'));

    // 返回数组的长度减去 1，即为搜索字符串在主字符串中出现的次数
    return splitArray.length - 1;
}

/**
 * 确保一个回调函数在milliseconds内只执行一次
 * @param {Function} callback
 * @param {number} milliseconds
 * @param {boolean} immediate
 */
export function debounce(callback, milliseconds, immediate) {

    let executed = false;

    // 执行异步回调函数
    function executeCallback() {
        setTimeout(() => {
            if (!executed) {
                executed = true;
                callback();
                // 设置定时器，在指定的毫秒数后执行回调函数
                setTimeout(() => {
                    executed = false;
                }, milliseconds);
            }
        })
    }

    if (immediate) {
        executeCallback();
    }

    return executeCallback;
}

