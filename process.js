const fs = require("fs");
const path = require("path");
const filePath = path.join(__dirname, "./original_rpcs.json"); // from chainlist https://github.com/DefiLlama/chainlist/blob/main/generate-json.js
const outputPath = path.join(__dirname, "../rpc.json");
const axios = require("axios");

fs.readFile(filePath, "utf-8", (err, data) => {
  if (err) {
    console.error("Error reading the file:", err);
    return;
  }
  try {
    // Parse the JSON data
    const jsonArray = JSON.parse(data);
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
