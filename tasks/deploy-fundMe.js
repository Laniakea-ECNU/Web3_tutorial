const { task } = require("hardhat/config")

task("deploy-fundMe", "Deploy and verify fundMe contract").setAction(async(taskArgs, hre) => {
    const fundMeFactory = await ethers.getContractFactory("FundMe")
    
    console.log("Contract deploying...")
    const fundMe = await fundMeFactory.deploy(300)
    await fundMe.waitForDeployment()
    console.log("Contract has been deployed successfully, contract address is " + fundMe.target)

    if(hre.network.config.chainID == 11155111 && process.env.ETHERSCAN_APIKEY){
        console.log("Waiting for 5 confirmations.")
        await fundMe.deploymentTransaction().wait(5);
        await verifyFundMe(fundMe.target, [300])
    }else{
        console.log("Verification skipped...")
    }
})

async function verifyFundMe(fundMeAddr, args) {
    await hre.run("verify:verify", {
        address: fundMeAddr,
        constructorArguments: args,
      });
}

module.exports = {}