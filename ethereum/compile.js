const path = require("path");
const solc = require("solc");
const fs = require("fs-extra");
const build_path = path.resolve(__dirname,"build");
fs.removeSync(build_path); // Removes the build folder
const Campaign_path = path.resolve(__dirname,"contracts","Campaign.sol");
const source = fs.readFileSync(Campaign_path,"utf8"); // Reads the file from Campaign.sol and converts it to the readable format and stores it into source variable
const output = solc.compile(source,1).contracts;
fs.ensureDirSync(build_path); // this is ensures the existance of the directory if its not existed it'll creates the directory

for(let contract in output){
    fs.outputJSONSync(
        path.resolve(build_path,contract.replace(":", "") + ".json"),
        output[contract]
    )
}
