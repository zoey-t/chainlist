const axios = require("axios");

const rpcBody = JSON.stringify({
  jsonrpc: "2.0",
  method: "eth_getBlockByNumber",
  params: ["latest", false],
  id: 1,
});

/*
// For http website

const getUsers = () => {
  axios
    .get("https://reqres.in/api/users")
    .then((response) => {
      const users = response;
      console.log(`GET users`, users);
    })
    .catch((error) => console.error(error));
};
getUsers();
*/

const url = "https://eth.llamarpc.com";

const instance = axios.create();

instance.interceptors.request.use((config) => {
  config.headers["request-startTime"] = process.hrtime();
  return config;
});

instance.interceptors.response.use((response) => {
  const start = response.config.headers["request-startTime"];
  const end = process.hrtime(start);
  const milliseconds = Math.round(end[0] * 1000 + end[1] / 1000000);
  response.headers["request-duration"] = milliseconds;
  return response;
});

instance
  .get(url)
  .then((response) => {
    console.log(response.headers["request-duration"]);
  })
  .catch((error) => {
    console.error(`Error`);
  });

const fetchChain = async (baseURL) => {
  if (baseURL.includes("API_KEY")) return null;
  try {
    let API = axios.create({
      baseURL,
      headers: {
        "Content-Type": "application/json",
      },
    });

    API.interceptors.request.use(function (request) {
      request.requestStart = Date.now();
      return request;
    });

    API.interceptors.response.use(
      function (response) {
        response.latency = Date.now() - response.config.requestStart;
        return response;
      },
      function (error) {
        if (error.response) {
          error.response.latency = null;
        }

        return Promise.reject(error);
      }
    );

    let { data, latency } = await API.post("", rpcBody);

    return { ...data, latency };
  } catch (error) {
    return null;
  }
};

let response = fetchChain("https://eth.llamarpc.com");

console.log(response);

response.then(function (result) {
  console.log(result.latency);
});

/*
function createPromise() {
  let resolve, reject;
  const promise = new Promise((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });

  promise.resolve = resolve;
  promise.reject = reject;

  return promise;
}

const fetchWssChain = async (baseURL) => {
  try {
    // small hack to wait until socket connection opens to show loading indicator on table row
    const queryFn = createPromise();

    const socket = new WebSocket(baseURL);
    let requestStart;

    socket.onopen = function () {
      socket.send(rpcBody);
      requestStart = Date.now();
    };

    socket.onmessage = function (event) {
      const data = JSON.parse(event.data);

      const latency = Date.now() - requestStart;
      queryFn.resolve({ ...data, latency });
    };

    socket.onerror = function (e) {
      queryFn.reject(e);
    };

    return await queryFn;
  } catch (error) {
    return null;
  }
};

let response = fetchWssChain("wss://ethereum.publicnode.com");

console.log(response);

response.then(function (result) {
  console.log(result);
});
*/
