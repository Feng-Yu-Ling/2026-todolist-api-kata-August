const http = require("http");
// uuid 在 12 版後不支援 CommonJS，所以在安裝時要用 npm install uuid@11
const { v4: uuidv4 } = require("uuid");
// 將錯誤交給 errorHandle 統一處理，避免相同程式碼重複
const errorHandle = require("./errorHandle");

// 先把資料暫存在陣列
const todos = [

];
/*
req: request 請求物件，代表瀏覽器 / 前端送進來的資料
res: response 回應物件，用來決定伺服器要回什麼內容給使用者
*/
const requestListener = (req, res) => {
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

    // 指定 encoding 為 utf8，確保 chunk 是字串、可直接相加
    /*
    是否要指定 encoding：

    1. 指定 "utf8"：
    適合 JSON、表單等文字資料。
    chunk 會直接是字串，可用 body += chunk 累加。

    2. 不指定 encoding：
    chunk 預設是 Buffer。
    與字串相加時會自動轉成字串，所以通常仍可正常累加。

    3. 二進位資料：
    圖片、檔案等不應設定 encoding，應保留 Buffer。
    */
    req.setEncoding("utf8");

    // 準備累積文字內容
    let body = "";
    /*

    HTTP Request 的內容可能很大，因此 Node.js 不會一次把所有資料
    全部載入記憶體，而是以串流方式分批接收，所以 req 是 Readable Stream（可讀串流）。

    每收到一小段資料（chunk），就會觸發一次 "data" 事件。
    chunk 的大小並不固定，而且 POST 的 body 可能會隨網路傳輸
    被拆成多個 chunk 陸續送達，因此不能假設一次就能取得完整內容。

    當所有資料都接收完成後，會觸發 "end" 事件。
    這時才能將累加完成的 body 使用 JSON.parse()
    解析成 JavaScript 物件。
    */
    // 監聽 data 事件，每接收到一段資料就觸發一次，把每個 chunk 加到 body
    req.on("data", (chunk) => {
        // chunk 就是「這次 data 事件送來的一小段資料」
        body += chunk;
    });

    // 取得所有待辦事項
    if (req.url === "/todos" && req.method === "GET") {
        // 設定 HTTP Response 的狀態碼與 Header
        res.writeHead(200, headers);
        // 寫進 HTTP Response Body 的內容
        /*
        res.write() 不能直接把 JavaScript 物件當成 HTTP 回應內容送出去，
        必須先把物件轉成 JSON 字串，所以先透過 JSON.stringify() 處理
        */
        res.write(JSON.stringify({
            status: "success",
            data: todos
        }));
        // 結束回應並送出 Response
        res.end();
    }
    // 新增待辦事項
    else if (req.url === "/todos" && req.method === "POST") {
        // 監聽 end 事件，代表整個 body 收完，這時才適合做 JSON.parse(body)
        req.on("end", () => {
            // 避免 JSON.parse() 失敗導致程式崩潰的錯誤處理
            try {
                const title = JSON.parse(body).title;
                if (!title) {
                    // 將錯誤交給 errorHandle 統一處理，return 是避免繼續往下執行
                    return errorHandle(res);
                }
                // 建立一個新的待辦物件
                const todo = {
                    title,
                    id: uuidv4()
                }
                // 將新增待辦添加到 todos 陣列
                todos.push(todo);
                // 設定 HTTP Response 的狀態碼與 Header
                res.writeHead(200, headers);
                // 寫進 HTTP Response Body 的內容
                /*
                res.write() 不能直接把 JavaScript 物件當成 HTTP 回應內容送出去，
                必須先把物件轉成 JSON 字串，所以先透過 JSON.stringify() 處理
                */
                res.write(JSON.stringify({
                    status: "success",
                    data: todos
                }));
                // 結束回應並送出 Response
                res.end();

            }
            catch(err) {
                // 將錯誤交給 errorHandle 統一處理，return 是避免繼續往下執行
                return errorHandle(res);
            }
        });
    }
    // 刪除所有待辦
    else if (req.url === "/todos" && req.method === "DELETE") {
        // 將 todos 陣列清空
        todos.length = 0;
         // 設定 HTTP Response 的狀態碼與 Header
        res.writeHead(200, headers);
        // 寫進 HTTP Response Body 的內容
        /*
        res.write() 不能直接把 JavaScript 物件當成 HTTP 回應內容送出去，
        必須先把物件轉成 JSON 字串，所以先透過 JSON.stringify() 處理
        */
        res.write(JSON.stringify({
            status: "success",
            data: todos
        }));
        // 結束回應並送出 Response
        res.end();       
    }
    // 刪除單筆待辦
    else if (req.url.startsWith("/todos/") && req.method === "DELETE") {
        /*
        這裡不能使用
        req.url === "/todos/:id"、const { id } = req.params
        因為這是 express 的功能，原生 http 模組要自己取字串內容
        */
        // 將 url 以 / 作為分隔符轉換為陣列 ["", "todos", "id"] 
        const id = req.url.split("/")[2];
        // 找出該筆待辦 id 所在的 index
        const index = todos.findIndex(todo => todo.id === id);
        // 如果 index 等於 -1，代表找不到這個待辦 id
        if (index === -1) {
            // 將錯誤交給 errorHandle 統一處理，return 是避免繼續往下執行
            return errorHandle(res);
        }
        // 透過 splice 在 index 位置移除一個元素
        todos.splice(index, 1);
        // 設定 HTTP Response 的狀態碼與 Header
        res.writeHead(200, headers);
        // 寫進 HTTP Response Body 的內容
        /*
        res.write() 不能直接把 JavaScript 物件當成 HTTP 回應內容送出去，
        必須先把物件轉成 JSON 字串，所以先透過 JSON.stringify() 處理
        */
        res.write(JSON.stringify({
            status: "success",
            data: todos
        }));
        // 結束回應並送出 Response
        res.end();       
    }
    // 更新單筆待辦
    else if (req.url.startsWith("/todos/") && req.method === "PATCH") {
        // 監聽 end 事件，代表整個 body 收完，這時才適合做 JSON.parse(body)
        req.on("end", () => {
            // 避免 JSON.parse() 失敗導致程式崩潰的錯誤處理
            try {
                const title = JSON.parse(body).title;
                if (!title) {
                    // 將錯誤交給 errorHandle 統一處理，return 是避免繼續往下執行
                    return errorHandle(res);
                }
                /*
                這裡不能使用
                req.url === "/todos/:id"、const { id } = req.params
                因為這是 express 的功能，原生 http 模組要自己取字串內容
                */
                // 將 url 以 / 作為分隔符轉換為陣列 ["", "todos", "id"] 
                const id = req.url.split("/")[2];
                // 找出該筆待辦 id 所在的 index
                const index = todos.findIndex(todo => todo.id === id);
                // 如果 index 等於 -1，代表找不到這個待辦 id
                if (index === -1) {
                    // 將錯誤交給 errorHandle 統一處理，return 是避免繼續往下執行
                    return errorHandle(res);
                }
                // 將該筆待辦的 title 更新為新內容
                todos[index].title = title;

                // 設定 HTTP Response 的狀態碼與 Header
                res.writeHead(200, headers);
                // 寫進 HTTP Response Body 的內容
                /*
                res.write() 不能直接把 JavaScript 物件當成 HTTP 回應內容送出去，
                必須先把物件轉成 JSON 字串，所以先透過 JSON.stringify() 處理
                */
                res.write(JSON.stringify({
                    status: "success",
                    data: todos
                }));
                // 結束回應並送出 Response
                res.end();

            }
            catch(err) {
                // 將錯誤交給 errorHandle 統一處理，return 是避免繼續往下執行
                return errorHandle(res);
            }
        });
    }
    /*
    Preflight OPTIONS
    瀏覽器在「可能有風險的跨來源請求」送出前，先用 HTTP OPTIONS 問一次伺服器：
    我等等要用某方法、帶某些標頭、可能含憑證，你允許嗎？
    若回應「允許」且內容匹配，才送真正的 API 請求；
    若不匹配或缺標頭，瀏覽器直接擋下，前端看到 CORS error（不是後端沒收到，而是被瀏覽器攔）
    */
    else if (req.method === "OPTIONS") {
        // 設定 HTTP Response 的狀態碼與 Header
        res.writeHead(200, headers);
        /*
        Preflight 請求的重點不是要拿「資料內容」，而是要確認伺服器允不允許這個跨來源請求？
        所以只要回傳正確的 Response Headers 就夠了，不需要 res.write() 寫 Body。
        */
        // 結束回應並送出 Response
        res.end();
    }
    else {
        // 設定 HTTP Response 的狀態碼與 Header
        res.writeHead(404, headers);
        // 寫進 HTTP Response Body 的內容
        res.write(JSON.stringify({
            status: "false",
            message: "無此網站路由"
        }));
        // 結束回應並送出 Response
        res.end();
    }

}

// 當伺服器收到 HTTP Request 時就會執行 requestListener 函式
const server = http.createServer(requestListener);
// 伺服器監聽的連接埠
server.listen(process.env.PORT || 3005);