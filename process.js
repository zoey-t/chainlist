const fs = require("fs");
const path = require("path");
const filePath = path.join(__dirname, "./original_rpcs.json"); // from chainlist https://github.com/DefiLlama/chainlist/blob/main/generate-json.js
const outputPath = path.join(__dirname, "../rpc.json");
const axios = require("axios");

fs.readFile(filePath, "utf-8", (err, data1) => {
  if (err) {
    console.error("Error reading the file:", err);
    return;
  }
  try {
    // Parse the JSON data
    const jsonArray = JSON.parse(data1);
    //console.log("JSON object:", jsonArray);
    // Filter the fields for each object
    const filteredArray = jsonArray.map(({ name, chain, rpc, chainId }) => ({
      chain,
      chainId,
      rpc: rpc.map((rpcItem) => ({
        endpoint: rpcItem.url,
        tracking: rpcItem.tracking,
      })),
    }));

    // Convert the filtered array back to a JSON string
    const filteredJsonString = JSON.stringify(filteredArray, null, 2); // Beautify the JSON output
    // console.log("Filtered Json:", filteredJsonString);

    //Let's take the ETH chain for example
    var ethinfo = filteredArray.filter(function (eth) {
      return eth.chainId == 1;
    });

    console.log("Eth info:", ethinfo);
    console.log("Eth info:", typeof ethinfo);

    // Now get the RPC
    rpc = ethinfo.rpc;
    console.log("The RPC list is:", ethinfo["rpc"]);

    // Axios section
    url = "https://mainnet.infura.io/v3/a1e8edaa30d6402e8e19546ad7a3fa8c";

    query = fetchChain(url);

    console.log(query);
    // Write the filtered JSON to a new file
    /*
    fs.writeFile(outputPath, filteredJsonString, "utf8", (err) => {
      if (err) {
        console.error("Error writing the file:", err);
        return;
      }
      console.log("Filtered JSON has been written to", outputPath);
    }); */
  } catch (error) {
    console.error("Error parsing JSON:", error);
  }
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
