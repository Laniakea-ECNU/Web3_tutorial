const { task } = require("hardhat/config")

task("interact-fundMe", "Interact with fundMe contract").addParam("addr", "fundMe contract address").setAction(async(taskArgs, hre) => {//addParam
    
    const fundMeFactory = await ethers.getContractFactory("FundMe")
    const fundMe = fundMeFactory.attach(taskArgs.addr)






    const [firstAccount, secondAccount] = await ethers.getSigners()

    const fundTx = await fundMe.fund({value: ethers.parseEther("0.05")})
    await fundTx.wait()

    const balanceOfContract = await ethers.provider.getBalance(fundMe.target)
    console.log("Balance of the contract is " + balanceOfContract)

    const fundTx_2 = await fundMe.connect(secondAccount).fund({value: ethers.parseEther("0.06")})
    await fundTx_2.wait()

    const balanceOfContract_2 = await ethers.provider.getBalance(fundMe.target)
    console.log("Balance of the contract is " + balanceOfContract_2)

    const firstAccountBalanceInFundMe = await fundMe.fundersToAmount(firstAccount.address)
    const secondAccountBalanceInFundMe = await fundMe.fundersToAmount(secondAccount.address)
    console.log(`Balacne of first account ${firstAccount.address} is ${firstAccountBalanceInFundMe}`)
    console.log(`Balacne of first account ${secondAccount.address} is ${secondAccountBalanceInFundMe}`)
})

module.exports = {}