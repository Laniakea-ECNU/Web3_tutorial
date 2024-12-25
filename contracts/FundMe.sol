//SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

//预言机，通过预言机群获取美元和数字货币的实时汇率
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

//实现目标：一个用于众筹的智能合约
//1.创建一个收款函数
//2.记录投资人并且查看
//3.在锁定期内，达到目标值，生产商可以提款
//4.在锁定期内，没有达到目标值，投资人在锁定期结束后退款


contract FundMe {
    mapping(address => uint256) public fundersToAmount;

    //设置投资人单次募捐的最小金额
    uint256 min_value = 100 * 10 ** 18;//这里指100USD

    //初始化一个空的合约
    AggregatorV3Interface internal dataFeed;

    //设定锁定期内的目标值，constant一般是后续不会再修改的值，即常量，常量常用全大写表示
    uint256 constant TARGET = 1000 * 10 ** 18;

    //设定访问权限
    address public owner;

    //设定锁定期（时间戳转换可以用www.unixtimestamp.com）
    uint256 deploymentTimestamp;//合约开始部署的时间点，例：2025年1月1日0点0分0秒为1735660800
    uint256 lockTime;//锁定期时长，例：3天为259200

    address erc20Addr;

    bool public getFundSuccess = false;//让大家看到众筹是否成功

    //合约的构造函数（一般就只会在初始化的时候调用一次）
    constructor(uint256 _lockTime) {
        //已经找到ETH和USD汇率合约的地址了，直接赋值就行了，没必要在该函数入参里再请求赋值
        dataFeed = AggregatorV3Interface(0x694AA1769357215DE4FAC081bf1f309aDC325306);
        //将该合约部署者的地址赋值给owner
        owner = msg.sender;//懂了，msg.sender就是指当前调用该函数的用户的地址
        //设定合约部署时间点
        deploymentTimestamp = block.timestamp;//block指当前区块，timestamp即当前区块的时间点
        //设定锁定期时长
        lockTime = _lockTime;
    }

    //收款函数，payable表示该函数可以用于接收链上的原生通证（token）
    function fund() external payable {
        //要在锁定期内才能筹款
        require(block.timestamp < deploymentTimestamp + lockTime, "Window is closed.");
        //require(condition, "")，condition为true才会正常交易，否则交易会被revert并输出字符串
        require(convertEthToUsd(msg.value) >= min_value, "The minimum value is 100 USD.");
        fundersToAmount[msg.sender] += msg.value;
    }

    function getChainlinkDataFeedLatestAnswer() public view returns (int) {
        // prettier-ignore
        (
            /* uint80 roundID */,
            int answer,
            /*uint startedAt*/,
            /*uint timeStamp*/,
            /*uint80 answeredInRound*/
        ) = dataFeed.latestRoundData();
        return answer;//这时候得到的结果就是USD比上ETH的值,也就是answer的USD可以兑换1ETH
    }

    //ETH和USD转化
    function convertEthToUsd(uint256 ethAmount) internal view returns(uint256) {
        //强制类型转化
        uint256 ethPrice = uint256(getChainlinkDataFeedLatestAnswer());
        //Solidity中没有浮点数，为了确保精度不损失，很多返回值的单位都很大，比如ethPrice的单位就是10的8次方
        //而ethAmount的单位是wei，注意
        return ethAmount * ethPrice / (10 ** 8);
    }

    //有时可能会修改owner
    function transferOwnership(address newOwner) public onlyOwner {
        //require(msg.sender == owner, "This function can only be called by owner.");//已用修改器
        owner = newOwner;
    }

    function getFund() external windowClosed onlyOwner {
        //require(block.timestamp > deploymentTimestamp + lockTime, "Window is not closed.");//用修改器windowClosed了，故可省略
        
        //require(msg.sender == owner, "This function can only be called by owner.");//已用修改器
        
        //this指当前合约
        require(convertEthToUsd(address(this).balance)  >= TARGET, "Target is not reached.");

        //接下来实现从合约中取出ETH
        //一般有三种方法：transfer,send,call
        //transfer和send是纯转账，而call更全能，可以转账加调用函数或写入数据

        //transfer:transfer ETH and revert if transaction failed
        //payable(msg.sender).transfer(address(this).balance);//地址默认都不是payable，所以要强制类型转换才能transfer
        
        //send:transfer ETH and return false if transaction failed
        //bool success = payable(msg.sender).send(address(this).balance);
        //require(success, "Transaction failed");

        //call:transfer ETH with data return bool and value of function
        bool success;
        (success, ) = payable(msg.sender).call{value: address(this).balance}("");//""中写调用的函数
        require(success, "Transaction failed");

        getFundSuccess = true;
    }

    function refund() external windowClosed {
        //require(block.timestamp > deploymentTimestamp + lockTime, "Window is not closed.");//用修改器windowClosed了，故可省略
        
        require(convertEthToUsd(address(this).balance)  < TARGET, "Target is reached.");
        require(fundersToAmount[msg.sender] != 0, "There is no fund for you.");
        bool success;
        (success, ) = payable(msg.sender).call{value: fundersToAmount[msg.sender]}("");//""中写调用的函数
        require(success, "Transaction failed.");
        fundersToAmount[msg.sender] = 0;
    }

    function setFundersToAmount(address funder, uint256 amountToUpdate) public {//方便外部合约来修改FundersToAmount
        //只允许ERC20合约修改
        require(msg.sender == erc20Addr, "You do not have permission to call this function.");
        fundersToAmount[funder] = amountToUpdate;
    }

    function setErc20Addr(address _erc20Addr) public onlyOwner {
        erc20Addr = _erc20Addr;
    }

    
    modifier windowClosed() {
        require(block.timestamp > deploymentTimestamp + lockTime, "Window is not closed.");
        _;//下划线指的是应用了这个修改器的函数里的其他内容，要先执行修改器的require，后执行函数中的其他内容。当然也可以把下划线放在上面，那就是最后才执行修改器中的require
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "This function can only be called by owner.");
        _;
    }
}