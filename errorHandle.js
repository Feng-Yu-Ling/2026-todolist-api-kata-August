const headers = {
    // 允許前端在 Request Header 中攜帶哪些欄位
    /*
    Content-Type：表示送出的資料格式，例如 application/json
    Authorization：通常用來攜帶 JWT Token
    Content-Length：表示 Request Body 的資料長度
    X-Requested-With：部分前端套件可能會使用的自訂 Header
    */
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Content-Length, X-Requested-With',
    // 允許哪些來源（Origin）的網站存取這個 API，* 代表允許所有來源
    'Access-Control-Allow-Origin': '*',
    // 允許前端使用哪些 HTTP Method 呼叫 API
    /*
    PATCH：部分更新
    OPTIONS：瀏覽器進行 CORS 預檢（Preflight Request）時使用
    */
    'Access-Control-Allow-Methods': 'PATCH, POST, GET,OPTIONS,DELETE',
    // 告訴接收端：這次 Response 回傳的資料格式是 JSON
    'Content-Type': 'application/json'
}

const errorHandle = (res) => {
    // 設定 HTTP Response 的狀態碼與 Header
    res.writeHead(400, headers);
    // 寫進 HTTP Response Body 的內容
    /*
    res.write() 不能直接把 JavaScript 物件當成 HTTP 回應內容送出去，
    必須先把物件轉成 JSON 字串，所以先透過 JSON.stringify() 處理
    */
    res.write(JSON.stringify({
        status: "false",
        message: "欄位未填寫正確或無此 todo id"
    }));
    res.end();
}

module.exports = errorHandle;