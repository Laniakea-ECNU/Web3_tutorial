require("@nomicfoundation/hardhat-toolbox");

//require("dotenv").config();//加载.env文件内的内容进来
require("@chainlink/env-enc").config()//加载env.enc（加密内容）
//require("@nomicfoundation/hardhat-verify")//这段貌似没啥用，先注释了吧

require("./tasks/index")  //  ./tasks也可以，因为导入文件夹的话会自动寻找该文件夹下的index.js

//const SEPOLIA_URL = process.env.SEPOLIA_URL
//const PRIVATE_KEY = process.env.PRIVATE_KEY

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  //defaultNetwork:"hardhat",//这一行其实不用写，因为默认就是hardhat网络，除非用其他网络才需要写
  solidity: "0.8.28",
  networks:{
    sepolia:{
      url:process.env.SEPOLIA_URL,//Alchemy,Infura,QuickNode
      accounts:[process.env.PRIVATE_KEY_1, process.env.PRIVATE_KEY_2],//.env中的私钥
      chainID:11155111,//sepolia的chainID，用于识别所在的测试网是在哪个链上的，可在chainlist中查到chainID
    }
  },

  etherscan: {//这里用于验证合约，apikey在etherscan.io上申请，验证结果在sepolia.etherscan.io上看
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey:process.env.ETHERSCAN_APIKEY
  },
};
