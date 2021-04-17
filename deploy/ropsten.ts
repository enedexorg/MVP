import { ethers } from "hardhat";

const MaxUint256 = ethers.constants.MaxUint256

async function main() {
    const time = Math.floor(Date.now() / 1000) + 60*60*10;
	
    const cRouter = await ethers.getContractFactory("UniswapV2Router02");
    const cMulticall = await ethers.getContractFactory("Multicall");
    const cFactory = await ethers.getContractFactory("UniswapV2Factory");
    const cWETH = await ethers.getContractFactory("WETH");
    const Token = await ethers.getContractFactory("MyERC20");

    const WETHaddr = "0x02d4418c5eeb5bef366272018f7cd498179fe98b"

    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:",
    		deployer.address
    );

    console.log("Account balance:", ethers.utils.formatEther(await deployer.getBalance()).toString());

    const multicall = await cMulticall.deploy();

    console.log("Multicall address: ", multicall.address);

    const DCA = await Token.deploy("DCA","DCA");
    const DCB = await Token.deploy("DCB", "DCB");

    console.log("DCA address: ", DCA.address);
    console.log("DCB address: ", DCB.address);

    const WETH = await cWETH.attach(WETHaddr);

    console.log("WETH address: ", WETH.address);

    const factory = await cFactory.deploy(deployer.address);

    console.log("Factory address: ", factory.address);
    const INIT_HASH = await factory.pairCodeHash();
    console.log("INIT_HASH: ", INIT_HASH);

    const router = await cRouter.deploy(factory.address, WETH.address);

    console.log("Router address: ", router.address);

    const amountSwap = ethers.utils.parseEther('5000');
    await DCA.approve(router.address, amountSwap);
    await DCB.approve(router.address, amountSwap);
    
    await router.addLiquidity(DCA.address, DCB.address, amountSwap, amountSwap, 0,0, deployer.address, time);
}



main()
  .then(() => process.exit(0))
  .catch(error => {
	  console.log(error);
	  process.exit(1);
  });
