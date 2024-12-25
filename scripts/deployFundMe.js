//import ethers.js
//create main function
    //init 2 accounts
    //fund contract with first account
    //check balance of contract
    //fund contract with second account
    //check balance of contract
    //check mapping fundersToAccount
//execute main function

const { ethers } = require("hardhat")
const { EDIT_DISTANCE_THRESHOLD } = require("hardhat/internal/constants")

async function main() {//有await的话就需要async，指该合约为非同步的合约
    //create factory
    const fundMeFactory = await ethers.getContractFactory("FundMe")//await指当前操作完成前不要进行下一步操作
    //因为上一行的过程比较长，如果不加await的话可能还没创建成功就直接执行下一句了，如果下一句用到fundMeFactory，就会报错
    
    //deploy contract
    console.log("Contract deploying...")
    const fundMe = await fundMeFactory.deploy(300)
    await fundMe.waitForDeployment()//deploy只是指发送了deploy这个操作，要等真正入块才行
    console.log("Contract has been deployed successfully, contract address is " + fundMe.target)//成功消息及合约地址显示在console中
    //console.log(`Contract has been deployed successfully, contract address is ${fundMe.target}`)//也可以这样写，注意是`而不是'，数字1左边那个键

    //验证网络是否在sepolia上
    if(hre.network.config.chainID == 11155111 && process.env.ETHERSCAN_APIKEY){
        console.log("Waiting for 5 confirmations.")
        //这时候虽然已经部署成功，但是Etherscan的数据库可能还没收录该区块，若立刻验证可能会找不到该区块的存在
        await fundMe.deploymentTransaction().wait(5);//等5个区块

        //自动验证
        await verifyFundMe(fundMe.target, [300])
    }else{
        console.log("Verification skipped...")
    }





    //init 2 accounts
    const [firstAccount, secondAccount] = await ethers.getSigners()//获取配置文件中的私钥所代表的账户（有几个就获取几个）


    //fund contract with first account
    const fundTx = await fundMe.fund({value: ethers.parseEther("0.05")})//solidity中没有小数，所以不能直接写入小数，调用函数来进行单位转换即可，但是该函数的参数是字符串，所以要加""
    await fundTx.wait()//等待交易上链


    //check balance of contract
    const balanceOfContract = await ethers.provider.getBalance(fundMe.target)
    console.log("Balance of the contract is " + balanceOfContract)//或者"Balance of the contract is ${balanceOfBalance}"


    //fund contract with second account
    const fundTx_2 = await fundMe.connect(secondAccount).fund({value: ethers.parseEther("0.06")})//若不写connect则默认为第一个账户
    await fundTx_2.wait()


    //check balance of contract
    const balanceOfContract_2 = await ethers.provider.getBalance(fundMe.target)
    console.log("Balance of the contract is " + balanceOfContract_2)


    //check mapping fundersToAccount
    const firstAccountBalanceInFundMe = await fundMe.fundersToAmount(firstAccount.address)
    const secondAccountBalanceInFundMe = await fundMe.fundersToAmount(secondAccount.address)
    console.log(`Balacne of first account ${firstAccount.address} is ${firstAccountBalanceInFundMe}`)
    console.log(`Balacne of first account ${secondAccount.address} is ${secondAccountBalanceInFundMe}`)


}


async function verifyFundMe(fundMeAddr, args) {

    //自动验证
    await hre.run("verify:verify", {
        address: fundMeAddr,
        constructorArguments: args,
      });
}


//执行main函数
main().then().catch((error) => {
    console.error(error)//console.error在控制台输出时会是更明显的红色
    process.exit(1)//非正常退出则为1
})
//js语言中可以将一个函数作为参数输入给另一个函数，如上catch(() => {})
